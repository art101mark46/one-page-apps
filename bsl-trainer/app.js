// app.js
import { getRandomWord } from './dictionary.js';

// State Management Profile Engine
let state = {
    username: "",
    currentWord: "",
    currentCategory: "",
    currentWordReplays: 0,
    isPlaying: false,
    playbackTimeout: null,
    speed: 800,
    assetsPath: 'assets/letters/',
    scores: {},
    
    // Core expansion parameters
    lastGeneratedWord: "",
    flashCorrectAnswer: "",
    currentRevisionTab: "letters",
    handedness: "right",
    theme: "light"
};

// DOM References - Launcher Navigation Hub
const hubContainer = document.getElementById('hub-container');
const btnGotoRevision = document.getElementById('btn-goto-revision');
const btnGotoTrainer = document.getElementById('btn-goto-trainer');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// DOM References - Revision Reference Module
const revisionContainer = document.getElementById('revision-container');
const btnRevisionBack = document.getElementById('btn-revision-back');
const tabLetters = document.getElementById('tab-letters');
const tabNumbers = document.getElementById('tab-numbers');
const tabTest = document.getElementById('tab-test');
const chartView = document.getElementById('chart-view');
const testView = document.getElementById('test-view');
const revisionGrid = document.getElementById('revision-grid');
const revisionViewerImg = document.getElementById('revision-viewer-img');
const revisionViewerLabel = document.getElementById('revision-viewer-label');

// DOM References - Quick Flash Test
const flashTestImg = document.getElementById('flash-test-img');
const flashTestFeedback = document.getElementById('flash-test-feedback');
const flashOptionsGrid = document.getElementById('flash-options-grid');
const btnNextFlash = document.getElementById('btn-next-flash');

// DOM References - Trainer Authentication
const loginContainer = document.getElementById('login-container');
const btnLoginBack = document.getElementById('btn-login-back');
const mainAppContainer = document.getElementById('main-app-container');
const usernameInput = document.getElementById('username-input');
const btnLogin = document.getElementById('btn-login');
const displayUsername = document.getElementById('display-username');
const btnLogout = document.getElementById('btn-logout');

// DOM References - Core System Trainer
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

// DOM References - Mistake Modal Components
const mistakesModal = document.getElementById('mistakes-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalBodyList = document.getElementById('modal-body-list');

// --- 0. Launcher Preferences & Theme Engine Initializer ---
function initTheme() {
    // Check local storage, or default to system dark mode preference if available
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('bsl_suite_theme') || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(savedTheme);
}

function setTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('bsl_suite_theme', themeName);
    
    // Safely update button text if the element exists in the DOM
    if (btnThemeToggle) {
        if (themeName === 'dark') {
            btnThemeToggle.textContent = "☀️ Light Mode";
        } else {
            btnThemeToggle.textContent = "🌙 Dark Mode";
        }
    }
}

// RESTORED: This click handler was completely missing in your file!
if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Stop mobile double-tap zoom/blink events
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });
}

function updateImageMirrorPreference() {
    const selectedRadio = document.querySelector('input[name="handedness"]:checked');
    state.handedness = selectedRadio ? selectedRadio.value : "right";

    const targetImages = [signViewer, revisionViewerImg, flashTestImg];
    targetImages.forEach(img => {
        if (state.handedness === 'left') {
            img.classList.add('left-handed-mirror');
        } else {
            img.classList.remove('left-handed-mirror');
        }
    });
}

btnGotoRevision.addEventListener('click', () => {
    updateImageMirrorPreference();
    hubContainer.classList.add('hidden');
    revisionContainer.classList.remove('hidden');
    switchRevisionTab('letters');
});
btnGotoTrainer.addEventListener('click', () => {
    updateImageMirrorPreference();
    hubContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});
btnRevisionBack.addEventListener('click', () => {
    revisionContainer.classList.add('hidden');
    hubContainer.classList.remove('hidden');
});
btnLoginBack.addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    hubContainer.classList.remove('hidden');
});
btnLogout.addEventListener('click', () => {
    mainAppContainer.classList.add('hidden');
    hubContainer.classList.remove('hidden');
    state.username = "";
});

// --- 1. Revision Mode Matrix Generation ---
tabLetters.addEventListener('click', () => switchRevisionTab('letters'));
tabNumbers.addEventListener('click', () => switchRevisionTab('numbers'));
tabTest.addEventListener('click', () => switchRevisionTab('test'));

function switchRevisionTab(tabName) {
    state.currentRevisionTab = tabName;
    tabLetters.classList.remove('active');
    tabNumbers.classList.remove('active');
    tabTest.classList.remove('active');

    if (tabName === 'letters') {
        tabLetters.classList.add('active');
        chartView.classList.remove('hidden');
        testView.classList.add('hidden');
        generateReferenceGrid('letters');
    } else if (tabName === 'numbers') {
        tabNumbers.classList.add('active');
        chartView.classList.remove('hidden');
        testView.classList.add('hidden');
        generateReferenceGrid('numbers');
    } else if (tabName === 'test') {
        tabTest.classList.add('active');
        chartView.classList.add('hidden');
        testView.classList.remove('hidden');
        initiateFlashCardTest();
    }
}

function generateReferenceGrid(mode) {
    revisionGrid.innerHTML = "";
    revisionViewerImg.src = "assets/letters/placeholder.png";
    revisionViewerLabel.textContent = "- None Selected -";

    let items = [];
    if (mode === 'letters') {
        items = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    } else {
        // Expanded to include 11-19 and tens up to 90
        items = [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
            '11', '12', '13', '14', '15', '16', '17', '18', '19',
            '20', '30', '40', '50', '60', '70', '80', '90'
        ];
    }

    items.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = item;
        cell.addEventListener('click', () => {
            if (mode === 'letters') {
                revisionViewerImg.src = `assets/letters/${item.toLowerCase()}.png`;
                revisionViewerLabel.textContent = `Letter: ${item}`;
            } else {
                revisionViewerImg.src = `assets/numbers/${item}.png`;
                revisionViewerLabel.textContent = `Number: ${item}`;
            }
        });
        revisionGrid.appendChild(cell);
    });
}

function initiateFlashCardTest() {
    flashTestFeedback.textContent = "";
    flashTestFeedback.className = "feedback-container";

    const useLetters = Math.random() > 0.5;
    let pool = [];
    let assetFolder = "";

    if (useLetters) {
        pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        assetFolder = 'assets/letters/';
    } else {
        // Expanded flash test pool to use all new assets
        pool = [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
            '11', '12', '13', '14', '15', '16', '17', '18', '19',
            '20', '30', '40', '50', '60', '70', '80', '90'
        ];
        assetFolder = 'assets/numbers/';
    }

    const correctChar = pool[Math.floor(Math.random() * pool.length)];
    state.flashCorrectAnswer = correctChar;

    flashTestImg.src = `${assetFolder}${correctChar.toLowerCase()}.png`;

    let distractors = pool.filter(c => c !== correctChar);
    distractors.sort(() => 0.5 - Math.random());
    let choices = [correctChar, distractors[0], distractors[1], distractors[2]];
    choices.sort(() => 0.5 - Math.random());

    flashOptionsGrid.innerHTML = "";
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = choice;
        btn.addEventListener('click', () => evaluateFlashChoice(choice, btn));
        flashOptionsGrid.appendChild(btn);
    });
}

// --- 2. Unscored Recognition Flash Test Engine ---
btnNextFlash.addEventListener('click', initiateFlashCardTest);

function initiateFlashCardTest() {
    flashTestFeedback.textContent = "";
    flashTestFeedback.className = "feedback-container";

    const useLetters = Math.random() > 0.5;
    let pool = [];
    let assetFolder = "";

    if (useLetters) {
        pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        assetFolder = 'assets/letters/';
    } else {
        pool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        assetFolder = 'assets/numbers/';
    }

    const correctChar = pool[Math.floor(Math.random() * pool.length)];
    state.flashCorrectAnswer = correctChar;

    flashTestImg.src = `${assetFolder}${correctChar.toLowerCase()}.png`;

    let distractors = pool.filter(c => c !== correctChar);
    distractors.sort(() => 0.5 - Math.random());
    let choices = [correctChar, distractors[0], distractors[1], distractors[2]];
    choices.sort(() => 0.5 - Math.random());

    flashOptionsGrid.innerHTML = "";
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = choice;
        btn.addEventListener('click', () => evaluateFlashChoice(choice, btn));
        flashOptionsGrid.appendChild(btn);
    });
}

function evaluateFlashChoice(selected, element) {
    const buttons = flashOptionsGrid.querySelectorAll('.btn-option');
    buttons.forEach(b => b.disabled = true);

    if (selected === state.flashCorrectAnswer) {
        flashTestFeedback.textContent = "Correct Selection!";
        flashTestFeedback.className = "feedback-container correct";
    } else {
        flashTestFeedback.textContent = `Wrong! That asset indicates: ${state.flashCorrectAnswer}`;
        flashTestFeedback.className = "feedback-container incorrect";
    }
}

// --- 3. User Identity Profile Operations ---
btnLogin.addEventListener('click', initUserProfile);
usernameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') initUserProfile(); });

function initUserProfile() {
    const rawName = usernameInput.value.trim();
    if (!rawName) return;

    state.username = rawName;
    displayUsername.textContent = state.username;
    
    const localData = localStorage.getItem('bsl_trainer_scores');
    state.scores = localData ? JSON.parse(localData) : {};
    
    ensureUserSchemaExists(state.username);
    
    loginContainer.classList.add('hidden');
    mainAppContainer.classList.remove('hidden');
    
    renderScoreboard();
}

function ensureUserSchemaExists(user) {
    if (!state.scores[user]) {
        state.scores[user] = {
            easy: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} },
            medium: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} },
            hard: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} }
        };
    }
    ['easy', 'medium', 'hard'].forEach(cat => {
        if (!state.scores[user][cat].mistakes) {
            state.scores[user][cat].mistakes = {};
        }
    });
}

function saveScoresToDisk() {
    localStorage.setItem('bsl_trainer_scores', JSON.stringify(state.scores));
    renderScoreboard();
}

function renderScoreboard() {
    if (!state.username || !state.scores[state.username]) return;
    const uData = state.scores[state.username];

    metricsTbody.innerHTML = "";
    ['easy', 'medium', 'hard'].forEach(cat => {
        const row = document.createElement('tr');
        
        let distinctMistakeCount = 0;
        if (uData[cat].mistakes) {
            distinctMistakeCount = Object.values(uData[cat].mistakes).reduce((a, b) => a + b, 0);
        }

        row.innerHTML = `
            <td><strong style="text-transform: capitalize;">${cat}</strong></td>
            <td>${uData[cat].correct}</td>
            <td>${uData[cat].attempts}</td>
            <td>${uData[cat].totalReplays}</td>
            <td>
                <button class="btn-review-mistakes" data-cat="${cat}">🔎 View (${distinctMistakeCount})</button>
            </td>
        `;
        metricsTbody.appendChild(row);
    });

    metricsTbody.querySelectorAll('.btn-review-mistakes').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openMistakesBreakdownModal(e.target.getAttribute('data-cat'));
        });
    });
}

// --- 4. Mistakes Diagnostics Popup Subsystem ---
btnCloseModal.addEventListener('click', () => mistakesModal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === mistakesModal) mistakesModal.classList.add('hidden'); });

function openMistakesBreakdownModal(category) {
    modalBodyList.innerHTML = "";
    const uData = state.scores[state.username];
    const categoryMistakes = uData[category].mistakes || {};

    const items = Object.entries(categoryMistakes);

    if (items.length === 0) {
        modalBodyList.innerHTML = `<div class="no-mistakes-msg">No entries logged for the ${category} category yet!</div>`;
    } else {
        items.sort((a, b) => b[1] - a[1]);
        items.forEach(([word, count]) => {
            const row = document.createElement('div');
            row.className = 'mistake-row';
            row.innerHTML = `
                <span><strong>${word}</strong></span>
                <span class="mistake-count">${count} Failures</span>
            `;
            modalBodyList.appendChild(row);
        });
    }
    mistakesModal.classList.remove('hidden');
}

// --- 5. Playback Controller Engine & Loop Framework ---
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
    
    let wordCandidate = getRandomWord(state.currentCategory).toUpperCase();
    while (wordCandidate === state.lastGeneratedWord) {
        wordCandidate = getRandomWord(state.currentCategory).toUpperCase();
    }
    
    state.currentWord = wordCandidate;
    state.lastGeneratedWord = wordCandidate;
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
            signViewer.classList.add('fade-out');
            state.playbackTimeout = setTimeout(() => {
                signViewer.src = `assets/letters/placeholder.png`;
                signViewer.classList.remove('fade-out');
                toggleUIState(false);
            }, 80);
            return;
        }

        const currentLetter = letters[timelineIndex].toLowerCase();
        
        if (timelineIndex > 0) {
            signViewer.classList.add('fade-out');
            
            state.playbackTimeout = setTimeout(() => {
                signViewer.src = `assets/letters/placeholder.png`;
                signViewer.classList.remove('fade-out');
                
                state.playbackTimeout = setTimeout(() => {
                    signViewer.src = `assets/letters/${currentLetter}.png`;
                    timelineIndex++;
                    state.playbackTimeout = setTimeout(nextFrame, state.speed);
                }, Math.min(80, state.speed / 6));
            }, 80);
        } else {
            signViewer.src = `assets/letters/${currentLetter}.png`;
            signViewer.classList.remove('fade-out');
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
        if (!userStats.mistakes[state.currentWord]) {
            userStats.mistakes[state.currentWord] = 0;
        }
        userStats.mistakes[state.currentWord]++;
        
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

// --- 6. CSV Storage Synchronization ---
btnExport.addEventListener('click', exportScoresToCSV);
csvImportInput.addEventListener('change', importScoresFromCSV);

function exportScoresToCSV() {
    let csvRows = ['Username,Category,Correct,Attempts,TotalReplays,MistakesJSONString'];
    
    for (const [user, categories] of Object.entries(state.scores)) {
        for (const [cat, data] of Object.entries(categories)) {
            const base64Mistakes = btoa(JSON.stringify(data.mistakes || {}));
            csvRows.push(`${user},${cat},${data.correct},${data.attempts},${data.totalReplays},${base64Mistakes}`);
        }
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `bsl_suite_scores_${state.username}.csv`);
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
            
            const [user, category, correct, attempts, totalReplays, base64Mistakes] = line.split(',');
            
            if (!state.scores[user]) {
                state.scores[user] = {
                    easy: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} },
                    medium: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} },
                    hard: { correct: 0, attempts: 0, totalReplays: 0, mistakes: {} },
                };
            }
            
            if (state.scores[user][category]) {
                let parsedMistakes = {};
                try {
                    if (base64Mistakes) parsedMistakes = JSON.parse(atob(base64Mistakes));
                } catch(err) { parsedMistakes = {}; }

                state.scores[user][category] = {
                    correct: parseInt(correct) || 0,
                    attempts: parseInt(attempts) || 0,
                    totalReplays: parseInt(totalReplays) || 0,
                    mistakes: parsedMistakes
                };
            }
        }
        
        saveScoresToDisk();
        alert("Data metrics synced successfully!");
    };
    reader.readAsText(file);
}

function clearFeedback() {
    feedbackMessage.textContent = "";
    feedbackMessage.className = "feedback-container";
}

// RESTORED: Safe event listener matching your ES module execution lifecycle
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
