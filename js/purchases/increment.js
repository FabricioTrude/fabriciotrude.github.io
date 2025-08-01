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
