/**
 * MultiDeco JS - Diving Tools: Trimix Mixing Calculator
 */

/**
 * Trimix mixing calculator
 * @param {number} startPressure
 * @param {number} startO2 - %
 * @param {number} startHe - %
 * @param {number} endPressure
 * @param {number} endO2 - %
 * @param {number} endHe - %
 * @param {boolean} isPSI
 * @param {boolean} heFirst - add helium first?
 * @param {number} tempC - temperature
 * @returns {Object} {addHe, addO2, testO2, addAir, valid}
 */
DiveTools.mixTrimix = function(startPressure, startO2, startHe, endPressure, endO2, endHe, isPSI, heFirst, tempC) {
    const T = tempC !== undefined ? tempC : 20;
    const pFlag = isPSI ? 1 : 0;
    const sO2 = startO2 / 100, sHe = startHe / 100;
    const eO2 = endO2   / 100, eHe = endHe   / 100;

    const zStart  = DiveTools.gasZ(0, startPressure, pFlag, T);
    const zHeEnd  = DiveTools.gasZ(3, endPressure,   pFlag, T);
    const zO2End  = DiveTools.gasZ(1, endPressure,   pFlag, T);
    const zAirEnd = DiveTools.gasZ(0, endPressure,   pFlag, T);

    const nStart = startPressure / zStart;
    const nEnd   = endPressure   / zAirEnd;
    const delta  = nEnd - nStart;

    // He balance (He only from pure He cylinder)
    const a = nEnd * eHe - nStart * sHe; // amount of pure He

    // O2 + Air balance for remainder
    const rhs_o2    = nEnd * eO2 - nStart * sO2;
    const rhs_total = delta - a;
    const b = (rhs_o2 - rhs_total * 0.21) / (1.0 - 0.21); // pure O2
    const c = rhs_total - b; // Air

    const addHe  = a * zHeEnd;
    const addO2  = b * zO2End;
    const addAir = c * zAirEnd;

    // Test O2 after He fill (if He first)
    let testO2 = 0;
    if (heFirst) {
        const pressureAfterHe = startPressure + addHe;
        if (pressureAfterHe > 0) {
            testO2 = (startPressure * sO2) / pressureAfterHe * 100;
        }
    }

    return {
        addHe:  Math.round(addHe  * 10) / 10,
        addO2:  Math.round(addO2  * 10) / 10,
        testO2: Math.round(testO2 * 10) / 10,
        addAir: Math.round(addAir * 10) / 10,
        valid: addHe >= 0 && addO2 >= 0 && addAir >= 0
    };
};
