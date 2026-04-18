// ============================================================
//  REALISTIC EXPLOSIONS MOD  —  Sandboxels v1.13+
//  Elementos reales: reactor nuclear, termita, ANFO, BLEVE, etc.
// ============================================================

// ────────────────────────────────────────────────────────────
//  NUCLEAR — Reactor Nuclear
// ────────────────────────────────────────────────────────────

// Barra de combustible de uranio enriquecido.
// Emite neutrones y calor. Sin refrigerante → fusión del núcleo.
elements.uranium_rod = {
    color: ["#4a8a52","#3d6647","#5a9c5a","#6fad4e","#8fcf70"],
    behavior: behaviors.WALL,
    behaviorOn: [
        "XX|XX|XX",
        "XX|RL:neutron%0.5 AND RL:radiation%0.3|XX",
        "XX|XX|XX"
    ],
    category: "nuclear",
    state: "solid",
    density: 10960,
    hardness: 0.7,
    conduct: 0.27,
    tempHigh: 2865,
    stateHigh: "corium",
    excludeRandom: true,
    reactions: {
        // Los neutrones causan fisión → más calor (reacción en cadena)
        "neutron": { temp1: 800, chance: 0.4 },
        // El refrigerante enfría la barra
        "reactor_coolant": { temp1: -30, chance: 0.6 },
        // La varilla de control absorbe neutrones y reduce la temperatura
        "control_rod_boron": { temp1: -100, chance: 0.9 },
        // Agua normal: menos eficiente que el refrigerante
        "water": { temp1: -8, temp2: 25, chance: 0.3 }
    },
    tick: function(pixel) {
        // Sin refrigerante ni varilla de control → calentamiento acelerado
        var hasCoolant = false;
        var offsets = [[-1,0],[1,0],[0,-1],[0,1]];
        for (var i = 0; i < offsets.length; i++) {
            var nx = pixel.x + offsets[i][0];
            var ny = pixel.y + offsets[i][1];
            if (!outOfBounds(nx, ny) && !isEmpty(nx, ny)) {
                var np = pixelMap[nx][ny];
                if (np && (np.element === "reactor_coolant" || np.element === "water")) {
                    hasCoolant = true;
                    break;
                }
            }
        }
        if (!hasCoolant) {
            // Acumulación de calor sin refrigerante (SCRAM fallido)
            pixel.temp += 15;
        }
        // Si supera la temperatura crítica → inicio de fusión del núcleo
        if (pixel.temp > 2500) {
            changePixel(pixel, "corium");
        }
    },
    desc: "Barra de combustible de uranio enriquecido. Emite neutrones y calor. Mantén el refrigerante o habrá fusión del núcleo.",
    alias: "fuel rod"
};

// Líquido refrigerante del reactor (agua a presión).
// Absorbe el calor de las barras. Si contacta corium → explosión de vapor.
elements.reactor_coolant = {
    color: ["#3399ff","#2277ee","#44aaff","#55bbff","#1155cc"],
    behavior: behaviors.LIQUID,
    category: "nuclear",
    state: "liquid",
    density: 1000,
    viscosity: 5,
    conduct: 0.65,
    tempHigh: 180,
    stateHigh: "steam",
    excludeRandom: true,
    extinguish: true,
    reactions: {
        // Contacto con corium → explosión de vapor (como en Chernobyl)
        "corium": { elem1: "steam_explosion", elem2: "steam", chance: 0.6 },
        // El termita en contacto con agua/refrigerante: PELIGROSO
        "thermite_burning": { elem1: "explosion", elem2: "steam", chance: 0.8 }
    },
    tick: function(pixel) {
        // Si el refrigerante se sobrecalienta de golpe → explosión de vapor
        if (pixel.temp > 350 && Math.random() < 0.2) {
            changePixel(pixel, "steam_explosion");
        }
    },
    desc: "Refrigerante de reactor nuclear. Absorbe el calor de las barras de combustible. ¡Contacto con corium = explosión de vapor!",
    alias: "coolant"
};

// Corium: mezcla de combustible nuclear fundido + acero + concreto.
// Producto de una fusión del núcleo. Quema casi todo lo que toca.
elements.corium = {
    color: ["#ff6600","#ee5500","#cc4400","#ff8800","#dd6600","#ff4400"],
    behavior: behaviors.LIQUID,
    category: "nuclear",
    state: "liquid",
    density: 5700,
    viscosity: 600,
    conduct: 0.5,
    temp: 2200,
    tempLow: 1800,
    stateLow: "corium_crust",
    excludeRandom: true,
    reactions: {
        // El agua causa explosión de vapor violenta (Fukushima/Chernobyl)
        "water": { elem1: "steam_explosion", elem2: "steam", chance: 0.7 },
        "reactor_coolant": { elem1: "steam_explosion", elem2: "steam", chance: 0.7 },
        "ice": { elem1: "steam_explosion", elem2: "steam", chance: 0.9 },
        // El corium funde/disuelve materiales de construcción (efecto "pie de elefante")
        "concrete": { elem1: "corium", elem2: null, chance: 0.008 },
        "rock":     { elem1: "corium", elem2: null, chance: 0.004 },
        "steel":    { elem1: "corium", elem2: null, chance: 0.002 },
        "iron":     { elem1: "corium", elem2: null, chance: 0.003 },
        "sand":     { elem1: "corium", elem2: null, chance: 0.015 },
        "dirt":     { elem1: "corium", elem2: null, chance: 0.015 },
        "glass":    { elem1: "corium", elem2: null, chance: 0.02  }
    },
    tick: function(pixel) {
        // Emite radiación constantemente
        if (Math.random() < 0.04 && !outOfBounds(pixel.x, pixel.y - 1) && isEmpty(pixel.x, pixel.y - 1)) {
            createPixel("radiation", pixel.x, pixel.y - 1);
        }
        // Mantiene temperatura mínima alta
        if (pixel.temp < 1900) { pixel.temp = 1900; }
    },
    desc: "Corium — mezcla de uranio fundido y materiales del reactor. Extremadamente caliente y radiactivo. Funde casi todo.",
    alias: "molten core"
};

// Corium solidificado. Todavía radiactivo. Se funde si se calienta de nuevo.
elements.corium_crust = {
    color: ["#2a2218","#3a3020","#1e1a12","#4a4030","#302818"],
    behavior: behaviors.WALL,
    category: "nuclear",
    state: "solid",
    density: 6500,
    hardness: 0.55,
    conduct: 0.3,
    tempHigh: 1800,
    stateHigh: "corium",
    excludeRandom: true,
    reactions: {
        "water": { elem1: "steam", elem2: "radiation", chance: 0.08 },
        "reactor_coolant": { elem1: "steam", elem2: "radiation", chance: 0.08 }
    },
    desc: "Corium solidificado. Sigue siendo radiactivo. Se puede volver a fundir si se calienta.",
    alias: "solidified corium"
};

// Varilla de control de carburo de boro. Absorbe neutrones → frena la reacción.
elements.control_rod_boron = {
    color: ["#1a1a1a","#222222","#2a2828","#181818"],
    behavior: behaviors.WALL,
    category: "nuclear",
    state: "solid",
    density: 2340,
    hardness: 0.85,
    conduct: 0.27,
    tempHigh: 2200,
    stateHigh: "smoke",
    excludeRandom: true,
    reactions: {
        // Absorbe neutrones sin liberar más (eso es precisamente el punto)
        "neutron": { elem2: null, chance: 0.95 }
    },
    desc: "Varilla de control de carburo de boro (B4C). Absorbe neutrones para frenar o detener la reacción en cadena.",
    alias: "control rod"
};

// Explosión de vapor: condensación instantánea de refrigerante en vapor.
// Ocurrió en Chernobyl y contribuyó al desastre.
elements.steam_explosion = {
    color: ["#ffffff","#f0f0f0","#e8e8e8","#dddddd","#cccccc"],
    behavior: behaviors.WALL,
    behaviorOn: [
        "XX|XX|XX",
        "XX|EX:30>steam,steam,steam,smoke,smoke|XX",
        "XX|XX|XX"
    ],
    temp: 600,
    category: "nuclear",
    state: "gas",
    density: 1000,
    excludeRandom: true,
    noMix: true,
    hidden: true,
    desc: "Explosión de vapor — refrigerante vaporizado instantáneamente por corium."
};

// ────────────────────────────────────────────────────────────
//  EXPLOSIVOS INDUSTRIALES
// ────────────────────────────────────────────────────────────

// Termita: polvo de aluminio + óxido de hierro.
// Quema a 2500 °C. El agua la empeora enormemente.
elements.thermite = {
    color: ["#c8c8c8","#b8b8b8","#d0d0d0","#cc2200","#aa1100","#c0c0c0"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 4000,
    excludeRandom: true,
    reactions: {
        "fire":    { elem1: "thermite_burning", chance: 0.05 },
        "lava":    { elem1: "thermite_burning", chance: 0.7  },
        "plasma":  { elem1: "thermite_burning", chance: 0.9  },
        "electric":{ elem1: "thermite_burning", chance: 0.4  },
        // El magnesio la enciende de forma confiable
        "magnesium":{ elem1: "thermite_burning", chance: 0.6 }
    },
    desc: "Termita — mezcla de polvo de aluminio y óxido de hierro. Arde a 2500 °C. ¡El agua provoca explosión!",
    alias: "thermite"
};

// Termita activa. Muy caliente. El agua la hace explotar violentamente.
elements.thermite_burning = {
    color: ["#ff9900","#ffcc00","#ff6600","#ffaa00","#ffffff","#ffee44"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 3800,
    temp: 2500,
    burn: 200,
    burnTime: 400,
    burnInto: "thermite_slag",
    tempHigh: 2600,
    stateHigh: "thermite_slag",
    excludeRandom: true,
    reactions: {
        // ¡PELIGRO! Agua + termita activa = explosión (real y documentado)
        "water":          { elem1: "explosion", elem2: "steam",     chance: 0.85 },
        "reactor_coolant":{ elem1: "explosion", elem2: "steam",     chance: 0.85 },
        "ice":            { elem1: "explosion", elem2: "steam",     chance: 0.95 },
        "snow":           { elem1: "explosion", elem2: "steam",     chance: 0.9  },
        // Derrite metales
        "steel": { elem1: "thermite_slag", elem2: "molten_steel",  chance: 0.04 },
        "iron":  { elem1: "thermite_slag", elem2: "molten_iron",   chance: 0.04 },
        // Enciende explosivos cercanos
        "anfo":  { elem2: "anfo_explosion", chance: 0.6 }
    },
    tick: function(pixel) {
        // Mantiene temperatura muy alta
        if (pixel.temp < 2300) { pixel.temp = 2300; }
        // Escoria fundida hacia abajo
        if (Math.random() < 0.08 && !outOfBounds(pixel.x, pixel.y + 1) && isEmpty(pixel.x, pixel.y + 1)) {
            createPixel("thermite_slag", pixel.x, pixel.y + 1);
        }
    },
    hidden: true,
    desc: "Termita en combustión activa (2500 °C). ¡Agregar agua provoca explosión violenta!"
};

// Escoria: óxido de aluminio fundido + hierro líquido, subproducto de la termita.
elements.thermite_slag = {
    color: ["#cc3300","#aa2200","#ee4400","#ff5500","#dd3300"],
    behavior: behaviors.LIQUID,
    category: "weapons",
    state: "liquid",
    density: 4800,
    viscosity: 250,
    conduct: 0.45,
    temp: 2000,
    tempLow: 1200,
    stateLow: "iron_oxide_slag",
    excludeRandom: true,
    reactions: {
        "water": { elem1: "steam", elem2: "explosion", chance: 0.5 },
        "ice":   { elem1: "steam", elem2: "explosion", chance: 0.7 }
    },
    hidden: true,
    desc: "Escoria fundida de termita — óxido de aluminio y hierro líquido."
};

// Residuo sólido de la termita (óxido de aluminio y hierro oxidado).
elements.iron_oxide_slag = {
    color: ["#8b2500","#7a2000","#993000","#6b1a00"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 5200,
    tempHigh: 1200,
    stateHigh: "thermite_slag",
    excludeRandom: true,
    hidden: true,
    desc: "Escoria solidificada de termita (óxido de hierro y aluminio)."
};

// ANFO: Nitrato de Amonio + Combustible (Fuel Oil).
// El explosivo más utilizado en minería del mundo. Requiere detonador.
elements.anfo = {
    color: ["#f0e8d0","#e8dcc0","#f5eed8","#ece0c8"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 850,
    excludeRandom: true,
    reactions: {
        // Solo con detonación directa o onda de detonación
        "detonation_wave": { elem1: "anfo_explosion", chance: 0.9 },
        "explosion":       { elem1: "anfo_explosion", chance: 0.7 },
        "n_explosion":     { elem1: "anfo_explosion", chance: 1.0 },
        // Con calor intenso puede cocinarse y luego detonar
        "thermite_burning":{ elem1: "anfo_explosion", chance: 0.8 },
        "lava":            { elem1: "anfo_explosion", chance: 0.3 },
        // El ANFO real es relativamente insensible al fuego solo
        "fire":  { elem1: "anfo_explosion", chance: 0.005 },
        "electric":{ elem1: "anfo_explosion", chance: 0.02  }
    },
    desc: "ANFO — Nitrato de Amonio / Fuel Oil. El explosivo industrial más usado en minería. Necesita detonador.",
    alias: "ANFO"
};

// La detonación del ANFO: onda de presión masiva.
elements.anfo_explosion = {
    color: ["#ffaa00","#ff8800","#ff6600","#ffcc00","#ff5500"],
    behavior: behaviors.WALL,
    behaviorOn: [
        "XX|XX|XX",
        "XX|EX:55>fire,fire,smoke,smoke,smoke,smoke|XX",
        "XX|XX|XX"
    ],
    temp: 2200,
    category: "weapons",
    state: "gas",
    density: 1000,
    excludeRandom: true,
    noMix: true,
    hidden: true,
    desc: "Detonación de ANFO — onda de presión masiva."
};

// Cordón detonante: arde casi instantáneamente y transmite la onda de detonación.
elements.det_cord = {
    color: ["#dd2222","#cc1111","#ee3333","#bb1111"],
    behavior: behaviors.WALL,
    category: "weapons",
    state: "solid",
    density: 1500,
    conduct: 1,
    tempHigh: 250,
    stateHigh: "detonation_wave",
    excludeRandom: true,
    reactions: {
        "fire":            { elem1: "detonation_wave", chance: 0.7 },
        "explosion":       { elem1: "detonation_wave", chance: 0.95 },
        "detonation_wave": { elem1: "detonation_wave", chance: 1.0  },
        "electric":        { elem1: "detonation_wave", chance: 0.6  }
    },
    desc: "Cordón detonante — transmite la onda de detonación casi instantáneamente. Usa para iniciar ANFO.",
    alias: "detonating cord"
};

// Onda de detonación que viaja por el cordón e inicia el ANFO.
elements.detonation_wave = {
    color: ["#ffffff","#ffff88","#ffee44","#ffcc22"],
    behavior: [
        "XX|XX|XX",
        "XX|EX:4>fire AND M1|XX",
        "XX|XX|XX"
    ],
    temp: 1000,
    category: "weapons",
    state: "gas",
    density: 1000,
    excludeRandom: true,
    noMix: true,
    hidden: true,
    tick: function(pixel) {
        // Propaga la detonación al det_cord y activa el ANFO adyacente
        var offsets = [[-1,0],[1,0],[0,-1],[0,1]];
        for (var i = 0; i < offsets.length; i++) {
            var nx = pixel.x + offsets[i][0];
            var ny = pixel.y + offsets[i][1];
            if (!outOfBounds(nx, ny) && !isEmpty(nx, ny)) {
                var np = pixelMap[nx][ny];
                if (!np) { continue; }
                if (np.element === "det_cord") {
                    changePixel(np, "detonation_wave");
                } else if (np.element === "anfo") {
                    changePixel(np, "anfo_explosion");
                }
            }
        }
    },
    desc: "Onda de detonación viajando a través del cordón."
};

// ────────────────────────────────────────────────────────────
//  EXPLOSIVOS DE CONTACTO
// ────────────────────────────────────────────────────────────

// Triioduro de nitrógeno: el explosivo de contacto más sensible del mundo.
// Se detona con el toque de una pluma. Húmedo es estable; seco es peligroso.
elements.nitrogen_triiodide = {
    color: ["#660066","#550055","#770077","#440044","#880088"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 3400,
    excludeRandom: true,
    reactions: {
        // El agua húmeda lo estabiliza (NI3 real es seguro disuelto)
        "water": { temp1: -20, chance: 0.5 },
        // Radiación, neutrones o calor lo detonan
        "radiation": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 4, ["fire","smoke"]);
            changePixel(pixel, "smoke");
        }, chance: 0.4 },
        "neutron": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 4, ["fire","smoke"]);
            changePixel(pixel, "smoke");
        }, chance: 0.5 },
        "fire": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 4, ["fire","smoke"]);
            changePixel(pixel, "smoke");
        }, chance: 0.8 }
    },
    tick: function(pixel) {
        // Pequeña probabilidad de detonación espontánea (cuando está seco)
        if (Math.random() < 0.0003) {
            explodeAt(pixel.x, pixel.y, 4, ["fire","smoke"]);
            changePixel(pixel, "smoke");
        }
    },
    desc: "Triioduro de nitrógeno — el explosivo de contacto más sensible. Se detona con una pluma. Húmedo = estable.",
    alias: "NI3"
};

// ────────────────────────────────────────────────────────────
//  EXPLOSIONES FÍSICAS / NUBE DE VAPOR / POLVO
// ────────────────────────────────────────────────────────────

// Nube de vapor de combustible. Cuando se mezcla con aire e ignición: VCE masiva.
// (Vapor Cloud Explosion — como Buncefield 2005 o Texas City 1947)
elements.fuel_vapor = {
    color: ["#ccbbaa","#bbaa99","#ddccbb","#aaaaaa","#c0b0a0"],
    behavior: behaviors.GAS,
    category: "weapons",
    state: "gas",
    density: 3,
    conduct: 0.001,
    excludeRandom: true,
    burn: 100,
    burnTime: 3,
    burnInto: "explosion",
    reactions: {
        // Con fuente de ignición → Explosión de Nube de Vapor (VCE)
        "fire": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 22, ["fire","fire","smoke","smoke","fire"]);
            changePixel(pixel, "fire");
        }, chance: 0.7 },
        "explosion": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 22, ["fire","smoke","fire","smoke"]);
            changePixel(pixel, "explosion");
        }, chance: 0.9 },
        "electric": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 18, ["fire","fire","smoke"]);
            changePixel(pixel, "fire");
        }, chance: 0.6 },
        "spark": { func: function(pixel) {
            explodeAt(pixel.x, pixel.y, 18, ["fire","smoke","fire"]);
            changePixel(pixel, "fire");
        }, chance: 0.8 },
        // La nube se propaga, encendiendo la siguiente nube (deflagración)
        "fuel_vapor": { elem1: null, chance: 0.0 }
    },
    desc: "Nube de vapor de combustible. Con una chispa provoca una VCE (Vapor Cloud Explosion) masiva.",
    alias: "fuel vapor"
};

// Polvo combustible fino (grano, carbón, harina, polvo de aluminio).
// Las explosiones de polvo son reales y devastadoras (silos de grano, minas).
elements.combustible_dust = {
    color: ["#e8d8a0","#d8c890","#c8b880","#e0d0a8","#d0c098"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 400,
    excludeRandom: true,
    reactions: {
        // En suspensión + ignición → explosión de polvo
        "fire":            { elem1: "dust_explosion", chance: 0.25 },
        "explosion":       { elem1: "dust_explosion", chance: 0.9  },
        "detonation_wave": { elem1: "dust_explosion", chance: 0.95 },
        "electric":        { elem1: "dust_explosion", chance: 0.35 },
        // El polvo húmedo no explota
        "water": { elem1: "mud", chance: 0.3 }
    },
    desc: "Polvo combustible (grano/carbón/harina). En suspensión y con ignición produce explosiones catastróficas.",
    alias: "combustible dust"
};

// La explosión de polvo: deflagración extremadamente rápida.
elements.dust_explosion = {
    color: ["#ff9900","#ffaa00","#ffbb00","#ff7700","#ffcc33","#ee8800"],
    behavior: behaviors.WALL,
    behaviorOn: [
        "XX|XX|XX",
        "XX|EX:28>fire,smoke,smoke,fire,smoke,ash|XX",
        "XX|XX|XX"
    ],
    temp: 900,
    category: "weapons",
    state: "gas",
    density: 1000,
    excludeRandom: true,
    noMix: true,
    hidden: true,
    desc: "Explosión de polvo — deflagración devastadora."
};

// BLEVE: Boiling Liquid Expanding Vapor Explosion.
// Ocurre cuando un tanque de gas licuado se calienta y falla catastróficamente.
// (Accidente de San Juanico 1984, entre otros).
elements.lpg = {
    color: ["#aaccff","#88aaee","#bbddff","#99bbff"],
    behavior: behaviors.LIQUID,
    category: "weapons",
    state: "liquid",
    density: 550,
    viscosity: 10,
    conduct: 0.002,
    tempHigh: -42,
    stateHigh: "fuel_vapor",
    excludeRandom: true,
    reactions: {
        "fire":    { elem1: "fuel_vapor", chance: 0.3 },
        "lava":    { elem1: "bleve",      chance: 0.8 },
        "plasma":  { elem1: "bleve",      chance: 0.9 }
    },
    tick: function(pixel) {
        // Si supera temperatura crítica sin contenedor → BLEVE
        if (pixel.temp > 100 && Math.random() < 0.05) {
            changePixel(pixel, "bleve");
        }
    },
    desc: "Gas Licuado de Petróleo (GLP). Si se calienta en contenedor → BLEVE catastrófico.",
    alias: "LPG"
};

// La BLEVE: bola de fuego masiva por expansión explosiva del GLP.
elements.bleve = {
    color: ["#ff4400","#ff6600","#ff8800","#ffaa00","#ff2200"],
    behavior: behaviors.WALL,
    behaviorOn: [
        "XX|XX|XX",
        "XX|EX:45>fire,fire,fire,smoke,smoke,fuel_vapor|XX",
        "XX|XX|XX"
    ],
    temp: 1500,
    category: "weapons",
    state: "gas",
    density: 1000,
    excludeRandom: true,
    noMix: true,
    hidden: true,
    desc: "BLEVE — Boiling Liquid Expanding Vapor Explosion. Bola de fuego masiva."
};

// ────────────────────────────────────────────────────────────
//  REGISTRAR CATEGORÍAS EN LA BARRA LATERAL
// ────────────────────────────────────────────────────────────
if (!eLists.nuclear) { eLists.nuclear = []; }
eListAdd("nuclear", ["uranium_rod","reactor_coolant","control_rod_boron","corium","corium_crust","steam_explosion"]);

// Los elementos de armas/explosivos se muestran en la categoría "weapons" existente
