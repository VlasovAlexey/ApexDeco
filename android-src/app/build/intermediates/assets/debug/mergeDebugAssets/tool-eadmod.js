/**
 * MultiDeco JS - Diving Tools: EAD/MOD/END Calculator
 */

/**
 * EAD/MOD/END calculator
 * @param {number} o2 - O2 percentage
 * @param {number} he - He percentage
 * @param {number} depth - depth
 * @param {boolean} metric
 * @param {number} waterType
 * @param {number} ppO2ForMOD - ppO2 for MOD calculation
 * @param {boolean} oxyNarc - consider O2 narcotic
 * @param {number} setpoint - CCR setpoint (0 for OC)
 * @returns {Object} {mod, ead, end, eadd, density}
 */
DiveTools.eadMod = function(o2, he, depth, metric, waterType, ppO2ForMOD, oxyNarc, setpoint) {
    let slp;
    if (metric) {
        slp = waterType === 0 ? DiveTools._SLP_SW_m : DiveTools._SLP_FW_m;
    } else {
        slp = waterType === 0 ? DiveTools._SLP_SW_f : DiveTools._SLP_FW_f;
    }

    const o2Frac = o2 / 100;
    const heFrac = he / 100;
    const n2Frac = 1 - o2Frac - heFrac;
    const pAmb = 1 + depth / slp;

    const mod = ((ppO2ForMOD / o2Frac) - 1) * slp;

    // EAD - Equivalent Air Depth (based on N2 partial pressure)
    const ppN2 = n2Frac * pAmb;
    const ead = ((ppN2 / 0.79) - 1) * slp;

    // END - Equivalent Narcotic Depth
    let narcFrac;
    if (oxyNarc) {
        narcFrac = 1 - heFrac; // N2 + O2 are narcotic
    } else {
        narcFrac = n2Frac; // only N2 is narcotic
    }

    let effectiveO2 = o2Frac;
    let effectiveHe = heFrac;
    if (setpoint > 0) {
        // CCR mode - O2 fraction changes with depth
        effectiveO2 = Math.min(1, setpoint / pAmb);
        effectiveHe = heFrac * (1 - effectiveO2) / (1 - o2Frac);
        if (oxyNarc) {
            narcFrac = 1 - effectiveHe;
        } else {
            narcFrac = 1 - effectiveO2 - effectiveHe;
        }
    }

    const end = ((narcFrac * pAmb / (oxyNarc ? 1.0 : 0.79)) - 1) * slp;

    // EADD - Equivalent Air Density Depth (gas density)
    const actualN2 = setpoint > 0 ? (1 - effectiveO2 - effectiveHe) : n2Frac;
    const actualO2 = setpoint > 0 ? effectiveO2 : o2Frac;
    const actualHe = setpoint > 0 ? effectiveHe : heFrac;

    // Gas density calculation at depth
    const density = (actualN2 * 1.2506 + actualO2 * 1.429 + actualHe * 0.1785) * pAmb;
    const eadd = (density / 1.293 - 1) * slp;

    return {
        mod: Math.round(mod),
        ead: Math.round(ead),
        end: Math.round(end),
        eadd: Math.round(eadd),
        density: Math.round(density * 100) / 100
    };
};
