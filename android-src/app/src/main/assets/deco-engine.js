/**
 * ApexDeco - Bühlmann ZH-L16C Decompression Engine with Gradient Factors
 * Implements ZH-L16C algorithm for dive decompression planning.
 */

const DecoEngine = (() => {

    // ZH-L16C Compartment parameters (N2)
    // Half-times in minutes, a and b coefficients
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

    // ZH-L16C Compartment parameters (He)
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

    const NUM_COMPARTMENTS = 16;
    const WATER_VAPOR_PRESSURE = 0.0577; // bar (tuned to match Android RT=240)

    // Sea level pressures (matching Android tools_calc)
    const SLP_SW_M = 10.078; // msw per atm (salt water)
    const SLP_FW_M = 10.337; // msw per atm (fresh water)
    const SLP_SW_F = 33.066; // fsw per atm (salt water)
    const SLP_FW_F = 33.914; // fsw per atm (fresh water)

    function createDefaultSettings() {
        return {
            // Circuit & Model
            circuit: 'OC',
            decoModel: 'ZHLC_GF',
            // Gradient Factors
            gfLo: 30,
            gfHi: 85,
            gfs: 85,
            conservatism: 0,
            // Gas & Depth
            oxyNarc: false,
            metric: true,
            waterType: 0, // 0=salt, 1=fresh
            altitude: 0,
            acclimatized: 0,
            gasVolUnit: 'ltr',
            pressureUnit: 'bar',
            temperature: 20,
            gaugeType: 1, // 1=digital
            // Rates & Stops
            descentRate: 22,
            ascentRate: 9,
            decoAscentRate: 9,
            surfaceAscentRate: 9,
            stepSize: 3,
            lastStop: 3,
            lastStopCCR: 3,
            minStopTime: 1,
            // ppO2 limits
            ppO2Deco: 1.6,
            ppO2Low: 1.4,
            ppO2Mid: 1.5,
            ppO2High: 1.6,
            ppO2Bottom: 1.4,
            o2MaxDepth: 6,
            // First stop options
            firstStop30sec: false,
            firstStopDoubleStep: false,
            // CCR
            ccrDefaultSP: 1.3,
            spUnits: 'bar',
            // RMV
            rmvBottom: 22,
            rmvDeco: 20,
            // Extended stops
            extendedStops: false,
            extStopDeep: 1,
            extStopShallow: 2,
            extendAdd: false,
            extendAllMix: false,
            extendO2Window: false,
            // Warnings
            warnPpO2Hi: true,
            ppO2HighThreshold: 1.6,
            warnPpO2Lo: true,
            ppO2LowThreshold: 0.16,
            warnCNS: true,
            cnsHigh: 80,
            warnOTU: true,
            otuHigh: 300,
            warnIBCDN2: true,
            ibcdN2Threshold: 0.5,
            warnIBCDHe: true,
            ibcdHeThreshold: 0.5,
            ccrDilCheck: true,
            // Bailout
            bailoutActive: false,
            bailModel: 'ZHLC_GF',
            bailGFLo: 30,
            bailGFHi: 85,
            bailGFS: 85,
            bailRMV: 30,
            bailExtraMin: false,
            bailExtraMinTime: 1,
            bailDiveNum: 1,
            bailCaveBail: false,
            bailCavePortion: 33,
            // Repetitive dive
            surfaceInterval: 0,
            twoWeekOTU: 0,
            // Travel gas
            travelO2: 21,
            travelHe: 0,
        };
    }

    /**
     * For CCR: compute effective gas fractions at a given depth for a diluent mix.
     * The rebreather maintains a constant ppO2 (setpoint), so effective O2 fraction
     * varies with depth. N2 and He are redistributed proportionally.
     * Matches smali: effectiveO2 = min(1, setpoint/pAmb),
     *   delta = effectiveO2 - origO2, adj = delta*N2/(He+N2),
     *   newN2 = N2 - adj, newHe = (1 - effectiveO2) - newN2
     */
    function getCCRFractions(o2Frac, heFrac, setpoint, pAmb) {
        const effO2 = Math.min(1.0, setpoint / pAmb);
        const n2Frac = 1.0 - o2Frac - heFrac;
        const inertSum = heFrac + n2Frac;
        let effN2, effHe;
        if (inertSum > 0 && o2Frac < 1.0) {
            effN2 = n2Frac * (1.0 - effO2) / (1.0 - o2Frac);
            effHe = (1.0 - effO2) - effN2;
        } else {
            effN2 = 0;
            effHe = 0;
        }
        return { o2: effO2, n2: effN2, he: Math.max(0, effHe) };
    }

    function getDepthPressure(depth, settings) {
        let slp;
        if (settings.metric) {
            slp = settings.waterType === 0 ? SLP_SW_M : SLP_FW_M;
        } else {
            slp = settings.waterType === 0 ? SLP_SW_F : SLP_FW_F;
        }
        return depth / slp;
    }

    function getSurfacePressure(settings) {
        // Atmospheric pressure at altitude (1.01325 bar at sea level)
        const alt = settings.altitude || 0;
        return 1.01325 * Math.exp(-alt / 8434);
    }

    function getAmbientPressure(depth, settings) {
        return getSurfacePressure(settings) + getDepthPressure(depth, settings);
    }

    function gasN2Fraction(o2Frac, heFrac) {
        return 1.0 - o2Frac - heFrac;
    }

    function createTissueState(settings) {
        const pAmb = getSurfacePressure(settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        const inspiredN2 = 0.7902 * (pAmb - ppH2O);
        const inspiredHe = 0.0;
        const tissues = [];
        for (let i = 0; i < NUM_COMPARTMENTS; i++) {
            tissues.push({
                pN2: inspiredN2,
                pHe: inspiredHe
            });
        }
        // Multi-dive: load tissues from previous dive and apply surface interval
        if (settings._preTissues && settings._preTissues.length === NUM_COMPARTMENTS) {
            for (let i = 0; i < NUM_COMPARTMENTS; i++) {
                tissues[i].pN2 = settings._preTissues[i].pN2;
                tissues[i].pHe = settings._preTissues[i].pHe;
            }
            if (settings._surfaceInterval > 0) {
                applySurfaceInterval(tissues, settings._surfaceInterval, settings);
            }
        }
        return tissues;
    }

    function haldaneEquation(pStart, pInspired, halfTime, time) {
        const k = Math.LN2 / halfTime;
        return pStart + (pInspired - pStart) * (1 - Math.exp(-k * time));
    }

    function loadTissuesConstantDepth(tissues, depth, time, o2Frac, heFrac, settings, setpoint) {
        const pAmb = getAmbientPressure(depth, settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        let n2Frac, heFracEff;
        if (setpoint && setpoint > 0) {
            const ccr = getCCRFractions(o2Frac, heFrac, setpoint, pAmb);
            n2Frac = ccr.n2;
            heFracEff = ccr.he;
        } else {
            n2Frac = gasN2Fraction(o2Frac, heFrac);
            heFracEff = heFrac;
        }
        const inspN2 = n2Frac * (pAmb - ppH2O);
        const inspHe = heFracEff * (pAmb - ppH2O);

        for (let i = 0; i < NUM_COMPARTMENTS; i++) {
            tissues[i].pN2 = haldaneEquation(tissues[i].pN2, inspN2, ZHL16C_N2[i].ht, time);
            tissues[i].pHe = haldaneEquation(tissues[i].pHe, inspHe, ZHL16C_He[i].ht, time);
        }
    }

    function loadTissuesLinearDepthChange(tissues, startDepth, endDepth, rate, o2Frac, heFrac, settings, setpoint) {
        const time = Math.abs(endDepth - startDepth) / rate;
        if (time <= 0) return 0;

        const ppH2O = WATER_VAPOR_PRESSURE;
        const surfP = getSurfacePressure(settings);
        // Android-reference: tissue loading within a segment uses salt SLP regardless of waterType
        let slp;
        if (settings.metric) {
            slp = SLP_SW_M;
        } else {
            slp = SLP_SW_F;
        }

        if (setpoint && setpoint > 0) {
            // CCR: gas fractions change with depth, so subdivide into small steps
            const steps = Math.max(1, Math.ceil(time));
            const dt = time / steps;
            for (let s = 0; s < steps; s++) {
                const t0 = s / steps;
                const t1 = (s + 1) / steps;
                const d0 = startDepth + (endDepth - startDepth) * t0;
                const d1 = startDepth + (endDepth - startDepth) * t1;
                const midDepth = (d0 + d1) / 2;
                const pAmbMid = surfP + midDepth / slp;
                const ccr = getCCRFractions(o2Frac, heFrac, setpoint, pAmbMid);
                const n2Frac = ccr.n2;
                const heFracEff = ccr.he;

                const depthRate = (d1 - d0) / dt;
                const pressureRate = depthRate / slp;
                const pAmbStart = surfP + d0 / slp;
                const inspN2Start = n2Frac * (pAmbStart - ppH2O);
                const inspHeStart = heFracEff * (pAmbStart - ppH2O);
                const rN2 = n2Frac * pressureRate;
                const rHe = heFracEff * pressureRate;

                for (let i = 0; i < NUM_COMPARTMENTS; i++) {
                    const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                    const kHe = Math.LN2 / ZHL16C_He[i].ht;
                    tissues[i].pN2 = inspN2Start + rN2 * (dt - 1/kN2)
                        - (inspN2Start - tissues[i].pN2 - rN2/kN2) * Math.exp(-kN2 * dt);
                    tissues[i].pHe = inspHeStart + rHe * (dt - 1/kHe)
                        - (inspHeStart - tissues[i].pHe - rHe/kHe) * Math.exp(-kHe * dt);
                }
            }
        } else {
            // OC: standard Schreiner equation
            const n2Frac = gasN2Fraction(o2Frac, heFrac);
            const depthRate = (endDepth - startDepth) / time;
            const pressureRate = depthRate / slp;
            const pAmbStart = surfP + startDepth / slp;
            const inspN2Start = n2Frac * (pAmbStart - ppH2O);
            const inspHeStart = heFrac * (pAmbStart - ppH2O);
            const rN2 = n2Frac * pressureRate;
            const rHe = heFrac * pressureRate;

            for (let i = 0; i < NUM_COMPARTMENTS; i++) {
                const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                const kHe = Math.LN2 / ZHL16C_He[i].ht;
                tissues[i].pN2 = inspN2Start + rN2 * (time - 1/kN2)
                    - (inspN2Start - tissues[i].pN2 - rN2/kN2) * Math.exp(-kN2 * time);
                tissues[i].pHe = inspHeStart + rHe * (time - 1/kHe)
                    - (inspHeStart - tissues[i].pHe - rHe/kHe) * Math.exp(-kHe * time);
            }
        }
        return time;
    }

    function getCeiling(tissues, settings, gfLo, gfHi, maxDepth) {
        const surfP = getSurfacePressure(settings);
        // Android-reference: ceiling is computed with salt SLP regardless of waterType
        let slp;
        if (settings.metric) {
            slp = SLP_SW_M;
        } else {
            slp = SLP_SW_F;
        }

        let minPAmb = 0;
        for (let i = 0; i < NUM_COMPARTMENTS; i++) {
            const pTotal = tissues[i].pN2 + tissues[i].pHe;

            // Weighted a, b coefficients for combined N2+He loading
            let a, b;
            if (pTotal > 0) {
                a = (tissues[i].pN2 * ZHL16C_N2[i].a + tissues[i].pHe * ZHL16C_He[i].a) / pTotal;
                b = (tissues[i].pN2 * ZHL16C_N2[i].b + tissues[i].pHe * ZHL16C_He[i].b) / pTotal;
            } else {
                a = ZHL16C_N2[i].a;
                b = ZHL16C_N2[i].b;
            }

            // M-value at surface (or any ambient pressure)
            // M = a + Pamb / b
            // With GF: Pamb_tol = (pTotal - a * gf) / (gf / b - gf + 1)
            // Ceiling Pamb = pTotal - a * gf) / (gf/b - gf + 1)

            // We need to compute the GF at this depth
            // GF varies linearly from gfLo at the first stop to gfHi at the surface
            // For ceiling calculation, we use gfLo as the controlling factor at depth

            const gf = gfLo / 100;
            const pAmbTol = (pTotal - a * gf) / (gf / b - gf + 1);

            if (pAmbTol > minPAmb) {
                minPAmb = pAmbTol;
            }
        }

        const ceilingDepth = (minPAmb - surfP) * slp;
        return Math.max(0, ceilingDepth);
    }

    function getGFAtDepth(stopDepth, firstStopDepth, settings) {
        const gfLo = settings.gfLo / 100;
        const gfHi = settings.gfHi / 100;
        if (firstStopDepth <= 0) return gfHi;
        const surfaceDepth = 0;
        // Linear interpolation from firstStop (gfLo) to surface (gfHi)
        const gf = gfHi + (gfLo - gfHi) * (stopDepth / firstStopDepth);
        return Math.max(gfLo, Math.min(gfHi, gf));
    }

    function isClearToAscend(tissues, targetDepth, firstStopDepth, settings) {
        const pAmb = getAmbientPressure(targetDepth, settings);
        const gf = getGFAtDepth(targetDepth, firstStopDepth, settings);

        for (let i = 0; i < NUM_COMPARTMENTS; i++) {
            const pTotal = tissues[i].pN2 + tissues[i].pHe;
            let a, b;
            if (pTotal > 0) {
                a = (tissues[i].pN2 * ZHL16C_N2[i].a + tissues[i].pHe * ZHL16C_He[i].a) / pTotal;
                b = (tissues[i].pN2 * ZHL16C_N2[i].b + tissues[i].pHe * ZHL16C_He[i].b) / pTotal;
            } else {
                a = ZHL16C_N2[i].a;
                b = ZHL16C_N2[i].b;
            }
            const mValue = a + pAmb / b;
            const mValueGF = pAmb + gf * (mValue - pAmb);
            if (pTotal > mValueGF) return false;
        }
        return true;
    }

    function roundUpToStop(depth, stepSize) {
        return Math.ceil(depth / stepSize) * stepSize;
    }

    function getGasPpO2Limit(gas, settings) {
        // Multiple ppO2 thresholds based on O2 percentage in the mix
        const o2pct = gas.o2 * 100;
        if (settings.ppO2Low && settings.ppO2Mid && settings.ppO2High) {
            if (o2pct <= 28) return settings.ppO2Low;
            if (o2pct <= 45) return settings.ppO2Mid;
            if (o2pct < 100) return settings.ppO2High;
        }
        return settings.ppO2Deco || 1.6;
    }

    function selectDecoGas(depth, decoGases, ppO2Limit, settings) {
        // Find the richest O2 deco gas usable at this depth
        let bestGas = null;
        let bestO2 = 0;
        const o2MaxDepth = settings.o2MaxDepth || 6;
        for (const gas of decoGases) {
            const pAmb = getAmbientPressure(depth, settings);
            const ppO2 = gas.o2 * pAmb;
            // Use per-mix ppO2 limit if available
            const limit = getGasPpO2Limit(gas, settings);
            // O2 100%: use o2MaxDepth as the sole depth gate
            if (gas.o2 >= 0.995) {
                if (depth <= o2MaxDepth && gas.o2 > bestO2) {
                    bestO2 = gas.o2;
                    bestGas = gas;
                }
                continue;
            }
            if (ppO2 <= limit && gas.o2 > bestO2) {
                bestO2 = gas.o2;
                bestGas = gas;
            }
        }
        return bestGas;
    }

    /**
     * Calculate a full decompression plan.
     * @param {Array} levels - [{depth, time, o2, he}] bottom segments (o2/he as 0-100 percentages)
     * @param {Array} decoGases - [{o2, he}] deco gases (o2/he as 0-100 percentages)
     * @param {Object} settings - dive settings
     * @returns {Object} plan with stops, runtime, gas usage info
     */
    function calculate(levels, decoGases, settings) {
        if (!levels || levels.length === 0) {
            return { error: 'No bottom segments defined', stops: [], totalTime: 0 };
        }

        // stepSize/lastStop stored in metric (3 or 6); convert to feet if imperial
        const stepSizeRaw = settings.stepSize || 3;
        const lastStopRaw = settings.lastStop || 3;
        const stepSize = settings.metric ? stepSizeRaw : Math.round(stepSizeRaw * 3.28084);
        const lastStop = settings.metric ? lastStopRaw : Math.round(lastStopRaw * 3.28084);
        const descentRate = settings.descentRate || (settings.metric ? 20 : 60);
        const ascentRate = settings.ascentRate || (settings.metric ? 10 : 30);
        const decoAscentRate = settings.decoAscentRate || (settings.metric ? 3 : 10);
        const surfaceAscentRate = settings.surfaceAscentRate || decoAscentRate;
        const ppO2Deco = settings.ppO2Deco || 1.6;
        const minStopTime = settings.minStopTime || 1;
        const firstStop30sec = settings.firstStop30sec || false;
        const firstStopDoubleStep = settings.firstStopDoubleStep || false;

        const tissues = createTissueState(settings);
        const plan = [];
        // Wrap push to attach a tissue snapshot to each segment (state at end of segment).
        const _origPush = plan.push;
        plan.push = function(seg) {
            try {
                seg._tissues = tissues.map(t => ({ pN2: t.pN2, pHe: t.pHe }));
                seg._cumOTU = totalOTU;
                seg._cumCNS = totalCNS;
            } catch (e) { /* ignore */ }
            return _origPush.call(this, seg);
        };
        let runtime = 0;
        let currentDepth = 0;
        let totalOTU = 0;
        let totalCNS = 0;

        // Normalize gas fractions
        const normalizedDecoGases = decoGases.map(g => ({
            o2: g.o2 / 100,
            he: g.he / 100,
            label: `${g.o2}/${g.he}`
        }));

        // CCR mode
        const isCCR = settings.circuit === 'CCR';

        // --- State object passed through deco ascent phases ---
        let currentO2 = 0, currentHe = 0, currentGasLabel = '', currentSP = 0;

        // Helper: perform deco ascent from fromDepth down to toDepth (toDepth < fromDepth).
        // toDepth=0 means ascend to surface. Mutates tissues, plan, runtime, OTU/CNS counters.
        // Returns the depth after ascent (toDepth or last stop depth if toDepth=0).
        function performDecoAscent(fromDepth, toDepth) {
            const rawCeiling = getCeiling(tissues, settings, settings.gfLo, settings.gfHi, fromDepth);
            let firstStopDepth = roundUpToStop(rawCeiling, stepSize);
            if (firstStopDoubleStep && firstStopDepth > lastStop) {
                const doubleStep = stepSize * 2;
                firstStopDepth = Math.ceil(rawCeiling / doubleStep) * doubleStep;
            }
            if (firstStopDepth >= fromDepth) firstStopDepth = fromDepth - stepSize;

            // Determine the shallowest stop we'll do in this ascent phase
            const effectiveLastStop = (toDepth > 0) ? Math.max(toDepth, lastStop) : lastStop;
            if (firstStopDepth < effectiveLastStop) firstStopDepth = effectiveLastStop;

            // No deco needed — free ascent to toDepth
            if (rawCeiling <= 0 || firstStopDepth < effectiveLastStop) {
                const ascTime = loadTissuesLinearDepthChange(
                    tissues, fromDepth, toDepth, ascentRate, currentO2, currentHe, settings, currentSP
                );
                runtime += ascTime;
                totalOTU += calculateOTUDepthChange(fromDepth, toDepth, ascentRate, currentO2, settings);
                totalCNS += calculateCNSDepthChange(fromDepth, toDepth, ascentRate, currentO2, settings);
                plan.push({
                    type: 'ascent',
                    startDepth: fromDepth,
                    endDepth: toDepth,
                    time: Math.round(ascTime * 10) / 10,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: currentGasLabel,
                    o2: Math.round(currentO2 * 100),
                    he: Math.round(currentHe * 100)
                });
                return toDepth;
            }

            // Ascend to first stop
            const ascTime1 = loadTissuesLinearDepthChange(
                tissues, fromDepth, firstStopDepth, ascentRate, currentO2, currentHe, settings, currentSP
            );
            runtime += ascTime1;
            totalOTU += calculateOTUDepthChange(fromDepth, firstStopDepth, ascentRate, currentO2, settings);
            totalCNS += calculateCNSDepthChange(fromDepth, firstStopDepth, ascentRate, currentO2, settings);
            plan.push({
                type: 'ascent',
                startDepth: fromDepth,
                endDepth: firstStopDepth,
                time: Math.round(ascTime1 * 10) / 10,
                runtime: Math.round(runtime * 10) / 10,
                gas: currentGasLabel,
                o2: Math.round(currentO2 * 100),
                he: Math.round(currentHe * 100)
            });

            // Decompression stops
            let stopDepth = firstStopDepth;
            let maxIter = 500;
            let isFirstDecoStop = true;
            // Extended Stops — track previous gas for mix-change detection
            let prevStopGas = currentGasLabel;

            while (stopDepth >= effectiveLastStop && maxIter > 0) {
                maxIter--;

                const nextStop = (stopDepth <= effectiveLastStop) ? (toDepth > 0 ? toDepth : 0) : stopDepth - stepSize;

                // Transit from previous stop
                let transitTime = 0;
                if (!isFirstDecoStop) {
                    const prevStop = stopDepth + stepSize;
                    transitTime = stepSize / decoAscentRate;
                    loadTissuesLinearDepthChange(
                        tissues, prevStop, stopDepth, decoAscentRate, currentO2, currentHe, settings, currentSP
                    );
                    runtime += transitTime;
                    totalOTU += calculateOTUDepthChange(prevStop, stopDepth, decoAscentRate, currentO2, settings);
                    totalCNS += calculateCNSDepthChange(prevStop, stopDepth, decoAscentRate, currentO2, settings);
                }

                // Gas switch at this depth
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

                // Wait at this stop until clear
                const isFirstStop = (stopDepth === firstStopDepth);
                const increment = isFirstStop ? (1 / 60) : minStopTime;
                let rawStopTime = 0;
                while (!isClearToAscend(tissues, nextStop, firstStopDepth, settings) && rawStopTime < 999) {
                    loadTissuesConstantDepth(tissues, stopDepth, increment, currentO2, currentHe, settings, currentSP);
                    rawStopTime += increment;
                }

                let actualStopTime;
                // Rounding granularity: use minStopTime as grid size (min 1 sec)
                const grid = Math.max(minStopTime, 1 / 60);
                if (isFirstStop) {
                    const rtAfterAscent = runtime;
                    // Round runtime up to next grid multiple (e.g. to next whole minute if grid=1)
                    const ceilGrid = Math.ceil(rtAfterAscent / grid) * grid;
                    const minFirstStop = ceilGrid - rtAfterAscent;
                    const rawRounded = Math.round(rawStopTime * 60) / 60;
                    actualStopTime = Math.max(rawRounded, Math.round(minFirstStop * 60) / 60);
                    if (actualStopTime < 1 / 60) actualStopTime = 1 / 60;
                    const extraFirst = actualStopTime - rawStopTime;
                    if (extraFirst > 0.001) {
                        loadTissuesConstantDepth(tissues, stopDepth, extraFirst, currentO2, currentHe, settings, currentSP);
                    }
                } else {
                    // Round the stop time itself up to the next grid multiple,
                    // matching Android MultiDeco — transit between stops is NOT
                    // folded into the grid (otherwise every stop ends at :40
                    // when transit = 20s, accumulating extra deco vs Android).
                    actualStopTime = Math.max(grid, Math.ceil(rawStopTime / grid) * grid);
                    const extraTime = actualStopTime - rawStopTime;
                    if (extraTime > 0.001) {
                        loadTissuesConstantDepth(tissues, stopDepth, extraTime, currentO2, currentHe, settings, currentSP);
                    }
                }

                // ===== EXTENDED STOPS — actually load tissues for the extra time =====
                // (mini-level effect: subsequent stops adapt to the new tissue state)
                if (settings.extendedStops) {
                    const deepMin = settings.extStopDeep || 0;
                    const shallowMin = settings.extStopShallow || 0;
                    const boundary = settings.metric ? 30 : 100;
                    const isMixChange = currentGasLabel !== prevStopGas;
                    let apply = settings.extendAllMix || isMixChange;
                    if (apply && settings.extendO2Window && !settings.extendAllMix) {
                        const curO2pct = Math.round(currentO2 * 100);
                        const prevO2pct = parseInt((prevStopGas || '0/0').split('/')[0]) || 0;
                        if (curO2pct <= prevO2pct) apply = false;
                    }
                    if (apply) {
                        const extTime = stopDepth > boundary ? deepMin : shallowMin;
                        if (extTime > 0) {
                            const addExtra = settings.extendAdd
                                ? extTime
                                : Math.max(0, extTime - actualStopTime);
                            if (addExtra > 0) {
                                loadTissuesConstantDepth(tissues, stopDepth, addExtra, currentO2, currentHe, settings, currentSP);
                                actualStopTime += addExtra;
                            }
                        }
                    }
                }

                runtime += actualStopTime;

                const pAmb = getAmbientPressure(stopDepth, settings);
                const ppO2 = currentSP > 0 ? Math.min(currentSP, pAmb) : currentO2 * pAmb;
                totalOTU += calculateOTU(ppO2, actualStopTime);
                totalCNS += calculateCNS(ppO2, actualStopTime);

                plan.push({
                    type: 'stop',
                    depth: stopDepth,
                    time: actualStopTime,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: currentGasLabel,
                    o2: Math.round(currentO2 * 100),
                    he: Math.round(currentHe * 100)
                });

                prevStopGas = currentGasLabel;
                isFirstDecoStop = false;

                if (stopDepth <= effectiveLastStop) break;
                stopDepth = nextStop;
                if (stopDepth < effectiveLastStop) stopDepth = effectiveLastStop;
            }

            // If ascending to surface, final ascent from lastStop to 0
            if (toDepth === 0 && lastStop > 0) {
                loadTissuesLinearDepthChange(
                    tissues, lastStop, 0, surfaceAscentRate, currentO2, currentHe, settings, currentSP
                );
                totalOTU += calculateOTUDepthChange(lastStop, 0, surfaceAscentRate, currentO2, settings);
                totalCNS += calculateCNSDepthChange(lastStop, 0, surfaceAscentRate, currentO2, settings);
            }

            return toDepth;
        }

        // --- Compute decozone start (uses tissue state after last level) ---
        // Deferred until after all levels are processed.

        // Process each bottom level
        for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
            const level = levels[levelIdx];
            const depth = level.depth;
            const time = level.time;
            const o2Frac = level.o2 / 100;
            const heFrac = level.he / 100;
            // OC/SCR leg in CCR mode: treat as open-circuit (setpoint=0)
            const sp = (isCCR && !level.oc && !level.scr) ? (level.setpoint || 1.3) : 0;

            // Set current gas for this level
            currentO2 = o2Frac;
            currentHe = heFrac;
            currentGasLabel = `${level.o2}/${level.he}`;
            currentSP = sp;

            // Descent or ascent to this level's depth
            if (depth > currentDepth) {
                // Descending to deeper level
                const descTime = loadTissuesLinearDepthChange(
                    tissues, currentDepth, depth, descentRate, o2Frac, heFrac, settings, sp
                );
                runtime += descTime;
                totalOTU += calculateOTUDepthChange(currentDepth, depth, descentRate, o2Frac, settings);
                totalCNS += calculateCNSDepthChange(currentDepth, depth, descentRate, o2Frac, settings);
                plan.push({
                    type: 'descent',
                    startDepth: currentDepth,
                    endDepth: depth,
                    time: Math.round(descTime * 10) / 10,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: currentGasLabel,
                    o2: level.o2,
                    he: level.he
                });
            } else if (depth < currentDepth) {
                // Ascending to shallower level — perform deco ascent with stops if needed
                currentDepth = performDecoAscent(currentDepth, depth);
                // After deco ascent, reset gas to this level's gas
                currentO2 = o2Frac;
                currentHe = heFrac;
                currentGasLabel = `${level.o2}/${level.he}`;
                currentSP = sp;
            }

            // Bottom time: level.time includes descent transit, subtract it.
            // For descent: currentDepth is still the old (shallower) depth, so transit is computed.
            // For ascent with deco: performDecoAscent already set currentDepth = depth, so transit = 0
            //   and the full level time is spent at the target depth.
            const descTimeFromLevel = (depth > currentDepth)
                ? (depth - currentDepth) / descentRate
                : 0;
            const bottomTime = Math.max(0, time - descTimeFromLevel);
            const bottomTimeDisplay = Math.floor(bottomTime);

            if (bottomTime > 0) {
                loadTissuesConstantDepth(tissues, depth, bottomTime, o2Frac, heFrac, settings, sp);
                runtime += bottomTime;
                // OTU/CNS for constant depth bottom phase
                const pAmb = getAmbientPressure(depth, settings);
                const ppO2Bottom = sp > 0 ? Math.min(sp, pAmb) : o2Frac * pAmb;
                totalOTU += calculateOTU(ppO2Bottom, bottomTime);
                totalCNS += calculateCNS(ppO2Bottom, bottomTime);
                plan.push({
                    type: 'bottom',
                    depth: depth,
                    time: bottomTimeDisplay,
                    runtime: Math.round(runtime * 10) / 10,
                    gas: currentGasLabel,
                    o2: level.o2,
                    he: level.he
                });
            }

            currentDepth = depth;
        }

        // After all levels, prepare for final deco ascent to surface
        const maxDepth = Math.max(...levels.map(l => l.depth));
        const lastLevel = levels[levels.length - 1];
        currentO2 = lastLevel.o2 / 100;
        currentHe = lastLevel.he / 100;
        currentGasLabel = `${lastLevel.o2}/${lastLevel.he}`;
        const lastSP = (isCCR && !lastLevel.oc && !lastLevel.scr) ? (lastLevel.setpoint || 1.3) : 0;
        currentSP = lastSP;

        // Compute decozone start: depth during ascent where tissue tension first exceeds pAmb
        let decoZoneStart = 0;
        {
            const surfP = getSurfacePressure(settings);
            // Android-reference: decoZoneStart is computed with salt SLP regardless of waterType
            let slpLocal;
            if (settings.metric) {
                slpLocal = SLP_SW_M;
            } else {
                slpLocal = SLP_SW_F;
            }
            const ppH2O = WATER_VAPOR_PRESSURE;
            const o2f = currentO2, hef = currentHe;
            let n2f, hefEff;
            if (currentSP > 0) {
                const pAmbMax = surfP + currentDepth / slpLocal;
                const ccr = getCCRFractions(o2f, hef, currentSP, pAmbMax);
                n2f = ccr.n2; hefEff = ccr.he;
            } else {
                n2f = gasN2Fraction(o2f, hef); hefEff = hef;
            }
            const savedTissues = tissues.map(t => ({pN2: t.pN2, pHe: t.pHe}));
            const pAmbStart = surfP + currentDepth / slpLocal;
            const inspN2Start = n2f * (pAmbStart - ppH2O);
            const inspHeStart = hefEff * (pAmbStart - ppH2O);
            const pressureRate = -ascentRate / slpLocal;
            const rN2 = n2f * pressureRate;
            const rHe = hefEff * pressureRate;
            for (let d = currentDepth; d >= 0; d -= 0.5) {
                const t = (currentDepth - d) / ascentRate;
                const pAmb = surfP + d / slpLocal;
                for (let i = 0; i < NUM_COMPARTMENTS; i++) {
                    const kN2 = Math.LN2 / ZHL16C_N2[i].ht;
                    const kHe = Math.LN2 / ZHL16C_He[i].ht;
                    const pN2 = inspN2Start + rN2 * (t - 1/kN2)
                        - (inspN2Start - savedTissues[i].pN2 - rN2/kN2) * Math.exp(-kN2 * t);
                    const pHe = inspHeStart + rHe * (t - 1/kHe)
                        - (inspHeStart - savedTissues[i].pHe - rHe/kHe) * Math.exp(-kHe * t);
                    if (pN2 + pHe > pAmb) {
                        decoZoneStart = Math.ceil(d / stepSize) * stepSize;
                        break;
                    }
                }
                if (decoZoneStart > 0) break;
            }
        }

        // Final deco ascent to surface
        performDecoAscent(currentDepth, 0);

        plan.push({
            type: 'surface',
            depth: 0,
            time: 0,
            runtime: Math.round(runtime * 10) / 10,
            gas: currentGasLabel
        });

        return buildResult(plan, runtime, totalOTU, totalCNS, settings, decoZoneStart, tissues);
    }

    function buildResult(plan, runtime, totalOTU, totalCNS, settings, decoZoneStart, tissues) {
        const depthUnit = settings.metric ? 'm' : 'ft';
        return {
            plan: plan,
            totalRuntime: Math.round(runtime),
            totalOTU: Math.round(totalOTU),
            totalCNS: Math.round(totalCNS * 100) / 100,
            depthUnit: depthUnit,
            stops: plan.filter(s => s.type === 'stop'),
            decoZoneStart: decoZoneStart || 0,
            finalTissues: tissues ? tissues.map(t => ({ pN2: t.pN2, pHe: t.pHe })) : null,
            error: null
        };
    }

    // OTU calculation: OTU = t * ((ppO2 - 0.5) / 0.5)^0.83
    function calculateOTU(ppO2, time) {
        if (ppO2 <= 0.5) return 0;
        return time * Math.pow((ppO2 - 0.5) / 0.5, 0.8333);
    }

    // OTU for depth change: numerical integration (1-sec steps)
    function calculateOTUDepthChange(startDepth, endDepth, rate, o2Frac, settings) {
        const totalTime = Math.abs(endDepth - startDepth) / rate;
        if (totalTime <= 0) return 0;
        const dt = 1 / 60; // 1 second
        let otu = 0;
        for (let t = 0; t < totalTime; t += dt) {
            const d = startDepth + (endDepth - startDepth) * (t / totalTime);
            const pAmb = getAmbientPressure(d, settings);
            const ppO2 = o2Frac * pAmb;
            if (ppO2 > 0.5) otu += dt * Math.pow((ppO2 - 0.5) / 0.5, 0.8333);
        }
        return otu;
    }

    // CNS rate table extracted verbatim from libmultideco.so (vaddr 0x15f80,
    // 131 consecutive doubles). Indexed by Math.round(ppO2 * 100), valid 50..180.
    // Units: % of CNS clock per minute. Rates above ppO2 > 1.80 clamp to 50%/min,
    // above 2.00 to 100%/min (catastrophic regime — matches Android behaviour).
    // Each entry in this table corresponds to an integer ppO2*100 index from 50..180.
    const CNS_RATE_ANDROID = [
        0.120, 0.122, 0.125, 0.127, 0.129, 0.130, 0.132, 0.134, 0.135, 0.138, //  50..59
        0.140, 0.140, 0.140, 0.145, 0.150, 0.155, 0.160, 0.165, 0.170, 0.175, //  60..69
        0.180, 0.180, 0.180, 0.185, 0.185, 0.190, 0.200, 0.200, 0.210, 0.210, //  70..79
        0.220, 0.225, 0.230, 0.235, 0.240, 0.245, 0.250, 0.255, 0.260, 0.270, //  80..89
        0.280, 0.290, 0.290, 0.300, 0.300, 0.305, 0.310, 0.315, 0.320, 0.325, //  90..99
        0.330, 0.340, 0.350, 0.355, 0.360, 0.370, 0.380, 0.385, 0.400, 0.410, // 100..109
        0.420, 0.430, 0.435, 0.4375, 0.439, 0.440, 0.445, 0.455, 0.460, 0.465, // 110..119
        0.470, 0.475, 0.480, 0.495, 0.510, 0.515, 0.520, 0.530, 0.540, 0.550, // 120..129
        0.560, 0.565, 0.570, 0.590, 0.600, 0.610, 0.620, 0.630, 0.640, 0.645, // 130..139
        0.650, 0.660, 0.680, 0.695, 0.710, 0.720, 0.740, 0.770, 0.780, 0.800, // 140..149
        0.830, 0.880, 0.930, 0.980, 1.040, 1.110, 1.190, 1.320, 1.470, 1.800, // 150..159
        2.220, 2.500, 3.000, 3.500, 4.000, 4.500, 5.000, 6.000, 8.000, 9.000, // 160..169
        10.000, 11.000, 12.500, 15.000, 20.000, 21.000, 22.000, 25.000, 31.250, 40.000, // 170..179
        50.000                                                                 // 180
    ];

    // Return CNS %/min rate for a given ppO2 using the Android table.
    // Below ppO2 < 0.50 — no oxygen toxicity accumulation.
    function getCNSRate(ppO2) {
        if (ppO2 < 0.50) return 0;
        if (ppO2 > 2.00) return 100.0;   // catastrophic
        if (ppO2 > 1.80) return 50.0;    // very harsh regime
        const idx = Math.max(50, Math.min(180, Math.round(ppO2 * 100))) - 50;
        return CNS_RATE_ANDROID[idx];
    }

    // Legacy getCNSLimit kept for backward compat — converts rate to NOAA-style limit.
    function getCNSLimit(ppO2) {
        if (ppO2 < 0.50) return Infinity;
        const rate = getCNSRate(ppO2);
        if (rate <= 0) return Infinity;
        return 100.0 / rate;
    }

    function calculateCNS(ppO2, time) {
        if (ppO2 < 0.50) return 0;
        return time * getCNSRate(ppO2);
    }

    // CNS for depth change: numerical integration (1-sec steps)
    function calculateCNSDepthChange(startDepth, endDepth, rate, o2Frac, settings) {
        const totalTime = Math.abs(endDepth - startDepth) / rate;
        if (totalTime <= 0) return 0;
        const dt = 1 / 60;
        let cns = 0;
        for (let t = 0; t < totalTime; t += dt) {
            const d = startDepth + (endDepth - startDepth) * (t / totalTime);
            const pAmb = getAmbientPressure(d, settings);
            const ppO2 = o2Frac * pAmb;
            if (ppO2 > 0.5) {
                const limit = getCNSLimit(ppO2);
                if (isFinite(limit)) cns += (dt / limit) * 100;
            }
        }
        return cns;
    }

    // Surface interval: off-gas tissues toward surface N2
    function applySurfaceInterval(tissues, intervalMinutes, settings) {
        const pAmb = getSurfacePressure(settings);
        const ppH2O = WATER_VAPOR_PRESSURE;
        const inspN2 = 0.7902 * (pAmb - ppH2O);
        for (let i = 0; i < NUM_COMPARTMENTS; i++) {
            tissues[i].pN2 = haldaneEquation(tissues[i].pN2, inspN2, ZHL16C_N2[i].ht, intervalMinutes);
            tissues[i].pHe = haldaneEquation(tissues[i].pHe, 0, ZHL16C_He[i].ht, intervalMinutes);
        }
    }

    return {
        calculate,
        createDefaultSettings,
        createTissueState,
        applySurfaceInterval,
        getAmbientPressure,
        getDepthPressure,
        getSurfacePressure,
        getCeiling,
        calculateOTU,
        calculateCNS,
        getCCRFractions,
        ZHL16C_N2,
        ZHL16C_He,
        NUM_COMPARTMENTS,
        SLP_SW_M,
        SLP_FW_M,
        SLP_SW_F,
        SLP_FW_F
    };
})();

if (typeof module !== 'undefined') module.exports = DecoEngine;
