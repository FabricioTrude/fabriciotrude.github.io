function purchaseEffectUnlock(upgrade){
  const effect = upgrade.effect
    switch (effect.property) {
      case "fruit":
        index = fruit.findIndex((f) => f.id === upgrade.id);
        if (!index) console.log("Vixi! Deu ruim D:");
        fruit[index].unlocked = true;
        break;
    }
}