DiveTools.gasDensity = function(o2, he, depth, metric, waterType, tempC, setpoint) {
    let slp;
    if (metric) {
        slp = waterType === 0 ? DiveTools._SLP_SW_m : DiveTools._SLP_FW_m;
    } else {
        slp = waterType === 0 ? DiveTools._SLP_SW_f : DiveTools._SLP_FW_f;
    }
    const pAmb = 1 + depth / slp;
    const o2Frac = o2 / 100;
    const heFrac = he / 100;
    let n2Frac = 1 - o2Frac - heFrac;
    let effectiveO2 = o2Frac;
    let effectiveHe = heFrac;
    let effectiveN2 = n2Frac;
    if (setpoint > 0) {
        effectiveO2 = Math.min(1.0, setpoint / pAmb);
        if (o2Frac < 1) {
            effectiveN2 = n2Frac * (1 - effectiveO2) / (1 - o2Frac);
            effectiveHe = (1 - effectiveO2) - effectiveN2;
        } else {
            effectiveN2 = 0;
            effectiveHe = 0;
        }
    }
    let density, refDensity;
    if (tempC <= 10) {
        density = (effectiveN2 * 1.2506 + effectiveO2 * 1.429 + effectiveHe * 0.1785) * pAmb;
        refDensity = 1.293;
    } else {
        density = (effectiveN2 * 1.165 + effectiveO2 * 1.331 + effectiveHe * 0.1664) * pAmb;
        refDensity = 1.205;
    }
    const ataEquiv = density / refDensity;
    return {
        density: Math.round(density * 100) / 100,
        ata: Math.round(ataEquiv * 100) / 100,
        gramsPerLiter: Math.round(density * 100) / 100
    };
};
