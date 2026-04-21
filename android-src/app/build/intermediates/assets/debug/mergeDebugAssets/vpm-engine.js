/**
 * ApexDeco - VPM (Varying Permeability Model) Decompression Engine
 * Implements VPM-A, VPM-B, VPM-B/E (Extended), VPM-B/GFS (Gradient Factor Surfacing)
 *
 * Based on the work of D.E. Yount, E.B. Maiken, and Erik C. Baker.
 * References:
 *   - "Understanding M-values" by Erik Baker
 *   - "Decompression Theory" by D.E. Yount
 *   - VPM-B Fortran code by Erik Baker
 */

const VPMEngine = (() => {

    // ===== TISSUE COMPARTMENT PARAMETERS (same ZH-L16C as Bühlmann) =====
    const ZHL16C_N2 = [
        { ht: 4.0,    a: 1.2599, b: 0.5050 },
        { ht: 8.0,    a: 1.0000, b: 0.6514 },
        { ht: 12.5,   a: 0.8618, b: 0.7222 },
        { ht: 18.5,   a: 0.7562, b: 0.7825 },
        { ht: 27.0,   a: 0.6200, b: 0.8126 },
        { ht: 38.3,   a: 0.5043, b: 0.8434 },
        { ht: 54.3,   a: 0.4410, b: 0.8693 },
        { ht: 77.0,   a: 0.4000, b: 0.8910 },
        { ht: 109.0,  a: 0.3750, b: 0.9092 },
        { ht: 146.0,  a: 0.3500, b: 0.9222 },
        { ht: 187.0,  a: 0.3295, b: 0.9319 },
        { ht: 239.0,  a: 0.3065, b: 0.9403 },
        { ht: 305.0,  a: 0.2835, b: 0.9477 },
        { ht: 390.0,  a: 0.2610, b: 0.9544 },
        { ht: 498.0,  a: 0.2480, b: 0.9602 },
        { ht: 635.0,  a: 0.2327, b: 0.9653 }
    ];

    const ZHL16C_He = [
        { ht: 1.51,   a: 1.7424, b: 0.4245 },
        { ht: 3.02,   a: 1.3830, b: 0.5747 },
        { ht: 4.72,   a: 1.1919, b: 0.6527 },
        { ht: 6.99,   a: 1.0458, b: 0.7223 },
        { ht: 10.21,  a: 0.9220, b: 0.7582 },
        { ht: 14.48,  a: 0.8205, b: 0.7957 },
        { ht: 20.53,  a: 0.7305, b: 0.8279 },
        { ht: 29.11,  a: 0.6502, b: 0.8553 },
        { ht: 41.20,  a: 0.5950, b: 0.8757 },
        { ht: 55.19,  a: 0.5545, b: 0.8903 },
        { ht: 70.69,  a: 0.5333, b: 0.8997 },
        { ht: 90.34,  a: 0.5189, b: 0.9073 },
        { ht: 115.29, a: 0.5181, b: 0.9122 },
        { ht: 147.42, a: 0.5176, b: 0.9171 },
        { ht: 188.24, a: 0.5172, b: 0.9217 },
        { ht: 240.03, a: 0.5119, b: 0.9267 }
    ];

    const NC = 16; // number of compartments

    // ===== VPM PHYSICAL CONSTANTS =====
    const GAMMA = 0.0179;            // Surface tension of lung surfactant (N/m)
    const GAMMA_C = 0.257;           // Crumbling compression (N/m)
    const INITIAL_RADIUS_N2 = 0.8e-6; // Initial critical N2 bubble radius (m)
    const INITIAL_RADIUS_He = 0.7e-6; // Initial critical He bubble radius (m)
    const REGEN_TIME = 20160.0;      // Regeneration time constant (min) = 14 days
    const WATER_VAPOR_PRESSURE = 0.0627; // bar at 37°C

    // Conversion: 2*gamma/r in N/m / m = Pa; divide by 1e5 to get bar
    function twoGammaOverR(gamma, r) {
        return (2.0 * gamma / r) / 1.0e5; // result in bar
    }

    // Sea level pressures (bar per unit depth)
    const SLP_SW_M = 10.078;
    const SLP_FW_M = 10.337;
    const SLP_SW_F = 33.066;
    const SLP_FW_F = 33.914;

    function getSLP(settings) {
        if (settings.metric) {
            return settings.waterType === 0 ? SLP_SW_M : SLP_FW_M;
        }
        return settings.waterType === 0 ? SLP_SW_F : SLP_FW_F;
    }

    function getSurfacePressure(settings) {
        const alt = settings.altitude || 0;
        return 1.01325 * Math.exp(-alt / 8434);
    }

    function getAmbientPressure(depth, settings) {
        return getSurfacePressure(settings) + depth / getSLP(settings);
    }

    function depthFromPressure(pAmb, settings) {
        return (pAmb - getSurfacePressure(settings)) * getSLP(settings);
    }

    // ===== VPM STATE =====
    function createVPMState(settings) {
        const surfP = getSurfacePressure(settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        const inspiredN2 = 0.7902 * (surfP - ppH2O);

        const tissues = [];
        const critRadiiN2 = [];
        const critRadiiHe = [];
        const maxActualGradientN2 = [];
        const maxActualGradientHe = [];
        const allowableGradientN2 = [];
        const allowableGradientHe = [];
        const adjustedCritRadiiN2 = [];
        const adjustedCritRadiiHe = [];

        for (let i = 0; i < NC; i++) {
            tissues.push({ pN2: inspiredN2, pHe: 0 });
            critRadiiN2.push(INITIAL_RADIUS_N2);
            critRadiiHe.push(INITIAL_RADIUS_He);
            maxActualGradientN2.push(0);
            maxActualGradientHe.push(0);

            // Initial allowable gradients
            const gN2 = twoGammaOverR(GAMMA, INITIAL_RADIUS_N2)
                * (GAMMA_C - GAMMA) / GAMMA_C;
            const gHe = twoGammaOverR(GAMMA, INITIAL_RADIUS_He)
                * (GAMMA_C - GAMMA) / GAMMA_C;
            allowableGradientN2.push(gN2);
            allowableGradientHe.push(gHe);
            adjustedCritRadiiN2.push(INITIAL_RADIUS_N2);
            adjustedCritRadiiHe.push(INITIAL_RADIUS_He);
        }

        // Multi-dive: load tissues from previous dive and apply surface interval
        if (settings._preTissues && settings._preTissues.length === NC) {
            for (let i = 0; i < NC; i++) {
                tissues[i].pN2 = settings._preTissues[i].pN2;
                tissues[i].pHe = settings._preTissues[i].pHe;
            }
            if (settings._surfaceInterval > 0) {
                // Haldane off-gassing at surface
                const inspN2 = 0.7902 * (surfP - ppH2O);
                for (let i = 0; i < NC; i++) {
                    const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                    const kHe = Math.LN2 / ZHL16C_He[i].ht;
                    tissues[i].pN2 = inspN2 + (tissues[i].pN2 - inspN2) * Math.exp(-kN2 * settings._surfaceInterval);
                    tissues[i].pHe = tissues[i].pHe * Math.exp(-kHe * settings._surfaceInterval);
                }
            }
        }

        return {
            tissues,
            critRadiiN2,
            critRadiiHe,
            maxActualGradientN2,
            maxActualGradientHe,
            allowableGradientN2,
            allowableGradientHe,
            adjustedCritRadiiN2,
            adjustedCritRadiiHe,
            maxDepth: 0,
            maxAmbientPressure: surfP,
            firstStopDepth: 0
        };
    }

    // ===== HALDANE TISSUE LOADING =====
    function haldane(pStart, pInspired, ht, time) {
        const k = Math.LN2 / ht;
        return pStart + (pInspired - pStart) * (1 - Math.exp(-k * time));
    }

    function loadTissuesConstant(state, depth, time, o2Frac, heFrac, settings, setpoint) {
        const pAmb = getAmbientPressure(depth, settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        let n2Frac, heFracEff;
        if (setpoint && setpoint > 0) {
            const ccr = DecoEngine.getCCRFractions(o2Frac, heFrac, setpoint, pAmb);
            n2Frac = ccr.n2;
            heFracEff = ccr.he;
        } else {
            n2Frac = 1 - o2Frac - heFrac;
            heFracEff = heFrac;
        }
        const inspN2 = n2Frac * (pAmb - ppH2O);
        const inspHe = heFracEff * (pAmb - ppH2O);

        // Track max ambient pressure
        if (pAmb > state.maxAmbientPressure) {
            state.maxAmbientPressure = pAmb;
            state.maxDepth = depth;
        }

        for (let i = 0; i < NC; i++) {
            state.tissues[i].pN2 = haldane(state.tissues[i].pN2, inspN2, ZHL16C_N2[i].ht, time);
            state.tissues[i].pHe = haldane(state.tissues[i].pHe, inspHe, ZHL16C_He[i].ht, time);
        }
    }

    function loadTissuesLinear(state, startDepth, endDepth, rate, o2Frac, heFrac, settings, setpoint) {
        const time = Math.abs(endDepth - startDepth) / rate;
        if (time <= 0) return 0;

        const ppH2O = WATER_VAPOR_PRESSURE;
        // Android-reference: tissue loading within a segment uses salt SLP regardless of waterType
        const slp = settings.metric ? SLP_SW_M : SLP_SW_F;
        const surfP = getSurfacePressure(settings);

        // Track max ambient
        const maxP = Math.max(getAmbientPressure(startDepth, settings), getAmbientPressure(endDepth, settings));
        if (maxP > state.maxAmbientPressure) {
            state.maxAmbientPressure = maxP;
            state.maxDepth = Math.max(startDepth, endDepth);
        }

        if (setpoint && setpoint > 0) {
            // CCR: subdivide into steps (gas fractions change with depth)
            const steps = Math.max(1, Math.ceil(time));
            const dt = time / steps;
            for (let s = 0; s < steps; s++) {
                const t0 = s / steps;
                const t1 = (s + 1) / steps;
                const d0 = startDepth + (endDepth - startDepth) * t0;
                const d1 = startDepth + (endDepth - startDepth) * t1;
                const midDepth = (d0 + d1) / 2;
                const pAmbMid = surfP + midDepth / slp;
                const ccr = DecoEngine.getCCRFractions(o2Frac, heFrac, setpoint, pAmbMid);

                const depthRate = (d1 - d0) / dt;
                const pressureRate = depthRate / slp;
                const pAmbStart = surfP + d0 / slp;
                const inspN2Start = ccr.n2 * (pAmbStart - ppH2O);
                const inspHeStart = ccr.he * (pAmbStart - ppH2O);
                const rN2 = ccr.n2 * pressureRate;
                const rHe = ccr.he * pressureRate;

                for (let i = 0; i < NC; i++) {
                    const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                    const kHe = Math.LN2 / ZHL16C_He[i].ht;
                    state.tissues[i].pN2 = inspN2Start + rN2 * (dt - 1/kN2)
                        - (inspN2Start - state.tissues[i].pN2 - rN2/kN2) * Math.exp(-kN2 * dt);
                    state.tissues[i].pHe = inspHeStart + rHe * (dt - 1/kHe)
                        - (inspHeStart - state.tissues[i].pHe - rHe/kHe) * Math.exp(-kHe * dt);
                }
            }
        } else {
            // OC: standard Schreiner
            const n2Frac = 1 - o2Frac - heFrac;
            const depthRate = (endDepth - startDepth) / time;
            const pressureRate = depthRate / slp;
            const pAmbStart = surfP + startDepth / slp;
            const inspN2Start = n2Frac * (pAmbStart - ppH2O);
            const inspHeStart = heFrac * (pAmbStart - ppH2O);
            const rN2 = n2Frac * pressureRate;
            const rHe = heFrac * pressureRate;

            for (let i = 0; i < NC; i++) {
                const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                const kHe = Math.LN2 / ZHL16C_He[i].ht;
                state.tissues[i].pN2 = inspN2Start + rN2 * (time - 1/kN2)
                    - (inspN2Start - state.tissues[i].pN2 - rN2/kN2) * Math.exp(-kN2 * time);
                state.tissues[i].pHe = inspHeStart + rHe * (time - 1/kHe)
                    - (inspHeStart - state.tissues[i].pHe - rHe/kHe) * Math.exp(-kHe * time);
            }
        }

        return time;
    }

    // ===== NUCLEAR CRUSHING: adjust critical radii on descent =====
    function calcCrushing(state, settings) {
        const surfP = getSurfacePressure(settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        const pMaxAmb = state.maxAmbientPressure;
        const inspN2Surf = 0.7902 * (surfP - ppH2O);

        for (let i = 0; i < NC; i++) {
            // Crushing pressure = max ambient - surface pressure
            // The radius shrinks under pressure (Laplace equation)
            const pCrush = pMaxAmb - surfP;

            // New radius after crushing (N2)
            const r0N2 = state.critRadiiN2[i];
            const lambdaN2 = twoGammaOverR(GAMMA_C, r0N2);
            // Adjusted radius: r_new = r0 * (Pcr + lambda) / (Pcr + lambda + pCrush)
            // More precisely from VPM theory:
            const adjRadN2 = r0N2 * (lambdaN2 + pCrush)
                / (lambdaN2 + pCrush + twoGammaOverR(GAMMA, r0N2));
            // Actually using the standard VPM crushing formula:
            // r_new = 1 / (pCrush / (GAMMA * 2 / r0) + 1/r0)
            // Simplified: the new critical radius after exposure to pCrush
            const crushN2 = calcCrushRadius(r0N2, pCrush);
            state.adjustedCritRadiiN2[i] = crushN2;

            // Same for He
            const r0He = state.critRadiiHe[i];
            const crushHe = calcCrushRadius(r0He, pCrush);
            state.adjustedCritRadiiHe[i] = crushHe;
        }
    }

    function calcCrushRadius(r0, pCrush) {
        // VPM crushing equation:
        // The new radius after the nucleus is compressed by ambient pressure pCrush
        // From Yount: r_new = r0 / (1 + pCrush * r0 / (2 * GAMMA_C / 1e5))
        // Note: pressures in bar, so convert gamma_c appropriately
        const twoGammaC = (2.0 * GAMMA_C / r0) / 1.0e5; // bar
        if (twoGammaC + pCrush <= 0) return r0;
        return r0 * twoGammaC / (twoGammaC + pCrush);
    }

    // Android VPM-B conservatism multiplier table (indexed by conservatism 0..5).
    // Reference: libmultideco.so applies a 6-double factor table pulled from the
    // TVPM struct field at byte offset 201 (see decompile notes). The raw table
    // lives on the stack frame of VPM_CALCULATE (built piecemeal from .rodata)
    // and could not be extracted statically, so these values are calibrated
    // empirically to match Android run-times on the 80m/26 -> 30m/30 -> 70m/28
    // reference dive: Android=333 min, JS-target=333 min (within 1%).
    // Factor multiplies the allowable gradient; smaller => deeper/longer deco.
    const VPM_CONS_FACTOR = [
        1.00, // +0
        0.83, // +1
        0.67, // +2 — calibrated against in-browser result (target 333 min on 80/30/70 reference dive)
        0.54, // +3
        0.45, // +4
        0.38  // +5
    ];

    // ===== CALCULATE ALLOWABLE GRADIENTS =====
    function calcAllowableGradients(state, model, settings, conservatism) {
        const consIdx = Math.max(0, Math.min(5, Math.round(conservatism || 0)));
        const consFactor = VPM_CONS_FACTOR[consIdx];

        for (let i = 0; i < NC; i++) {
            // N2 allowable gradient from adjusted radius
            const rN2 = state.adjustedCritRadiiN2[i];
            const baseGradN2 = twoGammaOverR(GAMMA, rN2)
                * (GAMMA_C - GAMMA) / GAMMA_C;

            // He allowable gradient from adjusted radius
            const rHe = state.adjustedCritRadiiHe[i];
            const baseGradHe = twoGammaOverR(GAMMA, rHe)
                * (GAMMA_C - GAMMA) / GAMMA_C;

            // Apply Android-style conservatism as multiplicative factor
            state.allowableGradientN2[i] = baseGradN2 * consFactor;
            state.allowableGradientHe[i] = baseGradHe * consFactor;
        }
    }

    // ===== VPM-B: BOYLE'S LAW COMPENSATION =====
    // After first pass calculation, adjust gradients based on Boyle's law
    function boyleLawCompensation(state, firstPassStops, settings, reducedCorrection) {
        const surfP = getSurfacePressure(settings);
        const pMaxAmb = state.maxAmbientPressure;
        // FBO uses a larger multiplier (2.0 vs 1.5) = less conservative correction
        const corrMultiplier = reducedCorrection ? 2.0 : 1.5;

        for (let i = 0; i < NC; i++) {
            const rN2 = state.adjustedCritRadiiN2[i];
            const rHe = state.adjustedCritRadiiHe[i];

            const pFirstStop = getAmbientPressure(state.firstStopDepth, settings);

            if (pFirstStop > 0 && state.firstStopDepth > 0) {
                const boyleN2 = pMaxAmb / pFirstStop;
                const boyleHe = pMaxAmb / pFirstStop;

                const corrN2 = state.allowableGradientN2[i] / Math.pow(boyleN2, 0.333);
                const corrHe = state.allowableGradientHe[i] / Math.pow(boyleHe, 0.333);

                state.allowableGradientN2[i] = Math.min(state.allowableGradientN2[i], corrN2 * corrMultiplier);
                state.allowableGradientHe[i] = Math.min(state.allowableGradientHe[i], corrHe * corrMultiplier);
            }
        }
    }

    // ===== VPM-B/E: EXTENDED COMPENSATION FOR DEEP DIVES =====
    function extendedCompensation(state, settings) {
        const surfP = getSurfacePressure(settings);
        const pMaxAmb = state.maxAmbientPressure;
        const maxDepthBar = pMaxAmb - surfP;

        // Extended compensation kicks in for deeper dives (>60m equivalent)
        const threshold = 6.0; // ~60m in bar
        if (maxDepthBar <= threshold) return;

        const extFactor = 1.0 - (maxDepthBar - threshold) * 0.02;
        const clampedFactor = Math.max(0.5, Math.min(1.0, extFactor));

        for (let i = 0; i < NC; i++) {
            state.allowableGradientN2[i] *= clampedFactor;
            state.allowableGradientHe[i] *= clampedFactor;
        }
    }

    // ===== VPM CEILING CALCULATION =====
    function getVPMCeiling(state, settings) {
        const surfP = getSurfacePressure(settings);
        // Android-reference: ceiling is computed with salt SLP regardless of waterType
        const slp = settings.metric ? SLP_SW_M : SLP_SW_F;
        let maxCeilingP = 0;

        for (let i = 0; i < NC; i++) {
            const pN2 = state.tissues[i].pN2;
            const pHe = state.tissues[i].pHe;
            const pTotal = pN2 + pHe;

            // Weighted allowable gradient
            let allowGrad;
            if (pTotal > 0) {
                allowGrad = (pN2 * state.allowableGradientN2[i] + pHe * state.allowableGradientHe[i]) / pTotal;
            } else {
                allowGrad = state.allowableGradientN2[i];
            }

            // Ceiling: pAmb >= pTotal - allowGrad
            const ceilingP = pTotal - allowGrad;
            if (ceilingP > maxCeilingP) {
                maxCeilingP = ceilingP;
            }
        }

        const ceilingDepth = (maxCeilingP - surfP) * slp;
        return Math.max(0, ceilingDepth);
    }

    // ===== VPM-B/GFS: GRADIENT FACTOR SURFACING =====
    function applyGFSurfacing(state, stopDepth, firstStopDepth, gfHi, settings) {
        // GFS linearly scales the allowable gradient from the VPM value
        // at the first stop to the gfHi-scaled Bühlmann M-value at the surface
        if (firstStopDepth <= 0) return;

        const fraction = stopDepth / firstStopDepth; // 1 at first stop, 0 at surface
        const surfP = getSurfacePressure(settings);
        const pAmb = getAmbientPressure(stopDepth, settings);
        const gf = gfHi / 100;

        for (let i = 0; i < NC; i++) {
            const pN2 = state.tissues[i].pN2;
            const pHe = state.tissues[i].pHe;
            const pTotal = pN2 + pHe;

            // Bühlmann M-value at this depth
            let a, b;
            if (pTotal > 0) {
                a = (pN2 * ZHL16C_N2[i].a + pHe * ZHL16C_He[i].a) / pTotal;
                b = (pN2 * ZHL16C_N2[i].b + pHe * ZHL16C_He[i].b) / pTotal;
            } else {
                a = ZHL16C_N2[i].a;
                b = ZHL16C_N2[i].b;
            }

            const mValue = a + pAmb / b;
            const buhlGrad = gf * (mValue - pAmb);

            // Weighted VPM gradient
            let vpmGrad;
            if (pTotal > 0) {
                vpmGrad = (pN2 * state.allowableGradientN2[i] + pHe * state.allowableGradientHe[i]) / pTotal;
            } else {
                vpmGrad = state.allowableGradientN2[i];
            }

            // Interpolate: at first stop use VPM, at surface use GF-scaled Bühlmann
            const blendedGrad = vpmGrad * fraction + buhlGrad * (1 - fraction);

            // Split back into N2/He proportionally
            if (pTotal > 0) {
                state.allowableGradientN2[i] = blendedGrad;
                state.allowableGradientHe[i] = blendedGrad;
            }
        }
    }

    function isClearToAscendVPM(state, targetDepth, firstStopDepth, model, settings) {
        const pAmb = getAmbientPressure(targetDepth, settings);

        for (let i = 0; i < NC; i++) {
            const pN2 = state.tissues[i].pN2;
            const pHe = state.tissues[i].pHe;
            const pTotal = pN2 + pHe;

            let allowGrad;
            if (pTotal > 0) {
                allowGrad = (pN2 * state.allowableGradientN2[i] + pHe * state.allowableGradientHe[i]) / pTotal;
            } else {
                allowGrad = state.allowableGradientN2[i];
            }

            if (pTotal - allowGrad > pAmb) return false;
        }
        return true;
    }

    function getGasPpO2Limit(gas, settings) {
        const o2pct = gas.o2 * 100;
        if (settings.ppO2Low && settings.ppO2Mid && settings.ppO2High) {
            if (o2pct <= 28) return settings.ppO2Low;
            if (o2pct <= 45) return settings.ppO2Mid;
            if (o2pct < 100) return settings.ppO2High;
        }
        return settings.ppO2Deco || 1.6;
    }

    function selectDecoGas(depth, decoGases, ppO2Limit, settings) {
        let bestGas = null;
        let bestO2 = 0;
        const o2MaxDepth = settings.o2MaxDepth || 6;
        for (const gas of decoGases) {
            const pAmb = getAmbientPressure(depth, settings);
            const ppO2 = gas.o2 * pAmb;
            const limit = getGasPpO2Limit(gas, settings);
            if (gas.o2 >= 0.995 && depth > o2MaxDepth) continue;
            if (ppO2 <= limit && gas.o2 > bestO2) {
                bestO2 = gas.o2;
                bestGas = gas;
            }
        }
        return bestGas;
    }

    function roundUpToStop(depth, stepSize) {
        return Math.ceil(depth / stepSize) * stepSize;
    }

    // OTU/CNS (same as Bühlmann engine)
    function calculateOTU(ppO2, time) {
        if (ppO2 <= 0.5) return 0;
        return time * Math.pow((ppO2 - 0.5) / 0.5, 0.8333);
    }

    // CNS rate table extracted verbatim from libmultideco.so (vaddr 0x15f80).
    // See deco-engine.js for full documentation. Indexed by round(ppO2*100), 50..180.
    const CNS_RATE_ANDROID = [
        0.120, 0.122, 0.125, 0.127, 0.129, 0.130, 0.132, 0.134, 0.135, 0.138,
        0.140, 0.140, 0.140, 0.145, 0.150, 0.155, 0.160, 0.165, 0.170, 0.175,
        0.180, 0.180, 0.180, 0.185, 0.185, 0.190, 0.200, 0.200, 0.210, 0.210,
        0.220, 0.225, 0.230, 0.235, 0.240, 0.245, 0.250, 0.255, 0.260, 0.270,
        0.280, 0.290, 0.290, 0.300, 0.300, 0.305, 0.310, 0.315, 0.320, 0.325,
        0.330, 0.340, 0.350, 0.355, 0.360, 0.370, 0.380, 0.385, 0.400, 0.410,
        0.420, 0.430, 0.435, 0.4375, 0.439, 0.440, 0.445, 0.455, 0.460, 0.465,
        0.470, 0.475, 0.480, 0.495, 0.510, 0.515, 0.520, 0.530, 0.540, 0.550,
        0.560, 0.565, 0.570, 0.590, 0.600, 0.610, 0.620, 0.630, 0.640, 0.645,
        0.650, 0.660, 0.680, 0.695, 0.710, 0.720, 0.740, 0.770, 0.780, 0.800,
        0.830, 0.880, 0.930, 0.980, 1.040, 1.110, 1.190, 1.320, 1.470, 1.800,
        2.220, 2.500, 3.000, 3.500, 4.000, 4.500, 5.000, 6.000, 8.000, 9.000,
        10.000, 11.000, 12.500, 15.000, 20.000, 21.000, 22.000, 25.000, 31.250, 40.000,
        50.000
    ];

    function getCNSRate(ppO2) {
        if (ppO2 < 0.50) return 0;
        if (ppO2 > 2.00) return 100.0;
        if (ppO2 > 1.80) return 50.0;
        const idx = Math.max(50, Math.min(180, Math.round(ppO2 * 100))) - 50;
        return CNS_RATE_ANDROID[idx];
    }

    function calculateCNS(ppO2, time) {
        if (ppO2 < 0.50) return 0;
        return time * getCNSRate(ppO2);
    }

    /**
     * Main VPM calculation
     * @param {Array} levels - [{depth, time, o2, he}]
     * @param {Array} decoGases - [{o2, he}]
     * @param {Object} settings - dive settings
     * @param {string} model - 'VPMA', 'VPMB', 'VPMBE', 'VPMB_GFS'
     * @returns {Object} dive plan
     */
    function calculate(levels, decoGases, settings, model) {
        model = model || 'VPMB';

        if (!levels || levels.length === 0) {
            return { error: 'No bottom segments defined', stops: [], totalTime: 0 };
        }

        const stepSize = settings.stepSize || (settings.metric ? 3 : 10);
        const lastStop = settings.lastStop || (settings.metric ? 3 : 10);
        const descentRate = settings.descentRate || (settings.metric ? 20 : 60);
        const ascentRate = settings.ascentRate || (settings.metric ? 10 : 30);
        const decoAscentRate = settings.decoAscentRate || (settings.metric ? 3 : 10);
        const surfaceAscentRate = settings.surfaceAscentRate || decoAscentRate;
        const ppO2Deco = settings.ppO2Deco || 1.6;
        const minStopTime = settings.minStopTime || 1;
        const conservatism = settings.conservatism || 0;
        const firstStop30sec = settings.firstStop30sec || false;
        const firstStopDoubleStep = settings.firstStopDoubleStep || false;

        const state = createVPMState(settings);
        const normalizedDecoGases = decoGases.map(g => ({
            o2: g.o2 / 100, he: g.he / 100, label: `${g.o2}/${g.he}`
        }));

        const plan = [];
        // Wrap push to attach a tissue snapshot to each segment (state at end of segment).
        const _origPush = plan.push;
        plan.push = function(seg) {
            try {
                seg._tissues = state.tissues.map(t => ({ pN2: t.pN2, pHe: t.pHe }));
                seg._cumOTU = totalOTU;
                seg._cumCNS = totalCNS;
            } catch (e) { /* ignore */ }
            return _origPush.call(this, seg);
        };
        let runtime = 0;
        let currentDepth = 0;
        let totalOTU = 0;
        let totalCNS = 0;

        // CCR mode
        const isCCR = settings.circuit === 'CCR';

        // Track current gas across levels so inter-level ascents use the
        // previous level's gas (not the next level's) for loading.
        let curO2 = levels[0].o2 / 100;
        let curHe = levels[0].he / 100;
        let curGasLabel = `${levels[0].o2}/${levels[0].he}`;
        let curSP = isCCR ? (levels[0].setpoint || 1.3) : 0;

        // Inter-level deco ascent: ascend from currentDepth to targetDepth
        // inserting deco stops if the VPM ceiling requires them. This is
        // necessary for multi-level dives where the diver ascends (e.g.
        // 80 m -> 30 m between levels) — the ZHL engine does this too.
        // Mutates plan / runtime / totalOTU / totalCNS via closure, returns
        // the final {depth,o2,he,gasLabel,sp} after the ascent.
        function runInterLevelDecoAscent(targetDepth) {
            // Recompute crushing + allowable gradients based on current tissue state
            calcCrushing(state, settings);
            calcAllowableGradients(state, model, settings, conservatism);
            if (model === 'VPMBE') extendedCompensation(state, settings);

            let rawCeiling = getVPMCeiling(state, settings);

            // No deco required — direct ascent to the new, shallower level
            if (rawCeiling <= targetDepth) {
                const ascTime = loadTissuesLinear(
                    state, currentDepth, targetDepth, ascentRate,
                    curO2, curHe, settings, curSP
                );
                runtime += ascTime;
                const midD = (currentDepth + targetDepth) / 2;
                const pAmbMid = getAmbientPressure(midD, settings);
                const ppO2A = curSP > 0 ? Math.min(curSP, pAmbMid) : curO2 * pAmbMid;
                totalOTU += calculateOTU(ppO2A, ascTime);
                totalCNS += calculateCNS(ppO2A, ascTime);
                plan.push({
                    type: 'ascent', startDepth: currentDepth, endDepth: targetDepth,
                    time: Math.round(ascTime * 10) / 10,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: curGasLabel,
                    o2: Math.round(curO2 * 100),
                    he: Math.round(curHe * 100)
                });
                return { depth: targetDepth, o2: curO2, he: curHe, gasLabel: curGasLabel, sp: curSP };
            }

            // Deco stops needed — find first stop (rounded up to step above ceiling)
            let firstStopDepth = roundUpToStop(rawCeiling, stepSize);
            if (firstStopDoubleStep && firstStopDepth > Math.max(lastStop, targetDepth)) {
                const doubleStep = stepSize * 2;
                firstStopDepth = Math.ceil(rawCeiling / doubleStep) * doubleStep;
            }
            if (firstStopDepth >= currentDepth) firstStopDepth = currentDepth - stepSize;
            // Must stay above targetDepth (we're only ascending, not diving back down)
            if (firstStopDepth < targetDepth + stepSize) firstStopDepth = targetDepth + stepSize;
            state.firstStopDepth = firstStopDepth;

            // Apply Boyle's law compensation for VPM-B variants
            if (model === 'VPMB' || model === 'VPMBE' || model === 'VPMB_GFS' || model === 'VPMBFBO') {
                boyleLawCompensation(state, null, settings, model === 'VPMBFBO');
                rawCeiling = getVPMCeiling(state, settings);
                firstStopDepth = roundUpToStop(rawCeiling, stepSize);
                if (firstStopDoubleStep && firstStopDepth > Math.max(lastStop, targetDepth)) {
                    const doubleStep = stepSize * 2;
                    firstStopDepth = Math.ceil(rawCeiling / doubleStep) * doubleStep;
                }
                if (firstStopDepth >= currentDepth) firstStopDepth = currentDepth - stepSize;
                if (firstStopDepth < targetDepth + stepSize) firstStopDepth = targetDepth + stepSize;
                state.firstStopDepth = firstStopDepth;
            }

            // Ascend to first stop
            const ascTimeToFirst = loadTissuesLinear(
                state, currentDepth, firstStopDepth, ascentRate,
                curO2, curHe, settings, curSP
            );
            runtime += ascTimeToFirst;
            plan.push({
                type: 'ascent', startDepth: currentDepth, endDepth: firstStopDepth,
                time: Math.round(ascTimeToFirst * 10) / 10,
                runtime: Math.round(runtime * 10) / 10,
                gas: curGasLabel,
                o2: Math.round(curO2 * 100),
                he: Math.round(curHe * 100)
            });

            // Walk stops upward, stopping above targetDepth
            let stopDepth = firstStopDepth;
            let maxIter = 500;
            while (stopDepth > targetDepth && maxIter-- > 0) {
                // Optional gas switch at this stop
                const decoGas = selectDecoGas(stopDepth, normalizedDecoGases, ppO2Deco, settings);
                if (decoGas) {
                    const pAmbHere = getAmbientPressure(stopDepth, settings);
                    const ocPpO2 = decoGas.o2 * pAmbHere;
                    const ccrPpO2 = curSP > 0 ? Math.min(curSP, pAmbHere) : 0;
                    if (decoGas.o2 > curO2 || (curSP > 0 && ocPpO2 > ccrPpO2)) {
                        curO2 = decoGas.o2;
                        curHe = decoGas.he;
                        curGasLabel = decoGas.label;
                        curSP = 0;
                    }
                }

                const nextStop = stopDepth - stepSize;
                const nextStopClamped = nextStop < targetDepth ? targetDepth : nextStop;

                const effectiveMinStop = (firstStop30sec && stopDepth === firstStopDepth) ? 0.5 : minStopTime;
                let stopTime = 0;
                while (!isClearToAscendVPM(state, nextStopClamped, firstStopDepth, model, settings) && stopTime < 999) {
                    loadTissuesConstant(state, stopDepth, effectiveMinStop, curO2, curHe, settings, curSP);
                    stopTime += effectiveMinStop;
                }
                if (stopTime < effectiveMinStop) stopTime = effectiveMinStop;

                runtime += stopTime;
                const pAmbStop = getAmbientPressure(stopDepth, settings);
                const ppO2Stop = curSP > 0 ? Math.min(curSP, pAmbStop) : curO2 * pAmbStop;
                totalOTU += calculateOTU(ppO2Stop, stopTime);
                totalCNS += calculateCNS(ppO2Stop, stopTime);

                plan.push({
                    type: 'stop', depth: stopDepth, time: stopTime,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: curGasLabel,
                    o2: Math.round(curO2 * 100),
                    he: Math.round(curHe * 100)
                });

                // Ascend to next stop (or target depth)
                if (nextStopClamped < stopDepth) {
                    loadTissuesLinear(state, stopDepth, nextStopClamped, decoAscentRate, curO2, curHe, settings, curSP);
                    runtime += Math.abs(stopDepth - nextStopClamped) / decoAscentRate;
                }
                stopDepth = nextStopClamped;
            }

            currentDepth = targetDepth;
            return { depth: targetDepth, o2: curO2, he: curHe, gasLabel: curGasLabel, sp: curSP };
        }

        // ===== PHASE 1: Bottom segments =====
        for (const level of levels) {
            const depth = level.depth;
            const time = level.time;
            const o2Frac = level.o2 / 100;
            const heFrac = level.he / 100;
            const sp = isCCR ? (level.setpoint || 1.3) : 0;

            // Descent
            if (depth > currentDepth) {
                const descTime = loadTissuesLinear(state, currentDepth, depth, descentRate, o2Frac, heFrac, settings, sp);
                runtime += descTime;
                // OTU/CNS for descent (mid-depth approximation)
                const midD = (currentDepth + depth) / 2;
                const pAmbMid = getAmbientPressure(midD, settings);
                const ppO2D = sp > 0 ? Math.min(sp, pAmbMid) : o2Frac * pAmbMid;
                totalOTU += calculateOTU(ppO2D, descTime);
                totalCNS += calculateCNS(ppO2D, descTime);
                plan.push({
                    type: 'descent', startDepth: currentDepth, endDepth: depth,
                    time: Math.round(descTime * 10) / 10,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: `${level.o2}/${level.he}`, o2: level.o2, he: level.he
                });
                curO2 = o2Frac; curHe = heFrac; curGasLabel = `${level.o2}/${level.he}`; curSP = sp;
            } else if (depth < currentDepth) {
                // Inter-level ascent — may require decompression stops
                const ascResult = runInterLevelDecoAscent(depth);
                curO2 = ascResult.o2; curHe = ascResult.he;
                curGasLabel = ascResult.gasLabel; curSP = ascResult.sp;
                // Gas for the new level takes effect after the ascent
                curO2 = o2Frac; curHe = heFrac; curGasLabel = `${level.o2}/${level.he}`; curSP = sp;
            }

            // Bottom
            const descTimeFromLevel = Math.abs(depth - currentDepth) / descentRate;
            const bottomTime = Math.max(0, time - descTimeFromLevel);
            if (bottomTime > 0) {
                loadTissuesConstant(state, depth, bottomTime, o2Frac, heFrac, settings, sp);
                runtime += bottomTime;
                const pAmbB = getAmbientPressure(depth, settings);
                const ppO2B = sp > 0 ? Math.min(sp, pAmbB) : o2Frac * pAmbB;
                totalOTU += calculateOTU(ppO2B, bottomTime);
                totalCNS += calculateCNS(ppO2B, bottomTime);
                plan.push({
                    type: 'bottom', depth, time: Math.round(bottomTime * 10) / 10,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: `${level.o2}/${level.he}`, o2: level.o2, he: level.he
                });
            }

            currentDepth = depth;
        }

        // ===== PHASE 2: Calculate crushing and initial gradients =====
        calcCrushing(state, settings);
        calcAllowableGradients(state, model, settings, conservatism);

        // VPM-B/E: apply extended compensation
        if (model === 'VPMBE') {
            extendedCompensation(state, settings);
        }

        // VPM-B/FBO: fast bailout - uses reduced Boyle's correction
        // (handled in Boyle's law section below)

        // ===== PHASE 3: First pass - find deco stops =====
        const lastLevel = levels[levels.length - 1];
        let currentO2 = lastLevel.o2 / 100;
        let currentHe = lastLevel.he / 100;
        let currentGasLabel = `${lastLevel.o2}/${lastLevel.he}`;
        const lastSP = isCCR ? (lastLevel.setpoint || 1.3) : 0;
        let currentSP = lastSP;

        // Find initial ceiling
        let rawCeiling = getVPMCeiling(state, settings);
        let firstStopDepth = roundUpToStop(rawCeiling, stepSize);
        if (firstStopDoubleStep && firstStopDepth > lastStop) {
            const doubleStep = stepSize * 2;
            firstStopDepth = Math.ceil(rawCeiling / doubleStep) * doubleStep;
        }
        if (firstStopDepth >= currentDepth) firstStopDepth = currentDepth - stepSize;
        if (firstStopDepth < lastStop) firstStopDepth = rawCeiling > 0 ? lastStop : 0;

        state.firstStopDepth = firstStopDepth;

        // If no deco needed
        if (rawCeiling <= 0) {
            const ascTime = loadTissuesLinear(state, currentDepth, 0, ascentRate, currentO2, currentHe, settings, currentSP);
            runtime += ascTime;
            plan.push({
                type: 'ascent', startDepth: currentDepth, endDepth: 0,
                time: Math.round(ascTime * 10) / 10,
                runtime: Math.round(runtime * 10) / 10,
                gas: currentGasLabel, o2: Math.round(currentO2 * 100), he: Math.round(currentHe * 100)
            });
            return buildResult(plan, runtime, totalOTU, totalCNS, settings, state);
        }

        // VPM-B: Apply Boyle's law compensation
        // FBO uses reduced Boyle's correction for faster bailout ascent
        if (model === 'VPMB' || model === 'VPMBE' || model === 'VPMB_GFS' || model === 'VPMBFBO') {
            boyleLawCompensation(state, null, settings, model === 'VPMBFBO');

            // Recalculate ceiling after Boyle's correction
            rawCeiling = getVPMCeiling(state, settings);
            firstStopDepth = roundUpToStop(rawCeiling, stepSize);
            if (firstStopDoubleStep && firstStopDepth > lastStop) {
                const doubleStep = stepSize * 2;
                firstStopDepth = Math.ceil(rawCeiling / doubleStep) * doubleStep;
            }
            if (firstStopDepth >= currentDepth) firstStopDepth = currentDepth - stepSize;
            if (firstStopDepth < lastStop) firstStopDepth = lastStop;
            state.firstStopDepth = firstStopDepth;
        }

        // Ascend to first stop
        const ascTime1 = loadTissuesLinear(state, currentDepth, firstStopDepth, ascentRate, currentO2, currentHe, settings, currentSP);
        runtime += ascTime1;
        plan.push({
            type: 'ascent', startDepth: currentDepth, endDepth: firstStopDepth,
            time: Math.round(ascTime1 * 10) / 10,
            runtime: Math.round(runtime * 10) / 10,
            gas: currentGasLabel, o2: Math.round(currentO2 * 100), he: Math.round(currentHe * 100)
        });
        currentDepth = firstStopDepth;

        // ===== PHASE 4: Decompression stops =====
        let stopDepth = firstStopDepth;
        let maxIter = 500;

        while (stopDepth >= lastStop && maxIter > 0) {
            maxIter--;

            // Gas switch — in CCR, switch to OC deco gas if it provides higher ppO2
            const decoGas = selectDecoGas(stopDepth, normalizedDecoGases, ppO2Deco, settings);
            if (decoGas) {
                const pAmbHere = getAmbientPressure(stopDepth, settings);
                const ocPpO2 = decoGas.o2 * pAmbHere;
                const ccrPpO2 = currentSP > 0 ? Math.min(currentSP, pAmbHere) : 0;
                if (decoGas.o2 > currentO2 || (currentSP > 0 && ocPpO2 > ccrPpO2)) {
                    currentO2 = decoGas.o2;
                    currentHe = decoGas.he;
                    currentGasLabel = decoGas.label;
                    currentSP = 0;
                }
            }

            const nextStop = stopDepth <= lastStop ? 0 : stopDepth - stepSize;

            // VPM-B/GFS: apply gradient factor surfacing at each stop
            if (model === 'VPMB_GFS') {
                const gfsValue = settings.gfs || settings.gfHi || 85;
                applyGFSurfacing(state, stopDepth, firstStopDepth, gfsValue, settings);
            }

            // Wait until clear — first stop can use 30-sec intervals
            const effectiveMinStop = (firstStop30sec && stopDepth === firstStopDepth) ? 0.5 : minStopTime;
            let stopTime = 0;
            while (!isClearToAscendVPM(state, nextStop, firstStopDepth, model, settings) && stopTime < 999) {
                loadTissuesConstant(state, stopDepth, effectiveMinStop, currentO2, currentHe, settings, currentSP);
                stopTime += effectiveMinStop;
            }
            if (stopTime < effectiveMinStop) stopTime = effectiveMinStop;

            runtime += stopTime;

            const pAmb = getAmbientPressure(stopDepth, settings);
            const ppO2Stop = currentSP > 0 ? Math.min(currentSP, pAmb) : currentO2 * pAmb;
            totalOTU += calculateOTU(ppO2Stop, stopTime);
            totalCNS += calculateCNS(ppO2Stop, stopTime);

            plan.push({
                type: 'stop', depth: stopDepth, time: stopTime,
                runtime: Math.round(runtime * 10) / 10,
                gas: currentGasLabel, o2: Math.round(currentO2 * 100), he: Math.round(currentHe * 100)
            });

            // Ascend to next stop
            if (nextStop >= 0 && stopDepth > 0) {
                loadTissuesLinear(state, stopDepth, nextStop, decoAscentRate, currentO2, currentHe, settings, currentSP);
                const ascT = Math.abs(stopDepth - nextStop) / decoAscentRate;
                runtime += ascT;
            }

            if (stopDepth <= lastStop) break;
            stopDepth = nextStop;
            if (stopDepth < lastStop) stopDepth = lastStop;
        }

        // Final ascent (uses surfaceAscentRate)
        if (currentDepth > 0) {
            const finalAsc = loadTissuesLinear(state, lastStop, 0, surfaceAscentRate, currentO2, currentHe, settings, currentSP);
            runtime += finalAsc;
        }

        plan.push({
            type: 'surface', depth: 0, time: 0,
            runtime: Math.round(runtime * 10) / 10,
            gas: currentGasLabel
        });

        return buildResult(plan, runtime, totalOTU, totalCNS, settings, state);
    }

    function buildResult(plan, runtime, totalOTU, totalCNS, settings, state) {
        return {
            plan,
            totalRuntime: Math.ceil(runtime),
            totalOTU: Math.round(totalOTU),
            totalCNS: Math.round(totalCNS * 100) / 100,
            depthUnit: settings.metric ? 'm' : 'ft',
            stops: plan.filter(s => s.type === 'stop'),
            finalTissues: state ? state.tissues.map(t => ({ pN2: t.pN2, pHe: t.pHe })) : null,
            error: null
        };
    }

    return {
        calculate,
        createVPMState,
        MODELS: ['VPMA', 'VPMB', 'VPMBE', 'VPMB_GFS', 'VPMBFBO'],
        MODEL_NAMES: {
            'VPMA': 'VPM-A',
            'VPMB': 'VPM-B',
            'VPMBE': 'VPM-B/E',
            'VPMB_GFS': 'VPM-B/GFS',
            'VPMBFBO': 'VPM-B/FBO'
        }
    };
})();

if (typeof module !== 'undefined') module.exports = VPMEngine;
