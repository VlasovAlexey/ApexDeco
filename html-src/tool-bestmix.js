DiveTools.bestMix = function(depth, ppO2, metric, waterType, trimix, eadDepth, oxyNarc) {
    let slp;
    if (metric) {
        slp = waterType === 0 ? DiveTools._SLP_SW_m : DiveTools._SLP_FW_m;
    } else {
        slp = waterType === 0 ? DiveTools._SLP_SW_f : DiveTools._SLP_FW_f;
    }
    const pAmb = 1 + depth / slp;
    const exactO2 = (ppO2 / pAmb) * 100;
    let o2Pct = Math.floor(exactO2);
    o2Pct = Math.max(1, Math.min(100, o2Pct));
    let hePct = 0;
    if (trimix && eadDepth !== undefined && eadDepth < depth) {
        const pAmbEAD = 1 + eadDepth / slp;
        const o2Frac = Math.max(0.01, Math.min(1, exactO2 / 100));
        if (oxyNarc) {
            const heFrac = 1 - pAmbEAD / pAmb;
            hePct = Math.round(Math.max(0, heFrac) * 100);
        } else {
            const n2Frac = 0.7902 * pAmbEAD / pAmb;
            hePct = Math.round((1 - o2Frac - n2Frac) * 100);
        }
        hePct = Math.max(0, Math.min(100 - o2Pct, hePct));
    }
    return { o2: o2Pct, he: hePct };
};
