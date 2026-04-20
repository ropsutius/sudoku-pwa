const gridElement = document.getElementById("grid");
const numberPad = document.getElementById("numberPad");
let selectedCell = null;
let notesMode = false;
let undoHistory = [];

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"));
}

// Show game and fetch a new puzzle
function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    newGame();
}

// Button handler
function newGame() {
    console.log("Starting new game...");
    const button = document.querySelector('.btn-primary');
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;

    fetchSudoku().finally(() => {
        button.textContent = originalText;
        button.disabled = false;
    });
}

// Fetch Sudoku from API
async function fetchSudoku() {
    console.log("Fetching new Sudoku...");
    try {
        const difficulty = document.getElementById('difficulty').value;
        const response = await fetch("https://cors-anywhere.herokuapp.com/https://you-do-sudoku-api.vercel.app/api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "LLKj5Xsm0iQqaTHxWVvUZv2TO9z2jZep6v0V5Pu_tG4"
            },
            body: JSON.stringify({
                difficulty: difficulty
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        console.log("API response:", data);

        // Adjust depending on API structure
        let puzzleString = data.puzzle || data.board || data;

        if (Array.isArray(puzzleString)) {
            renderGrid(puzzleString);
        } else {
            const grid = stringToGrid(puzzleString);
            renderGrid(grid);
        }
    } catch (err) {
        console.error("API failed, using fallback:", err);
        fallbackGame();
    }
}

// Convert string → 2D grid
function stringToGrid(str) {
    let grid = [];
    for (let i = 0; i < 9; i++) {
        grid.push(str.slice(i * 9, i * 9 + 9).split("").map(Number));
    }

    return grid;
}

// Render grid
function renderGrid(grid) {
    selectedCell = null;
    gridElement.innerHTML = "";
    undoHistory = [];
    updateUndoButton();

    grid.flat().forEach(value => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.tabIndex = 0;

        // Create main value span
        const mainValue = document.createElement("span");
        mainValue.classList.add("main-value");

        // Create notes container
        const notesDiv = document.createElement("div");
        notesDiv.classList.add("notes");
        for (let i = 1; i <= 9; i++) {
            const noteSpan = document.createElement("span");
            noteSpan.textContent = "";
            notesDiv.appendChild(noteSpan);
        }

        cell.appendChild(mainValue);
        cell.appendChild(notesDiv);

        if (value !== 0) {
            mainValue.textContent = value;
            cell.classList.add("fixed");
        }

        cell.addEventListener("click", () => {
            if (cell.classList.contains('fixed')) return;
            selectCell(cell);
        });

        gridElement.appendChild(cell);
    });
}

function selectCell(cell) {
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

function saveState() {
    // Save current grid state to undo history
    const cells = document.querySelectorAll(".cell");
    const state = [];
    
    cells.forEach(cell => {
        const mainValue = cell.querySelector('.main-value').textContent;
        const notes = Array.from(cell.querySelector('.notes').querySelectorAll('span')).map(s => s.textContent);
        state.push({ mainValue, notes });
    });
    
    undoHistory.push(state);
    updateUndoButton();
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    undoBtn.disabled = undoHistory.length === 0;
}

function undo() {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory.pop();
    const cells = document.querySelectorAll(".cell");
    
    previousState.forEach((state, index) => {
        const cell = cells[index];
        const mainValue = cell.querySelector('.main-value');
        const noteSpans = cell.querySelector('.notes').querySelectorAll('span');
        
        mainValue.textContent = state.mainValue;
        noteSpans.forEach((span, i) => {
            span.textContent = state.notes[i];
        });
    });
    
    updateUndoButton();
}

function fillSelected(value) {
    if (!selectedCell) return;

    const mainValue = selectedCell.querySelector('.main-value');

    if (notesMode && value !== "") {
        // In notes mode, save state and toggle the note
        saveState();
        const notesDiv = selectedCell.querySelector('.notes');
        const noteSpans = notesDiv.querySelectorAll('span');
        const noteIndex = parseInt(value) - 1;

        if (noteSpans[noteIndex].textContent === value) {
            noteSpans[noteIndex].textContent = "";
        } else {
            noteSpans[noteIndex].textContent = value;
        }
    } else if (value !== "") {
        // In normal mode, save state then set the main value and clear notes
        saveState();
        mainValue.textContent = value;
        const notesDiv = selectedCell.querySelector('.notes');
        const noteSpans = notesDiv.querySelectorAll('span');
        noteSpans.forEach(span => span.textContent = "");
    } else {
        // Clear button
        saveState();
        mainValue.textContent = "";
        const notesDiv = selectedCell.querySelector('.notes');
        const noteSpans = notesDiv.querySelectorAll('span');
        noteSpans.forEach(span => span.textContent = "");
    }
}

function getGridValues() {
    const cells = document.querySelectorAll(".cell");
    let grid = [];
    for (let i = 0; i < 9; i++) {
        grid.push([]);
        for (let j = 0; j < 9; j++) {
            const cell = cells[i * 9 + j];
            const mainValue = cell.querySelector('.main-value').textContent.trim();
            const value = parseInt(mainValue) || 0;
            grid[i].push(value);
        }
    }
    return grid;
}

// Check Sudoku validity
function isValid(grid, checkEmpty=false) {
    console.log("Checking solution...");

    const rows = Array.from({ length: 9 }, () => Array(9).fill(false));
    const cols = Array.from({ length: 9 }, () => Array(9).fill(false));
    const boxes = Array.from({ length: 9 }, () => Array(9).fill(false));

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (checkEmpty && grid[i][j] === 0) return false;
            else if (grid[i][j] === 0) continue;

            let num = grid[i][j] - 1;
            let boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);

            if (rows[i][num] || cols[j][num] || boxes[boxIndex][num]) {
                console.log(`Duplicate found at row ${i+1}, col ${j+1} for number ${num+1}`);
                return false;
            }

            rows[i][num] = cols[j][num] = boxes[boxIndex][num] = true;
        }
    }

    return true;
}

function checkSolution() {
    const grid = getGridValues();
    alert(isValid(grid, true) ? "Looks good!" : "Something's wrong ❌");
}

if (numberPad) {
    numberPad.addEventListener('click', event => {
        const btn = event.target.closest('.pad-btn');
        if (!btn) return;
        if (btn.disabled) return;

        const value = btn.getAttribute('data-value');

        if (value === 'notes') {
            // Toggle notes mode
            notesMode = !notesMode;
            btn.classList.toggle('active', notesMode);
            return;
        }

        if (value === 'undo') {
            undo();
            return;
        }

        fillSelected(value);
    });
}
