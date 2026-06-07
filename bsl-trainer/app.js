// app.js
import { getRandomWord } from './dictionary.js';

// State Management
let state = {
    username: "",
    currentWord: "",
    currentCategory: "",
    currentWordReplays: 0,
    isPlaying: false,
    playbackTimeout: null,
    speed: 800,
    assetsPath: 'assets/letters/',
    scores: {} 
};

// DOM References - Authentication
const loginContainer = document.getElementById('login-container');
const mainAppContainer = document.getElementById('main-app-container');
const usernameInput = document.getElementById('username-input');
const btnLogin = document.getElementById('btn-login');
const displayUsername = document.getElementById('display-username');

// DOM References - Core App
const signViewer = document.getElementById('sign-viewer');
const statusIndicator = document.getElementById('status-indicator');
const speedRange = document.getElementById('speed-range');
const speedVal = document.getElementById('speed-val');
const difficultySelect = document.getElementById('difficulty-select');
const userGuess = document.getElementById('user-guess');
const feedbackMessage = document.getElementById('feedback-message');
const metricsTbody = document.getElementById('metrics-tbody');

const btnNext = document.getElementById('btn-next');
const btnReplay = document.getElementById('btn-replay');
const btnSubmit = document.getElementById('btn-submit');
const btnExport = document.getElementById('btn-export');
const csvImportInput = document.getElementById('csv-import');

// --- Profile Initialization Tracking ---
btnLogin.addEventListener('click', initUserProfile);
usernameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') initUserProfile(); });

function initUserProfile() {
    const rawName = usernameInput.value.trim();
    if (!rawName) return;

    state.username = rawName;
    displayUsername.textContent = state.username;
    
    // Fetch system historical database
    const localData = localStorage.getItem('bsl_trainer_scores');
    state.scores = localData ? JSON.parse(localData) : {};
    
    ensureUserSchemaExists(state.username);
    
    // UI Screen Swap
    loginContainer.classList.add('hidden');
    mainAppContainer.classList.remove('hidden');
    
    renderScoreboard();
}

function ensureUserSchemaExists(user) {
    if (!state.scores[user]) {
        state.scores[user] = {
            easy: { correct: 0, attempts: 0, totalReplays: 0 },
            medium: { correct: 0, attempts: 0, totalReplays: 0 },
            hard: { correct: 0, attempts: 0, totalReplays: 0 }
        };
    }
}

function saveScoresToDisk() {
    localStorage.setItem('bsl_trainer_scores', JSON.stringify(state.scores));
    renderScoreboard();
}

function renderScoreboard() {
    if (!state.username || !state.scores[state.username]) return;
    const uData = state.scores[state.username];

    metricsTbody.innerHTML = `
        <tr>
            <td><strong>Easy</strong></td>
            <td>${uData.easy.correct}</td>
            <td>${uData.easy.attempts}</td>
            <td>${uData.easy.totalReplays}</td>
        </tr>
        <tr>
            <td><strong>Medium</strong></td>
            <td>${uData.medium.correct}</td>
            <td>${uData.medium.attempts}</td>
            <td>${uData.medium.totalReplays}</td>
        </tr>
        <tr>
            <td><strong>Hard</strong></td>
            <td>${uData.hard.correct}</td>
            <td>${uData.hard.attempts}</td>
            <td>${uData.hard.totalReplays}</td>
        </tr>
    `;
}

// --- Playback Controller Framework ---
speedRange.addEventListener('input', (e) => {
    state.speed = parseInt(e.target.value);
    speedVal.textContent = state.speed;
});

btnNext.addEventListener('click', startNewTurn);
btnReplay.addEventListener('click', handleReplayTrigger);
btnSubmit.addEventListener('click', checkAnswer);
userGuess.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !btnReplay.disabled && document.activeElement !== userGuess) {
        e.preventDefault(); 
        handleReplayTrigger();
    }
});

function startNewTurn() {
    clearFeedback();
    userGuess.value = "";
    
    state.currentCategory = difficultySelect.value;
    state.currentWord = getRandomWord(state.currentCategory).toUpperCase();
    state.currentWordReplays = 0; 
    
    determineAndPlayWord(state.currentWord);
}

function handleReplayTrigger() {
    if (state.isPlaying) return;
    state.currentWordReplays++; 
    determineAndPlayWord(state.currentWord);
}

async function determineAndPlayWord(word) {
    if (state.isPlaying || !word) return;
    toggleUIState(true);

    const lowercaseWord = word.toLowerCase();
    const signGifPath = `assets/signs/${lowercaseWord}.gif`;

    try {
        const response = await fetch(signGifPath, { method: 'HEAD' });
        if (response.ok) {
            statusIndicator.textContent = "Signing Word...";
            signViewer.src = signGifPath;
            state.playbackTimeout = setTimeout(() => {
                toggleUIState(false);
                userGuess.focus();
            }, 2500);
        } else {
            playFingerspelling(word);
        }
    } catch (error) {
        playFingerspelling(word);
    }
}

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

    const userStats = state.scores[state.username][state.currentCategory];
    userStats.attempts++;
    userStats.totalReplays += state.currentWordReplays;

    if (guess === state.currentWord) {
        userStats.correct++;
        showFeedback(`Correct! It was ${state.currentWord} (${state.currentWordReplays} replays)`, 'correct');
    } else {
        showFeedback(`Not quite! It was actually ${state.currentWord}.`, 'incorrect');
    }

    saveScoresToDisk();
    
    userGuess.disabled = true;
    btnSubmit.disabled = true;
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

// --- CSV Portability Operations ---
btnExport.addEventListener('click', exportScoresToCSV);
csvImportInput.addEventListener('change', importScoresFromCSV);

function exportScoresToCSV() {
    let csvRows = ['Username,Category,Correct,Attempts,TotalReplays'];
    
    for (const [user, categories] of Object.entries(state.scores)) {
        for (const [cat, data] of Object.entries(categories)) {
            csvRows.push(`${user},${cat},${data.correct},${data.attempts},${data.totalReplays}`);
        }
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `bsl_trainer_scores_${state.username}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

function importScoresFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        if(lines.length <= 1 || !lines[0].includes('Category')) return;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [user, category, correct, attempts, totalReplays] = line.split(',');
            
            if (!state.scores[user]) {
                state.scores[user] = {
                    easy: { correct: 0, attempts: 0, totalReplays: 0 },
                    medium: { correct: 0, attempts: 0, totalReplays: 0 },
                    hard: { correct: 0, attempts: 0, totalReplays: 0 }
                };
            }
            
            if (state.scores[user][category]) {
                state.scores[user][category] = {
                    correct: parseInt(correct) || 0,
                    attempts: parseInt(attempts) || 0,
                    totalReplays: parseInt(totalReplays) || 0
                };
            }
        }
        
        saveScoresToDisk();
        alert("Scores successfully imported!");
    };
    reader.readAsText(file);
}