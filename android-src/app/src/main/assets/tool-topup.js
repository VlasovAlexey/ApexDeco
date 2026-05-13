DiveTools.topUp = function(oldPressure, newPressure, oldO2, oldHe, withO2, withHe, unitFlag) {
    if (!Number.isFinite(oldPressure) || !Number.isFinite(newPressure) ||
        !Number.isFinite(oldO2) || !Number.isFinite(oldHe) ||
        !Number.isFinite(withO2) || !Number.isFinite(withHe) ||
        newPressure < oldPressure) {
        return invalidTopUp();
    }
    const oldO2Frac = oldO2 * 0.01;
    const oldHeFrac = oldHe * 0.01;
    const withO2Frac = withO2 * 0.01;
    const withHeFrac = withHe * 0.01;
    if (oldO2Frac + oldHeFrac > 1 || withO2Frac + withHeFrac > 1 || oldO2Frac < 0 || oldHeFrac < 0 || withO2Frac < 0 || withHeFrac < 0) {
        return invalidTopUp();
    }
    const offset = unitFlag === 1 ? 14.7 : 1.0;
    const oldAbs = oldPressure + offset;
    const addedPressure = newPressure - oldPressure;
    const newAbs = newPressure + offset;
    const finalO2Frac = ((oldO2Frac * oldAbs) + (withO2Frac * addedPressure)) / newAbs;
    const finalHeFrac = ((oldHeFrac * oldAbs) + (withHeFrac * addedPressure)) / newAbs;
    const finalO2 = finalO2Frac * 100;
    const finalHe = finalHeFrac * 100;
    return {
        valid: true,
        finalO2,
        finalHe,
        result: finalHeFrac < 0.01
            ? `${finalO2.toFixed(1)}`
            : `${finalO2.toFixed(1)} / ${finalHe.toFixed(1)}`
    };
    function invalidTopUp() {
        return { valid: false, finalO2: 0, finalHe: 0, result: '--' };
    }
};
