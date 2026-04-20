const gridElement = document.getElementById("grid");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"));
}

// Init
fetchSudoku();

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
    gridElement.innerHTML = "";

    grid.flat().forEach(value => {
        const input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = 9;
        input.classList.add("cell");

        input.addEventListener("input", () => {
            if (input.value > 9 || input.value < 1) input.value = "";
        });

        if (value !== 0) {
            input.value = value;
            input.disabled = true;
        }

        gridElement.appendChild(input);
    });
}

function getGridValues() {
    const cells = document.querySelectorAll(".cell");
    let grid = [];
    for (let i = 0; i < 9; i++) {
        grid.push([]);
        for (let j = 0; j < 9; j++) {
            const value = parseInt(cells[i * 9 + j].value) || 0;
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
