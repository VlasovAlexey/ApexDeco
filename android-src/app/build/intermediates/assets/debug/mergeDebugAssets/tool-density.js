/**
 * MultiDeco JS - Diving Tools: Gas Density Calculator
 */

/**
 * Gas density calculator - matches original smali exactly
 * Density calculation from tools_calc.smali lines 840-1067
 *
 * Original formula (from smali):
 *   pAmb = depth/SLP + 1.0
 *   CCR adjustment: effectiveO2 = min(1, SP/pAmb), redistribute N2/He proportionally
 *   At 20C: density = (N2*1.165 + O2*1.331 + He*0.1664) * pAmb, ref=1.205
 *   At 0C:  density = (N2*1.2506 + O2*1.429 + He*0.1785) * pAmb, ref=1.293
 *   ATA equivalent = density / ref
 *
 * @param {number} o2 - O2%
 * @param {number} he - He%
 * @param {number} depth
 * @param {boolean} metric
 * @param {number} waterType
 * @param {number} tempC - 0 or 20
 * @param {number} setpoint - 0 for OC
 * @returns {Object} {density, ata, gramsPerLiter}
 */
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

    // CCR setpoint adjustment (matches smali lines 930-971)
    if (setpoint > 0) {
        effectiveO2 = Math.min(1.0, setpoint / pAmb);
        // Redistribute N2 and He proportionally
        // smali: adj = (effO2 - origO2) * N2frac / (Hefrac + N2frac)
        // newN2 = N2frac - adj = N2frac * (1 - effO2) / (1 - origO2)
        if (o2Frac < 1) {
            effectiveN2 = n2Frac * (1 - effectiveO2) / (1 - o2Frac);
            effectiveHe = (1 - effectiveO2) - effectiveN2;
        } else {
            effectiveN2 = 0;
            effectiveHe = 0;
        }
    }

    // Density calculation (matches smali lines 974-1027)
    let density, refDensity;
    if (tempC <= 10) {
        // 0C coefficients (smali: temp flag FALSE path, :cond_9)
        density = (effectiveN2 * 1.2506 + effectiveO2 * 1.429 + effectiveHe * 0.1785) * pAmb;
        refDensity = 1.293;
    } else {
        // 20C coefficients (smali: temp flag TRUE path, line 983)
        density = (effectiveN2 * 1.165 + effectiveO2 * 1.331 + effectiveHe * 0.1664) * pAmb;
        refDensity = 1.205;
    }

    // ATA equivalent = density / reference (smali line 1027: div-double v0, v10, v0)
    const ataEquiv = density / refDensity;

    return {
        density: Math.round(density * 100) / 100,
        ata: Math.round(ataEquiv * 100) / 100,
        gramsPerLiter: Math.round(density * 100) / 100
    };
};
