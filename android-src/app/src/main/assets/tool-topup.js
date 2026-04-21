/**
 * MultiDeco JS - Diving Tools: Top-Up Calculator
 */

/**
 * Top-up calculator
 * @param {number} startPressure
 * @param {number} startO2 - %
 * @param {number} startHe - %
 * @param {number} topUpPressure - amount to add
 * @param {number} topO2 - top up gas O2%
 * @param {number} topHe - top up gas He%
 * @param {number} tempC - temperature
 * @returns {Object} {finalO2, finalHe, finalPressure}
 */
DiveTools.topUp = function(startPressure, startO2, startHe, topUpPressure, topO2, topHe, tempC) {
    const T = tempC !== undefined ? tempC : 20;
    const finalP = startPressure + topUpPressure;
    if (finalP <= 0) return { finalO2: 0, finalHe: 0, finalPressure: 0 };

    // Mixed gas Z: weighted average by fraction (BAR mode)
    function mixZ(p, o2pct, hepct) {
        const n2f = Math.max(0, 1 - o2pct/100 - hepct/100);
        return DiveTools.gasZ(0, p, 0, T) * n2f
             + DiveTools.gasZ(1, p, 0, T) * (o2pct/100)
             + DiveTools.gasZ(3, p, 0, T) * (hepct/100);
    }

    const zStart = mixZ(startPressure, startO2, startHe);
    const zTop   = mixZ(topUpPressure, topO2,   topHe);

    // Amounts (proportional to moles)
    const nStart = startPressure / Math.max(0.5, zStart);
    const nTop   = topUpPressure / Math.max(0.5, zTop);
    const nTotal = nStart + nTop;

    if (nTotal <= 0) return { finalO2: 0, finalHe: 0, finalPressure: 0 };

    const finalO2pct = (nStart * startO2/100 + nTop * topO2/100) / nTotal * 100;
    const finalHepct = (nStart * startHe/100 + nTop * topHe/100) / nTotal * 100;

    // Final pressure: apply Z of the final mixture
    const zFinal = mixZ(finalP, finalO2pct, finalHepct);
    const finalPressure = nTotal * Math.max(0.5, zFinal);

    return {
        finalO2:       Math.round(finalO2pct    * 10) / 10,
        finalHe:       Math.round(finalHepct    * 10) / 10,
        finalPressure: Math.round(finalPressure * 10) / 10
    };
};
