let boosts = [
  {
    id: "max_fruits", // required
    name: "Max Fruits", // required
    description: "Increases the maximum number of fruits on the screen", // required
    unlocked: false, // required
    level: 0, // required
    requirement: { type: "serpentine", value: 0.2 }, // required
    price: {
      // required
      type: "serpentine",
      model: { type: "exponential", factor: 2 }, // "fixed", "sequence", "exponential", "decreasing"
      // model:{type: "fixed"},
      base: 0.5, // preço = base * (factor^timesBought)
      maxPrice: 1e9, // preço máximo
      maxLevel: 3, // ou null para infinito
    },
    effect: {
      // required
      property: "maxFruits",
      model: "increment", // "set", "increment", "multiply", "exponential", "decreasing"
      value: 1,
    },
    styles: {
      backgroundColor: "#f0f0f0",
      borderColor: "#cccccc",
    },
  },
  {
    id: "screen_size",
    name: "Screen Size",
    description: "Increases area you can play around!",
    unlocked: false,
    level: 0,
    requirement: { type: "serpentine", value: 0.2 }, // 2
    price: {
      type: "serpentine",
      model: { type: "sequence" },
      values: [2, 5],
      // model: { type: "fixed" },
      // base: 1,
      maxLevel: 2,
    },
    effect: {
      property: "screenSize",
      model: "increment",
      value: 1,
    },
    styles: {
      backgroundColor: "#ff2e2eff",
      borderColor: "#222222ff",
    },
  },
];
