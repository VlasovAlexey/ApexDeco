const DiveTools = (() => {
    const O2ZFactor = [1.0,0.995,0.99,0.986,0.981,0.977,0.973,0.969,0.966,0.962,0.959,0.956,0.954,0.951,0.949,0.947,0.945,0.944,0.943,0.942,0.941,0.94,0.94,0.94,0.941,0.941,0.942,0.943,0.944,0.945,0.947,0.948,0.95,0.953,0.955,0.957,0.96,0.963,0.966,0.969,0.972];
    const HeZFactor = [1.0,1.004,1.007,1.011,1.015,1.018,1.022,1.026,1.029,1.033,1.036,1.04,1.043,1.047,1.05,1.054,1.057,1.061,1.064,1.067,1.071,1.074,1.078,1.081,1.084,1.088,1.091,1.094,1.097,1.101,1.104,1.107,1.11,1.114,1.117,1.12,1.123,1.127,1.13,1.133,1.136];
    const N2ZFactor = [1.0,0.998,0.997,0.995,0.994,0.993,0.993,0.993,0.993,0.993,0.994,0.995,0.996,0.997,0.999,1.001,1.003,1.005,1.008,1.011,1.014,1.017,1.021,1.024,1.028,1.032,1.036,1.041,1.045,1.05,1.054,1.059,1.064,1.069,1.074,1.08,1.085,1.091,1.096,1.102,1.107];
    const AirZFactor = [1.0,0.997,0.995,0.993,0.991,0.99,0.989,0.988,0.987,0.987,0.986,0.987,0.987,0.988,0.988,0.99,0.991,0.992,0.994,0.996,0.999,1.001,1.004,1.007,1.01,1.013,1.016,1.02,1.024,1.028,1.032,1.036,1.04,1.045,1.049,1.054,1.059,1.064,1.069,1.074,1.079];
    const tempCoeffs = [9.0E-4, 0.0015, 0, 4.0E-4, 9.0E-4]; 
    const SLP_SW_f = 33.066;
    const SLP_SW_m = 10.078;
    const SLP_FW_f = 33.914;
    const SLP_FW_m = 10.337;
    function gasZ(gasType, pressure, isPSI, tempC) {
        if (isPSI === 0) {
            pressure = 14.7 * pressure; 
        }
        pressure = Math.max(0, Math.min(4000, pressure));
        const tempOffset = (tempC * 5 - 20); 
        const tempCorr = tempCoeffs[gasType] * tempOffset;
        const idx = Math.round(pressure * 0.01);
        let z;
        switch (gasType) {
            case 0: z = AirZFactor[idx]; break;
            case 1: z = O2ZFactor[idx]; break;
            case 2: z = N2ZFactor[idx]; break;
            case 3: z = HeZFactor[idx]; break;
            case 4: 
                const n2z = N2ZFactor[idx];
                const o2z = O2ZFactor[idx];
                z = o2z + (n2z - o2z) * 0.68;
                break;
            default: return 1.0;
        }
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
    }
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
        const ppN2 = n2Frac * pAmb;
        const ead = ((ppN2 / 0.79) - 1) * slp;
        let narcFrac;
        if (oxyNarc) {
            narcFrac = 1 - heFrac; 
        } else {
            narcFrac = n2Frac; 
        }
        let effectiveO2 = o2Frac;
        let effectiveHe = heFrac;
        if (setpoint > 0) {
            effectiveO2 = Math.min(1, setpoint / pAmb);
            effectiveHe = heFrac * (1 - effectiveO2) / (1 - o2Frac);
            if (oxyNarc) {
                narcFrac = 1 - effectiveHe;
            } else {
                narcFrac = 1 - effectiveO2 - effectiveHe;
            }
        }
        const end = ((narcFrac * pAmb / (oxyNarc ? 1.0 : 0.79)) - 1) * slp;
        const actualN2 = setpoint > 0 ? (1 - effectiveO2 - effectiveHe) : n2Frac;
        const actualO2 = setpoint > 0 ? effectiveO2 : o2Frac;
        const actualHe = setpoint > 0 ? effectiveHe : heFrac;
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
    function mixNitrox(startPressure, startO2, endPressure, endO2, isPSI, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const pFlag = isPSI ? 1 : 0;
        const o2Start = startO2 / 100;
        const o2End   = endO2   / 100;
        const zStartAir = gasZ(0, startPressure, pFlag, T);
        const zEndO2    = gasZ(1, endPressure,   pFlag, T);
        const zEndAir   = gasZ(0, endPressure,   pFlag, T);
        const nStart = startPressure / zStartAir;
        const nEnd   = endPressure   / zEndAir;
        const delta  = nEnd - nStart;
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
        const a = nEnd * eHe - nStart * sHe; 
        const rhs_o2    = nEnd * eO2 - nStart * sO2;
        const rhs_total = delta - a;
        const b = (rhs_o2 - rhs_total * 0.21) / (1.0 - 0.21); 
        const c = rhs_total - b; 
        const addHe  = a * zHeEnd;
        const addO2  = b * zO2End;
        const addAir = c * zAirEnd;
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
    function topUp(startPressure, startO2, startHe, topUpPressure, topO2, topHe, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const finalP = startPressure + topUpPressure;
        if (finalP <= 0) return { finalO2: 0, finalHe: 0, finalPressure: 0 };
        function mixZ(p, o2pct, hepct) {
            const n2f = Math.max(0, 1 - o2pct/100 - hepct/100);
            return gasZ(0, p, 0, T) * n2f
                 + gasZ(1, p, 0, T) * (o2pct/100)
                 + gasZ(3, p, 0, T) * (hepct/100);
        }
        const zStart = mixZ(startPressure, startO2, startHe);
        const zTop   = mixZ(topUpPressure, topO2,   topHe);
        const nStart = startPressure / Math.max(0.5, zStart);
        const nTop   = topUpPressure / Math.max(0.5, zTop);
        const nTotal = nStart + nTop;
        if (nTotal <= 0) return { finalO2: 0, finalHe: 0, finalPressure: 0 };
        const finalO2pct = (nStart * startO2/100 + nTop * topO2/100) / nTotal * 100;
        const finalHepct = (nStart * startHe/100 + nTop * topHe/100) / nTotal * 100;
        const zFinal = mixZ(finalP, finalO2pct, finalHepct);
        const finalPressure = nTotal * Math.max(0.5, zFinal);
        return {
            finalO2:       Math.round(finalO2pct    * 10) / 10,
            finalHe:       Math.round(finalHepct    * 10) / 10,
            finalPressure: Math.round(finalPressure * 10) / 10
        };
    }
    function equalize(supplySize, supplyPressure, receiveSize, receivePressure, tempC) {
        const T = tempC !== undefined ? tempC : 20;
        const zSupply = gasZ(0, supplyPressure,  0, T);
        const zRecv   = gasZ(0, receivePressure, 0, T);
        const nSupply = supplySize  * supplyPressure  / Math.max(0.5, zSupply);
        const nRecv   = receiveSize * receivePressure / Math.max(0.5, zRecv);
        const nTotal  = nSupply + nRecv;
        const totalV  = supplySize + receiveSize;
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
        if (setpoint > 0) {
            effectiveO2 = Math.min(1.0, setpoint / pAmb);
            if (o2Frac < 1) {
                effectiveN2 = n2Frac * (1 - effectiveO2) / (1 - o2Frac);
                effectiveHe = (1 - effectiveO2) - effectiveN2;
            } else {
                effectiveN2 = 0;
                effectiveHe = 0;
            }
        }
        let density, refDensity;
        if (tempC <= 10) {
            density = (effectiveN2 * 1.2506 + effectiveO2 * 1.429 + effectiveHe * 0.1785) * pAmb;
            refDensity = 1.293;
        } else {
            density = (effectiveN2 * 1.165 + effectiveO2 * 1.331 + effectiveHe * 0.1664) * pAmb;
            refDensity = 1.205;
        }
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
