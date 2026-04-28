/**
 * ApexDeco - Settings UI, Load/Save/Reset Config, Unit Conversion & Tools Recalc
 */

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

    // CCR
    document.getElementById('cfg-ccr-default-sp').value = s.ccrDefaultSP || 1.3;
    setRadio('spunits', s.spUnits || 'bar');

    // RMV
    document.getElementById('cfg-rmv-bottom').value = s.rmvBottom || 22;
    document.getElementById('cfg-rmv-deco').value = s.rmvDeco || 20;

    // Extended stops
    setRadio('extstops', s.extendedStops ? '1' : '0');
    document.getElementById('cfg-ext-deep').value = s.extStopDeep || 1;
    document.getElementById('cfg-ext-shallow').value = s.extStopShallow || 2;
    setRadio('extadd', s.extendAdd ? '1' : '0');
    setRadio('extallmix', s.extendAllMix ? '1' : '0');
    setRadio('exto2window', s.extendO2Window ? '1' : '0');
    updateExtendedStopsLabels();

    // Warnings
    document.getElementById('cfg-warn-ppo2hi-on').checked = s.warnPpO2Hi !== false;
    document.getElementById('cfg-warn-ppo2hi').value = s.ppO2HighThreshold || 1.6;
    document.getElementById('cfg-warn-ppo2lo-on').checked = !!s.warnPpO2Lo;
    document.getElementById('cfg-warn-ppo2lo').value = s.ppO2LowThreshold || 0.16;
    document.getElementById('cfg-warn-cns-on').checked = s.warnCNS !== false;
    document.getElementById('cfg-warn-otu-on').checked = s.warnOTU !== false;
    document.getElementById('cfg-warn-ibcdn2-on').checked = !!s.warnIBCDN2;
    document.getElementById('cfg-warn-ibcdn2').value = s.ibcdN2Threshold || 0.5;
    document.getElementById('cfg-warn-ibcdhe-on').checked = !!s.warnIBCDHe;
    document.getElementById('cfg-warn-ibcdhe').value = s.ibcdHeThreshold || 0.5;
    // CCR diluent check — checkbox (default on)
    const ccrDilEl = document.getElementById('cfg-warn-ccrdil-on');
    if (ccrDilEl) ccrDilEl.checked = s.ccrDilCheck !== false;

    // Bailout
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

    // Surface interval / Multi-dive
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
        // Reset Tools inputs to their HTML defaults captured at init
        if (appState.toolsDefaults) {
            appState.tools = JSON.parse(JSON.stringify(appState.toolsDefaults));
            applyToolsState();
            toggleBmTrimix();
        }
        updateDepthUnits();
        recalcAllTools();
        saveStateToStorage();

        // Reset theme to light
        try {
            localStorage.setItem('apexdeco_theme', 'light');
            const themeSel = document.getElementById('cfg-theme');
            if (themeSel) themeSel.value = 'light';
            if (typeof onThemeChange === 'function') onThemeChange('light');
        } catch (e) {}

        // Reset language to English
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

    // CCR
    s.ccrDefaultSP = parseFloat(document.getElementById('cfg-ccr-default-sp').value) || 1.3;
    s.spUnits = getRadio('spunits') || 'bar';

    // RMV
    s.rmvBottom = parseInt(document.getElementById('cfg-rmv-bottom').value) || 22;
    s.rmvDeco = parseInt(document.getElementById('cfg-rmv-deco').value) || 20;

    // Extended stops
    s.extendedStops = getRadio('extstops') === '1';
    s.extStopDeep = parseInt(document.getElementById('cfg-ext-deep').value) || 0;
    s.extStopShallow = parseInt(document.getElementById('cfg-ext-shallow').value) || 0;
    s.extendAdd = getRadio('extadd') === '1';
    s.extendAllMix = getRadio('extallmix') === '1';
    s.extendO2Window = getRadio('exto2window') === '1';

    // Warnings
    s.warnPpO2Hi = document.getElementById('cfg-warn-ppo2hi-on').checked;
    s.ppO2HighThreshold = parseFloat(document.getElementById('cfg-warn-ppo2hi').value) || 1.6;
    s.warnPpO2Lo = document.getElementById('cfg-warn-ppo2lo-on').checked;
    s.ppO2LowThreshold = parseFloat(document.getElementById('cfg-warn-ppo2lo').value) || 0.16;
    s.warnCNS = document.getElementById('cfg-warn-cns-on').checked;
    s.warnOTU = document.getElementById('cfg-warn-otu-on').checked;
    s.warnIBCDN2 = document.getElementById('cfg-warn-ibcdn2-on').checked;
    s.ibcdN2Threshold = parseFloat(document.getElementById('cfg-warn-ibcdn2').value) || 0.5;
    s.warnIBCDHe = document.getElementById('cfg-warn-ibcdhe-on').checked;
    s.ibcdHeThreshold = parseFloat(document.getElementById('cfg-warn-ibcdhe').value) || 0.5;
    const ccrDilElSave = document.getElementById('cfg-warn-ccrdil-on');
    s.ccrDilCheck = ccrDilElSave ? ccrDilElSave.checked : true;

    // Bailout
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

    // Surface interval / Multi-dive
    s.surfaceInterval = parseInt(document.getElementById('cfg-si').value) || 0;
    s.twoWeekOTU = parseInt(document.getElementById('cfg-2week-otu').value) || 0;
    s.travelO2 = parseInt(document.getElementById('cfg-travel-o2').value) || 21;
    s.travelHe = parseInt(document.getElementById('cfg-travel-he').value) || 0;

    // Unit conversion when switching metric <-> imperial
    if (prevMetric !== s.metric) {
        convertUnits(prevMetric, s.metric);
    }

    updateDepthUnits();
    renderLevels();
    saveStateToStorage();
    // Recalculate all tools so they pick up changed settings (waterType, oxyNarc, metric, etc.)
    recalcAllTools();
}

/**
 * Convert depth/rate values when switching between metric and imperial.
 * Matches Android MultiDeco conversion: m->ft multiply by 3.28084 and round,
 * ft->m divide by 3.28084 and round.
 */
function convertUnits(wasMetric, isMetric) {
    const s = appState.settings;
    const M_TO_FT = 3.28084;

    if (wasMetric && !isMetric) {
        // Metric -> Imperial
        s.descentRate = Math.round(s.descentRate * M_TO_FT);
        s.ascentRate = Math.round(s.ascentRate * M_TO_FT);
        s.decoAscentRate = Math.round(s.decoAscentRate * M_TO_FT);
        s.surfaceAscentRate = Math.round(s.surfaceAscentRate * M_TO_FT);
        s.o2MaxDepth = Math.round(s.o2MaxDepth * M_TO_FT);
        s.altitude = Math.round(s.altitude * M_TO_FT);
        s.acclimatized = Math.round(s.acclimatized * M_TO_FT);
        // Convert bottom levels depths
        for (const l of appState.levels) {
            l.depth = Math.round(l.depth * M_TO_FT);
        }
    } else if (!wasMetric && isMetric) {
        // Imperial -> Metric
        s.descentRate = Math.round(s.descentRate / M_TO_FT);
        s.ascentRate = Math.round(s.ascentRate / M_TO_FT);
        s.decoAscentRate = Math.round(s.decoAscentRate / M_TO_FT);
        s.surfaceAscentRate = Math.round(s.surfaceAscentRate / M_TO_FT);
        s.o2MaxDepth = Math.round(s.o2MaxDepth / M_TO_FT);
        s.altitude = Math.round(s.altitude / M_TO_FT);
        s.acclimatized = Math.round(s.acclimatized / M_TO_FT);
        // Convert bottom levels depths
        for (const l of appState.levels) {
            l.depth = Math.round(l.depth / M_TO_FT);
        }
    }
    // Note: stepSize, lastStop, lastStopCCR always stored in metric (3/6/9m).
    // The engine converts internally when in imperial mode.

    // Update the UI with converted values
    loadConfigToUI();
}

function recalcAllTools() {
    const s = appState.settings;
    const _t = (k, d) => (window.t ? window.t(k) : d);
    // Update pressure unit labels across all tools
    const pressLabel = (s.pressureUnit === 'psi') ? _t('UNIT_PSI', 'psi') : _t('UNIT_BAR', 'bar');
    document.querySelectorAll('.press-unit').forEach(el => el.textContent = pressLabel);
    // Update volume unit labels in Capacity tool
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
    ['rmv-unit', 'rmv-unit2', 'bail-rmv-unit'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = lMin;
    });
    updateExtendedStopsLabels();
    updateStopSelectLabels();
}

// Rebuild option labels for Step Size / Last Stop (OC) / Last Stop (CCR)
// Option `value` is always stored in metres (3/6/9). Display text shows the
// equivalent in metres or feet depending on the active unit setting.
// Conversion: 3m -> 10ft, 6m -> 20ft, 9m -> 30ft.
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

// Switch Extended Stops range labels between metric and imperial
function updateExtendedStopsLabels() {
    const metric = appState.settings.metric;
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const u = metric ? _t('UNIT_M', 'm') : _t('UNIT_FT', 'ft');
    const shallow = document.getElementById('cfg-ext-shallow-label');
    const deep = document.getElementById('cfg-ext-deep-label');
    if (shallow) shallow.textContent = metric ? `7..30 ${u}` : `21..100 ${u}`;
    if (deep) deep.textContent = metric ? `30 + ${u}` : `100 + ${u}`;
}
