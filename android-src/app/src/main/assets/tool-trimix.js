DiveTools.mixTrimix = function(oldPressure, newPressure, oldO2, oldHe, newO2, newHe, unitFlag, tempIndex, banked32, heFirst) {
    if (!Number.isFinite(oldPressure) || !Number.isFinite(newPressure) ||
        !Number.isFinite(oldO2) || !Number.isFinite(oldHe) ||
        !Number.isFinite(newO2) || !Number.isFinite(newHe) ||
        newPressure < oldPressure) {
        return invalidTrimixMix();
    }
    const startO2 = oldO2 * 0.01;
    const startHe = oldHe * 0.01;
    const targetO2 = newO2 * 0.01;
    const targetHe = newHe * 0.01;
    if (startO2 + startHe > 1 || targetO2 + targetHe > 1 || startO2 < 0 || startHe < 0 || targetO2 < 0 || targetHe < 0) {
        return invalidTrimixMix();
    }
    const offset = unitFlag === 1 ? 14.7 : 1.0;
    const targetAbs = newPressure + offset;
    const targetO2Amt = targetAbs * targetO2;
    const targetHeAmt = targetAbs * targetHe;
    const targetN2Amt = targetAbs - targetO2Amt - targetHeAmt;
    const startN2 = 1 - startO2 - startHe;
    const startAbs = oldPressure + offset;
    const startHeAmt = startHe * startAbs;
    const startO2Amt = startO2 * startAbs;
    const startN2Amt = startN2 * startAbs;
    const heNeed = targetHeAmt - startHeAmt;
    const airOr32Frac = 1 - (targetO2 + targetHe);
    const heCorrected = ((((DiveTools.gasZ(3, startAbs + heNeed, unitFlag, tempIndex) -
        DiveTools.gasZ(0, startAbs + heNeed, unitFlag, tempIndex)) * airOr32Frac) + 1) * heNeed);
    let topAddRaw;
    let o2NeedRaw;
    if (!banked32) {
        topAddRaw = ((targetN2Amt - startN2Amt) - (heCorrected - heNeed)) / 0.79;
        o2NeedRaw = (targetO2Amt - startO2Amt) - (topAddRaw * 0.21);
    } else {
        topAddRaw = ((targetN2Amt - startN2Amt) - (heCorrected - heNeed)) / 0.68;
        o2NeedRaw = (targetO2Amt - startO2Amt) - (topAddRaw * 0.32);
    }
    const afterHeAbs = startAbs + heCorrected;
    const o2Corrected = o2NeedRaw * (1 - (airOr32Frac *
        (DiveTools.gasZ(0, afterHeAbs + o2NeedRaw, unitFlag, tempIndex) -
         DiveTools.gasZ(1, afterHeAbs + o2NeedRaw, unitFlag, tempIndex))));
    const afterAllAbs = startAbs + heCorrected + o2Corrected;
    const o2MolesAfterAll = (o2Corrected / DiveTools.gasZ(1, afterAllAbs, unitFlag, tempIndex)) + startO2Amt;
    const totalMolesAfterAll = o2MolesAfterAll +
        startHeAmt +
        (heCorrected / DiveTools.gasZ(3, afterAllAbs, unitFlag, tempIndex)) +
        startN2Amt;
    const testO2 = totalMolesAfterAll > 0 ? (o2MolesAfterAll / totalMolesAfterAll) * 100 : 0;
    const topAdd = targetAbs - afterAllAbs;
    const o2Pressure = Math.abs(o2Corrected) < 1e-6 ? 0 : o2Corrected;
    const hePressure = Math.abs(heCorrected) < 1e-6 ? 0 : heCorrected;
    const safeTopAdd = Math.abs(topAdd) < 1e-6 ? 0 : topAdd;
    if (o2Pressure < 0 || hePressure < 0 || safeTopAdd < 0) {
        return invalidTrimixMix();
    }
    const firstAdd = heFirst ? hePressure : o2Pressure;
    const firstPressure = heFirst ? (startAbs + hePressure - offset) : (startAbs + o2Pressure - offset);
    const secondAdd = heFirst ? o2Pressure : hePressure;
    const secondPressure = afterAllAbs - offset;
    return {
        valid: true,
        firstAdd,
        firstPressure,
        secondAdd,
        secondPressure,
        topAdd: safeTopAdd,
        finalPressure: newPressure,
        testO2: Math.round(testO2 * 10) / 10
    };
    function invalidTrimixMix() {
        return {
            valid: false,
            firstAdd: 0,
            firstPressure: 0,
            secondAdd: 0,
            secondPressure: 0,
            topAdd: 0,
            finalPressure: 0,
            testO2: 0
        };
    }
};
