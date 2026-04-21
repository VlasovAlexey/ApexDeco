/**
 * MultiDeco JS - Diving Tools: Shared Utilities
 * Z-factor compressibility, constants, gasZ function
 */

const DiveTools = {};

// Z-factor compressibility arrays (from original app, indexed 0-40 for 0-4000 PSI in 100 PSI steps)
DiveTools._O2ZFactor = [1.0,0.995,0.99,0.986,0.981,0.977,0.973,0.969,0.966,0.962,0.959,0.956,0.954,0.951,0.949,0.947,0.945,0.944,0.943,0.942,0.941,0.94,0.94,0.94,0.941,0.941,0.942,0.943,0.944,0.945,0.947,0.948,0.95,0.953,0.955,0.957,0.96,0.963,0.966,0.969,0.972];
DiveTools._HeZFactor = [1.0,1.004,1.007,1.011,1.015,1.018,1.022,1.026,1.029,1.033,1.036,1.04,1.043,1.047,1.05,1.054,1.057,1.061,1.064,1.067,1.071,1.074,1.078,1.081,1.084,1.088,1.091,1.094,1.097,1.101,1.104,1.107,1.11,1.114,1.117,1.12,1.123,1.127,1.13,1.133,1.136];
DiveTools._N2ZFactor = [1.0,0.998,0.997,0.995,0.994,0.993,0.993,0.993,0.993,0.993,0.994,0.995,0.996,0.997,0.999,1.001,1.003,1.005,1.008,1.011,1.014,1.017,1.021,1.024,1.028,1.032,1.036,1.041,1.045,1.05,1.054,1.059,1.064,1.069,1.074,1.08,1.085,1.091,1.096,1.102,1.107];
DiveTools._AirZFactor = [1.0,0.997,0.995,0.993,0.991,0.99,0.989,0.988,0.987,0.987,0.986,0.987,0.987,0.988,0.988,0.99,0.991,0.992,0.994,0.996,0.999,1.001,1.004,1.007,1.01,1.013,1.016,1.02,1.024,1.028,1.032,1.036,1.04,1.045,1.049,1.054,1.059,1.064,1.069,1.074,1.079];

// Correction factors for Z-factor temperature adjustment
DiveTools._tempCoeffs = [9.0E-4, 0.0015, 0, 4.0E-4, 9.0E-4]; // Air, O2, N2, He, EAN32

// Sea level pressure constants
DiveTools._SLP_SW_f = 33.066;
DiveTools._SLP_SW_m = 10.078;
DiveTools._SLP_FW_f = 33.914;
DiveTools._SLP_FW_m = 10.337;

/**
 * Get Z-factor for a gas at a given pressure
 * @param {number} gasType - 0=Air, 1=O2, 2=N2, 3=He, 4=EAN32
 * @param {number} pressure - pressure value
 * @param {number} isPSI - 0=PSI, 1=BAR
 * @param {number} tempC - temperature in Celsius (for adjustment, 20=standard)
 */
DiveTools.gasZ = function(gasType, pressure, isPSI, tempC) {
    if (isPSI === 0) {
        pressure = 14.7 * pressure; // Convert BAR to PSI-equivalent
    }
    pressure = Math.max(0, Math.min(4000, pressure));

    const tempOffset = (tempC * 5 - 20); // temperature deviation
    const tempCorr = DiveTools._tempCoeffs[gasType] * tempOffset;

    const idx = Math.round(pressure * 0.01);

    let z;
    switch (gasType) {
        case 0: z = DiveTools._AirZFactor[idx]; break;
        case 1: z = DiveTools._O2ZFactor[idx]; break;
        case 2: z = DiveTools._N2ZFactor[idx]; break;
        case 3: z = DiveTools._HeZFactor[idx]; break;
        case 4: // EAN32 - interpolated
            const n2z = DiveTools._N2ZFactor[idx];
            const o2z = DiveTools._O2ZFactor[idx];
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
};

if (typeof module !== 'undefined') module.exports = DiveTools;
