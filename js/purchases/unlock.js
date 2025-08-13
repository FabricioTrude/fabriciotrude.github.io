function purchaseEffectUnlock(upgrade){
  const effect = upgrade.effect
    switch (effect.property) {
      case "fruit":
        index = fruits.findIndex((f) => f.id === upgrade.id);
        if (!index) console.log("Vixi! Deu ruim D:");
        fruits[index].unlocked = true;
        document.querySelector(`.fruits.upgrade#${upgrade.id}`).classList.remove("blocked")
        fruitGen();
        break;
    }
    updateOverflowCounter();
}