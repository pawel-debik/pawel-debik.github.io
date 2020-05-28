/** TODO

- fix timer animation
- button disabled should run just once


*/

/* * * * * * * * * * * * * * * * * * * * * * * 
    VARS
* * * * * * * * * * * * * * * * * * * * * * */

// Game settings
const timeLimit = 5
const colors = ['red', 'green', 'blue']; // web colors only
const startNumber = 1 // start with three words

// Game elements
const start = document.getElementById('start-button');
const words = document.getElementById('words');
const countDown = document.getElementById('count-down');
const circleMaskFull = document.querySelector('.circle__mask--full');
const circleMaskHalf = document.querySelector('.circle__mask--half');
const circleFills = document.querySelectorAll('.circle__fill');

// Game variables
let challenge = ''; // This var holds the randomly generated color words
let gameStatus = 'not started';
let timeInterval;

// Voice synth items
const talk = document.getElementById('talk');
const content = document.querySelector('.content');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
	recognition = new SpeechRecognition();
} else {
	console.log('speech recognition seems to be unsuported in this browser');
	recognition = "";
}


/* * * * * * * * * * * * * * * * * * * * * * * 
    GAME LOGIC
* * * * * * * * * * * * * * * * * * * * * * */

start.addEventListener('click', startGame);


function startGame(){
	let userInput = '';

	if ( gameStatus != 'game running' ){
		displayWords(startNumber);
		timer();
		timerAnimation();
		recognition.start();
		circleMaskFull.classList.add('active');
		updateGame('game running', timeLimit, 1);
	}
}



function updateGame(g, gameTime){

	gameStatus = g;
	start.disabled = false;

	if ( gameStatus == 'game running' ) {
		console.log('game running');

		start.disabled = true;
	}

	if ( gameStatus == 'game over' ) {
		console.log('game over');

		start.firstChild.data = 'Game over. Play again?';
		gameStatus = 'not started'; // reset game status
		challenge = ''; // reset internal variable with words
		words.innerHTML = ''; // clear actual words on the page
	}

	if ( gameStatus == 'next round' ) {
		
		console.log('next round');
		
		start.firstChild.data = 'Start next round';
	}

	// Update timer graphic
	countDown.innerHTML = gameTime;

	// Update button
}



function timerAnimation(){
	circleMaskFull.innerHTML = '';
	circleMaskHalf.innerHTML = '';

	const circleFill1 = document.createElement('div');
	circleFill1.classList.add('circle__fill');
	circleFill1.classList.add('active');
	circleMaskFull.appendChild(circleFill1);

	const circleFill2 = document.createElement('div');
	circleFill2.classList.add('circle__fill');
	circleFill2.classList.add('active');
	circleMaskHalf.appendChild(circleFill2);
}



function answer(userInput){
	if ( gameStatus == 'game running' ){
		if (challenge.trim().toLowerCase() == userInput.trim().toLowerCase()){
			updateGame('next round', timeLimit);
			clearInterval(timeInterval);
			console.log(`Question: ${challenge}, Answer: ${userInput} Result: Corrent`);
		} else {				
			console.log(`Question: ${challenge}, Answer: ${userInput} Result: Wrong`);
		}
	} else {
		console.log('game has not yet started or has ended already');
	}
}



function timer(){
	let gameTime = timeLimit -1;

	timeInterval = setInterval(function() {
		if (gameTime < 1) {
			clearInterval(timeInterval);
			updateGame('game over', 0);
		} else {
			updateGame('game running', gameTime);
		}

		gameTime--;
	}, 1000);
}




function colorSelector(taken) {
	let randomColor = colors[Math.floor(Math.random() * colors.length)];
	
	// See which color label is taken, and look for another color for the class
	if ( taken ) {
		while ( randomColor == taken){
			randomColor = colors[Math.floor(Math.random() * colors.length)]
		}
	}

	return randomColor;
}



function displayWords( input ){
	let i = 0;

	while( input > i ){
		const label = document.createElement('span');
		let wordColor = colorSelector();
		let labelColor = colorSelector(wordColor);

		challenge += `${labelColor} `;

		label.appendChild(document.createTextNode(wordColor));
		label.classList.add('word__label');
		label.classList.add(`word__label--${labelColor}`);
		words.appendChild(label);
		i++;
	}
}




/* * * * * * * * * * * * * * * * * * * * * * * 
    VOICE SYNTH
* * * * * * * * * * * * * * * * * * * * * * */

recognition.onresult = function(e){
	const current = e.resultIndex;
	const transcript = e.results[current][0].transcript;

	answer(transcript);
}