// Save
function saveGame() {
  // console.log("===== Salvando jogo ======")
  // console.log("Fruits antes de salvar: ", fruits)
  // console.log("Quantidade de frutas: ", fruits.length)
  const gameData = {
    commands: {...player.commands},
    fruits: [...fruits],
    fruit: [...fruit],
    gameWidth: gameWidth,
    gameHeight: gameHeight,
    gameSpeed: gameSpeed,
    player: { ...player },
    timePlayed: timePlayed,
    unlockables: unlockables.map((u) => ({
      unlocked: u.unlocked,
      level: u.level,
    })),
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
    fruits = [...gameData.fruits];
    // console.log("==== CARREGANDO JOGO =====")
    // console.log("Fruits após load:", fruits)

    // Atribuições diretas simples
    gameWidth = gameData.gameWidth;
    gameHeight = gameData.gameHeight;
    gameSpeed = gameData.gameSpeed;
    timePlayed = gameData.timePlayed;

    // Upgrades
  } catch (e) {
    console.error("Erro ao carregar jogo:", e);
  }
}

function deleteSave() {
  localStorage.removeItem("snake");
}

function hasSavedGame() {
  return localStorage.getItem("snake") !== null;
}

setInterval(() => { 
  if(player.commands.autoSave)saveGame();
}, 30000);
