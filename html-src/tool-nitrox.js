/**
 * MultiDeco JS - Diving Tools: Nitrox Mixing Calculator
 */

/**
 * Nitrox mixing calculator
 * @param {number} startPressure
 * @param {number} startO2 - start O2%
 * @param {number} endPressure
 * @param {number} endO2 - target O2%
 * @param {boolean} isPSI - true=PSI, false=BAR
 * @param {number} tempC - temperature
 * @returns {Object} {addO2, addAir, addTotal, valid}
 */
DiveTools.mixNitrox = function(startPressure, startO2, endPressure, endO2, isPSI, tempC) {
    const T = tempC !== undefined ? tempC : 20;
    const pFlag = isPSI ? 1 : 0;
    const o2Start = startO2 / 100;
    const o2End   = endO2   / 100;

    // Z-factors: treat start contents as Air-like, use gas-specific Z for added gases
    const zStartAir = DiveTools.gasZ(0, startPressure, pFlag, T);
    const zEndO2    = DiveTools.gasZ(1, endPressure,   pFlag, T);
    const zEndAir   = DiveTools.gasZ(0, endPressure,   pFlag, T);

    // Work in amount units (proportional to moles): n = P/Z
    const nStart = startPressure / zStartAir;
    const nEnd   = endPressure   / zEndAir;
    const delta  = nEnd - nStart;

    // Solve two-component system:
    // a (pure O2) + b (Air) = delta
    // a*1.0 + b*0.21 = nEnd*o2End - nStart*o2Start
    const rhs = nEnd * o2End - nStart * o2Start;
    const a = (rhs - delta * 0.21) / (1.0 - 0.21);
    const b = delta - a;

    const addO2  = a * zEndO2;
    const addAir = b * zEndAir;

    return {
        addO2:    Math.round(addO2  * 10) / 10,
        addAir:   Math.round(addAir * 10) / 10,
        addTotal: Math.round((endPressure - startPressure) * 10) / 10,
        valid: addO2 >= 0 && addAir >= 0
    };
};
