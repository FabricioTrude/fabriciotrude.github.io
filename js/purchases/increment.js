function purchaseEffectIncrement(upgrade) {
  const effect = upgrade.effect;
  switch (effect.property) {
    case "maxFruits": {
      player.maxFruits += 1;
      fruitGen();
      break;
    }
    case "screenSize": {
      gameWidth += 1;
      gameHeight += 1;
      screenStart();
      break;
    }
  }
}
function purchaseUpgradeIncrement(upgrade) {
  const effect = upgrade.effect;
  const list = upgrades[effect.upgrades];
  const boost = list.find((el) => el.id === effect.property);
  if (boost) {
    boost.price.maxLevel += parseInt(boost.effect.value);
    const boostDiv = document.querySelector(
      `.boosts#${boost.id}`
    );
    boostDiv.dataset.maxLevel = boost.price.maxLevel
    updateBoostTooltip(boostDiv, boost);
  }
}
