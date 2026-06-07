// app.js
import { getRandomWord } from './dictionary.js';

// State Management
let state = {
    currentWord: "",
    isPlaying: false,
    playbackTimeout: null,
    speed: 800,
    assetsPath: 'assets/letters/'
};

// DOM References
const signViewer = document.getElementById('sign-viewer');
const statusIndicator = document.getElementById('status-indicator');
const speedRange = document.getElementById('speed-range');
const speedVal = document.getElementById('speed-val');
const difficultySelect = document.getElementById('difficulty-select');
const userGuess = document.getElementById('user-guess');
const feedbackMessage = document.getElementById('feedback-message');

const btnNext = document.getElementById('btn-next');
const btnReplay = document.getElementById('btn-replay');
const btnSubmit = document.getElementById('btn-submit');

// Update UI speed text on slide
speedRange.addEventListener('input', (e) => {
    state.speed = parseInt(e.target.value);
    speedVal.textContent = state.speed;
});

// Primary Triggers
btnNext.addEventListener('click', startNewTurn);
btnReplay.addEventListener('click', () => determineAndPlayWord(state.currentWord));
btnSubmit.addEventListener('click', checkAnswer);
userGuess.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });

// Global Spacebar listener for lightning-fast Replays
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !btnReplay.disabled && document.activeElement !== userGuess) {
        e.preventDefault(); 
        determineAndPlayWord(state.currentWord);
    }
});

function startNewTurn() {
    clearFeedback();
    userGuess.value = "";
    state.currentWord = getRandomWord(difficultySelect.value).toUpperCase();
    
    determineAndPlayWord(state.currentWord);
}

/**
 * Checks for a dedicated lexical sign asset before falling back to fingerspelling
 */
async function determineAndPlayWord(word) {
    if (state.isPlaying || !word) return;
    toggleUIState(true);

    const lowercaseWord = word.toLowerCase();
    const signGifPath = `assets/signs/${lowercaseWord}.gif`;

    try {
        // Attempt to check if the specific word GIF exists on the local server
        const response = await fetch(signGifPath, { method: 'HEAD' });
        
        if (response.ok) {
            // SUCCESS: Dedicated sign exists. Play it.
            statusIndicator.textContent = "Signing Word...";
            signViewer.src = signGifPath;
            
            // Stay in "playing" state for a moment so they can't guess until it loops
            state.playbackTimeout = setTimeout(() => {
                toggleUIState(false);
                userGuess.focus();
            }, 2500); // Give them 2.5s to observe the sign GIF loop
            
        } else {
            // GIF file missing on server -> Fall back to fingerspelling
            playFingerspelling(word);
        }
    } catch (error) {
        // Network or local environment block -> Fall back to fingerspelling
        playFingerspelling(word);
    }
}

/**
 * Handles letter-by-letter visual playback sequence
 */
function playFingerspelling(word) {
    statusIndicator.textContent = "Fingerspelling...";
    let letters = word.split('');
    let timelineIndex = 0;

    function nextFrame() {
        if (timelineIndex >= letters.length) {
            state.playbackTimeout = setTimeout(() => {
                signViewer.src = `${state.assetsPath}placeholder.png`;
                toggleUIState(false);
                userGuess.focus();
            }, state.speed);
            return;
        }

        const currentLetter = letters[timelineIndex].toLowerCase();
        
        // Visual Rhythm check for repeating characters (e.g., "LL" in "CHLOE" or "EE" in "COFFEE")
        if (timelineIndex > 0 && letters[timelineIndex] === letters[timelineIndex - 1]) {
            signViewer.src = `${state.assetsPath}placeholder.png`;
            timelineIndex++;
            state.playbackTimeout = setTimeout(nextFrame, Math.min(200, state.speed / 2));
        } else {
            signViewer.src = `${state.assetsPath}${currentLetter}.png`;
            timelineIndex++;
            state.playbackTimeout = setTimeout(nextFrame, state.speed);
        }
    }

    nextFrame();
}

function checkAnswer() {
    const guess = userGuess.value.trim().toUpperCase();
    if (!guess) return;

    if (guess === state.currentWord) {
        showFeedback(`Correct! It was ${state.currentWord}`, 'correct');
    } else {
        showFeedback(`Not quite! Try replaying or try a new word.`, 'incorrect');
    }
}

function toggleUIState(playing) {
    state.isPlaying = playing;
    btnNext.disabled = playing;
    btnReplay.disabled = playing;
    difficultySelect.disabled = playing;
    
    if (playing) {
        statusIndicator.className = "status-playing";
        userGuess.disabled = true;
        btnSubmit.disabled = true;
    } else {
        statusIndicator.textContent = "Waiting for guess";
        statusIndicator.className = "status-idle";
        userGuess.disabled = false;
        btnSubmit.disabled = false;
    }
}

function showFeedback(text, type) {
    feedbackMessage.textContent = text;
    feedbackMessage.className = `feedback-container ${type}`;
}

function clearFeedback() {
    feedbackMessage.textContent = "";
    feedbackMessage.className = "feedback-container";
}