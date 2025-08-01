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
  const unlocks = document.querySelectorAll(".unlockables");

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
  const containers = [...document.querySelectorAll("#right>div")];
  const floatingTooltip = document.querySelector(".floating-tooltip");

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
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
      if (i === 0) {
        transitionTimeout = setTimeout(() => {
          updateOverflowCounter();
        }, 1050);
        container.style.height = "68px";
      }
      floatingTooltip.style.opacity = "0";
    }

    function handleTransitionEnd(e) {
      if (e.propertyName === "height" && i === 0) {
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

function startUi() {
  pages.forEach((page) => {
    const button = document.createElement("div");
    button.classList.add("page-button");
    const classe = page.classList[0];
    button.id = classe;
    const nome = classe.charAt(0).toUpperCase() + classe.slice(1).toLowerCase();
    button.innerText = nome;
    bottom.appendChild(button);
  });
  const buttons = document.querySelectorAll(".page-button");
  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      pages.forEach((page) => {
        const pageClass = page.classList[0];
        if (pageClass === button.id) {
          page.classList.remove("hidden");
          // Load changelog when changelog tab is opened
          switch (pageClass) {
            case "snake":
              sizeAdjust();
              break;
            case "changelog":
              loadChangelog();
              break;
          }
        } else {
          page.classList.add("hidden");
        }
      });
      title.innerText = button.innerText;
    });
  });

  // Initialize controls form
  initControlsForm();
}

function parseChangelog(text) {
  const lines = text.split("\n").map((line) => line.trim());
  const rootUL = document.createElement("ul");

  let currentVersionLI, currentTypeLI, currentWhereLI;

  lines.forEach((line) => {
    if (!line || line.startsWith("-")) return;

    if (line.startsWith("Snake v")) {
      // Version
      currentVersionLI = document.createElement("li");
      currentVersionLI.classList.add("version");
      currentVersionLI.textContent = line;
      currentVersionLI.id = line.replace("Snake", "");
      const typeUL = document.createElement("ul");
      currentVersionLI.appendChild(typeUL);
      rootUL.appendChild(currentVersionLI);
      currentTypeLI = null;
      currentWhereLI = null;
    } else if (line.startsWith("#")) {
      // Type
      const type = line.replace("#", "");
      currentTypeLI = document.createElement("li");
      currentTypeLI.classList.add("type");
      currentTypeLI.textContent = type;
      currentTypeLI.id = type.replace(":", "").toLowerCase();
      const whereUL = document.createElement("ul");
      currentTypeLI.appendChild(whereUL);
      currentVersionLI.querySelector("ul").appendChild(currentTypeLI);
      currentWhereLI = null;
    } else if (line.endsWith(":") && !line.startsWith("#")) {
      // Where
      const where = line;
      currentWhereLI = document.createElement("li");
      currentWhereLI.classList.add("where");
      currentWhereLI.textContent = where;
      currentWhereLI.id = where.replace(":", "").toLowerCase();
      const contentUL = document.createElement("ul");
      currentWhereLI.appendChild(contentUL);
      currentTypeLI.querySelector("ul").appendChild(currentWhereLI);
    } else if (line.startsWith("*")) {
      // Content
      const content = line;
      const li = document.createElement("li");
      li.classList.add("content");
      li.textContent = content;
      if (currentWhereLI) {
        currentWhereLI.querySelector("ul").appendChild(li);
      } else if (currentTypeLI) {
        currentTypeLI.querySelector("ul").appendChild(li);
      }
    }
  });
  return rootUL.outerHTML;
}

function loadChangelog() {
  const changelogBox = document.getElementById("changelog-box");
  if (!changelogBox) return;
  if (changelogBox.textContent.trim()) return;

  fetch("changelog.txt")
    .then((response) => response.text())
    .then((changelog) => {
      changelogBox.innerHTML = parseChangelog(changelog);
      const content = [...document.querySelectorAll(".version.content")];
      for (let i = 0; i < content.length; i++) {
        content[i].id = `changelog-content-${content.length - 1 - i}`;
      }
      const versions = [...document.querySelectorAll(".version")];
      function changelogName() {
        document.querySelector("#header-title").innerText =
          "Changelog" + versions[0].id;
      }
      changelogName();
      document
        .querySelector(".page-button#changelog")
        .addEventListener("click", changelogName);
    })
    .catch((error) => {
      changelogBox.textContent = "Error loading changelog: " + error.message;
    });
}

function initControlsForm() {
  // config buttons
  const form = document.getElementById("controls-form");
  const undoBtn = document.getElementById("undo-controls");
  const confirmBtn = document.getElementById("confirm-controls");

  if (!form || !undoBtn || !confirmBtn) return;

  let tempCommands = { ...player.commands }; // Copia temporária

  updateFormPlaceholders();

  // Undo button - clear all inputs
  undoBtn.addEventListener("click", () => {
    tempCommands = { ...player.commands };
    updateFormValues();
  });

  // Confirm button - apply changes and clear inputs
  confirmBtn.addEventListener("click", () => {
    confirmControls();
  });

  // Handle input changes (store in temp)
  form.addEventListener("input", (e) => {
    if (e.target.type === "text") {
      const key = e.target.name;
      const value = e.target.value;

      if (value.length <= 1) {
        tempCommands[key] = value || player.commands[key];
        e.target.style.borderColor = "#333";
      } else {
        e.target.value = value.slice(0, 1);
        tempCommands[key] = e.target.value;
      }
    } else if (e.target.type === "checkbox") {
      const key = e.target.name;
      tempCommands[key] = e.target.checked;
    }
  });

  // Enter = confirm, Esc = undo, if input is focused
  form.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmControls();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        tempCommands = { ...player.commands };
        updateFormValues();
      }
    }
  });

  function confirmControls() {
    // Validate inputs first
    const inputs = form.querySelectorAll("input");
    let valid = true;

    inputs.forEach((input) => {
      if (input.type === "text" && input.value && input.value.length !== 1) {
        valid = false;
        input.style.borderColor = "#d32f2f";
      } else {
        input.style.borderColor = "#333";
      }
    });

    if (valid) {
      // Apply changes to player.commands
      inputs.forEach((input) => {
        if (input.type === "text" && input.value) {
          player.commands[input.name] = input.value;
        } else if (input.type === "checkbox") {
          player.commands[input.name] = input.checked;
        }
      });

      tempCommands = { ...player.commands };
      // Clear only text inputs
      inputs.forEach((input) => {
        if (input.type === "text") {
          input.value = "";
        }
      });
      updateFormPlaceholders();
      saveGame(); // Show confirmation
    }
  }

  function updateFormPlaceholders() {
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      if (input.type === "text") {
        input.placeholder = player.commands[input.name] || "";
      } else if (input.type === "checkbox") {
        input.checked = player.commands[input.name] || false;
      }
    });
  }

  function updateFormValues() {
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      if (input.type === "text") {
        input.value = "";
        input.style.borderColor = "#333";
      } else if (input.type === "checkbox") {
        input.checked = player.commands[input.name] || false;
      }
    });
  }
}

// Upgrades

function createUpgradeCheck(div) {
  const requirementValue = parseFloat(div.dataset.requirementValue);
  let level, unlocked;
  switch (div.dataset.type) {
    case "unlockables": {
      level = div.dataset.level;
      if (level>0) return false;
      unlocked = unlockables.find((u) => u.id === div.id).unlocked;
      break;
    }
    case "boosts": {
      unlocked = boosts[div.dataset.boostIndex].unlocked
    }
  }
  switch (div.dataset.requirementType) {
    case "serpentine": {
      if (requirementValue > player.serpentine && !unlocked) return false;
      else return true;
    }
    case "length": {
      if (requirementValue > player.length && !unlocked) return false;
      else return true;
    }
  }
}

function applyStyles(div, styles) {
  if (!styles) return;
  if (div.dataset.type === "unlockables") {
    Object.entries(styles).forEach(([property, value]) => {
      div.style[property] = value;
    });
  } else if (div.dataset.type === "boosts") {
    Object.entries(styles).forEach(([property, value]) => {
      div.children[0].style[property] = value;
    });
  }
}

function sortUnlocks() {
  const container = document.querySelector(".unlockables-ui");
  const unlocks = Array.from(container.querySelectorAll(".unlockables"));

  const typePriority = {
    serpentine: 0,
    length: 1,
    levels: 2,
  };

  unlocks.sort((a, b) => {
    const typeA = typePriority[a.dataset.priceType] ?? 99;
    const typeB = typePriority[b.dataset.priceType] ?? 99;

    if (typeA !== typeB) return typeA - typeB;

    const valA = parseFloat(a.dataset.price);
    const valB = parseFloat(b.dataset.price);
    return valA - valB;
  });

  unlocks.forEach((div) => container.appendChild(div));
}

function createUnlock(unlock) {
  const existingUnlock = document.getElementById(unlock.id);
  if (existingUnlock) return
  const div = document.createElement("div");
  div.dataset.requirementType = unlock.requirement.type;
  div.dataset.requirementValue = unlock.requirement.value;
  div.dataset.priceType = unlock.price.type;
  div.dataset.price = unlock.price.value;
  div.dataset.level = unlock.level;
  div.dataset.type = "unlockables";
  div.id = unlock.id;
  if (createUpgradeCheck(div) === false) return;
  unlock.unlocked = true;
  div.classList.add("unlockables", "has-tooltip");
  div.innerHTML = `<span class="tooltip">
    ${unlock.name}<br>
    ${unlock.description}<br>
    <span class="requirement">
    Requirement: 
    ${unlock.requirement.value} ${unlock.requirement.type}</span> <br>
    Cost: ${unlock.price.value} ${unlock.price.type}</span>`;
  unlocksUi.appendChild(div);
  applyStyles(div, unlock.styles);
  div.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      div.classList.contains("purchasable") &&
      !div.classList.contains("blocked")
    )
    purchaseUpgrade(div);
  });
  sortUnlocks();
  requirementsCheck()
}

function createBoost(boost) {
  const existingBoost = document.getElementById(boost.id);
  if (existingBoost) return

  const div = document.createElement("div");
  div.dataset.boostIndex = boosts.indexOf(boost);
  div.dataset.requirementValue = boost.requirement.value;
  div.dataset.requirementType = boost.requirement.type;
  div.dataset.price = boost.price.base ?? boost.price.values[0];
  div.dataset.type = "boosts";
  div.classList.add("boosts", "has-tooltip");
  if (createUpgradeCheck(div) === false) return;
  div.id = boost.id;
  boost.unlocked = true;

  div.innerHTML = `
  <div class="boost-icon"></div>
  <div class="boost-title">${boost.name}</div>
  <div class="boost-price">
    <p class="boost-cost">${div.dataset.price}</p>
    <p class="boost-type serpentine">${boost.price.type}</p>
  </div>
  <span class="tooltip">
    ${boost.name}<br>
    ${boost.description}<br>
    <span class="requirement">
      Requirement: ${boost.requirement.value} ${boost.requirement.type}
    </span>
  </span>
`;
  boostsUi.appendChild(div);
  applyStyles(div, boost.styles);
  div.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      div.classList.contains("purchasable") &&
      !div.classList.contains("blocked")
    )
      purchaseUpgrade(div);
  });
  requirementsCheck()
}

function createUpgrades() {
  unlockables.forEach((unlock) => {
    createUnlock(unlock);
  });
  boosts.forEach((boost) => {
    createBoost(boost);
  });
}

function purchaseUpgrade(div) {
  const type = div.dataset.type;
  const id = div.id;
  const upgradesList = upgrades[type];
  const upgrade = upgradesList.find((u) => u.id === id);
  if (!upgrade) return;
  const effect = upgrade.effect
  const price = parseFloat(div.dataset.price);

  // Checks if removes or not upgrade
  switch (type) {
    case "unlockables": {
      upgrade.level = 1;
      div.remove();
      break;
    }
    case "boosts": {
      upgrade.level += 1;
      break;
    }
    default: {
      console.warn(`tipo ${type} ainda não implementado.`);
      break;
    }
  }

  // Changes its price / Discounts its price
  switch (upgrade.price.type) {
    case "serpentine":
      player.serpentine -= price;
      document.querySelector("#point").innerText = player.serpentine.toFixed(2);
      break;
    case "lenght":
      player.lenght -= price;
      break;
    default:
      console.warn(`tipo de preço desconhecido: ${upgrade.price.type}`);
  }

  // Effects of the upgrade
  switch (effect.model) {
    case "unlock":
      purchaseEffectUnlock(upgrade);
      break;
    case "increment":
      purchaseEffectIncrement(upgrade);
      break;
  }
  requirementsCheck();
}

function requirementsCheck() {
  // Percorre todos os tipos de upgrade (boosts, unlocks, etc.)
  Object.keys(upgrades).forEach((type) => {
    const upgradeList = upgrades[type];
    const divs = [...document.querySelectorAll(`.${type}`)];
    upgradeList.forEach((upgrade) => {
      if (upgrade.level>0) return;
      switch(type){
        case "unlockables":{
          if (divs.some((div) => div.id === `${upgrade.id}`)) return;
          createUnlock(upgrade)
          break;
        }
        case "boosts":{
          if (divs.some((div) => div.id === `${upgrade.id}`)) return
          createBoost(upgrade)
        }
      }
    });
    divs.forEach((div) => {
      const upgrade = upgradeList.find((u) => u.id === div.id);
      let price = parseFloat(upgrade.price.value);
      const priceType = upgrade.price.type;
      if (upgrade.price.model) {
        const level = upgrade.level || 0;
        const base = parseFloat(upgrade.price.base || 0);
        const increment = parseFloat(upgrade.price.increment || 0);
        const factor = parseFloat(upgrade.price.model.factor || 1);
        const maxLevel = upgrade.price.maxLevel ?? Infinity;

        switch (upgrade.price.model.type) {
          case "constant":
            price = base;
            break;
          case "linear":
            price = base + increment * level;
            break;
          case "exponential":
            price = base * Math.pow(factor, level);
            break;
          case "factorial":
            price = base * Math.factorial(level);
            break;
          case "sequence":
            price = upgrade.price.values[level];
            break;
          case "fixed":
            price = base;
            break;
        }

        if (div.children[2]?.children[0]) {
          div.children[2].children[0].innerText = price;
        }
        div.dataset.price = price;

        if (price > player[priceType] || level >= maxLevel) {
          div.classList.add("blocked");
          div.classList.remove("purchasable");
        } else {
          div.classList.add("purchasable");
          div.classList.remove("blocked");
        }
      } else {
        // Caso seja upgrade de compra única (ex: unlock)
        if (upgrade.level>0) return;

        const price = upgrade.price.value;
        if (price > player[priceType]) {
          div.classList.add("blocked");
          div.classList.remove("purchasable");
        } else {
          div.classList.remove("blocked");
          div.classList.add("purchasable");
        }
      }
    });
  });
}
