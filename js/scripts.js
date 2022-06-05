// Math section________________________________________________________________________________________________
var mean = .55;
var deviation = .2;
var simulationsCount, insuredValue, tfl, max, results, resultsDistribution, meanFGU, meanGR;

// in order to improove the performance; we have to precalculate some immutable values
var doublePI = 2 * Math.PI;
var sqrt2Pi = Math.sqrt(doublePI);
var denominator, multiploicator;

var initCalc = () => {
    denominator = 1 / (2 * deviation * deviation);
    max = normalDistribution(mean);
    graphStep = xScale / samplesSteps
}

// Helpers
// example 20.5% -> 0.205
var percentToFloat = (s) => parseFloat(s) / 100;

// returns the floating point value in both cases, if the given value is float or string in %
var getFloat = (s) => s.indexOf('%') == -1 ? s : percentToFloat(s);

// Math functions
// calculates the normal distribution with given mean and deviation (1 / (deviation * Math.sqrt(2 * Math.PI)) * Math.E ** (-Math.sqr(x - mean) / ((2 * Math.sqr (deviation))))
var normalDistribution = (x) =>  Math.E ** (-(x - mean) * (x - mean) * denominator);
// 1 / (deviation*Math.sqrt(Math.PI*2)) * (Math.E ** (-1/2*((x-mean)/deviation)*((x-mean)/deviation)));

// damage value can not be less than 0 and more than 1 (100%)
var normalDistributionNormalized = (x) => normalDistribution(x) / max;

// calculates the mean value from results array on given field
var calculateMean = (field) => results.reduce((a, b) => !a ? a + parseFloat(b[field]): (a + parseFloat(b[field])) / 2, 0).toFixed(2);


//Graphics section_______________________________________________________________________________________
var canvas, ctx;
var canvasWidth = 480;
var canvasHeight = 360;
var xScale = canvasWidth - 40;
var yScale = canvasHeight - 100;
var samplesSteps = 75;
var graphStep;

var clearCanvas = () => {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    drawAxis();
    drawGraph();
}

var drawGraph = () => {
    ctx.strokeStyle = '#eec';
    ctx.lineWidth = .5;
    
    ctx.beginPath();
    ctx.moveTo (20, canvasHeight - 20 - (normalDistributionNormalized(0) * yScale));
    for (var i = 1; i <= canvasWidth - 40; i += 5){
        ctx.lineTo (20 + i, canvasHeight - 20 - (normalDistributionNormalized(i / xScale) * yScale));
        ctx.stroke();
    }
    ctx.closePath();
}

var drawAxis = () => {
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;

    // X
    ctx.beginPath();
    ctx.moveTo(10, canvasHeight - 20);
    ctx.lineTo(canvasWidth - 10, canvasHeight- 20);
    ctx.stroke();
    ctx.closePath();

    // Y
    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.lineTo(20, canvasHeight - 10);
    ctx.stroke();
    ctx.closePath();
}

// displays dosts of distribution for the selected field by the selected color
var drawDistribution = (field, color, normal = insuredValue) => {
    var maxResult = 1;
    resultsDistribution = [];

    results.map ( (result) => {
        //samplesSteps
        var distributionSlot = Math.floor(result[field] * samplesSteps / normal);
        resultsDistribution[distributionSlot] = !resultsDistribution[distributionSlot] ? 1 : resultsDistribution[distributionSlot] + 1;
        maxResult = resultsDistribution[distributionSlot] > maxResult ? resultsDistribution[distributionSlot] : maxResult;
    });
    graphScale = yScale / maxResult;
    ctx.fillStyle = color;

    resultsDistribution.forEach((element , index) => {      
        ctx.beginPath();    
        ctx.arc(23 + index * graphStep, canvasHeight - 20 - element * graphScale, 3 , 0, doublePI);
        ctx.fill();
    ctx.closePath();})
}

// Displays results and getting mean values
var displayResults = () => {
    meanFGU = calculateMean('lossFGU');
    meanGR = calculateMean('lossGR');
    drawDistribution('lossFGU', 'rgba(200, 0, 0, 0.75)');
    drawDistribution('lossGR', 'rgba(0, 200, 180, 0.75)');
    createTable(results);
    document.getElementById('generate_csv').style.display = 'block';
}


// operation logic_______________________________________________________________________________________
var init = () => {
    canvas = document.getElementById('graph');
    ctx = canvas.getContext('2d');
    initCalc();
    clearCanvas();
}

var getValues = () => {
    mean = getFloat(document.getElementById('mean').value);
    deviation = getFloat(document.getElementById('deviation').value);
    simulationsCount = getFloat(document.getElementById('simulations_count').value);
    insuredValue = getFloat(document.getElementById('insured_value').value);
    tfl = parseFloat(document.getElementById('tfl').value).toFixed(2);
    initCalc();
}

var fillResults = (resolve) => {
    while (results.length < simulationsCount) {
        var loss = Math.random();
        if (Math.random() < normalDistributionNormalized(loss)) {
            var lossFGU = (insuredValue * loss).toFixed(2);
            var lossGR = lossFGU < tfl ? lossFGU : tfl;
            results.push ({lossFGU: lossFGU, lossGR: lossGR});
        }
    }
    resolve();
}

var createTable = () => {
    document.getElementById('results').innerHTML = '';
    var table = document.createElement('table');
    var tableBody = document.createElement('tbody');
    var header = document.createElement('tr');
    var cell = document.createElement('th');
    cell.appendChild(document.createTextNode('LossFGU'));
    header.appendChild(cell);
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('LossGR'));
    header.appendChild(cell);
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('Mean FGU'));
    header.appendChild(cell);
    cell = document.createElement('th');
    cell.appendChild(document.createTextNode('Mean GR'));
    header.appendChild(cell);
    tableBody.appendChild(header);

    results.forEach((rowData, index) => {
      var row = document.createElement('tr');
      if (!! (index % 2)) row.className = 'odd';
  
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(rowData.lossFGU));
      row.appendChild(cell);
      cell = document.createElement('td');
      cell.appendChild(document.createTextNode(rowData.lossGR));
      row.appendChild(cell);

      if (!index) {
        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(meanFGU));
        row.appendChild(cell);
        cell = document.createElement('td');
        cell.appendChild(document.createTextNode(meanGR));
        row.appendChild(cell)
      }
  
      tableBody.appendChild(row);
    });
  
    table.appendChild(tableBody);
    document.getElementById('results').appendChild(table);
  }

var generateCSV = () => {  
    var csv = 'LossFGU,LossGR,Mean FGU, Mean GR\n';  
      
    //merge the data with CSV  
    results.forEach((rowData, index) => {  
        csv += rowData.lossFGU + ',';  
        csv += rowData.lossGR;  

        if (!index) {
            csv += ',' + meanFGU + ',';  
            csv += meanGR; 
        }
        csv += '\n';  
    });  

    var hiddenElement = document.createElement('a');  
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);  
    hiddenElement.target = '_blank';  
      
    //provide the name for the CSV file to be downloaded  
    hiddenElement.download = 'Simulations Results.csv';  
    hiddenElement.click(); 
}   

var runSimulation = () => {
    /// draw
    results = [];
    resultsDistribution = [];
    getValues();
    clearCanvas(); 
    var getSimulations = new Promise (() => {fillResults(() => {displayResults()})});
}
