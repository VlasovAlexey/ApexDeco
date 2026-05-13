function onModelChange() {
    const model = document.getElementById('cfg-model').value;
    const isVPM = model.startsWith('VPM');
    const isGFS = model === 'VPMB_GFS';
    const isBuhl = !isVPM;
    document.querySelectorAll('.gf-row').forEach(el => {
        el.style.display = (isBuhl || isGFS) ? 'flex' : 'none';
    });
    document.querySelectorAll('.gfs-row').forEach(el => {
        el.style.display = isGFS ? 'flex' : 'none';
    });
    const consRow = document.getElementById('cfg-conservatism-row');
    if (consRow) consRow.style.display = isVPM ? 'flex' : 'none';
}
function onBailCaveChange() {
    const on = getRadio('bailcave') === '1';
    document.querySelectorAll('.bail-cave-field').forEach(el => {
        el.style.display = on ? 'flex' : 'none';
    });
}
function onCircuitChange() {
    const isCCR = getRadio('circuit') === 'CCR';
    appState.settings.circuit = isCCR ? 'CCR' : 'OC';
    document.querySelectorAll('.ccr-field').forEach(el => {
        el.style.display = isCCR ? 'flex' : 'none';
    });
    applyLevelsForCircuit();
    renderLevels();
}
function onExtStopsChange() {
    const on = getRadio('extstops') === '1';
    document.querySelectorAll('.ext-stop-field').forEach(el => {
        el.style.display = on ? 'flex' : 'none';
    });
    document.querySelectorAll('.ext-stop-swap-block').forEach(el => {
        el.style.display = on ? 'block' : 'none';
    });
}
function onBailoutChange() {
    const on = getRadio('bailout') === '1';
    document.querySelectorAll('.bail-field').forEach(el => {
        el.style.display = on ? 'flex' : 'none';
    });
}
const WARNING_COLOR_INPUT_IDS = [
    'cfg-warn-ppo2hi-color',
    'cfg-warn-ppo2lo-color',
    'cfg-warn-cns-color',
    'cfg-warn-otu-color',
    'cfg-warn-ibcdn2-color',
    'cfg-warn-ibcdhe-color',
    'cfg-warn-ccrdil-color'
];
const WARNING_COLOR_SETTING_MAP = Object.freeze({
    'cfg-warn-ppo2hi-color': 'warnColorPpO2Hi',
    'cfg-warn-ppo2lo-color': 'warnColorPpO2Lo',
    'cfg-warn-cns-color': 'warnColorCNS',
    'cfg-warn-otu-color': 'warnColorOTU',
    'cfg-warn-ibcdn2-color': 'warnColorIBCDN2',
    'cfg-warn-ibcdhe-color': 'warnColorIBCDHe',
    'cfg-warn-ccrdil-color': 'warnColorCCRDil'
});
let warningColorPickerState = null;
function syncWarningColorPreview(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.querySelector(`[data-color-preview="${inputId}"]`);
    if (!input || !preview) return;
    const color = normalizeWarningColorHex(input.value, '#ff8080');
    input.value = color;
    preview.style.background = color;
}
function syncAllWarningColorPreviews() {
    WARNING_COLOR_INPUT_IDS.forEach(syncWarningColorPreview);
}
function ensureWarningColorPickerState() {
    if (warningColorPickerState) return warningColorPickerState;
    const canvas = document.getElementById('warn-color-canvas');
    const modal = document.getElementById('warn-color-modal');
    if (!canvas || !modal) return null;
    warningColorPickerState = {
        modal,
        canvas,
        ctx: canvas.getContext('2d', { willReadFrequently: true }),
        activeInputId: null,
        originalColor: null,
        pendingColor: null,
        selecting: false,
        markerX: null,
        markerY: null,
        width: 0,
        height: 0
    };
    const start = (event) => {
        event.preventDefault();
        warningColorPickerState.selecting = true;
        updateWarningColorFromPointer(event);
        if (canvas.setPointerCapture && event.pointerId != null) {
            try { canvas.setPointerCapture(event.pointerId); } catch (e) {}
        }
    };
    const move = (event) => {
        if (!warningColorPickerState.selecting) return;
        event.preventDefault();
        updateWarningColorFromPointer(event);
    };
    const stop = (event) => {
        if (!warningColorPickerState.selecting) return;
        event.preventDefault();
        warningColorPickerState.selecting = false;
        if (canvas.releasePointerCapture && event.pointerId != null) {
            try { canvas.releasePointerCapture(event.pointerId); } catch (e) {}
        }
    };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('lostpointercapture', () => { warningColorPickerState.selecting = false; });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && warningColorPickerState && warningColorPickerState.modal.classList.contains('active')) {
            cancelWarnColorPicker();
        }
    });
    return warningColorPickerState;
}
function hslHueToRgb(hue) {
    const h = ((hue % 360) + 360) % 360;
    const c = 1;
    const x = 1 - Math.abs(((h / 60) % 2) - 1);
    let r = 0, g = 0, b = 0;
    if (h < 60) {
        r = c; g = x;
    } else if (h < 120) {
        r = x; g = c;
    } else if (h < 180) {
        g = c; b = x;
    } else if (h < 240) {
        g = x; b = c;
    } else if (h < 300) {
        r = x; b = c;
    } else {
        r = c; b = x;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
function mixRgb(a, b, t) {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t)
    };
}
function paletteRgbAt(nx, ny) {
    const hue = Math.max(0, Math.min(1, nx)) * 360;
    const pure = hslHueToRgb(hue);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const y = Math.max(0, Math.min(1, ny));
    if (y <= 0.5) {
        return mixRgb(white, pure, y / 0.5);
    }
    return mixRgb(pure, black, (y - 0.5) / 0.5);
}
function rgbToHex(rgb) {
    const hex = [rgb.r, rgb.g, rgb.b]
        .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('');
    return `#${hex}`;
}
function hexToRgb(hex) {
    const normalized = normalizeWarningColorHex(hex, '#ff8080').slice(1);
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
    };
}
function resizeWarningColorCanvas(state) {
    const rect = state.canvas.getBoundingClientRect();
    const width = Math.max(220, Math.round(rect.width || 300));
    const height = Math.max(160, Math.round(rect.height || 192));
    state.canvas.width = width;
    state.canvas.height = height;
    state.width = width;
    state.height = height;
}
function drawWarningColorPalette(state) {
    const ctx = state.ctx;
    const { width, height } = state;
    if (!ctx || !width || !height) return;
    const image = ctx.createImageData(width, height);
    let offset = 0;
    for (let y = 0; y < height; y++) {
        const ny = height <= 1 ? 0 : y / (height - 1);
        for (let x = 0; x < width; x++) {
            const nx = width <= 1 ? 0 : x / (width - 1);
            const rgb = paletteRgbAt(nx, ny);
            image.data[offset++] = rgb.r;
            image.data[offset++] = rgb.g;
            image.data[offset++] = rgb.b;
            image.data[offset++] = 255;
        }
    }
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(image, 0, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    if (typeof state.markerX === 'number' && typeof state.markerY === 'number') {
        const x = state.markerX;
        const y = state.markerY;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
function findWarningColorMarker(state, hexColor) {
    const target = hexToRgb(hexColor);
    let bestX = 0;
    let bestY = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    const xStep = Math.max(1, Math.round(state.width / 120));
    const yStep = Math.max(1, Math.round(state.height / 80));
    for (let y = 0; y < state.height; y += yStep) {
        const ny = state.height <= 1 ? 0 : y / (state.height - 1);
        for (let x = 0; x < state.width; x += xStep) {
            const nx = state.width <= 1 ? 0 : x / (state.width - 1);
            const rgb = paletteRgbAt(nx, ny);
            const dr = rgb.r - target.r;
            const dg = rgb.g - target.g;
            const db = rgb.b - target.b;
            const score = dr * dr + dg * dg + db * db;
            if (score < bestScore) {
                bestScore = score;
                bestX = x;
                bestY = y;
            }
        }
    }
    state.markerX = bestX;
    state.markerY = bestY;
}
function refreshWarningsForCurrentResult() {
    if (!appState || !appState.lastResult || typeof generateWarnings !== 'function' || typeof renderResult !== 'function') return;
    const levels = (appState.levels || []).filter(level => level.selected !== false);
    appState.lastResult.warnings = generateWarnings(appState.lastResult, levels, appState.settings);
    renderResult(appState.lastResult);
}
function updateWarningColorAtPoint(x, y) {
    const state = ensureWarningColorPickerState();
    if (!state || !state.activeInputId) return;
    const clampedX = Math.max(0, Math.min(state.width - 1, x));
    const clampedY = Math.max(0, Math.min(state.height - 1, y));
    const nx = state.width <= 1 ? 0 : clampedX / (state.width - 1);
    const ny = state.height <= 1 ? 0 : clampedY / (state.height - 1);
    const color = rgbToHex(paletteRgbAt(nx, ny));
    const input = document.getElementById(state.activeInputId);
    if (!input) return;
    input.value = color;
    state.pendingColor = color;
    state.markerX = clampedX;
    state.markerY = clampedY;
    syncWarningColorPreview(state.activeInputId);
    drawWarningColorPalette(state);
}
function updateWarningColorFromPointer(event) {
    const state = ensureWarningColorPickerState();
    if (!state) return;
    const rect = state.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    updateWarningColorAtPoint(x, y);
}
function openWarnColorPicker(inputId) {
    const state = ensureWarningColorPickerState();
    if (!state) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    state.activeInputId = inputId;
    state.originalColor = normalizeWarningColorHex(input.value, '#ff8080');
    state.pendingColor = state.originalColor;
    state.modal.classList.add('active');
    requestAnimationFrame(() => {
        resizeWarningColorCanvas(state);
        findWarningColorMarker(state, state.pendingColor);
        drawWarningColorPalette(state);
    });
}
function closeWarnColorPicker() {
    const state = ensureWarningColorPickerState();
    if (!state) return;
    state.modal.classList.remove('active');
    state.selecting = false;
    state.activeInputId = null;
}
function cancelWarnColorPicker() {
    const state = ensureWarningColorPickerState();
    if (!state || !state.activeInputId) {
        closeWarnColorPicker();
        return;
    }
    const input = document.getElementById(state.activeInputId);
    if (input && state.originalColor) {
        input.value = state.originalColor;
        syncWarningColorPreview(state.activeInputId);
    }
    state.pendingColor = state.originalColor;
    closeWarnColorPicker();
}
function confirmWarnColorPicker() {
    const state = ensureWarningColorPickerState();
    if (!state || !state.activeInputId) {
        closeWarnColorPicker();
        return;
    }
    const input = document.getElementById(state.activeInputId);
    const color = normalizeWarningColorHex(state.pendingColor || (input ? input.value : null), '#ff8080');
    if (input) {
        input.value = color;
        syncWarningColorPreview(state.activeInputId);
    }
    const settingKey = WARNING_COLOR_SETTING_MAP[state.activeInputId];
    if (settingKey && appState && appState.settings) {
        appState.settings[settingKey] = color;
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
    refreshWarningsForCurrentResult();
    state.originalColor = color;
    state.pendingColor = color;
    closeWarnColorPicker();
}
function loadConfigToUI() {
    const s = appState.settings;
    document.getElementById('cfg-model').value = s.decoModel || 'ZHLC_GF';
    document.getElementById('cfg-gflo').value = s.gfLo;
    document.getElementById('cfg-gfhi').value = s.gfHi;
    document.getElementById('cfg-gfs').value = s.gfs || 85;
    document.getElementById('cfg-conservatism').value = s.conservatism || 0;
    document.getElementById('cfg-altitude').value = s.altitude || 0;
    document.getElementById('cfg-acclim').value = s.acclimatized || 0;
    document.getElementById('cfg-descent').value = s.descentRate;
    document.getElementById('cfg-ascent').value = s.ascentRate;
    document.getElementById('cfg-deco-ascent').value = s.decoAscentRate;
    document.getElementById('cfg-surface-ascent').value = s.surfaceAscentRate || 9;
    document.getElementById('cfg-step').value = s.stepSize;
    document.getElementById('cfg-laststop').value = s.lastStop;
    document.getElementById('cfg-laststop-ccr').value = s.lastStopCCR || 3;
    document.getElementById('cfg-stoptime').value = s.minStopTime;
    document.getElementById('cfg-ppo2').value = s.ppO2Deco;
    document.getElementById('cfg-ppo2-low').value = s.ppO2Low || 1.4;
    document.getElementById('cfg-ppo2-mid').value = s.ppO2Mid || 1.5;
    document.getElementById('cfg-ppo2-high').value = s.ppO2High || 1.6;
    document.getElementById('cfg-ppo2-bottom').value = s.ppO2Bottom;
    document.getElementById('cfg-o2-maxdepth').value = s.o2MaxDepth || 6;
    setRadio('firststop30', s.firstStop30sec ? '1' : '0');
    setRadio('firststopdbl', s.firstStopDoubleStep ? '1' : '0');
    document.getElementById('cfg-cns').value = s.cnsHigh || 80;
    document.getElementById('cfg-otu').value = s.otuHigh || 300;
    setRadio('gasvol', s.gasVolUnit || 'ltr');
    setRadio('gaugetype', String(s.gaugeType || 0));
    document.getElementById('cfg-ccr-default-sp').value = s.ccrDefaultSP || 1.3;
    setRadio('spunits', s.spUnits || 'bar');
    document.getElementById('cfg-rmv-bottom').value = s.rmvBottom || 22;
    document.getElementById('cfg-rmv-deco').value = s.rmvDeco || 20;
    document.getElementById('cfg-rmv-ccr-dil').value = s.rmvDilCCR != null ? s.rmvDilCCR : 1;
    setRadio('extstops', s.extendedStops ? '1' : '0');
    document.getElementById('cfg-ext-deep').value = s.extStopDeep || 1;
    document.getElementById('cfg-ext-shallow').value = s.extStopShallow || 2;
    setRadio('extadd', s.extendAdd ? '1' : '0');
    setRadio('extallmix', s.extendAllMix ? '1' : '0');
    setRadio('exto2window', s.extendO2Window ? '1' : '0');
    updateExtendedStopsLabels();
    document.getElementById('cfg-warn-ppo2hi-on').checked = s.warnPpO2Hi !== false;
    document.getElementById('cfg-warn-ppo2hi').value = s.ppO2HighThreshold || 1.6;
    document.getElementById('cfg-warn-ppo2hi-color').value = s.warnColorPpO2Hi || '#ff8080';
    document.getElementById('cfg-warn-ppo2lo-on').checked = !!s.warnPpO2Lo;
    document.getElementById('cfg-warn-ppo2lo').value = s.ppO2LowThreshold || 0.16;
    document.getElementById('cfg-warn-ppo2lo-color').value = s.warnColorPpO2Lo || '#ff8080';
    document.getElementById('cfg-warn-cns-on').checked = s.warnCNS !== false;
    document.getElementById('cfg-warn-cns-color').value = s.warnColorCNS || '#ffff00';
    document.getElementById('cfg-warn-otu-on').checked = s.warnOTU !== false;
    document.getElementById('cfg-warn-otu-color').value = s.warnColorOTU || '#ffff00';
    document.getElementById('cfg-warn-ibcdn2-on').checked = !!s.warnIBCDN2;
    document.getElementById('cfg-warn-ibcdn2').value = s.ibcdN2Threshold || 0.5;
    document.getElementById('cfg-warn-ibcdn2-color').value = s.warnColorIBCDN2 || '#ff0000';
    document.getElementById('cfg-warn-ibcdhe-on').checked = !!s.warnIBCDHe;
    document.getElementById('cfg-warn-ibcdhe').value = s.ibcdHeThreshold || 0.5;
    document.getElementById('cfg-warn-ibcdhe-color').value = s.warnColorIBCDHe || '#ff0000';
    const ccrDilEl = document.getElementById('cfg-warn-ccrdil-on');
    if (ccrDilEl) ccrDilEl.checked = s.ccrDilCheck !== false;
    const ccrDilColorEl = document.getElementById('cfg-warn-ccrdil-color');
    if (ccrDilColorEl) ccrDilColorEl.value = s.warnColorCCRDil || '#ff8040';
    syncAllWarningColorPreviews();
    setRadio('bailout', s.bailoutActive ? '1' : '0');
    document.getElementById('cfg-bail-model').value = s.bailModel || 'ZHLC_GF';
    document.getElementById('cfg-bail-gflo').value = s.bailGFLo || 30;
    document.getElementById('cfg-bail-gfhi').value = s.bailGFHi || 85;
    document.getElementById('cfg-bail-gfs').value = s.bailGFS || 85;
    document.getElementById('cfg-bail-rmv').value = s.bailRMV || 30;
    setRadio('bailextra', s.bailExtraMin ? '1' : '0');
    document.getElementById('cfg-bail-extra-time').value = s.bailExtraMinTime || 1;
    document.getElementById('cfg-bail-divenum').value = s.bailDiveNum || 1;
    setRadio('bailcave', s.bailCaveBail ? '1' : '0');
    document.getElementById('cfg-bail-cave-portion').value = s.bailCavePortion || 33;
    document.getElementById('cfg-si').value = s.surfaceInterval || 0;
    document.getElementById('cfg-2week-otu').value = s.twoWeekOTU || 0;
    document.getElementById('cfg-travel-o2').value = s.travelO2 || 21;
    document.getElementById('cfg-travel-he').value = s.travelHe || 0;
    setRadio('units', s.metric ? 'metric' : 'imperial');
    setRadio('water', String(s.waterType));
    document.getElementById('cfg-temperature').value = s.temperature != null ? s.temperature : 20;
    setRadio('press-units', s.pressureUnit || 'bar');
    setRadio('oxynarc', s.oxyNarc ? '1' : '0');
    setRadio('circuit', s.circuit || 'OC');
    onModelChange();
    onCircuitChange();
    onExtStopsChange();
    onBailoutChange();
    onBailCaveChange();
}
function resetConfig() {
    showConfirm(window.t ? window.t('CONFIRM_RESET') : 'Reset all settings to defaults?', () => {
        appState.settings = DecoEngine.createDefaultSettings();
        loadConfigToUI();
        if (appState.toolsDefaults) {
            appState.tools = JSON.parse(JSON.stringify(appState.toolsDefaults));
            if (typeof loadMixConfigToUI === 'function') loadMixConfigToUI();
            applyToolsState();
            if (typeof syncMixConfigFromUI === 'function') syncMixConfigFromUI(false);
            toggleBmTrimix();
        }
        updateDepthUnits();
        recalcAllTools();
        saveStateToStorage();
        try {
            localStorage.setItem('apexdeco_theme', 'light');
            const themeSel = document.getElementById('cfg-theme');
            if (themeSel) themeSel.value = 'light';
            if (typeof onThemeChange === 'function') onThemeChange('light');
        } catch (e) {}
        try {
            localStorage.setItem('apexdeco_language', 'en');
            const langSel = document.getElementById('cfg-language');
            if (langSel) langSel.value = 'en';
            if (window.setLanguage) window.setLanguage('en');
        } catch (e) {}
    });
}
function saveConfig() {
    const s = appState.settings;
    const prevMetric = s.metric;
    s.decoModel = document.getElementById('cfg-model').value || 'ZHLC_GF';
    s.gfLo = parseInt(document.getElementById('cfg-gflo').value) || 30;
    s.gfHi = parseInt(document.getElementById('cfg-gfhi').value) || 85;
    s.gfs = parseInt(document.getElementById('cfg-gfs').value) || 85;
    s.conservatism = parseInt(document.getElementById('cfg-conservatism').value) || 0;
    s.altitude = parseInt(document.getElementById('cfg-altitude').value) || 0;
    s.acclimatized = parseInt(document.getElementById('cfg-acclim').value) || 0;
    s.descentRate = parseInt(document.getElementById('cfg-descent').value) || 22;
    s.ascentRate = parseInt(document.getElementById('cfg-ascent').value) || 9;
    s.decoAscentRate = parseInt(document.getElementById('cfg-deco-ascent').value) || 9;
    s.surfaceAscentRate = parseInt(document.getElementById('cfg-surface-ascent').value) || 9;
    s.stepSize = parseInt(document.getElementById('cfg-step').value) || 3;
    s.lastStop = parseInt(document.getElementById('cfg-laststop').value) || 3;
    s.lastStopCCR = parseInt(document.getElementById('cfg-laststop-ccr').value) || 3;
    s.minStopTime = parseFloat(document.getElementById('cfg-stoptime').value) || 1;
    s.ppO2Deco = parseFloat(document.getElementById('cfg-ppo2').value) || 1.6;
    s.ppO2Low = parseFloat(document.getElementById('cfg-ppo2-low').value) || 1.4;
    s.ppO2Mid = parseFloat(document.getElementById('cfg-ppo2-mid').value) || 1.5;
    s.ppO2High = parseFloat(document.getElementById('cfg-ppo2-high').value) || 1.6;
    s.ppO2Bottom = parseFloat(document.getElementById('cfg-ppo2-bottom').value) || 1.4;
    s.o2MaxDepth = parseInt(document.getElementById('cfg-o2-maxdepth').value) || 6;
    s.firstStop30sec = getRadio('firststop30') === '1';
    s.firstStopDoubleStep = getRadio('firststopdbl') === '1';
    s.cnsHigh = parseInt(document.getElementById('cfg-cns').value) || 80;
    s.otuHigh = parseInt(document.getElementById('cfg-otu').value) || 300;
    s.metric = getRadio('units') === 'metric';
    s.waterType = parseInt(getRadio('water')) || 0;
    const _tempVal = parseInt(document.getElementById('cfg-temperature').value);
    s.temperature = Math.max(0, Math.min(35, isNaN(_tempVal) ? 20 : _tempVal));
    s.pressureUnit = getRadio('press-units') || 'bar';
    s.oxyNarc = getRadio('oxynarc') === '1';
    s.circuit = getRadio('circuit') || 'OC';
    s.gasVolUnit = getRadio('gasvol') || 'ltr';
    s.gaugeType = parseInt(getRadio('gaugetype')) || 0;
    s.ccrDefaultSP = parseFloat(document.getElementById('cfg-ccr-default-sp').value) || 1.3;
    s.spUnits = getRadio('spunits') || 'bar';
    s.rmvBottom = parseInt(document.getElementById('cfg-rmv-bottom').value) || 22;
    s.rmvDeco = parseInt(document.getElementById('cfg-rmv-deco').value) || 20;
    s.rmvDilCCR = parseFloat(document.getElementById('cfg-rmv-ccr-dil').value) || 1;
    s.extendedStops = getRadio('extstops') === '1';
    s.extStopDeep = parseInt(document.getElementById('cfg-ext-deep').value) || 0;
    s.extStopShallow = parseInt(document.getElementById('cfg-ext-shallow').value) || 0;
    s.extendAdd = getRadio('extadd') === '1';
    s.extendAllMix = getRadio('extallmix') === '1';
    s.extendO2Window = getRadio('exto2window') === '1';
    s.warnPpO2Hi = document.getElementById('cfg-warn-ppo2hi-on').checked;
    s.ppO2HighThreshold = parseFloat(document.getElementById('cfg-warn-ppo2hi').value) || 1.6;
    s.warnColorPpO2Hi = document.getElementById('cfg-warn-ppo2hi-color').value || '#ff8080';
    s.warnPpO2Lo = document.getElementById('cfg-warn-ppo2lo-on').checked;
    s.ppO2LowThreshold = parseFloat(document.getElementById('cfg-warn-ppo2lo').value) || 0.16;
    s.warnColorPpO2Lo = document.getElementById('cfg-warn-ppo2lo-color').value || '#ff8080';
    s.warnCNS = document.getElementById('cfg-warn-cns-on').checked;
    s.warnColorCNS = document.getElementById('cfg-warn-cns-color').value || '#ffff00';
    s.warnOTU = document.getElementById('cfg-warn-otu-on').checked;
    s.warnColorOTU = document.getElementById('cfg-warn-otu-color').value || '#ffff00';
    s.warnIBCDN2 = document.getElementById('cfg-warn-ibcdn2-on').checked;
    s.ibcdN2Threshold = parseFloat(document.getElementById('cfg-warn-ibcdn2').value) || 0.5;
    s.warnColorIBCDN2 = document.getElementById('cfg-warn-ibcdn2-color').value || '#ff0000';
    s.warnIBCDHe = document.getElementById('cfg-warn-ibcdhe-on').checked;
    s.ibcdHeThreshold = parseFloat(document.getElementById('cfg-warn-ibcdhe').value) || 0.5;
    s.warnColorIBCDHe = document.getElementById('cfg-warn-ibcdhe-color').value || '#ff0000';
    const ccrDilElSave = document.getElementById('cfg-warn-ccrdil-on');
    s.ccrDilCheck = ccrDilElSave ? ccrDilElSave.checked : true;
    const ccrDilColorElSave = document.getElementById('cfg-warn-ccrdil-color');
    s.warnColorCCRDil = ccrDilColorElSave ? (ccrDilColorElSave.value || '#ff8040') : '#ff8040';
    s.bailoutActive = getRadio('bailout') === '1';
    s.bailModel = document.getElementById('cfg-bail-model').value || 'ZHLC_GF';
    s.bailGFLo = parseInt(document.getElementById('cfg-bail-gflo').value) || 30;
    s.bailGFHi = parseInt(document.getElementById('cfg-bail-gfhi').value) || 85;
    s.bailGFS = parseInt(document.getElementById('cfg-bail-gfs').value) || 85;
    s.bailRMV = parseInt(document.getElementById('cfg-bail-rmv').value) || 30;
    s.bailExtraMin = getRadio('bailextra') === '1';
    s.bailExtraMinTime = parseInt(document.getElementById('cfg-bail-extra-time').value) || 1;
    s.bailDiveNum = parseInt(document.getElementById('cfg-bail-divenum').value) || 1;
    s.bailCaveBail = getRadio('bailcave') === '1';
    s.bailCavePortion = parseInt(document.getElementById('cfg-bail-cave-portion').value) || 33;
    s.surfaceInterval = parseInt(document.getElementById('cfg-si').value) || 0;
    s.twoWeekOTU = parseInt(document.getElementById('cfg-2week-otu').value) || 0;
    s.travelO2 = parseInt(document.getElementById('cfg-travel-o2').value) || 21;
    s.travelHe = parseInt(document.getElementById('cfg-travel-he').value) || 0;
    if (prevMetric !== s.metric) {
        convertUnits(prevMetric, s.metric);
    }
    updateDepthUnits();
    renderLevels();
    if (typeof renderDecos === 'function') renderDecos();
    saveStateToStorage();
    recalcAllTools();
}
function convertUnits(wasMetric, isMetric) {
    const s = appState.settings;
    const M_TO_FT = 3.28084;
    if (wasMetric && !isMetric) {
        s.descentRate = Math.round(s.descentRate * M_TO_FT);
        s.ascentRate = Math.round(s.ascentRate * M_TO_FT);
        s.decoAscentRate = Math.round(s.decoAscentRate * M_TO_FT);
        s.surfaceAscentRate = Math.round(s.surfaceAscentRate * M_TO_FT);
        s.o2MaxDepth = Math.round(s.o2MaxDepth * M_TO_FT);
        s.altitude = Math.round(s.altitude * M_TO_FT);
        s.acclimatized = Math.round(s.acclimatized * M_TO_FT);
        for (const l of appState.levels) {
            l.depth = Math.round(l.depth * M_TO_FT);
        }
        for (const d of appState.decos) {
            if ((d.depthOverrideOn === true || d.depthOverrideOn === 1 || d.depthOverrideOn === '1') &&
                Number.isFinite(Number(d.depthOverride)) && Number(d.depthOverride) > 0) {
                d.depthOverride = Math.round(Number(d.depthOverride) * M_TO_FT);
            }
        }
    } else if (!wasMetric && isMetric) {
        s.descentRate = Math.round(s.descentRate / M_TO_FT);
        s.ascentRate = Math.round(s.ascentRate / M_TO_FT);
        s.decoAscentRate = Math.round(s.decoAscentRate / M_TO_FT);
        s.surfaceAscentRate = Math.round(s.surfaceAscentRate / M_TO_FT);
        s.o2MaxDepth = Math.round(s.o2MaxDepth / M_TO_FT);
        s.altitude = Math.round(s.altitude / M_TO_FT);
        s.acclimatized = Math.round(s.acclimatized / M_TO_FT);
        for (const l of appState.levels) {
            l.depth = Math.round(l.depth / M_TO_FT);
        }
        for (const d of appState.decos) {
            if ((d.depthOverrideOn === true || d.depthOverrideOn === 1 || d.depthOverrideOn === '1') &&
                Number.isFinite(Number(d.depthOverride)) && Number(d.depthOverride) > 0) {
                d.depthOverride = Math.round(Number(d.depthOverride) / M_TO_FT);
            }
        }
    }
    loadConfigToUI();
}
function recalcAllTools() {
    const s = appState.settings;
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const pressLabel = (s.pressureUnit === 'psi') ? _t('UNIT_PSI', 'psi') : _t('UNIT_BAR', 'bar');
    document.querySelectorAll('.press-unit').forEach(el => el.textContent = pressLabel);
    const volLabel = (s.gasVolUnit === 'cuft') ? _t('UNIT_CUFT', 'cu.ft') : _t('UNIT_LITERS_WORD', 'liters');
    document.querySelectorAll('.vol-unit').forEach(el => el.textContent = volLabel);
    calcBestMix();
    calcEadMod();
    calcNitrox();
    calcTrimix();
    calcTopUp();
    calcCapacity();
    calcDensity();
}
function updateDepthUnits() {
    const metric = appState.settings.metric;
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const unit = metric ? _t('UNIT_M', 'm') : _t('UNIT_FT', 'ft');
    document.querySelectorAll('.depth-unit').forEach(el => el.textContent = unit);
    const rateUnit = metric ? _t('UNIT_M_MIN', 'm/min') : _t('UNIT_FT_MIN', 'ft/min');
    ['rate-unit', 'rate-unit2', 'rate-unit3', 'rate-unit4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = rateUnit;
    });
    const lMin = _t('UNIT_L_MIN', 'L/min');
    ['rmv-unit', 'rmv-unit2', 'rmv-unit3', 'bail-rmv-unit'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = lMin;
    });
    updateExtendedStopsLabels();
    updateStopSelectLabels();
}
function updateStopSelectLabels() {
    const metric = appState.settings.metric;
    const fmt = (m) => metric ? String(m) : String(Math.round(m * 3.28084));
    const setOpt = (sel, mVals) => {
        if (!sel) return;
        const cur = sel.value;
        for (let i = 0; i < sel.options.length && i < mVals.length; i++) {
            sel.options[i].text = fmt(mVals[i]);
        }
        sel.value = cur;
    };
    setOpt(document.getElementById('cfg-step'), [3, 6]);
    setOpt(document.getElementById('cfg-laststop'), [3, 6]);
    setOpt(document.getElementById('cfg-laststop-ccr'), [3, 6, 9]);
}
function updateExtendedStopsLabels() {
    const metric = appState.settings.metric;
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const u = metric ? _t('UNIT_M', 'm') : _t('UNIT_FT', 'ft');
    const shallow = document.getElementById('cfg-ext-shallow-label');
    const deep = document.getElementById('cfg-ext-deep-label');
    if (shallow) shallow.textContent = metric ? `7..30 ${u}` : `21..100 ${u}`;
    if (deep) deep.textContent = metric ? `30 + ${u}` : `100 + ${u}`;
}
