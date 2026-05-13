DiveTools.mixNitrox = function(oldPressure, newPressure, oldO2, newO2, unitFlag, tempIndex, banked32) {
    if (!Number.isFinite(oldPressure) || !Number.isFinite(newPressure) ||
        !Number.isFinite(oldO2) || !Number.isFinite(newO2) ||
        newPressure < oldPressure || oldO2 < 0 || newO2 < 0 || oldO2 > 100 || newO2 > 100) {
        return { valid: false, addO2: 0, afterO2Pressure: 0, addTop: 0, finalPressure: 0 };
    }
    const deltaPressure = newPressure - oldPressure;
    const topGasO2Percent = banked32 ? 32 : 21;
    const topGasO2Fraction = topGasO2Percent / 100;
    if (unitFlag === 1) {
        const atmOffset = 14.7;
        const oldAbs = oldPressure + atmOffset;
        const newAbs = newPressure + atmOffset;
        const addO2 = (
            (newAbs * (newO2 / 100)) -
            (oldAbs * (oldO2 / 100)) -
            (deltaPressure * topGasO2Fraction)
        ) / (1 - topGasO2Fraction);
        const afterO2Pressure = oldPressure + addO2;
        const addTop = newPressure - afterO2Pressure;
        const safeAddO2 = Math.abs(addO2) < 1e-6 ? 0 : addO2;
        const safeAddTop = Math.abs(addTop) < 1e-6 ? 0 : addTop;
        return {
            valid: Number.isFinite(safeAddO2) && Number.isFinite(safeAddTop),
            addO2: safeAddO2,
            afterO2Pressure,
            addTop: safeAddTop,
            finalPressure: newPressure
        };
    }
    function mixZ(o2Percent, pressure) {
        const o2Frac = Math.max(0, Math.min(1, o2Percent / 100));
        const n2Frac = 1 - o2Frac;
        return (DiveTools.gasZ(1, pressure, unitFlag, tempIndex) * o2Frac) +
            (DiveTools.gasZ(2, pressure, unitFlag, tempIndex) * n2Frac);
    }
    const startReferencePressure = oldPressure + (deltaPressure * 0.8);
    const startZ = mixZ(newO2, startReferencePressure);
    const startMoles = oldPressure / startZ;
    const targetO2Fraction = newO2 / 100;
    const startO2Fraction = oldO2 / 100;
    const rawO2Moles = (
        (newPressure * targetO2Fraction) -
        (startMoles * startO2Fraction) -
        (deltaPressure * topGasO2Fraction)
    ) / (1 - topGasO2Fraction);
    let addO2 = rawO2Moles * DiveTools.gasZ(1, newPressure, unitFlag, tempIndex);
    const x1 = oldPressure / Math.max(newPressure, 1e-9);
    const spanDen = Math.max(1e-9, 100 - topGasO2Percent);
    const x2 = (oldO2 - topGasO2Percent) / spanDen;
    const x3 = (newO2 - topGasO2Percent) / spanDen;
    const x4 = x3 * x3;
    const x5 = x1 * x3;
    const x6 = x1 * x2;
    const x7 = x1 * x4;
    const correctionCoeffs = unitFlag === 0
        ? [
            0.49392206244615067,
            0.22049145972375062,
            -2.1284416926510197,
            7.019238955963774,
            1.9021263036327394,
            -18.234716040145653,
            5.297206496375647,
            25.014282808939527
        ]
        : [
            0.39421169437942116,
            1.40362044090069,
            -2.3867012919691613,
            -1.2205113237232776,
            0.5892410681294127,
            -22.96024395726222,
            13.163139221723142,
            27.409963488179354
        ];
    const correction =
        correctionCoeffs[0] +
        (correctionCoeffs[1] * x1) +
        (correctionCoeffs[2] * x2) +
        (correctionCoeffs[3] * x3) +
        (correctionCoeffs[4] * x4) +
        (correctionCoeffs[5] * x5) +
        (correctionCoeffs[6] * x6) +
        (correctionCoeffs[7] * x7);
    addO2 += correction;
    const afterO2Pressure = oldPressure + addO2;
    const addTop = newPressure - afterO2Pressure;
    const safeAddO2 = Math.abs(addO2) < 1e-6 ? 0 : addO2;
    const safeAddTop = Math.abs(addTop) < 1e-6 ? 0 : addTop;
    return {
        valid: Number.isFinite(safeAddO2) && Number.isFinite(safeAddTop),
        addO2: safeAddO2,
        afterO2Pressure,
        addTop: safeAddTop,
        finalPressure: newPressure
    };
};
