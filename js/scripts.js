// DOM
const pages = [...document.querySelector("main").children];
const mainSnake = document.querySelector(".snake");
const screen = document.querySelector("#screen");
const bottom = document.querySelector("#bottom");
const unlocksUi = document.querySelector(".unlockables-ui");
const boostsUi = document.querySelector(".boosts-ui");
const title = document.querySelector("#header-title");
const serpentine = document.querySelector("#point");

// Variables
let gameWidth = 3; // quantidade cubos
let gameHeight = 3; // quantidade cubos
let minCubeSize = 4;
let maxCubeSize = 160;
let cube_size, screenWidth, screenHeight;
let gameSpeed = 300;
let isMoving = false; // Flag para controlar se a cobra está se movendo
let preparationTime = 500; // Tempo em ms para a animação de preparação
let timePlayed;

// Objects

let player = {
  head: {
    x: Math.floor(gameWidth / 2),
    y: Math.floor(gameWidth / 2),
  },
  body: [],
  commands: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    save: "f",
    stop: " ",
  },
  fruits: [],
  keys: [],
  dir: "stop",
  length: 0,
  serpentine: 0,
  maxFruits: 1,
  eaten: false,
};
player.body = [{ ...player.head }];

let fruits = [];

start();

// Game Functions
function getTile(x, y) {
  return screen.querySelector(`.floor[data-x="${x}"][data-y="${y}"]`);
}
function screenCreate() {
  sizeAdjust();
  screen.innerHTML = "";
  const cubes = document.querySelectorAll(".floor");
  if (cubes) {
    cubes.forEach((element) => element.remove());
  }
  for (let y = 0; y < gameHeight; y++) {
    const line = document.createElement("div");
    line.classList.add("line");
    for (let x = 0; x < gameWidth; x++) {
      const cube = document.createElement("div");
      cube.classList.add("floor");
      cube.dataset.x = x;
      cube.dataset.y = y;
      line.appendChild(cube);
    }
    line.dataset.y = y;
    screen.appendChild(line);
  }
  const playerTile = getTile(player.head.x, player.head.y);
  const head = document.createElement("div");
  head.classList.add("content", "snake");
  head.id = "head";
  playerTile.dataset.player = "player";
  playerTile.appendChild(head);
}
// function screenUpdate() {
//   const playerTile = getTile(player.head.x, player.head.y);
//   const head = document.createElement("div");
//   head.classList.add("content", "snake");
//   head.id = "head";
//   playerTile.dataset.content = "player";
//   playerTile.appendChild(head);

//   const fruitTile = getTile(fruits[0].x, fruits[0].y);
//   const fruit = document.createElement("div");
//   fruit.classList.add("content", "fruit");
//   fruit.id = fruits[0].type;
//   fruitTile.appendChild(fruit);
// }

function screenStart() {
  screenCreate();
  if (fruits.length === 0) fruitGen();
  else fruits.forEach((fruit) => fruitCreate(fruit, "true"));
}
function fruitPos() {
  let x, y;
  let attempts = 0;
  let validPosition = false;

  while (!validPosition && attempts < 50) {
    x = Math.floor(Math.random() * gameWidth);
    y = Math.floor(Math.random() * gameHeight);
    attempts++;

    // Verifica se a posição é válida
    const tile = getTile(x, y);
    const isPlayerPosition = x === player.head.x && y === player.head.y;
    const isFruitPosition = fruits.some(
      (fruit) => fruit.x === x && fruit.y === y
    );
    const hasContent = tile && tile.querySelector(".content");

    if (!isPlayerPosition && !isFruitPosition && !hasContent) {
      validPosition = true;
    }
  }

  if (!validPosition) {
    console.warn("Não foi possível encontrar posição livre após 50 tentativas");
  }

  return { x, y };
}
function fruitRarity() {
  return "common";
}
function fruitType(rarity) {
  const validFruits = fruit.filter((f) => f.rarity === rarity && f.unlocked);
  if (validFruits.length === 0) return "apple";
  // Soma das chances válidas
  const onScreen = {};
  for (let i = 0; i < fruits.length; i++) {
    const id = fruits[i].type;
    onScreen[id] = (onScreen[id] || 0) + 1;
  }
  while (true) {
    const totalChance = validFruits.reduce((sum, f) => sum + f.baseChance, 0);
    const rand = Math.random() * totalChance;

    let cumulative = 0;
    for (let i = 0; i < validFruits.length; i++) {
      const f = validFruits[i];
      cumulative += f.baseChance;

      if (rand < cumulative) {
        const current = onScreen[f.id] || 0;
        if (current >= f.maxFruit) break;
        return f.id;
      }
    }
  }
}
function fruitValue(type) {
  return fruit.find((f) => f.id === type).value;
}
function fruitGen({ posX, posY } = {}) {
  // Verifica se já atingiu o limite máximo de frutas
  if (fruits.length >= player.maxFruits) {
    console.log("Limite máximo de frutas atingido");
    return;
  }

  // Verifica se ainda existem tipos de fruta disponíveis
  const rarity = fruitRarity();
  const validFruits = fruit.filter((f) => f.rarity === rarity && f.unlocked);

  if (validFruits.length === 0) {
    console.log("Nenhuma fruta válida disponível");
    return;
  }

  // Conta frutas na tela por tipo
  const onScreen = {};
  for (let i = 0; i < fruits.length; i++) {
    const id = fruits[i].type;
    onScreen[id] = (onScreen[id] || 0) + 1;
  }

  // Verifica se alguma fruta ainda pode ser criada
  const availableFruits = validFruits.filter((f) => {
    const current = onScreen[f.id] || 0;
    return current < f.maxFruit;
  });

  if (availableFruits.length === 0) return;

  let x, y;
  if (posX !== undefined && posY !== undefined) {
    x = posX;
    y = posY;
  } else {
    ({ x, y } = fruitPos());
  }

  const type = fruitType(rarity);
  if (!type) {
    console.log("Nenhum tipo de fruta válido retornado");
    return;
  }

  const value = fruitValue(type);
  let newFruit = {
    x,
    y,
    rarity,
    type,
    value,
  };

  fruitCreate(newFruit);
  if(fruits.length < player.maxFruits) fruitGen();
}

function fruitCreate(fruit, dontPush) {
  if (dontPush !== "true") fruits.push(fruit);
  const newTile = getTile(fruit.x, fruit.y);
  newTile.dataset.fruit = "fruit";
  const newFruit = document.createElement("div");
  newFruit.classList.add("content", "fruit");
  newFruit.dataset.index = fruits.indexOf(fruit);
  newFruit.id = fruit.type;
  newTile.appendChild(newFruit);
}
function fruitCheck(x, y) {
  const oldFruitTile = getTile(x, y);
  const oldFruit = fruits[oldFruitTile.children[0].dataset.index];
  player.serpentine += oldFruit.value;
  oldFruitTile.dataset.fruit = "";
  oldFruitTile.dataset.index = "";
  fruits.splice(oldFruit, 1);
  oldFruitTile.innerHTML = "";
  fruitGen();
  scoreUpdate();
}
function scoreUpdate() {
  serpentine.innerText = player.serpentine.toFixed(2);
  requirementsCheck();
}
function playerMove() {
  if (player.dir === "stop") return;
  switch (player.dir) {
    case "up":
      if (player.head.y === 0) {
        player.dir = "stop";
        return;
      } else player.head.y--;
      break;
    case "down":
      if (player.head.y === gameHeight - 1) {
        player.dir = "stop";
        return;
      } else player.head.y++;
      break;
    case "left":
      if (player.head.x === 0) {
        player.dir = "stop";
        return;
      } else player.head.x--;
      break;
    case "right":
      if (player.head.x === gameWidth - 1) {
        player.dir = "stop";
        return;
      } else player.head.x++;
      break;
  }
  if (getTile(player.head.x, player.head.y).dataset.fruit === "fruit") {
    fruitCheck(player.head.x, player.head.y);
  }

  updatePlayer();
}
function updatePlayer() {
  if (player.length == 0) {
    const newHeadTile = getTile(player.head.x, player.head.y);
    newHead = document.createElement("div");
    newHead.classList.add("content", "snake");
    newHead.id = "head";
    newHeadTile.appendChild(newHead);
    newHeadTile.dataset.player = "player";

    const oldHeadTile = getTile(player.body[0].x, player.body[0].y);
    oldHeadTile.firstElementChild?.remove();
    oldHeadTile.dataset.player = "";
    player.body.unshift({ ...player.head });
    player.body.pop();
  }
}

// Events
window.addEventListener("resize", () => {
  sizeAdjust();
  setTimeout(() => {
    updateOverflowCounter();
    initHoverListeners();
  }, 100);
});
window.addEventListener("orientationchange", sizeAdjust);
window.addEventListener("keydown", (e) => {
  // Commands
  switch (e.key) {
    case player.commands.up:
    case "ArrowUp":
      e.preventDefault();
      player.dir = "up";
      break;
    case player.commands.left:
    case "ArrowLeft":
      e.preventDefault();
      player.dir = "left";
      break;
    case player.commands.down:
    case "ArrowDown":
      e.preventDefault();
      player.dir = "down";
      break;
    case player.commands.right:
    case "ArrowRight":
      e.preventDefault();
      player.dir = "right";
      break;
    case player.commands.stop:
      e.preventDefault();
      player.dir = "stop";
      break;
    case player.commands.save:
      e.preventDefault();
      saveGame();
      showSaveNotification();
      break;
  }
});
// Startup
function start() {
  loadGame();
  screenStart();
  setTimeout(() => {
    createUpgrades();
    updateOverflowCounter();
    initHoverListeners();
    startUi();
    scoreUpdate();
  }, 100);
}

// Game
setInterval(() => {
  playerMove();
}, gameSpeed);
setInterval(() => {
  timePlayed++;
}, 1000);
