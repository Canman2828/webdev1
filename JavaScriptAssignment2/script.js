const cells = document.querySelectorAll(".cell");
const turnMessage = document.getElementById("turn_message");
const resultMessage = document.getElementById("result_message");
const resetBoardButton = document.getElementById("reset_board");
const newGameButton = document.getElementById("new_game");
const xScoreText = document.getElementById("x_score");
const oScoreText = document.getElementById("o_score");
const drawScoreText = document.getElementById("draw_score");
const body = document.body;

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let scores = {
  X: 0,
  O: 0,
  draw: 0
};

function updateTurnMessage() {
  if (gameActive) {
    turnMessage.textContent = `Player ${currentPlayer}'s turn`;
  }
}

function updateScores() {
  xScoreText.textContent = scores.X;
  oScoreText.textContent = scores.O;
  drawScoreText.textContent = scores.draw;
}

function highlightWinningCells(combination) {
  combination.forEach((index) => {
    cells[index].classList.add("winner");
  });
}

function setPageBackground(color) {
  body.style.backgroundColor = color;
}

function checkWinner() {
  for (const combination of winningCombinations) {
    const [first, second, third] = combination;

    if (
      board[first] !== "" &&
      board[first] === board[second] &&
      board[second] === board[third]
    ) {
      gameActive = false;
      scores[board[first]] += 1;
      highlightWinningCells(combination);
      setPageBackground("#90ee90");
      resultMessage.textContent = `Player ${board[first]} wins!`;
      turnMessage.textContent = "Round complete";
      updateScores();
      return true;
    }
  }

  if (!board.includes("")) {
    gameActive = false;
    scores.draw += 1;
    setPageBackground("#ffd700");
    resultMessage.textContent = "It's a draw!";
    turnMessage.textContent = "Round complete";
    updateScores();
    return true;
  }

  return false;
}

function handleCellClick(event) {
  const selectedCell = event.target;
  const selectedIndex = Number(selectedCell.dataset.cellIndex);

  if (!gameActive || board[selectedIndex] !== "") {
    return;
  }

  board[selectedIndex] = currentPlayer;
  selectedCell.textContent = currentPlayer;
  selectedCell.classList.add("played");

  if (checkWinner()) {
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  resultMessage.textContent = "";
  updateTurnMessage();
}

function resetBoard() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  resultMessage.textContent = "";
  turnMessage.textContent = "Player X's turn";
  setPageBackground("#f4f4f4");

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("played", "winner");
  });
}

function startNewGame() {
  scores = {
    X: 0,
    O: 0,
    draw: 0
  };

  updateScores();
  resetBoard();
}

cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick);
});

resetBoardButton.addEventListener("click", resetBoard);
newGameButton.addEventListener("click", startNewGame);

updateScores();
resetBoard();
