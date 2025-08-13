// Save
function saveGame() {
  // console.log("===== Salvando jogo ======")
  // console.log("Fruits antes de salvar: ", fruit)
  // console.log("Quantidade de frutas: ", fruit.length)
  const gameData = {
    fruits: [...fruits],
    fruit: [...fruit],
    gameWidth: gameWidth,
    gameHeight: gameHeight,
    gameSpeed: gameSpeed,
    player: { ...player },
    timePlayed: timePlayed,
    upgrades: Object.keys(upgrades).reduce((savedUpgrades, category) => {
      savedUpgrades[category] = upgrades[category].map((upgrade) => ({
        id: upgrade.id,
        unlocked: upgrade.unlocked,
        level: upgrade.level,
        maxLevel: upgrade.price.maxLevel
      }));
      return savedUpgrades;
    },{}),
  };
  localStorage.setItem("snake", JSON.stringify(gameData));
  showSaveNotification();
}

function loadGame() {
  const save = localStorage.getItem("snake");
  if (!save) return;
  try {
    const gameData = JSON.parse(save);
    // Pra Screen
    player = { ...gameData.player };
    player.scales = new Big(player.scales)
    fruit = [...gameData.fruit];

    // Atribuições diretas simples
    gameWidth = gameData.gameWidth;
    gameHeight = gameData.gameHeight;
    gameSpeed = gameData.gameSpeed;
    timePlayed = gameData.timePlayed;

    // Upgrades - carrega todas as categorias salvas
    if (gameData.upgrades) {
      Object.keys(gameData.upgrades).forEach((category) => {
        if (upgrades[category]) {
          gameData.upgrades[category].forEach((savedUpgrade, index) => {
            if (upgrades[category][index]) {
              upgrades[category][index].unlocked = savedUpgrade.unlocked;
              upgrades[category][index].level = savedUpgrade.level;
              if(upgrades[category][index].price.maxLevel)
                upgrades[category][index].price.maxLevel = savedUpgrade.maxLevel;
            }
          });
        }
      });
    }
    // Assets
     fruits = fruits.map((fruit,index) => ({
      ...fruit,
      unlocked: gameData.fruits[index].unlocked ?? fruit.unlocked
    }))

  } catch (e) {
    console.error("Erro ao carregar jogo:", e);
  }
}

function deleteSave() {
  localStorage.removeItem("snake");
  showDeleteNotification();
}

function hasSavedGame() {
  return localStorage.getItem("snake") !== null;
}

setInterval(() => { 
  if(player.commands.autoSave)saveGame();
}, 30000);
