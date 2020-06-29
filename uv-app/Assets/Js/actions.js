
// UI elements
const uvLevel = document.querySelector('.uv-level');
const singleUvIndex = document.querySelector('.uv-index-now_number');
const clothesSlider = document.getElementById('clothes-slider');
const cloudCoverageSlider = document.getElementById('cloud-coverage-slider');
const cloudCoverageGraphic = document.querySelector('.factor-cloud-coverage');
const ageSlider = document.getElementById('age-slider');
const spfSlider = document.getElementById('spf-slider');
const bmiSlider = document.getElementById('bmi-slider');
const ageNumber = document.querySelector('.factor-age_number');
const spfNumber = document.querySelector('.factor-spf_number');
const bmiNumber = document.querySelector('.factor-bmi_number');
const clothes1 = document.querySelector('.clothes-1');
const clothes2 = document.querySelector('.clothes-2');
const clothes3 = document.querySelector('.clothes-3');
const clothes4 = document.querySelector('.clothes-4');
const clothes5 = document.querySelector('.clothes-5');

// API stuff
const urlGetCurrentUv = 'https://api.openuv.io/api/v1/uv?lat=52.07&lng=4.28';
const urlGetForecastUv = 'https://api.openuv.io/api/v1/forecast?lat=52.07&lng=4.28';
const token = 'a4919b716dbadd90a2b85094147fadb7';

// Charts
let timeChart = '';

// vars for calculations
const forecast = [];
let uvIndexes = [];
let uvTimes = [];
let uvNumber = '';
let roundedUvNumber = '';
let now = '';
let forecastDate  = '';
let multiplier = { age : 1, spf : 1, clothes : 1, clouds : 1, bmi : 1 };


function renderUvChart(data, labels) {
	const ctx = document.getElementById("uv-chart").getContext('2d');
	
	var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
	gradientStroke.addColorStop(0, "#b37bda");
	gradientStroke.addColorStop(0.5, "#d83d83");
	gradientStroke.addColorStop(1, "#b37bda");

	const uvChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: 'UV Index',
				borderColor: gradientStroke,
				backgroundColor: "#d83d8315",
				borderWidth: 6,
				pointBorderWidth: 0,
				data: data,
				}]
		},
		options: {
			legend: {
				display: false
			}
		}
	});

	Chart.defaults.global.defaultFontColor = "#fff";
}


function renderTimeChart(minimumExposure, maximumExposure) {
	const ctx = document.getElementById("time-chart").getContext('2d');
	timeChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: ['I', 'II', 'III', 'IV', 'V', 'VI'],
			datasets: [{
				label: 'Minimum exposure to reach 4000 IU',
				borderColor: '#fff',
				backgroundColor: "#d83d8315",
				borderWidth: 3,
					data: minimumExposure,
				},{
				label: 'Maximum exposure to reach 4000 IU',
				borderColor: '#fff',
				backgroundColor: "#d83d8315",
				borderWidth: 3,
					data: maximumExposure
				}]
		},
		options: {
			legend: {
				display: false
			},
			scales: {
				yAxes: [{
					ticks: {
						max: 180
					}
				}]
			}
		}
	});

	Chart.defaults.global.defaultFontColor = "#fff";
}

function getUVData(url){
	const localData = window.localStorage.getItem('uv_forecast');

	if ( localData ) {
		forecast.push(JSON.parse(localData));

		now = new Date();
		forecastDate = new Date(forecast[0].result[forecast[0].result.length -1].uv_time);

		if ( now.getDate() > forecastDate.getDate() ){
			getUVDataFromExternal(url);
		}
	} else {
		getUVDataFromExternal(url);
	}

	for ( i = 0; i < forecast[0].result.length; i++ ){
		let uvHour = new Date(forecast[0].result[i].uv_time);
		uvIndexes.push(forecast[0].result[i].uv);
		uvTimes.push(forecast[0].result[i].uv_time.substring(11, 16));

		if ( now.getHours() === uvHour.getHours() ){
			uvNumber = forecast[0].result[i].uv;
			roundedUvNumber = Math.round((uvNumber + Number.EPSILON) * 10) / 10;
		}
	}

	renderUvChart(uvIndexes, uvTimes);
	renderTimeChart(minimumExposure(roundedUvNumber), maximumExposure(roundedUvNumber));
	renderTimeNumber(roundedUvNumber);
}


function renderTimeNumber(uvNumber){
	singleUvIndex.innerHTML = Math.round((uvNumber + Number.EPSILON) * 10) / 10;
}

/* * * * * * * * * * * * * * * * * * * */
/* EVENTS                              */
/* * * * * * * * * * * * * * * * * * * */

clothesSlider.oninput = function() { // I could add onchange for IE10 support spfSlider.onchange = function() { }
	// change this into a loop in V2
	if ( clothesSlider.value == 1 ) {
		clothes1.classList.add('active')
	} else {
		clothes1.classList.remove('active')
	}

	if ( clothesSlider.value == 2 ) {
		clothes2.classList.add('active')
	} else {
		clothes2.classList.remove('active')
	}

	if ( clothesSlider.value == 3 ) {
		clothes3.classList.add('active')
	} else {
		clothes3.classList.remove('active')
	}

	if ( clothesSlider.value == 4 ) {
		clothes4.classList.add('active')
	} else {
		clothes4.classList.remove('active')
	}

	if ( clothesSlider.value == 5 ) {
		clothes5.classList.add('active')
	} else {
		clothes5.classList.remove('active')
	}

	recalculate('clothes', clothesSlider.value);
}

spfSlider.oninput = function() {
	spfNumber.textContent = spfSlider.value;
	recalculate('spf', spfSlider.value);
}

cloudCoverageSlider.oninput = function() {
	const cloudClass = "factor factor-cloud-coverage cloud-coverage-" + cloudCoverageSlider.value;
	cloudCoverageGraphic.className = cloudClass;
	recalculate('clouds', cloudCoverageSlider.value);
}

ageSlider.oninput = function() {
	ageNumber.textContent = ageSlider.value;
	recalculate('age', ageSlider.value);
}

bmiSlider.oninput = function() {
	bmiNumber.textContent = bmiSlider.value;
	recalculate('bmi', bmiSlider.value);
}

function recalculate(type, value){
	let output = '';

// let multiplier = { age : 1, spf : 1, clothes : 1, clouds : 1, bmi : 1 };
	if ( type === 'clothes' ) {
		if ( value <= 5 && value > 4 ) { multiplier.clothes = 8; }
		if ( value <= 4 && value > 3 ) { multiplier.clothes = 5; }
		if ( value <= 3 && value > 2 ) { multiplier.clothes = 3; }
		if ( value <= 2 && value > 1 ) { multiplier.clothes = 1.5; }
		if ( value <= 1 ) { multiplier.clothes = 1; }
	}

	if ( type === 'bmi' ) {
		if ( value <= 99 && value > 30 ) { multiplier.bmi = 2; }
		if ( value <= 30 && value > 15 ) { multiplier.bmi = 1.5; }
		if ( value <= 15 ) { multiplier.bmi = 0.7; }
	}

	if ( type === 'clouds' ) {
		if ( value <= 5 && value > 4 ) { multiplier.clouds = 5; }
		if ( value <= 4 && value > 3 ) { multiplier.clouds = 4; }
		if ( value <= 3 && value > 2 ) { multiplier.clouds = 3; }
		if ( value <= 2 && value > 1 ) { multiplier.clouds = 2; }
		if ( value <= 1 ) { multiplier.clouds = 1; }
	}

	if ( type === 'spf' ) {
		if ( value <= 60 && value > 50 ) { multiplier.spf = 6; }
		if ( value <= 50 && value > 40 ) { multiplier.spf = 5; }
		if ( value <= 40 && value > 30 ) { multiplier.spf = 4; }
		if ( value <= 30 && value > 20 ) { multiplier.spf = 3; }
		if ( value <= 20 && value > 10 ) { multiplier.spf = 2; }
		if ( value <= 10 && value > 0 ) { multiplier.spf = 1; }
	}

	if ( type === 'age' ) {
		if ( value <= 99 && value > 80 ) { multiplier.age = 2; }
		if ( value <= 80 && value > 70 ) { multiplier.age = 1.7; }
		if ( value <= 70 && value > 60 ) { multiplier.age = 1.6; }
		if ( value <= 60 && value > 50 ) { multiplier.age = 1.5; }
		if ( value <= 50 && value > 50 ) { multiplier.age = 1.4; }
		if ( value <= 40 && value > 30 ) { multiplier.age = 1.2; }
		if ( value <= 30 && value > 20 ) { multiplier.age = 1; }
		if ( value <= 10 && value > 5 ) { multiplier.age = 0.8; }
		if ( value <= 5 ) { multiplier.age = 0.5; }
	}

	output = Number( multiplier.age + multiplier.spf + multiplier.clothes + multiplier.clouds + multiplier.bmi ) / 5;
	updateChart(output);
}

let originalChartArray = [['undefined'],['undefined']];
let newChartArray = [['undefined'],['undefined']];

function updateChart(multiplier) {

	timeChart.data.datasets.forEach((dataset, i) => {
		
		// reset
		if ( dataset.data == newChartArray[i] ){
			dataset.data = originalChartArray[i] 
		}

		dataset.data.forEach(function(value, index){

			if ( originalChartArray[i][index] === undefined || originalChartArray[i][index] === 'undefined' ) {
				if ( newChartArray[i].length < dataset.data.length ) {
					if ( newChartArray[i][index] == 'undefined') {
						newChartArray[i].pop();
						originalChartArray[i].pop();
					}

					newChartArray[i].push(dataset.data[index] * multiplier);
					originalChartArray[i].push(dataset.data[index]);
				}
			} else {
				originalChartArray[i][index] = dataset.data[index];
				newChartArray[i][index] = dataset.data[index] * multiplier;
			}

// console.log(i, 
// 			'data',dataset.data[index], 
// 			'multiplier',multiplier, 
// 			'orig',originalChartArray[i][index], 
// 			'new',newChartArray[i][index]);

		});
		dataset.data = newChartArray[i];
	});
	timeChart.update();
}

/* * * * * * * * * * * * * * * * * * * */
/* API CALL                            */
/* * * * * * * * * * * * * * * * * * * */
function getUVDataFromExternal(url){
	// console.log('getting data from url: ' , url);

	var getUv = new XMLHttpRequest();

	getUv.open('GET', url);
	
	getUv.setRequestHeader('x-access-token', token);

	getUv.onload = function(){
		var bla = (getUv.responseText);
		// console.log('bla from API : ', bla);
		window.localStorage.setItem('uv_forecast', bla);
	}

	getUv.send();
}
getUVData(urlGetForecastUv);


/* * * * * * * * * * * * * * * * * * * */
/* UV REQUIREMENT CALCULATION          */
/* * * * * * * * * * * * * * * * * * * */

function minimumExposure(uvi, skinType, age, spf, bmi, skin){
	let output = [];
	let skinTypeMultiplier = 0;
	let uviStart = 0;
	let i = 1;

	if ( uvi <= 15 ) { uviStart = 0.5; }
	if ( uvi <= 14 ) { uviStart = 0.6; }
	if ( uvi <= 13 ) { uviStart = 0.7; }
	if ( uvi <= 12 ) { uviStart = 0.8; }
	if ( uvi <= 11 ) { uviStart = 0.9; }
	if ( uvi <= 10 ) { uviStart = 1; }
	if ( uvi <= 9 ) { uviStart = 1.2; }
	if ( uvi <= 8 ) { uviStart = 1.7; }
	if ( uvi <= 7 ) { uviStart = 1.8; }
	if ( uvi <= 6 ) { uviStart = 2; }
	if ( uvi <= 5 ) { uviStart = 3; }
	if ( uvi <= 4 ) { uviStart = 4; }
	if ( uvi <= 3 ) { uviStart = 5; }
	if ( uvi <= 2 ) { uviStart = 8; }
	if ( uvi <= 1 ) { uviStart = 20; }

	while ( i <= 6 ) {
		let skinType = i;

		if ( skinType === 1 ) { skinTypeMultiplier = 0.5; }
		if ( skinType === 2 ) { skinTypeMultiplier = 1; }
		if ( skinType === 3 ) { skinTypeMultiplier = 2; }
		if ( skinType === 4 ) { skinTypeMultiplier = 3; }
		if ( skinType === 5 ) { skinTypeMultiplier = 4; }
		if ( skinType === 6 ) { skinTypeMultiplier = 7; }

		output.push(uviStart * skinTypeMultiplier);
		// console.log('uviStart: ', uviStart, 'skinTypeMultiplier: ', skinTypeMultiplier, 'calc: ', uviStart * skinTypeMultiplier);
		i++;
	}

	// console.log('uvi', uvi);
	// console.log('uviStart', uviStart);
	// console.log('skinTypeMultiplier in min exp', skinTypeMultiplier);
	// console.log('output', output);
	return output;
}

function maximumExposure(uvi, skinType, age, spf, bmi, skin){
	let output = [];
	let skinTypeMultiplier = 0;
	let uviStart = 0;
	let i = 1;

	// console.log('uvi', uvi);

	if ( uvi <= 1 ) { uviStart = 200; }
	if ( uvi <= 2 ) { uviStart = 80; }
	if ( uvi <= 3 ) { uviStart = 42; }
	if ( uvi <= 4 ) { uviStart = 30; }
	if ( uvi <= 5 ) { uviStart = 25; }
	if ( uvi <= 6 ) { uviStart = 20; }
	if ( uvi <= 7 ) { uviStart = 18; }
	if ( uvi <= 8 ) { uviStart = 17; }
	if ( uvi <= 9 ) { uviStart = 16; }
	if ( uvi <= 10 ) { uviStart = 15; }
	if ( uvi <= 11 ) { uviStart = 14; }
	if ( uvi <= 12 ) { uviStart = 13; }
	if ( uvi <= 13 ) { uviStart = 12; }
	if ( uvi <= 14 ) { uviStart = 11; }
	if ( uvi <= 15 ) { uviStart = 10; }

	while ( i <= 6 ) {
		let skinType = i;

		if ( skinType === 1 ) { skinTypeMultiplier = 0.5; }
		if ( skinType === 2 ) { skinTypeMultiplier = 1; }
		if ( skinType === 3 ) { skinTypeMultiplier = 2; }
		if ( skinType === 4 ) { skinTypeMultiplier = 3; }
		if ( skinType === 5 ) { skinTypeMultiplier = 4; }
		if ( skinType === 6 ) { skinTypeMultiplier = 7; }

		output.push(uviStart * skinTypeMultiplier);
		i++;
	}

	// console.log('skinTypeMultiplier in max exp', skinTypeMultiplier);
	return output;
}