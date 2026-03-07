const fruits = {
  1: { name: "Apple", image: "fruit/apple-g56a141b7e_640.png" },
  2: { name: "Orange", image: "fruit/orange-g37e0fbbbb_640.png" },
  3: { name: "Pear", image: "fruit/pear-gf679252a5_1280.png" },
  4: { name: "Pineapple", image: "fruit/pineapple-g0b83a3b6c_640.png" }
};

let currentImageId = 1;

const body = document.body;
const fruitImage = document.getElementById("fruit_image");
const fruitName = document.getElementById("fruit_name");
const resultMessage = document.getElementById("result_message");
const fruitButtons = document.querySelectorAll(".fruit_buttons button");
const playAgainButton = document.getElementById("play_again");

function showCurrentFruitImage() {
  fruitImage.src = fruits[currentImageId].image;
}

function resetRound() {
  body.style.backgroundColor = "white";
  fruitName.textContent = "";
  resultMessage.textContent = "";
}

fruitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Each button has a id that gets compared to the current image id.
    const selectedButtonId = Number(button.dataset.fruitId);
    fruitName.textContent = fruits[currentImageId].name;

    if (selectedButtonId === currentImageId) {
      body.style.backgroundColor = "green";
      resultMessage.textContent = "Correct!";
    } else {
      body.style.backgroundColor = "red";
      resultMessage.textContent = "Incorrect";
    }
  });
});

playAgainButton.addEventListener("click", () => {
  currentImageId += 1;

  if (currentImageId > 4) {
    currentImageId = 1;
  }

  showCurrentFruitImage();
  resetRound();
});

showCurrentFruitImage();
resetRound();
