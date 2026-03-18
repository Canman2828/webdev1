const cells = document.querySelectorAll(".cell");
const turnMessage = document.getElementById("turn_message");
const resultMessage = document.getElementById("result_message");
const resetBoardButton = document.getElementById("reset_board");
const newGameButton = document.getElementById("new_game");
const xScoreText = document.getElementById("x_score");
const oScoreText = document.getElementById("o_score");
const drawScoreText = document.getElementById("draw_score");
const playerXNameInput = document.getElementById("player_x_name");
const playerONameInput = document.getElementById("player_o_name");
const startGameButton = document.getElementById("start_game");
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
let playerNames = {
  X: "Player X",
  O: "Player O"
};

function getPlayerName(player) {
  return playerNames[player];
}

function updateTurnMessage() {
  if (gameActive) {
    turnMessage.textContent = `${getPlayerName(currentPlayer)}'s turn`;
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
      resultMessage.textContent = `${getPlayerName(board[first])} wins!`;
      turnMessage.textContent = "Round done!";
      updateScores();
      return true;
    }
  }

  if (!board.includes("")) {
    gameActive = false;
    scores.Tie += 1;
    setPageBackground("#ffd700");
    resultMessage.textContent = "It's a tie!";
    turnMessage.textContent = "Round done!";
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
  setPageBackground("#f4f4f4");

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("played", "winner");
  });

  updateTurnMessage();
}

function startGame() {
  playerNames.X = playerXNameInput.value.trim() || "Player X";
  playerNames.O = playerONameInput.value.trim() || "Player O";
  resultMessage.textContent = "Game started!";
  resetBoard();
}

function startNewGame() {
  scores = {
    X: 0,
    O: 0,
    Tie: 0
  };

  updateScores();
  resetBoard();
}

cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick);
});

resetBoardButton.addEventListener("click", resetBoard);
newGameButton.addEventListener("click", startNewGame);
startGameButton.addEventListener("click", startGame);

updateScores();
resetBoard();
