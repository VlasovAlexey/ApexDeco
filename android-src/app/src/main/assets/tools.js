/**
 * MultiDeco JS - Diving Tools Module
 * Best Mix, EAD/MOD, Gas Mixer (Nitrox, Trimix, Topup, Capacity, Density)
 */

const DiveTools = (() => {

    // Z-factor compressibility arrays (from original app, indexed 0-40 for 0-4000 PSI in 100 PSI steps)
    const O2ZFactor = [1.0,0.995,0.99,0.986,0.981,0.977,0.973,0.969,0.966,0.962,0.959,0.956,0.954,0.951,0.949,0.947,0.945,0.944,0.943,0.942,0.941,0.94,0.94,0.94,0.941,0.941,0.942,0.943,0.944,0.945,0.947,0.948,0.95,0.953,0.955,0.957,0.96,0.963,0.966,0.969,0.972];
    const HeZFactor = [1.0,1.004,1.007,1.011,1.015,1.018,1.022,1.026,1.029,1.033,1.036,1.04,1.043,1.047,1.05,1.054,1.057,1.061,1.064,1.067,1.071,1.074,1.078,1.081,1.084,1.088,1.091,1.094,1.097,1.101,1.104,1.107,1.11,1.114,1.117,1.12,1.123,1.127,1.13,1.133,1.136];
    const N2ZFactor = [1.0,0.998,0.997,0.995,0.994,0.993,0.993,0.993,0.993,0.993,0.994,0.995,0.996,0.997,0.999,1.001,1.003,1.005,1.008,1.011,1.014,1.017,1.021,1.024,1.028,1.032,1.036,1.041,1.045,1.05,1.054,1.059,1.064,1.069,1.074,1.08,1.085,1.091,1.096,1.102,1.107];
    const AirZFactor = [1.0,0.997,0.995,0.993,0.991,0.99,0.989,0.988,0.987,0.987,0.986,0.987,0.987,0.988,0.988,0.99,0.991,0.992,0.994,0.996,0.999,1.001,1.004,1.007,1.01,1.013,1.016,1.02,1.024,1.028,1.032,1.036,1.04,1.045,1.049,1.054,1.059,1.064,1.069,1.074,1.079];

    // Correction factors for Z-factor temperature adjustment
    const tempCoeffs = [9.0E-4, 0.0015, 0, 4.0E-4, 9.0E-4]; // Air, O2, N2, He, EAN32

    const SLP_SW_f = 33.066;
    const SLP_SW_m = 10.078;
    const SLP_FW_f = 33.914;
    const SLP_FW_m = 10.337;

    /**
     * Get Z-factor for a gas at a given pressure
     * @param {number} gasType - 0=Air, 1=O2, 2=N2, 3=He, 4=EAN32
     * @param {number} pressure - pressure value
     * @param {number} isPSI - 0=PSI, 1=BAR
     * @param {number} tempC - temperature in Celsius (for adjustment, 20=standard)
     */
    function gasZ(gasType, pressure, isPSI, tempC) {
        if (isPSI === 0) {
            pressure = 14.7 * pressure; // Convert BAR to PSI-equivalent
        }
        pressure = Math.max(0, Math.min(4000, pressure));

        const tempOffset = (tempC * 5 - 20); // temperature deviation
        const tempCorr = tempCoeffs[gasType] * tempOffset;

        const idx = Math.round(pressure * 0.01);

        let z;
        switch (gasType) {
            case 0: z = AirZFactor[idx]; break;
            case 1: z = O2ZFactor[idx]; break;
            case 2: z = N2ZFactor[idx]; break;
            case 3: z = HeZFactor[idx]; break;
            case 4: // EAN32 - interpolated
                const n2z = N2ZFactor[idx];
                const o2z = O2ZFactor[idx];
                z = o2z + (n2z - o2z) * 0.68;
                break;
            default: return 1.0;
        }

        // Temperature correction for O2 (special case)
        if (gasType === 1) {
            z *= (1 + Math.max(pressure, 2500) / 2500 * tempCorr);
        } else if (gasType === 0 || gasType === 4) {
            z *= (1 + Math.max(pressure, 2500) / 2500 * tempCorr);
        } else if (gasType === 2) {
            z *= (1 - pressure / 4000 * tempCorr);
        } else {
            return z;
        }

        return z;
    }

    /**
     * Best Mix calculator
     * @param {number} depth - depth in current units
     * @param {number} ppO2 - max ppO2
     * @param {boolean} metric - true=meters, false=feet
     * @param {number} waterType - 0=salt, 1=fresh
     * @param {boolean} trimix - use trimix?
     * @param {number} eadDepth - target EAD depth for trimix
     * @returns {Object} {o2: number, he: number}
     */
    function bestMix(depth, ppO2, metric, waterType, trimix, eadDepth, oxyNarc) {
        let slp;
        if (metric) {
            slp = waterType === 0 ? SLP_SW_m : SLP_FW_m;
        } else {
            slp = waterType === 0 ? SLP_SW_f : SLP_FW_f;
        }

        const pAmb = 1 + depth / slp;
        const exactO2 = (ppO2 / pAmb) * 100;
        let o2Pct = Math.round(exactO2);
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
    }

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
     * @returns {Object} {mod, ead, end, eadd}
     */
    function eadMod(o2, he, depth, metric, waterType, ppO2ForMOD, oxyNarc, setpoint) {
        let slp;
        if (metric) {
            slp = waterType === 0 ? SLP_SW_m : SLP_FW_m;
        } else {
            slp = waterType === 0 ? SLP_SW_f : SLP_FW_f;
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
    }

    /**
     * Nitrox mixing calculator
     * @param {number} startPressure
     * @param {number} startO2 - start O2%
     * @param {number} endPressure
     * @param {number} endO2 - target O2%
     * @param {boolean} isPSI - true=PSI, false=BAR
     * @param {number} tempC - temperature
     * @returns {Object} {addO2, addAir, addTotal}
     */
    function mixNitrox(startPressure, startO2, endPressure, endO2, isPSI, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const pFlag = isPSI ? 1 : 0;
        const o2Start = startO2 / 100;
        const o2End   = endO2   / 100;

        // Z-factors: treat start contents as Air-like, use gas-specific Z for added gases
        const zStartAir = gasZ(0, startPressure, pFlag, T);
        const zEndO2    = gasZ(1, endPressure,   pFlag, T);
        const zEndAir   = gasZ(0, endPressure,   pFlag, T);

        // Work in amount units (∝ moles): n = P/Z
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
    }

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
     * @returns {Object}
     */
    function mixTrimix(startPressure, startO2, startHe, endPressure, endO2, endHe, isPSI, heFirst, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const pFlag = isPSI ? 1 : 0;
        const sO2 = startO2 / 100, sHe = startHe / 100;
        const eO2 = endO2   / 100, eHe = endHe   / 100;

        const zStart  = gasZ(0, startPressure, pFlag, T);
        const zHeEnd  = gasZ(3, endPressure,   pFlag, T);
        const zO2End  = gasZ(1, endPressure,   pFlag, T);
        const zAirEnd = gasZ(0, endPressure,   pFlag, T);

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
    }

    /**
     * Top-up calculator
     * @param {number} startPressure
     * @param {number} startO2 - %
     * @param {number} startHe - %
     * @param {number} topUpPressure - amount to add
     * @param {number} topO2 - top up gas O2%
     * @param {number} topHe - top up gas He%
     * @returns {Object} final mix
     */
    function topUp(startPressure, startO2, startHe, topUpPressure, topO2, topHe, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const finalP = startPressure + topUpPressure;
        if (finalP <= 0) return { finalO2: 0, finalHe: 0, finalPressure: 0 };

        // Mixed gas Z: weighted average by fraction (BAR mode)
        function mixZ(p, o2pct, hepct) {
            const n2f = Math.max(0, 1 - o2pct/100 - hepct/100);
            return gasZ(0, p, 0, T) * n2f
                 + gasZ(1, p, 0, T) * (o2pct/100)
                 + gasZ(3, p, 0, T) * (hepct/100);
        }

        const zStart = mixZ(startPressure, startO2, startHe);
        const zTop   = mixZ(topUpPressure, topO2,   topHe);

        // Amounts (∝ moles)
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
    }

    /**
     * Tank capacity / equalization calculator
     * @param {number} supplySize - supply tank water capacity
     * @param {number} supplyPressure - supply pressure
     * @param {number} receiveSize - receiving tank water capacity
     * @param {number} receivePressure - receiving pressure
     * @returns {Object} equalized pressure, amounts transferred
     */
    function equalize(supplySize, supplyPressure, receiveSize, receivePressure, tempC) {
        const T = tempC !== undefined ? tempC : 20;

        // Use Air Z-factors (BAR mode)
        const zSupply = gasZ(0, supplyPressure,  0, T);
        const zRecv   = gasZ(0, receivePressure, 0, T);

        // Amounts (∝ moles): n = V * P / Z
        const nSupply = supplySize  * supplyPressure  / Math.max(0.5, zSupply);
        const nRecv   = receiveSize * receivePressure / Math.max(0.5, zRecv);
        const nTotal  = nSupply + nRecv;
        const totalV  = supplySize + receiveSize;

        // Ideal equalized pressure (n/V), then one Z correction pass
        const peqIdeal = nTotal / totalV;
        const zEq      = gasZ(0, peqIdeal, 0, T);
        const eqPressure = nTotal * Math.max(0.5, zEq) / totalV;

        return {
            equalizedPressure: Math.round(eqPressure * 10) / 10,
            supplyFinal:       Math.round(eqPressure * 10) / 10,
            receiveFinal:      Math.round(eqPressure * 10) / 10,
            transferred:       Math.round((eqPressure - receivePressure) * receiveSize * 10) / 10
        };
    }

    /**
     * Gas density calculator
     * @param {number} o2 - O2%
     * @param {number} he - He%
     * @param {number} depth
     * @param {boolean} metric
     * @param {number} waterType
     * @param {number} tempC - 0 or 20
     * @param {number} setpoint - 0 for OC
     * @returns {Object} {density, ata}
     */
    /**
     * Gas density calculator - matches original smali exactly
     * Density calculation from tools_calc.smali lines 840-1067
     *
     * Original formula (from smali):
     *   pAmb = depth/SLP + 1.0
     *   CCR adjustment: effectiveO2 = min(1, SP/pAmb), redistribute N2/He proportionally
     *   At 20°C: density = (N2*1.165 + O2*1.331 + He*0.1664) * pAmb, ref=1.205
     *   At 0°C:  density = (N2*1.2506 + O2*1.429 + He*0.1785) * pAmb, ref=1.293
     *   ATA equivalent = density / ref
     */
    function gasDensity(o2, he, depth, metric, waterType, tempC, setpoint) {
        let slp;
        if (metric) {
            slp = waterType === 0 ? SLP_SW_m : SLP_FW_m;
        } else {
            slp = waterType === 0 ? SLP_SW_f : SLP_FW_f;
        }

        const pAmb = 1 + depth / slp;
        const o2Frac = o2 / 100;
        const heFrac = he / 100;
        let n2Frac = 1 - o2Frac - heFrac;

        let effectiveO2 = o2Frac;
        let effectiveHe = heFrac;
        let effectiveN2 = n2Frac;

        // CCR setpoint adjustment (matches smali lines 930-971)
        if (setpoint > 0) {
            effectiveO2 = Math.min(1.0, setpoint / pAmb);
            // Redistribute N2 and He proportionally
            // smali: adj = (effO2 - origO2) * N2frac / (Hefrac + N2frac)
            // newN2 = N2frac - adj = N2frac * (1 - effO2) / (1 - origO2)
            if (o2Frac < 1) {
                effectiveN2 = n2Frac * (1 - effectiveO2) / (1 - o2Frac);
                effectiveHe = (1 - effectiveO2) - effectiveN2;
            } else {
                effectiveN2 = 0;
                effectiveHe = 0;
            }
        }

        // Density calculation (matches smali lines 974-1027)
        let density, refDensity;
        if (tempC <= 10) {
            // 0°C coefficients (smali: temp flag FALSE path, :cond_9)
            density = (effectiveN2 * 1.2506 + effectiveO2 * 1.429 + effectiveHe * 0.1785) * pAmb;
            refDensity = 1.293;
        } else {
            // 20°C coefficients (smali: temp flag TRUE path, line 983)
            density = (effectiveN2 * 1.165 + effectiveO2 * 1.331 + effectiveHe * 0.1664) * pAmb;
            refDensity = 1.205;
        }

        // ATA equivalent = density / reference (smali line 1027: div-double v0, v10, v0)
        const ataEquiv = density / refDensity;

        return {
            density: Math.round(density * 100) / 100,
            ata: Math.round(ataEquiv * 100) / 100,
            gramsPerLiter: Math.round(density * 100) / 100
        };
    }

    return {
        bestMix,
        eadMod,
        mixNitrox,
        mixTrimix,
        topUp,
        equalize,
        gasDensity,
        gasZ,
        O2ZFactor,
        HeZFactor,
        N2ZFactor,
        AirZFactor
    };
})();

if (typeof module !== 'undefined') module.exports = DiveTools;
