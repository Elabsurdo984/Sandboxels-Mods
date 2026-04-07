elements.MoltenGloop = {
    color: "#770A55",
    singleColor: true,
    behavior: behaviors.MOLTEN,
    category: "gloops",
    state:  "liquid",
    tempHigh: 1200,
    stateHigh: "GloopGas",
    tempLow: 20,
    stateLow: "HardGloop",
    temp: 900,
    density: 1100,
    viscosity: 60000,
};

elements.HardGloop = {
    color: "#AD0A28",
    singleColor: true,
    behavior: behaviors.SOLID,
    reactions: {
        "MoltenGloop": { elem1:"MoltenGloop", chance:0.5, elem2:"MoltenGloop"}
    },
    category: "gloops",
    state:  "solid",
    tempHigh: 900,
    stateHigh: "MoltenGloop",
    density: 1100,
};

elements.Gloop = {
    color: "#E81D71",
    singleColor: true,
    behavior: [
        "XX|XX|XX",
        "XX|XX|XX",
        "M2%10|M1|M2%10",
    ],
    reactions: {
        "MoltenGloop": { elem1:"MoltenGloop", elem2:"MoltenGloop"}
    },
    related: ["MoltenGloop", "HardGloop", "GloopGas", "ConsumingGloop"],
    category: "gloops",
    state:  "solid",
    tempHigh: 900,
    stateHigh: "MoltenGloop",
    density: 1100,
    desc: "A strange substance. It can be melted at 900°C."
};

elements.ConsumingGloop = {
    color: "#A53A6E",
    singleColor: true,
    behavior: [
        "CH:ConsumingGloop|CH:ConsumingGloop|CH:ConsumingGloop",
        "M2 AND CH:ConsumingGloop|XX|M2 AND CH:ConsumingGloop",
        "M2 AND CH:ConsumingGloop|M1|M2 AND CH:ConsumingGloop",
    ],
    category: "gloops",
    density: 1100,
    temp: 400,
    tempLow: 20,
    stateLow: "Gloop",
},

elements.GloopGas = {
    color: ["#E3659A", "#CF5D8C", "#EB699F"],
    behavior: behaviors.GAS,
    category: "gloops",
    state:  "gas",
    tempLow: 900,
    stateLow: "Gloop",
    temp: 1200,
    density: 1000,
};

elements.Gloopfier = {
    color: "#E81D71",
    tool: function(pixel) {
        changePixel(pixel, "Gloop");
    },
    category: "tools",
};

elements.GloopBomb = {
    color: ["#981049", "#99295F", "#D71E6B"],
    behavior: [
        "XX|XX|XX",
        "XX|XX|XX",
        "M2%25 AND EX:8>Gloop|M1 AND EX:8>Gloop|M2%25 AND EX:8>Gloop",
    ],
    category: "weapons",
    density: 1100,
};