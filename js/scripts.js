// DOM
const pages = [...document.querySelector("main").children];
const mainSnake = document.querySelector(".snake");
const screen = document.querySelector("#screen");
const bottom = document.querySelector("#bottom");
const fruitsUi = document.querySelector(".fruits-container");
const unlocksUi = document.querySelector(".unlockables-container");
const boostsUi = document.querySelector(".boosts-ui");
const title = document.querySelector("#header-title");
const scales = document.querySelector("#point");

// Variables
let gameWidth = 3; // quantidade cubos
let gameHeight = 3; // quantidade cubos
let minCubeSize = 4;
let maxCubeSize = 64;
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
    autoSave: true,
  },
  move:{
    dir: "stop",
    side: "left",
    stop: "stop",
  },
  fruit: [],
  keys: [],
  length: 0,
  scales: new Big(0.01),
  maxFruits: 1,
  eaten: false,
};
player.body = [{ ...player.head }];

let fruit = [];

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
  if (player.length === 0) {
    const playerTile = getTile(player.head.x, player.head.y);
    const head = document.createElement("div");
    head.classList.add("content", "snake");
    head.id = "head";
    head.dataset.dir = player.move.dir;
    head.dataset.side = player.move.side
    head.dataset.length = player.length;
    playerTile.dataset.player = "player";
    playerTile.appendChild(head);
  }
}

function screenStart() {
  screenCreate();
  if (fruit.length === 0) fruitGen();
  else fruit.forEach((currentFruit, index) => fruitCreate(currentFruit, index));
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
    const isFruitPosition = fruit.some(
      (currentFruit) => currentFruit.x === x && currentFruit.y === y
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
function fruitType(rarity, ignoreId) {
  const validFruits = fruits.filter((f) => f.rarity === rarity && f.unlocked);
  if (validFruits.length === 0) return "apple";

  const onScreen = {};
  for (let i = 0; i < fruit.length; i++) {
    const id = fruit[i].type;
    if (id === ignoreId) continue; // ignora a fruta que será substituída
    onScreen[id] = (onScreen[id] || 0) + 1;
  }

  let attempts = 0;
  while (attempts < 100) {
    attempts++;

    const totalChance = validFruits.reduce((sum, f) => sum + f.chance, 0);
    const rand = Math.random() * totalChance;

    let cumulative = 0;
    for (let i = 0; i < validFruits.length; i++) {
      const f = validFruits[i];
      cumulative += f.chance;

      if (rand < cumulative) {
        const current = onScreen[f.id] || 0;
        if (current < f.maxFruit) {
          return f.id;
        } else {
          break;
        }
      }
    }
  }

  return undefined;
}
function fruitValue(type) {
  return fruits.find((f) => f.id === type).value;
}
function fruitGen({ posX, posY } = {}, replaceIndex) {
  // Verifica se já atingiu o limite máximo de frutas
  if (replaceIndex === undefined && fruit.length >= player.maxFruits) {
    console.log("Limite máximo de frutas atingido");
    return;
  }

  const rarity = fruitRarity();

  const validFruits = fruits.filter((f) => f.rarity === rarity && f.unlocked);
  if (validFruits.length === 0) {
    console.log("Nenhuma fruta válida disponível");
    return;
  }

  const ignoreId =
    replaceIndex !== undefined ? fruit[replaceIndex]?.type : undefined;
  const type = fruitType(rarity, ignoreId);
  if (!type) {
    console.log("Nenhum tipo de fruta válido retornado");
    return;
  }

  let x, y;
  if (posX !== undefined && posY !== undefined) {
    x = posX;
    y = posY;
  } else {
    ({ x, y } = fruitPos());
  }

  const value = fruitValue(type);
  let newFruit = {
    x,
    y,
    rarity,
    type,
    value,
  };

  fruitCreate(newFruit, replaceIndex);
  if (replaceIndex === undefined || fruit.length < player.maxFruits) fruitGen();
}

function fruitCreate(currentFruit, replaceIndex) {
  if (replaceIndex === undefined) {
    fruit.push(currentFruit);
    replaceIndex = fruit.length - 1;
  } else {
    fruit[replaceIndex] = currentFruit;
  }
  const newTile = getTile(currentFruit.x, currentFruit.y);
  newTile.dataset.fruit = "fruit";
  const newFruit = document.createElement("div");
  newFruit.classList.add("content", "fruit");
  newFruit.dataset.index = replaceIndex;
  newFruit.id = currentFruit.type;
  newTile.appendChild(newFruit);
}
function fruitCheck(x, y) {
  const oldFruitTile = getTile(x, y);
  const oldFruitIndex = oldFruitTile.children[0].dataset.index;
  const oldFruit = fruit[oldFruitIndex];
  player.scales = player.scales.plus(oldFruit.value);
  oldFruitTile.dataset.fruit = "";
  oldFruitTile.dataset.index = "";
  oldFruitTile.innerHTML = "";
  fruitGen({}, oldFruitIndex);
  scoreUpdate();
}
function scoreUpdate() {
  scales.innerText = player.scales/*.toFixed(2)*/;
  requirementsCheck();
}
function playerMove() {
  if (player.move.stop === "stop") return;
  switch (player.move.dir) {
    case "up":
      if (player.head.y === 0) {
        player.move.stop = "stop";
        return;
      } else {
        player.head.y--;
      }
      break;
    case "down":
      if (player.head.y === gameHeight - 1) {
        player.move.stop = "stop";
        return;
      } else {
        player.head.y++;
      }
      break;
    case "left":
      if (player.head.x === 0) {
        player.move.stop = "stop";
        return;
      } else {
        player.head.x--;
      }
      break;
    case "right":
      if (player.head.x === gameWidth - 1) {
        player.move.stop = "stop";
        return;
      } else {
        player.head.x++;
      }
      break;
  }
  player.move.stop = "move";
  currentTile = getTile(player.head.x, player.head.y);
  if (currentTile && currentTile.dataset.fruit === "fruit") {
    fruitCheck(player.head.x, player.head.y);
  }

  updatePlayer();
}
function updatePlayer() {
  if (player.length == 0) {
    const newHeadTile = getTile(player.head.x, player.head.y);
    newHead = document.createElement("div");
    newHead.classList.add("content", "snake");
    newHead.dataset.dir = player.move.dir;
    newHead.dataset.side = player.move.side
    newHead.dataset.length = player.length;
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
  setTimeout(() => {
    sizeAdjust();
    updateOverflowCounter();
    initHoverListeners();
  }, 100);
});
window.addEventListener("orientationchange", sizeAdjust);
window.addEventListener("keydown", (e) => {
  // Commands
  player.move.stop="move"
  switch (e.key) {
    case player.commands.up:
      case "ArrowUp":
      e.preventDefault();
      player.move.dir = "up";
      break;
    case player.commands.left:
    case "ArrowLeft":
      e.preventDefault();
      player.move.side = "left"
      player.move.dir = "left";
      break;
    case player.commands.down:
    case "ArrowDown":
      e.preventDefault();
      player.move.dir = "down";
      break;
    case player.commands.right:
    case "ArrowRight":
      e.preventDefault();
      player.move.side = "right";
      player.move.dir = "right";
      break;
    case player.commands.stop:
      e.preventDefault();
      player.move.stop = "stop";
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
