/**
 * MultiDeco JS - Diving Tools: Best Mix Calculator
 */

/**
 * Best Mix calculator
 * @param {number} depth - depth in current units
 * @param {number} ppO2 - max ppO2
 * @param {boolean} metric - true=meters, false=feet
 * @param {number} waterType - 0=salt, 1=fresh
 * @param {boolean} trimix - use trimix?
 * @param {number} eadDepth - target EAD depth for trimix
 * @param {boolean} oxyNarc - consider O2 narcotic
 * @returns {Object} {o2: number, he: number}
 */
DiveTools.bestMix = function(depth, ppO2, metric, waterType, trimix, eadDepth, oxyNarc) {
    let slp;
    if (metric) {
        slp = waterType === 0 ? DiveTools._SLP_SW_m : DiveTools._SLP_FW_m;
    } else {
        slp = waterType === 0 ? DiveTools._SLP_SW_f : DiveTools._SLP_FW_f;
    }

    const pAmb = 1 + depth / slp;
    const exactO2 = (ppO2 / pAmb) * 100;
    // Android smali uses floor(), not round()
    let o2Pct = Math.floor(exactO2);
    o2Pct = Math.max(1, Math.min(100, o2Pct));

    let hePct = 0;
    if (trimix && eadDepth !== undefined && eadDepth < depth) {
        const pAmbEAD = 1 + eadDepth / slp;
        // Use exact (unrounded) O2 fraction for He calc to avoid rounding error
        const o2Frac = Math.max(0.01, Math.min(1, exactO2 / 100));
        if (oxyNarc) {
            // O2 narcotic: narcotic fraction = (N2+O2) = (1-He)
            // Target: (1-heFrac)*pAmb = 1.0*pAmbEAD
            const heFrac = 1 - pAmbEAD / pAmb;
            hePct = Math.round(Math.max(0, heFrac) * 100);
        } else {
            // N2-only narcosis: (1-O2%-He%)*pAmb = 0.7902*pAmbEAD
            const n2Frac = 0.7902 * pAmbEAD / pAmb;
            hePct = Math.round((1 - o2Frac - n2Frac) * 100);
        }
        hePct = Math.max(0, Math.min(100 - o2Pct, hePct));
    }

    return { o2: o2Pct, he: hePct };
};
