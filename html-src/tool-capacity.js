/**
 * MultiDeco JS - Diving Tools: Tank Capacity / Equalization Calculator
 */

/**
 * Tank capacity / equalization calculator
 * @param {number} supplySize - supply tank water capacity
 * @param {number} supplyPressure - supply pressure
 * @param {number} receiveSize - receiving tank water capacity
 * @param {number} receivePressure - receiving pressure
 * @param {number} tempC - temperature
 * @returns {Object} {equalizedPressure, supplyFinal, receiveFinal, transferred}
 */
DiveTools.equalize = function(supplySize, supplyPressure, receiveSize, receivePressure, tempC) {
    const T = tempC !== undefined ? tempC : 20;

    // Use Air Z-factors (BAR mode)
    const zSupply = DiveTools.gasZ(0, supplyPressure,  0, T);
    const zRecv   = DiveTools.gasZ(0, receivePressure, 0, T);

    // Amounts (proportional to moles): n = V * P / Z
    const nSupply = supplySize  * supplyPressure  / Math.max(0.5, zSupply);
    const nRecv   = receiveSize * receivePressure / Math.max(0.5, zRecv);
    const nTotal  = nSupply + nRecv;
    const totalV  = supplySize + receiveSize;

    // Ideal equalized pressure (n/V), then one Z correction pass
    const peqIdeal = nTotal / totalV;
    const zEq      = DiveTools.gasZ(0, peqIdeal, 0, T);
    const eqPressure = nTotal * Math.max(0.5, zEq) / totalV;

    return {
        equalizedPressure: Math.round(eqPressure * 10) / 10,
        supplyFinal:       Math.round(eqPressure * 10) / 10,
        receiveFinal:      Math.round(eqPressure * 10) / 10,
        transferred:       Math.round((eqPressure - receivePressure) * receiveSize * 10) / 10
    };
};
