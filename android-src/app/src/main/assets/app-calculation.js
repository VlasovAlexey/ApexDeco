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
    const effectiveSettings = Object.assign({}, s);
    if (s.circuit === 'CCR' && s.lastStopCCR) {
        effectiveSettings.lastStop = s.lastStopCCR;
    }
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
    result.gasUsage = calculateGasUsage(result, levels, decos, s);
    result.warnings = generateWarnings(result, levels, s);
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
function applyExtendedStops(result, settings) {
    const deepTime = settings.extStopDeep || 0;
    const shallowTime = settings.extStopShallow || 0;
    const addToExisting = settings.extendAdd;
    const allMix = settings.extendAllMix;
    const o2Window = settings.extendO2Window;
    const stops = result.stops;
    if (!stops || stops.length === 0) return;
    if (deepTime === 0 && shallowTime === 0) return;
    const boundary = settings.metric ? 30 : 100;
    let prevGas = null;
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
        if (apply && o2Window && !allMix) {
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
    const decoTime = stops.reduce((a, s) => a + s.time, 0);
    result.totalRuntime = Math.ceil(
        result.plan.filter(s => s.type !== 'stop').reduce((a, s) => a + (s.time || 0), 0) + decoTime
    );
}
function calculateGasUsage(result, levels, decos, settings) {
    const rmvBottom = settings.rmvBottom || 20;
    const rmvDeco = settings.rmvDeco || 15;
    const rmvDilCCR = settings.rmvDilCCR != null ? settings.rmvDilCCR : 1;
    const isCCR = settings.circuit === 'CCR';
    const tWater = settings.temperature != null ? settings.temperature : 20;
    const tempFactor = 1 + 0.07 * Math.max(0, (25 - tWater)) / 10;
    const dilGases = new Set();
    if (isCCR) {
        for (const l of levels) {
            if (!l.oc && !l.scr) dilGases.add(`${l.o2}/${l.he}`);
        }
    }
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
        if (dilGases.has(gasKey)) {
            usage[gasKey].liters += time * rmvDilCCR * pAmb * tempFactor;
        } else {
            const rmv = (seg.type === 'stop') ? rmvDeco : rmvBottom;
            usage[gasKey].liters += time * rmv * pAmb;
        }
    }
    const isCuFt = settings.gasVolUnit === 'cuft';
    return Object.values(usage).map(u => {
        const liters = Math.round(u.liters);
        const cuft = Math.round(u.liters * 0.035315); 
        return {
            gas: u.gas,
            liters,
            cuft,
            volume: isCuFt ? cuft : liters,
            volumeUnit: isCuFt ? 'cuft' : 'L',
            bar11: Math.round(u.liters / 11), 
            bar12: Math.round(u.liters / 12), 
            bar15: Math.round(u.liters / 15), 
            bar24: Math.round(u.liters / 24), 
        };
    });
}
const PLAN_WARNING_CODES = Object.freeze({
    PPO2_HI: 1,
    PPO2_LO: 2,
    OTU: 4,
    CNS: 8,
    IBCD_N2: 16,
    IBCD_HE: 32,
    CCR_DIL: 64
});
const PLAN_WARNING_COLOR_KEYS = Object.freeze({
    [PLAN_WARNING_CODES.PPO2_HI]: 'warnColorPpO2Hi',
    [PLAN_WARNING_CODES.PPO2_LO]: 'warnColorPpO2Lo',
    [PLAN_WARNING_CODES.OTU]: 'warnColorOTU',
    [PLAN_WARNING_CODES.CNS]: 'warnColorCNS',
    [PLAN_WARNING_CODES.IBCD_N2]: 'warnColorIBCDN2',
    [PLAN_WARNING_CODES.IBCD_HE]: 'warnColorIBCDHe',
    [PLAN_WARNING_CODES.CCR_DIL]: 'warnColorCCRDil'
});
const PLAN_WARNING_DEFAULT_COLORS = Object.freeze({
    [PLAN_WARNING_CODES.PPO2_HI]: '#ff8080',
    [PLAN_WARNING_CODES.PPO2_LO]: '#ff8080',
    [PLAN_WARNING_CODES.OTU]: '#ffff00',
    [PLAN_WARNING_CODES.CNS]: '#ffff00',
    [PLAN_WARNING_CODES.IBCD_N2]: '#ff0000',
    [PLAN_WARNING_CODES.IBCD_HE]: '#ff0000',
    [PLAN_WARNING_CODES.CCR_DIL]: '#ff8040'
});
const PLAN_WARNING_PRIORITY_DESC = Object.freeze([
    PLAN_WARNING_CODES.CCR_DIL,
    PLAN_WARNING_CODES.PPO2_HI,
    PLAN_WARNING_CODES.PPO2_LO,
    PLAN_WARNING_CODES.IBCD_N2,
    PLAN_WARNING_CODES.IBCD_HE,
    PLAN_WARNING_CODES.CNS,
    PLAN_WARNING_CODES.OTU
]);
function normalizeWarningColorHex(value, fallback) {
    const raw = (value || fallback || '').toString().trim().toLowerCase();
    const src = raw.startsWith('#') ? raw.slice(1) : raw;
    if (/^[0-9a-f]{6}$/.test(src)) return `#${src}`;
    if (/^[0-9a-f]{3}$/.test(src)) {
        return `#${src.split('').map(ch => ch + ch).join('')}`;
    }
    return fallback;
}
function getPlanWarningColor(settings, code) {
    const fallback = PLAN_WARNING_DEFAULT_COLORS[code] || '#ff8080';
    const key = PLAN_WARNING_COLOR_KEYS[code];
    if (!key) return fallback;
    return normalizeWarningColorHex(settings[key], fallback);
}
function getPlanWarningTextColor(hexColor) {
    const hex = normalizeWarningColorHex(hexColor, '#ff8080').slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (g > 228 && (b + r) === 0) return '#3b3b3b';
    return (r + g + b) >= 384 ? '#3b3b3b' : '#f2f0ef';
}
function toWarningRgba(hexColor, alpha) {
    const hex = normalizeWarningColorHex(hexColor, '#ff8080').slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function parseWarningGas(gasStr) {
    if (!gasStr) return { o2: 21, he: 0 };
    const parts = String(gasStr).split('/');
    return {
        o2: parseFloat(parts[0]) || 21,
        he: parseFloat(parts[1]) || 0
    };
}
function getWarningAmbientPressure(depth, settings) {
    const safeDepth = Math.max(0, depth || 0);
    const slp = settings.metric
        ? (settings.waterType === 0 ? 10.078 : 10.337)
        : (settings.waterType === 0 ? 33.066 : 33.914);
    return safeDepth / slp + 1;
}
function getSegmentDepthSamples(seg) {
    const samples = [];
    if (typeof seg.depth === 'number') samples.push(seg.depth);
    if (typeof seg.startDepth === 'number') samples.push(seg.startDepth);
    if (typeof seg.endDepth === 'number') samples.push(seg.endDepth);
    return samples.length ? samples : [0];
}
function getSegmentMaxDepth(seg) {
    return Math.max(...getSegmentDepthSamples(seg));
}
function getSegmentMinDepth(seg) {
    return Math.min(...getSegmentDepthSamples(seg));
}
function getSegmentDisplayDepth(seg) {
    if (typeof seg.depth === 'number') return seg.depth;
    if (typeof seg.endDepth === 'number') return seg.endDepth;
    if (typeof seg.startDepth === 'number') return seg.startDepth;
    return 0;
}
function findWarningLevel(levels, gas, depth) {
    if (!Array.isArray(levels) || !gas) return null;
    const matches = levels.filter(level => `${level.o2}/${level.he}` === gas);
    if (matches.length === 0) return null;
    let best = matches[0];
    let bestDiff = Math.abs((best.depth || 0) - (depth || 0));
    for (const level of matches) {
        const diff = Math.abs((level.depth || 0) - (depth || 0));
        if (diff < bestDiff) {
            best = level;
            bestDiff = diff;
        }
    }
    return best;
}
function getSegmentActualPpO2(seg, levels, settings, depth) {
    if (!seg || !seg.gas) return null;
    const { o2 } = parseWarningGas(seg.gas);
    const pAmb = getWarningAmbientPressure(depth, settings);
    if (settings.circuit === 'CCR') {
        const level = findWarningLevel(levels, seg.gas, depth);
        if (level && !level.oc && !level.scr) {
            const sp = level.setpoint || settings.ccrDefaultSP || 1.3;
            return Math.min(sp, pAmb);
        }
    }
    return (o2 / 100) * pAmb;
}
function ensureDisplayedExposure(plan) {
    let maxOTU = 0;
    let maxCNS = 0;
    for (const seg of plan || []) {
        if (typeof seg._cumOTU === 'number') maxOTU = Math.max(maxOTU, seg._cumOTU);
        if (typeof seg._cumCNS === 'number') maxCNS = Math.max(maxCNS, seg._cumCNS);
        seg._dispOTU = maxOTU;
        seg._dispCNS = maxCNS;
    }
}
function getHighestWarningCode(mask) {
    for (const code of PLAN_WARNING_PRIORITY_DESC) {
        if (mask & code) return code;
    }
    return 0;
}
function buildPlanWarningState(result, levels, settings) {
    const plan = Array.isArray(result.plan) ? result.plan : [];
    const firstByCode = {};
    ensureDisplayedExposure(plan);
    for (const seg of plan) {
        delete seg._warnMask;
        delete seg._warnCode;
        delete seg._warnColor;
        delete seg._warnBackground;
        delete seg._warnTextColor;
    }
    let prevGasInfo = null;
    const allLevels = Array.isArray(levels) ? levels : [];
    for (const seg of plan) {
        let mask = 0;
        const displayDepth = getSegmentDisplayDepth(seg);
        const maxDepth = getSegmentMaxDepth(seg);
        const minDepth = getSegmentMinDepth(seg);
        let segSetpoint = 0;
        if (settings.circuit === 'CCR' && seg.gas) {
            let lvlForSeg = null;
            if (seg.type === 'bottom') {
                lvlForSeg = allLevels.find(l =>
                    Math.round(l.depth || 0) === Math.round(seg.depth || 0) &&
                    `${l.o2}/${l.he}` === seg.gas
                );
            } else {
                lvlForSeg = allLevels.find(l =>
                    !l.oc && !l.scr && `${l.o2}/${l.he}` === seg.gas
                );
            }
            if (lvlForSeg && !lvlForSeg.oc && !lvlForSeg.scr) {
                segSetpoint = lvlForSeg.setpoint || settings.ccrDefaultSP || 1.3;
            }
        }
        if (settings.warnOTU !== false && (seg._dispOTU || 0) > (settings.otuHigh || 300)) {
            mask |= PLAN_WARNING_CODES.OTU;
            if (!firstByCode[PLAN_WARNING_CODES.OTU]) {
                firstByCode[PLAN_WARNING_CODES.OTU] = {
                    value: Math.round(seg._dispOTU || 0),
                    depth: displayDepth
                };
            }
        }
        if (settings.warnCNS !== false && (seg._dispCNS || 0) > (settings.cnsHigh || 80)) {
            mask |= PLAN_WARNING_CODES.CNS;
            if (!firstByCode[PLAN_WARNING_CODES.CNS]) {
                firstByCode[PLAN_WARNING_CODES.CNS] = {
                    value: seg._dispCNS || 0,
                    depth: displayDepth
                };
            }
        }
        if (seg.gas && seg.type !== 'surface') {
            const highThreshold = settings.ppO2HighThreshold || 1.6;
            const lowThreshold = settings.ppO2LowThreshold || 0.16;
            const ppO2HighVal = getSegmentActualPpO2(seg, levels, settings, maxDepth);
            const ppO2LowVal = getSegmentActualPpO2(seg, levels, settings, minDepth);
            if (settings.warnPpO2Hi !== false && ppO2HighVal != null && ppO2HighVal > highThreshold) {
                mask |= PLAN_WARNING_CODES.PPO2_HI;
                if (!firstByCode[PLAN_WARNING_CODES.PPO2_HI]) {
                    firstByCode[PLAN_WARNING_CODES.PPO2_HI] = {
                        value: ppO2HighVal,
                        depth: maxDepth,
                        gas: seg.gas
                    };
                }
            }
            if (settings.warnPpO2Lo && ppO2LowVal != null && ppO2LowVal < lowThreshold) {
                mask |= PLAN_WARNING_CODES.PPO2_LO;
                if (!firstByCode[PLAN_WARNING_CODES.PPO2_LO]) {
                    firstByCode[PLAN_WARNING_CODES.PPO2_LO] = {
                        value: ppO2LowVal,
                        depth: minDepth,
                        gas: seg.gas
                    };
                }
            }
            if (settings.circuit === 'CCR' && settings.ccrDilCheck && segSetpoint > 0) {
                const { o2: gasO2 } = parseWarningGas(seg.gas);
                const dilPpO2 = (gasO2 / 100) * getWarningAmbientPressure(maxDepth, settings);
                if (dilPpO2 > segSetpoint) {
                    mask |= PLAN_WARNING_CODES.CCR_DIL;
                    if (!firstByCode[PLAN_WARNING_CODES.CCR_DIL]) {
                        firstByCode[PLAN_WARNING_CODES.CCR_DIL] = {
                            value: dilPpO2,
                            setpoint: segSetpoint,
                            depth: maxDepth,
                            gas: seg.gas
                        };
                    }
                }
            }
        }
        if (seg.gas && seg.type !== 'surface') {
            if (seg.type === 'stop' && prevGasInfo && seg.gas !== prevGasInfo.gas) {
                const { o2: prevO2, he: prevHePct } = parseWarningGas(prevGasInfo.gas);
                const { o2: newO2, he: newHePct } = parseWarningGas(seg.gas);
                const prevHe = prevHePct / 100;
                const newHe = newHePct / 100;
                const prevN2 = Math.max(0, 1 - (prevO2 / 100) - prevHe);
                const newN2 = Math.max(0, 1 - (newO2 / 100) - newHe);
                const pAmb = getWarningAmbientPressure(displayDepth, settings);
                const deltaN2Bar = (newN2 - prevN2) * pAmb;
                const deltaHeBar = (prevHe - newHe) * pAmb;
                if (settings.warnIBCDN2 && deltaN2Bar > (settings.ibcdN2Threshold || 0.5) && deltaHeBar > 0) {
                    mask |= PLAN_WARNING_CODES.IBCD_N2;
                    if (!firstByCode[PLAN_WARNING_CODES.IBCD_N2]) {
                        firstByCode[PLAN_WARNING_CODES.IBCD_N2] = {
                            depth: displayDepth,
                            deltaN2Bar,
                            deltaHeBar,
                            fromGas: prevGasInfo.gas,
                            toGas: seg.gas
                        };
                    }
                }
                if (settings.warnIBCDHe && deltaHeBar > (settings.ibcdHeThreshold || 0.5) && deltaN2Bar > 0) {
                    mask |= PLAN_WARNING_CODES.IBCD_HE;
                    if (!firstByCode[PLAN_WARNING_CODES.IBCD_HE]) {
                        firstByCode[PLAN_WARNING_CODES.IBCD_HE] = {
                            depth: displayDepth,
                            deltaN2Bar,
                            deltaHeBar,
                            fromGas: prevGasInfo.gas,
                            toGas: seg.gas
                        };
                    }
                }
            }
            prevGasInfo = { gas: seg.gas };
        }
        const topCode = getHighestWarningCode(mask);
        if (topCode && seg.type !== 'descent' && seg.type !== 'surface') {
            const color = getPlanWarningColor(settings, topCode);
            seg._warnMask = mask;
            seg._warnCode = topCode;
            seg._warnColor = color;
            seg._warnBackground = toWarningRgba(color, 0.686);
            seg._warnTextColor = getPlanWarningTextColor(color);
        }
    }
    result.alertRowsWarn = plan.map(seg => seg._warnMask || 0);
    result.alertRowsColor = plan.map(seg => seg._warnCode ? seg._warnColor : null);
    return firstByCode;
}
function generateWarnings(result, levels, settings) {
    const warnings = [];
    const s = settings;
    const unit = s.metric ? 'm' : 'ft';
    const firstByCode = buildPlanWarningState(result, levels, s);
    if (firstByCode[PLAN_WARNING_CODES.PPO2_HI]) {
        const threshold = s.ppO2HighThreshold || 1.6;
        const info = firstByCode[PLAN_WARNING_CODES.PPO2_HI];
        warnings.push({
            level: 'error',
            code: PLAN_WARNING_CODES.PPO2_HI,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.PPO2_HI),
            msg: `ppO2 ${info.value.toFixed(2)} > ${threshold} at ${info.depth}${unit} (${info.gas})`
        });
    }
    if (firstByCode[PLAN_WARNING_CODES.OTU]) {
        const info = firstByCode[PLAN_WARNING_CODES.OTU];
        warnings.push({
            level: 'warn',
            code: PLAN_WARNING_CODES.OTU,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.OTU),
            msg: `OTU ${info.value} > ${s.otuHigh || 300} at ${info.depth}${unit}`
        });
    }
    if (s.twoWeekOTU > 0) {
        const cumulativeOTU = s.twoWeekOTU + result.totalOTU;
        if (cumulativeOTU > 300) {
            warnings.push({
                level: 'warn',
                code: PLAN_WARNING_CODES.OTU,
                color: getPlanWarningColor(s, PLAN_WARNING_CODES.OTU),
                msg: `2-week cumulative OTU ${cumulativeOTU} > 300`
            });
        }
    }
    if (firstByCode[PLAN_WARNING_CODES.CNS]) {
        const info = firstByCode[PLAN_WARNING_CODES.CNS];
        warnings.push({
            level: 'error',
            code: PLAN_WARNING_CODES.CNS,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.CNS),
            msg: `CNS ${info.value.toFixed(0)}% > ${s.cnsHigh || 80}% at ${info.depth}${unit}`
        });
    }
    if (firstByCode[PLAN_WARNING_CODES.PPO2_LO]) {
        const threshold = s.ppO2LowThreshold || 0.16;
        const info = firstByCode[PLAN_WARNING_CODES.PPO2_LO];
        warnings.push({
            level: 'error',
            code: PLAN_WARNING_CODES.PPO2_LO,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.PPO2_LO),
            msg: `ppO2 ${info.value.toFixed(2)} < ${threshold} — hypoxic at ${info.depth}${unit} (${info.gas})`
        });
    }
    if (firstByCode[PLAN_WARNING_CODES.IBCD_N2]) {
        const info = firstByCode[PLAN_WARNING_CODES.IBCD_N2];
        warnings.push({
            level: 'warn',
            code: PLAN_WARNING_CODES.IBCD_N2,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.IBCD_N2),
            msg: `IBCD N2 risk: pN2 ↑${info.deltaN2Bar.toFixed(2)} bar, pHe ↓${info.deltaHeBar.toFixed(2)} bar at ${info.depth}${unit} (${info.fromGas}→${info.toGas})`
        });
    }
    if (firstByCode[PLAN_WARNING_CODES.IBCD_HE]) {
        const info = firstByCode[PLAN_WARNING_CODES.IBCD_HE];
        warnings.push({
            level: 'warn',
            code: PLAN_WARNING_CODES.IBCD_HE,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.IBCD_HE),
            msg: `IBCD He risk: pHe ↓${info.deltaHeBar.toFixed(2)} bar, pN2 ↑${info.deltaN2Bar.toFixed(2)} bar at ${info.depth}${unit} (${info.fromGas}→${info.toGas})`
        });
    }
    if (firstByCode[PLAN_WARNING_CODES.CCR_DIL]) {
        const info = firstByCode[PLAN_WARNING_CODES.CCR_DIL];
        warnings.push({
            level: 'warn',
            code: PLAN_WARNING_CODES.CCR_DIL,
            color: getPlanWarningColor(s, PLAN_WARNING_CODES.CCR_DIL),
            msg: `Diluent ppO2 (${info.value.toFixed(2)}) > setpoint (${info.setpoint}) at ${info.depth}${unit} (${info.gas})`
        });
    }
    return warnings;
}
function calculateBailout(levels, decos, settings) {
    const bailSettings = Object.assign({}, settings);
    bailSettings.circuit = 'OC'; 
    bailSettings.gfLo = settings.gfLo || 30;
    bailSettings.gfHi = settings.gfHi || 85;
    bailSettings.gfs = settings.gfs || settings.gfHi || 85;
    const bailLevels = levels.map(l => {
        const bl = Object.assign({}, l);
        delete bl.setpoint;
        return bl;
    });
    if (settings.bailExtraMin && bailLevels.length > 0) {
        bailLevels[bailLevels.length - 1].time += (settings.bailExtraMinTime || 1);
    }
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
    const bailModel = settings.decoModel || 'ZHLC_GF';
    let result;
    if (bailModel.startsWith('VPM')) {
        result = VPMEngine.calculate(bailLevels, decos, bailSettings, bailModel);
    } else {
        result = DecoEngine.calculate(bailLevels, decos, bailSettings);
    }
    result.gasUsage = calculateGasUsage(result, bailLevels, decos, bailSettings);
    result.modelName = getModelName(bailModel) + ' (Bailout)';
    return result;
}
function nextDive() {
    const result = appState.lastResult;
    if (!result || !result.finalTissues) {
        showAlert(window.t ? window.t('ERR_NO_RESULT') : 'No completed dive to continue from. Calculate a dive plan first.');
        return;
    }
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
    appState.previousTissues = result.finalTissues;
    appState.settings.surfaceInterval = totalMin;
    const siInput = document.getElementById('cfg-si');
    if (siInput) siInput.value = totalMin;
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
