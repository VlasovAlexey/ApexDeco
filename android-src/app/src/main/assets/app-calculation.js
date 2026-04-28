/**
 * ApexDeco - Core Calculation, Gas Planning, Warnings & Bailout
 */

function calculateDeco() {
    saveConfig();
    const s = appState.settings;
    logSettingsToConsole(s);
    const levels = appState.levels.filter(l => l.selected !== false);
    const decos = appState.decos.filter(d => d.selected !== false);

    if (levels.length === 0) {
        showAlert(window.t ? window.t('ERR_NO_LEVELS') : 'Add at least one bottom level before calculating.');
        return;
    }

    // Apply CCR last stop
    const effectiveSettings = Object.assign({}, s);
    if (s.circuit === 'CCR' && s.lastStopCCR) {
        effectiveSettings.lastStop = s.lastStopCCR;
    }

    // Apply surface interval (pre-load tissues)
    if (s.surfaceInterval > 0 && appState.previousTissues) {
        effectiveSettings._preTissues = appState.previousTissues;
        effectiveSettings._surfaceInterval = s.surfaceInterval;
    }

    const model = s.decoModel || 'ZHLC_GF';
    let result;

    if (model.startsWith('VPM')) {
        result = VPMEngine.calculate(levels, decos, effectiveSettings, model);
    } else {
        result = DecoEngine.calculate(levels, decos, effectiveSettings);
    }

    if (result.error) {
        showAlert(window.t ? window.t('ERR_CALC', {error: result.error}) : ('Calculation error: ' + result.error));
        return;
    }

    // Extended Stops are applied inside the deco engine itself
    // (tissues loaded for the extra time → mini-level effect on later stops).

    // Calculate gas usage
    result.gasUsage = calculateGasUsage(result, levels, decos, s);

    // Generate warnings
    result.warnings = generateWarnings(result, levels, s);

    // Bailout plan (CCR only)
    if (s.circuit === 'CCR' && s.bailoutActive) {
        result.bailoutPlan = calculateBailout(levels, decos, s);
    }

    result.model = model;
    result.modelName = getModelName(model);

    appState.lastResult = result;
    renderResult(result);
    logPlanToConsole(result, s);
    showScreen('result');
    saveStateToStorage();
}

// ===== EXTENDED STOPS =====
// Android semantics:
//  - extStopShallow: minutes added to stops in shallow range (7..30m / 21..100ft)
//  - extStopDeep:    minutes added to stops in deep range (30+ m / 100+ ft)
//  - extendAdd:      Add time to stop (true) or replace/max (false)
//  - extendAllMix:   Apply at all stops (true) or only at deco-mix-change stops (false)
//  - extendO2Window: O2 window effect — apply only when switching to a gas with >= current ppO2
function applyExtendedStops(result, settings) {
    const deepTime = settings.extStopDeep || 0;
    const shallowTime = settings.extStopShallow || 0;
    const addToExisting = settings.extendAdd;
    const allMix = settings.extendAllMix;
    const o2Window = settings.extendO2Window;
    const stops = result.stops;

    if (!stops || stops.length === 0) return;
    if (deepTime === 0 && shallowTime === 0) return;

    // Boundary between "shallow" and "deep" range is 30m (metric) or 100ft (imperial)
    const boundary = settings.metric ? 30 : 100;

    // Determine which stops are deco-mix-change (gas differs from previous stop)
    // or first deco stop (gas differs from bottom).
    let prevGas = null;
    // Find bottom gas for comparison on first stop
    const bottomSeg = result.plan.find(p => p.type === 'bottom');
    if (bottomSeg) prevGas = bottomSeg.gas;

    for (const stop of stops) {
        const isMixChange = stop.gas !== prevGas;

        let apply = false;
        if (allMix) {
            apply = true;
        } else if (isMixChange) {
            apply = true;
        }

        // O2 window effect: only apply when switching to a higher-ppO2 gas (o2 increased)
        if (apply && o2Window && !allMix) {
            // Compute o2 fraction from stop.gas
            const curO2 = parseInt((stop.gas || '0/0').split('/')[0]) || 0;
            const prevO2 = parseInt((prevGas || '0/0').split('/')[0]) || 0;
            if (curO2 <= prevO2) {
                apply = false;
            }
        }

        prevGas = stop.gas;
        if (!apply) continue;

        const extTime = stop.depth > boundary ? deepTime : shallowTime;
        if (extTime <= 0) continue;

        if (addToExisting) {
            stop.time += extTime;
        } else {
            stop.time = Math.max(stop.time, extTime);
        }
    }

    // Recalculate totals
    const decoTime = stops.reduce((a, s) => a + s.time, 0);
    result.totalRuntime = Math.ceil(
        result.plan.filter(s => s.type !== 'stop').reduce((a, s) => a + (s.time || 0), 0) + decoTime
    );
}

// ===== GAS PLANNING =====
function calculateGasUsage(result, levels, decos, settings) {
    const rmvBottom = settings.rmvBottom || 20;
    const rmvDeco = settings.rmvDeco || 15;
    const isCCR = settings.circuit === 'CCR';
    const usage = {};

    for (const seg of result.plan) {
        const gasKey = seg.gas || 'unknown';
        if (!usage[gasKey]) usage[gasKey] = { gas: gasKey, liters: 0 };

        const time = seg.time || 0;
        if (time <= 0) continue;

        let avgDepth;
        if (seg.type === 'descent' || seg.type === 'ascent') {
            avgDepth = ((seg.startDepth || 0) + (seg.endDepth || 0)) / 2;
        } else {
            avgDepth = seg.depth || 0;
        }

        const slp = settings.metric
            ? (settings.waterType === 0 ? 10.078 : 10.337)
            : (settings.waterType === 0 ? 33.066 : 33.914);
        const pAmb = avgDepth / slp + 1;

        const rmv = (seg.type === 'stop') ? rmvDeco : rmvBottom;
        // CCR: only count bailout gas if on OC deco gas, loop gas usage is minimal
        if (isCCR && seg.type !== 'stop') {
            usage[gasKey].liters += time * 2 * pAmb; // minimal loop gas ~2 L/min
        } else {
            usage[gasKey].liters += time * rmv * pAmb;
        }
    }

    const isCuFt = settings.gasVolUnit === 'cuft';
    return Object.values(usage).map(u => {
        const liters = Math.round(u.liters);
        const cuft = Math.round(u.liters * 0.035315); // 1 liter = 0.035315 cuft
        return {
            gas: u.gas,
            liters,
            cuft,
            volume: isCuFt ? cuft : liters,
            volumeUnit: isCuFt ? 'cuft' : 'L',
            bar11: Math.round(u.liters / 11), // 11L tank
            bar12: Math.round(u.liters / 12), // 12L tank
            bar15: Math.round(u.liters / 15), // 15L tank
            bar24: Math.round(u.liters / 24), // 24L doubles
        };
    });
}

// ===== WARNINGS =====
function generateWarnings(result, levels, settings) {
    const warnings = [];
    const s = settings;

    // CNS
    if (s.warnCNS !== false && result.totalCNS > (s.cnsHigh || 80)) {
        warnings.push({ level: 'error', msg: `CNS ${result.totalCNS.toFixed(0)}% > ${s.cnsHigh || 80}%` });
    }

    // OTU
    if (s.warnOTU !== false && result.totalOTU > (s.otuHigh || 300)) {
        warnings.push({ level: 'warn', msg: `OTU ${result.totalOTU} > ${s.otuHigh || 300}` });
    }

    // 2-week OTU tracking
    if (s.twoWeekOTU > 0) {
        const cumulativeOTU = s.twoWeekOTU + result.totalOTU;
        if (cumulativeOTU > 300) {
            warnings.push({ level: 'warn', msg: `2-week cumulative OTU ${cumulativeOTU} > 300` });
        }
    }

    // ppO2 High in plan segments
    if (s.warnPpO2Hi !== false) {
        const threshold = s.ppO2HighThreshold || 1.6;
        for (const seg of result.plan) {
            if (!seg.o2 || !seg.depth && !seg.endDepth) continue;
            const depth = seg.depth || seg.endDepth || 0;
            const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);
            const pAmb = depth / slp + 1;
            const ppO2 = (seg.o2 / 100) * pAmb;
            if (ppO2 > threshold) {
                warnings.push({ level: 'error', msg: `ppO2 ${ppO2.toFixed(2)} > ${threshold} at ${depth}${s.metric ? 'm' : 'ft'} (${seg.gas})` });
                break;
            }
        }
    }

    // ppO2 Low
    if (s.warnPpO2Lo) {
        const threshold = s.ppO2LowThreshold || 0.16;
        for (const seg of result.plan) {
            if (!seg.o2 || !seg.depth && !seg.endDepth) continue;
            const depth = seg.depth || seg.startDepth || 0;
            const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);
            const pAmb = depth / slp + 1;
            let ppO2;
            if (s.circuit === 'CCR') {
                const sp = levels[0] && levels[0].setpoint ? levels[0].setpoint : 1.3;
                ppO2 = Math.min(sp, pAmb);
            } else {
                ppO2 = (seg.o2 / 100) * pAmb;
            }
            if (ppO2 < threshold) {
                warnings.push({ level: 'error', msg: `ppO2 ${ppO2.toFixed(2)} < ${threshold} — hypoxic at ${depth}${s.metric ? 'm' : 'ft'}` });
                break;
            }
        }
    }

    // IBCD (Isobaric Counter Diffusion) — check gas switches
    if (s.warnIBCDN2 || s.warnIBCDHe) {
        const stops = result.stops;
        let prevGas = null;
        for (const stop of stops) {
            if (prevGas && stop.gas !== prevGas.gas) {
                const prevHe = (prevGas.he || 0) / 100;
                const newHe = (stop.he || 0) / 100;
                const prevN2 = 1 - (prevGas.o2 || 21) / 100 - prevHe;
                const newN2 = 1 - (stop.o2 || 21) / 100 - newHe;
                const deltaN2 = newN2 - prevN2;
                const deltaHe = prevHe - newHe;
                if (s.warnIBCDN2 && deltaN2 > 0 && deltaHe > 0) {
                    const ratio = deltaN2 / deltaHe;
                    if (deltaN2 > (s.ibcdN2Threshold || 2.0) / 10) {
                        warnings.push({ level: 'warn', msg: `IBCD risk: N2 ↑${(deltaN2*100).toFixed(0)}%, He ↓${(deltaHe*100).toFixed(0)}% at ${stop.depth}${s.metric ? 'm' : 'ft'}` });
                    }
                }
            }
            prevGas = stop;
        }
    }

    // CCR diluent ppO2 check
    if (s.circuit === 'CCR' && s.ccrDilCheck) {
        for (const level of levels) {
            const depth = level.depth;
            const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);
            const pAmb = depth / slp + 1;
            const dilPpO2 = (level.o2 / 100) * pAmb;
            const sp = level.setpoint || 1.3;
            if (dilPpO2 > sp) {
                warnings.push({ level: 'warn', msg: `Diluent ppO2 (${dilPpO2.toFixed(2)}) > setpoint (${sp}) at ${depth}${s.metric ? 'm' : 'ft'}` });
            }
        }
    }

    return warnings;
}

// ===== BAILOUT =====
function calculateBailout(levels, decos, settings) {
    const bailSettings = Object.assign({}, settings);
    bailSettings.circuit = 'OC'; // bailout is always OC
    // Bailout uses main OC model and GF settings
    bailSettings.gfLo = settings.gfLo || 30;
    bailSettings.gfHi = settings.gfHi || 85;
    bailSettings.gfs = settings.gfs || settings.gfHi || 85;

    // Add extra bottom time if configured
    const bailLevels = levels.map(l => {
        const bl = Object.assign({}, l);
        delete bl.setpoint;
        return bl;
    });
    if (settings.bailExtraMin && bailLevels.length > 0) {
        bailLevels[bailLevels.length - 1].time += (settings.bailExtraMinTime || 1);
    }

    // Cave bailout: add return time (portion of last bottom segment)
    if (settings.bailCaveBail && bailLevels.length > 0) {
        const lastLevel = bailLevels[bailLevels.length - 1];
        const portion = (settings.bailCavePortion || 33) / 100;
        const returnTime = Math.ceil(lastLevel.time * portion);
        bailLevels.push({
            depth: bailLevels[0].depth,
            time: returnTime,
            o2: lastLevel.o2,
            he: lastLevel.he,
            selected: true
        });
    }

    // Bailout uses same model as main plan
    const bailModel = settings.decoModel || 'ZHLC_GF';
    let result;
    if (bailModel.startsWith('VPM')) {
        result = VPMEngine.calculate(bailLevels, decos, bailSettings, bailModel);
    } else {
        result = DecoEngine.calculate(bailLevels, decos, bailSettings);
    }

    // Gas usage for bailout — use main OC RMV settings
    result.gasUsage = calculateGasUsage(result, bailLevels, decos, bailSettings);

    result.modelName = getModelName(bailModel) + ' (Bailout)';
    return result;
}

// ===== NEXT DIVE =====
function nextDive() {
    const result = appState.lastResult;
    if (!result || !result.finalTissues) {
        showAlert(window.t ? window.t('ERR_NO_RESULT') : 'No completed dive to continue from. Calculate a dive plan first.');
        return;
    }
    // Open surface interval modal
    document.getElementById('si-modal').classList.add('active');
    siUpdateTotal();
}

function siStep(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const max = parseInt(el.max);
    const min = parseInt(el.min);
    let val = parseInt(el.value) + delta;
    if (val > max) val = min;
    if (val < min) val = max;
    el.value = val;
    siUpdateTotal();
}

function siUpdateTotal() {
    const days    = parseInt(document.getElementById('si-days').value)    || 0;
    const hours   = parseInt(document.getElementById('si-hours').value)   || 0;
    const minutes = parseInt(document.getElementById('si-minutes').value) || 0;
    const total   = days * 1440 + hours * 60 + minutes;
    const lbl = document.getElementById('si-total-label');
    if (lbl) lbl.textContent = (window.t ? window.t('LABEL_SI_TOTAL', { n: total }) : `Total: ${total} min`);
}

function confirmNextDive() {
    const result = appState.lastResult;
    if (!result || !result.finalTissues) return;

    const days    = parseInt(document.getElementById('si-days').value)    || 0;
    const hours   = parseInt(document.getElementById('si-hours').value)   || 0;
    const minutes = parseInt(document.getElementById('si-minutes').value) || 0;
    const totalMin = days * 1440 + hours * 60 + minutes;

    // Save end-of-dive tissues
    appState.previousTissues = result.finalTissues;

    // Store surface interval in settings so calculateDeco picks it up.
    // Also update the config UI field because calculateDeco() calls saveConfig()
    // which reads surfaceInterval from #cfg-si and would otherwise overwrite it.
    appState.settings.surfaceInterval = totalMin;
    const siInput = document.getElementById('cfg-si');
    if (siInput) siInput.value = totalMin;

    // Increment dive counter for debug display
    appState.nextDiveNum = (appState.nextDiveNum || 1) + 1;

    document.getElementById('si-modal').classList.remove('active');
    saveStateToStorage();
    updateResetTissuesButton();
    showScreen('main');
}

function updateResetTissuesButton() {
    const btn = document.getElementById('btn-reset-tissues');
    if (!btn) return;
    btn.style.display = appState.previousTissues ? '' : 'none';
}

function resetSurfaceTissues() {
    appState.previousTissues = null;
    appState.nextDiveNum = 1;
    // Also clear the hidden surfaceInterval field so saveConfig doesn't re-apply it
    appState.settings.surfaceInterval = 0;
    const siInput = document.getElementById('cfg-si');
    if (siInput) siInput.value = 0;
    updateResetTissuesButton();
    saveStateToStorage();
    showAlert(window.t ? window.t('MSG_TISSUES_RESET') : 'Surface tissues reset. Next dive will be planned as Dive #1.');
}

function getModelName(model) {
    const names = {
        'ZHLC_GF': 'ZH-L16C GF',
        'ZHLB_GF': 'ZH-L16B GF',
        'VPMA': 'VPM-A',
        'VPMB': 'VPM-B',
        'VPMBE': 'VPM-B/E',
        'VPMB_GFS': 'VPM-B/GFS',
        'VPMBFBO': 'VPM-B/FBO'
    };
    return names[model] || model;
}
