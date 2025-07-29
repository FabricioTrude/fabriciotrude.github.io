// DOM
const screen = document.querySelector("#screen");
const unlocksUi = document.querySelector(".unlockables-ui");
let points = document.querySelector("#point");

// Variables
let gameWidth = 3; // quantidade cubos
let gameHeight = 3; // quantidade cubos
let minCubeSize = 4;
let maxCubeSize = 160;
let cube_size, screenWidth, screenHeight;
let gameSpeed = 100;
let isMoving = false; // Flag para controlar se a cobra está se movendo
let preparationTime = 500; // Tempo em ms para a animação de preparação
let timePlayed

// Objects

let player = {
  head: {
    x: Math.floor(gameWidth / 2),
    y: Math.floor(gameWidth / 2),
  },
  body: [],
  dir: "stop",
  length: 0,
  points: 0,
  eaten: false,
};
player.body = [{ ...player.head }];

let fruits = [];

start();

// UI Functions
function calculateCubeSize() {
  screenWidth = screen.clientWidth;
  screenHeight = screen.clientHeight;

  const cubeSizeX = screenWidth / gameWidth;
  const cubeSizeY = screenHeight / gameHeight;

  cube_size = Math.max(
    minCubeSize,
    Math.min(Math.min(cubeSizeX, cubeSizeY), maxCubeSize)
  );
}

function sizeAdjust() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty(`--vh`, `${vh}px`);

  calculateCubeSize();
  document.documentElement.style.setProperty(`--cube_size`, `${cube_size}px`);
}

function updateOverflowCounter() {
  const container = document.querySelector(".unlockables-ui");
  const unlocks = document.querySelectorAll(".unlock");

  if (!container || unlocks.length === 0) return;

  const size = 32;
  const gap = 1;
  let containerWidth = container.offsetWidth;
  let containerHeight = container.offsetHeight;
  let elPerRow = Math.floor(containerWidth / (size + gap));
  let visibleRows = Math.floor(containerHeight / size);
  let visibleElements = elPerRow * visibleRows;
  let overflowCount = Math.max(0, unlocks.length - visibleElements);
  let existingCounter = document.querySelector(".unlock.counter");
  if (existingCounter) {
    existingCounter.classList.remove("counter");
    existingCounter.textContent = "";
  }
  if (overflowCount > 0 && visibleElements > 0) {
    const lastVisibleIndex = visibleElements - 1;
    const lastVisibleElement = unlocks[lastVisibleIndex];
    if (lastVisibleElement) {
      lastVisibleElement.classList.add("counter");
      lastVisibleElement.textContent = `+${overflowCount + 1}`;
    }
  }
}

function initHoverListeners() {
  const container = document.querySelector(".unlockables-ui");
  const floatingTooltip = document.querySelector(".floating-tooltip");

  if (!container || !floatingTooltip) return;

  let transitionTimeout;
  let counterActivated = false;

  container.removeEventListener("mouseover", handleMouseOver);
  container.removeEventListener("mouseleave", handleMouseLeave);
  container.removeEventListener("transitionend", handleTransitionEnd);

  function handleMouseOver(e) {
    const target = e.target.closest(".has-tooltip");

    if (e.target.classList.contains("counter") && !counterActivated) {
      clearTimeout(transitionTimeout);
      const existingCounter = document.querySelector(".unlock.counter");
      if (existingCounter) {
        existingCounter.classList.remove("counter");
        existingCounter.textContent = "";
      }
      container.style.height = "102px";
      counterActivated = true;
      return;
    }

    if (target) {
      const tooltip = target.querySelector(".tooltip");
      if (!tooltip) return;

      floatingTooltip.innerHTML = tooltip.innerHTML;
      floatingTooltip.style.opacity = "1";

      const rect = target.getBoundingClientRect();
      const tooltipRect = floatingTooltip.getBoundingClientRect();

      let top = rect.top - tooltipRect.height - 8;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

      // Protege contra bordas
      left = Math.max(
        4,
        Math.min(left, window.innerWidth - tooltipRect.width - 4)
      );

      floatingTooltip.style.top = `${top}px`;
      floatingTooltip.style.left = `${left}px`;
    }
  }

  function handleMouseLeave(e) {
    clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
      updateOverflowCounter();
    }, 1050);
    container.style.height = "68px";

    floatingTooltip.style.opacity = "0";
  }

  function handleTransitionEnd(e) {
    if (e.propertyName === "height") {
      setTimeout(() => {
        updateOverflowCounter();
        if (container.style.height === "68px") counterActivated = false;
      }, 10);
    }
  }

  container.addEventListener("mouseover", handleMouseOver);
  container.addEventListener("mouseleave", handleMouseLeave);
  container.addEventListener("transitionend", handleTransitionEnd);
}

function showSaveNotification() {
  const saveElement = document.createElement("div");
  saveElement.className = "save-popup";
  saveElement.innerText = "Game Saved!";
  document.body.appendChild(saveElement);
  saveElement.offsetHeight;
  saveElement.classList.add("show");

  setTimeout(() => {
    saveElement.classList.remove("show");
    saveElement.classList.add("hide");
    setTimeout(() => {
      if (saveElement.parentNode) {
        saveElement.parentNode.removeChild(saveElement);
      }
    }, 500);
  }, 2000);
}

function createUnlockableCheck(div) {
  const requirementValue = parseFloat(div.dataset.requirementValue);
  const bougth = div.dataset.bougth === "true";
  if (bougth) return false;
  const unlocked = unlockables.find(u => u.id === div.id).unlocked;
  switch (div.dataset.requirementType) {
    case "points": {
      if (requirementValue > player.points && !unlocked) return false;
      else return true;
    }
    case "length": {
      if (requirementValue > player.length && !unlocked) return false;
      else return true;
    }
  }
}

function createUnlock(unlock) {
  const div = document.createElement("div");
  div.dataset.requirementType = unlock.requirement.type;
  div.dataset.requirementValue = unlock.requirement.value;
  div.dataset.priceType = unlock.price.type;
  div.dataset.priceValue = unlock.price.value;
  div.dataset.bougth = unlock.bougth;
  div.id = unlock.id;
  if (createUnlockableCheck(div) === false) return;
  unlock.unlocked = true;

  div.classList.add("unlock", "has-tooltip");
  div.innerHTML = `<span class="tooltip">
    ${unlock.name}<br>
    ${unlock.description}<br>
    <span class="requirement">
    Requirement: 
    ${unlock.requirement.value} ${unlock.requirement.type}</span> <br>
    Cost: ${unlock.price.value} ${unlock.price.type}</span>`;
  unlocksUi.appendChild(div);
  applyUnlockStyles(div, unlock.styles);
  div.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      div.classList.contains("purchasable") &&
      !div.classList.contains("blocked")
    )
      purchaseUnlock(div, e);
  });
}

function createUnlocks() {
  unlockables.forEach((unlock) => {
    createUnlock(unlock);
  });
}

function sortUnlocks() {
  const container = document.querySelector(".unlockables-ui");
  const unlocks = Array.from(container.querySelectorAll(".unlock"));

  const typePriority = {
    points: 0,
    length: 1,
    levels: 2,
  };

  unlocks.sort((a, b) => {
    const typeA = typePriority[a.dataset.priceType] ?? 99;
    const typeB = typePriority[b.dataset.priceType] ?? 99;

    if (typeA !== typeB) return typeA - typeB;

    const valA = parseFloat(a.dataset.priceValue);
    const valB = parseFloat(b.dataset.priceValue);
    return valA - valB;
  });

  unlocks.forEach((div) => container.appendChild(div));
}

function purchaseUnlockEffect(unlock) {
  const effect = unlock.effect;
  // Pra coisas que aumentam valores (length)
  if (!isNaN(effect.value)) {
    player[effect.property] += parseFloat(effect.value);
  }
  // Pra unlocks
  if (effect.property === "unlock") {
    switch (effect.object) {
      case "fruit":
        index = fruit.findIndex(f => f.id === unlock.id)
        if(!index) console.log("Vixi! Deu ruim D:")
        fruit[index].unlocked = true;
        break;

      default:
        console.log(effect.object);
        break;
    }
  }
}

function purchaseUnlock(div, element) {
  unlock =
    unlockables[unlockables.findIndex((unlock) => unlock.id === `${div.id}`)];
  const price = parseFloat(unlock.price.value);
  switch (unlock.price.type) {
    case "points": {
      player.points -= price;
      break;
    }
    case "length": {
      player.length -= price;
      break;
    }
  }
  purchaseUnlockEffect(unlock);
  unlock.bougth = true;
  div.remove();
}

function applyUnlockStyles(div, styles) {
  Object.entries(styles).forEach(([property, value]) => {
    div.style[property] = value;
  });
}

function applyStyles() {}

function requirementsCheck() {
  const unlocks = document.querySelectorAll(".unlock");
  const unlockArr = Array.from(unlocks);
  unlockables.forEach((unlock) => {
    if (unlock.bougth) return;
    if (unlockArr.some((div) => div.id === `${unlock.id}`)) return;
    createUnlock(unlock);
  });
  unlocks.forEach((unlock) => {
    const price = parseFloat(unlock.dataset.priceValue);
    const requirementValue = parseFloat(unlock.dataset.requirementValue);
    const priceType = unlock.dataset.priceType;
    const reqType = unlock.dataset.requirementType;
    if (price > player[priceType]) {
      unlock.classList.add("blocked");
    } else {
      unlock.classList.remove("blocked");
    }
    if (player[reqType] >= requirementValue) {
      unlock.classList.add("purchasable");
    } else {
      unlock.classList.remove("purchasable");
    }
  });
}

// Game Functions
function getTile(x, y) {
  return screen.querySelector(`.floor[data-x="${x}"][data-y="${y}"]`);
}

function screenUpdate() {
  const cubes = document.querySelectorAll(".floor")
  if (cubes){
    cubes.forEach((element) => element.remove())
  }
  for (let y = 0; y < gameHeight; y++) {
    const line = document.createElement("div");
    line.classList.add("line");
    for (let x = 0; x < gameWidth; x++) {
      const cube = document.createElement("div");
      cube.classList.add("floor");
      cube.dataset.x = x;
      cube.dataset.y = y;
      if (x === player.head.x && y === player.head.y) {
        cube.id = "head";
      }
      if (x === fruits[0].x && y === fruits[0].y) {
        cube.classList.add("fruit");
        cube.id = fruits[0].type;
      }
      line.appendChild(cube);
    }
    line.dataset.y = y;
    screen.appendChild(line);
  }
}

function screenStart() {
  fruits.push(fruitGen());
  screenUpdate();
}
function fruitPos() {
  let x, y;
  let attempts = 0;
  do {
    x = Math.floor(Math.random() * gameWidth);
    y = Math.floor(Math.random() * gameHeight);
    attempts++;
    if (attempts > 50) {
      console.warn("Muitas tentativas para encontrar posição livre");
      break;
    }
  } while (
    (x === player.head.x && y === player.head.y) ||
    // Não pode estar na posição de outras frutas existentes
    fruits.some((fruit) => fruit.x === x && fruit.y === y) ||
    // Não pode estar em uma posição já ocupada no DOM
    (getTile(x, y) && getTile(x, y).id !== "")
  );
  return {
    x: x,
    y: y,
  };
}
function fruitRarity() {
  return "common";
}
function fruitType(rarity) {
  const validFruits = fruit.filter(f => f.rarity === rarity && f.unlocked);
  if (validFruits.length === 0) return "apple";
  // Soma das chances válidas
  const totalChance = validFruits.reduce((sum, f) => sum + f.baseChance, 0);
  const rand = Math.random() * totalChance;

  let cumulative = 0;
  for (let i = 0; i < validFruits.length; i++) {
    cumulative += validFruits[i].baseChance;
    if (rand < cumulative) {
      return validFruits[i].id;
    }
  }
}
function fruitValue(type) {
  return fruit.find(f => f.id === type).baseValue
}
function fruitGen() {
  const { x, y } = fruitPos();
  const rarity = fruitRarity();
  const type = fruitType(rarity);
  const value = fruitValue(type);
  return {
    x: x,
    y: y,
    rarity: rarity,
    type: type,
    value: value,
  };
}
function fruitCheck(x, y) {
  for (let i = 0; i < fruits.length; i++) {
    if (fruits[i].x === x && fruits[i].y === y) {
      getTile(fruits[i].x, fruits[i].y).id = "";
      getTile(fruits[i].x, fruits[i].y).classList.remove("fruit");
      player.points += fruits[i].value;
      fruits.splice(i, 1);
      const newFruit = fruitGen();
      fruits.push(newFruit);
      const newTile = getTile(newFruit.x, newFruit.y);
      if (newTile && newFruit.type) {
        newTile.classList.add("fruit");
        newTile.id = newFruit.type;
      }
      player.eaten = true;
      setTimeout(() => {
        player.eaten = false;
      }, 1000);
      break;
    }
  }
}
function scoreUpdate() {
  points.innerText = player.points.toFixed(2);
}
function playerMove() {
  if (player.dir === "stop") return;

  switch (player.dir) {
    case "up":
      if (player.head.y === 0) player.dir = "stop";
      else player.head.y--;
      break;
    case "down":
      if (player.head.y === gameHeight - 1) player.dir = "stop";
      else player.head.y++;
      break;
    case "left":
      if (player.head.x === 0) player.dir = "stop";
      else player.head.x--;
      break;
    case "right":
      if (player.head.x === gameWidth - 1) player.dir = "stop";
      else player.head.x++;
      break;
  }

  if (getTile(player.head.x, player.head.y).classList.contains("fruit")) {
    fruitCheck(player.head.x, player.head.y);
  }

  updateMap();

  player.body.unshift({ ...player.head });
  player.body.pop();
}
function updateMap() {
  if (player.length == 0 && player.dir != "stop") {
    getTile(player.head.x, player.head.y).id = "head";
    getTile(player.body[0].x, player.body[0].y).id = "";
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
    case "w":
    case "ArrowUp":
      e.preventDefault();
      player.dir = "up";
      break;
    case "a":
    case "ArrowLeft":
      e.preventDefault();
      player.dir = "left";
      break;
    case "s":
    case "ArrowDown":
      e.preventDefault();
      player.dir = "down";
      break;
    case "d":
    case "ArrowRight":
      e.preventDefault();
      player.dir = "right";
      break;
    case " ":
      e.preventDefault();
      player.dir = "stop";
      break;
    case "f":
      e.preventDefault();
      saveGame();
      showSaveNotification();
      break;
  }
});
// Startup
function start() {
  sizeAdjust();
  screenStart();
  loadGame();
  setTimeout(() => {
    createUnlocks();
    applyStyles();
    updateOverflowCounter();
    initHoverListeners();
  }, 100);
}

// Game
setInterval(() => {
  playerMove();
  scoreUpdate();
}, gameSpeed);
setInterval(() => {
  requirementsCheck();
  sortUnlocks();
}, 500);
setInterval(() => {
  timePlayed++;
}, 1000);
// Save
function saveGame() {
  const gameData = {
    player: {...player,},
    fruits: [...fruits],
    fruit: [...fruit],
    unlockables: [...unlockables],
    gameWidth: gameWidth,
    gameHeight: gameHeight,
    gameSpeed: gameSpeed,
    timePlayed: timePlayed,
  };
  localStorage.setItem("snakeGameSave", JSON.stringify(gameData));
  showSaveNotification();
}

function loadGame() {
  const savedData = localStorage.getItem("snakeGameSave");
  if (savedData) {
    try {
      const gameData = JSON.parse(savedData);
      getTile(fruits[0].x, fruits[0].y).classList.remove("fruit");
      getTile(fruits[0].x, fruits[0].y).id = "";
      getTile(player.head.x, player.head.y).id = "";
      unlockables = [...gameData.unlockables]
      fruit = [...gameData.fruit]
      fruits = [...gameData.fruits];
      fruits.forEach((element) => {
        getTile(element.x, element.y).classList.add("fruit");
        getTile(element.x, element.y).id = element.type;
      });
      player = { ...gameData.player };
      getTile(player.head.x, player.head.y).id = "head";

      gameWidth = gameData.gameWidth;
      gameHeight = gameData.gameHeight;
      gameSpeed = gameData.gameSpeed;
      timePlayed = gameData.timePlayed;
      
      const pointElement = document.querySelector("#point");
      if (pointElement && player.points) {
        pointElement.innerText = player.points.toFixed(2);
      }
    } catch (error) {
      console.log(`Erro ao carregar jogo: ${error}`);
    }
  }
}

function deleteSave() {
  localStorage.removeItem("snakeGameSave");
}

function hasSavedGame() {
  return localStorage.getItem("snakeGameSave") !== null;
}

setInterval(() => {
  saveGame();
}, 30000);
