function sortDebugValue(value) {
    if (Array.isArray(value)) {
        return value.map(sortDebugValue);
    }
    if (value && typeof value === 'object') {
        const out = {};
        Object.keys(value).sort().forEach(key => {
            out[key] = sortDebugValue(value[key]);
        });
        return out;
    }
    return value;
}
function buildJsonDebugSection(title, value) {
    const sorted = sortDebugValue(value);
    return [
        `===== ${title} =====`,
        JSON.stringify(sorted, null, 2),
        '='.repeat(title.length + 12)
    ].join('\n');
}
function getToolPanelTitle(panel, index) {
    const header = panel ? panel.querySelector('.card-header') : null;
    return (header && header.textContent ? header.textContent.trim() : `Tool ${index + 1}`);
}
function getToolElementValue(el) {
    if (!el) return null;
    if (el.type === 'checkbox') return !!el.checked;
    return el.value;
}
function buildToolsDebugText() {
    const screen = document.getElementById('screen-tools');
    const lines = ['===== TOOLS DEBUG ====='];
    if (!screen) {
        lines.push('(screen-tools not found)');
        lines.push('=======================');
        return lines.join('\n');
    }
    const activePanel = screen.querySelector('.tool-panel.active');
    lines.push(`Active Tool Panel: ${activePanel ? getToolPanelTitle(activePanel, 0) : '(none)'}`);
    const panels = Array.from(screen.querySelectorAll('.tool-panel'));
    panels.forEach((panel, index) => {
        const title = getToolPanelTitle(panel, index);
        const radiosSeen = new Set();
        const inputs = {};
        const results = {};
        const warnings = [];
        panel.querySelectorAll('input, select, textarea').forEach((el, elIdx) => {
            if (el.type === 'radio') {
                if (!el.name || radiosSeen.has(el.name)) return;
                radiosSeen.add(el.name);
                const checked = panel.querySelector(`input[name="${el.name}"]:checked`);
                inputs[el.name] = checked ? checked.value : '';
                return;
            }
            const key = el.id || el.name || `${el.tagName.toLowerCase()}_${elIdx + 1}`;
            inputs[key] = getToolElementValue(el);
        });
        panel.querySelectorAll('.stat-value, .result-value').forEach((el, elIdx) => {
            const key = el.id || `result_${elIdx + 1}`;
            results[key] = (el.textContent || '').trim();
        });
        panel.querySelectorAll('.warning').forEach((el, elIdx) => {
            warnings.push({
                id: el.id || `warning_${elIdx + 1}`,
                className: el.className,
                text: (el.textContent || '').trim()
            });
        });
        lines.push(`[${title}]`);
        lines.push('  Inputs:');
        const inputEntries = Object.entries(inputs);
        if (inputEntries.length === 0) {
            lines.push('    (none)');
        } else {
            inputEntries.forEach(([key, value]) => {
                lines.push(`    ${key}: ${value}`);
            });
        }
        lines.push('  Results:');
        const resultEntries = Object.entries(results);
        if (resultEntries.length === 0) {
            lines.push('    (none)');
        } else {
            resultEntries.forEach(([key, value]) => {
                lines.push(`    ${key}: ${value}`);
            });
        }
        lines.push('  Warnings:');
        if (warnings.length === 0) {
            lines.push('    (none)');
        } else {
            warnings.forEach(item => {
                lines.push(`    ${item.id}: ${item.text} [${item.className}]`);
            });
        }
    });
    lines.push('=======================');
    return lines.join('\n');
}
function collectToolsResultsSnapshot() {
    return Array.from(document.querySelectorAll('#screen-tools .tool-panel')).map((panel, idx) => ({
        id: panel.id || `tool_${idx + 1}`,
        title: getToolPanelTitle(panel, idx),
        values: Array.from(panel.querySelectorAll('.stat-value, .result-value, .warning')).map((el, itemIdx) => ({
            id: el.id || `value_${itemIdx + 1}`,
            className: el.className,
            text: (el.textContent || '').trim()
        }))
    }));
}
function collectToolsDebugSettings(settings) {
    const s = settings || {};
    return {
        circuit: s.circuit || 'OC',
        metric: !!s.metric,
        waterType: s.waterType != null ? s.waterType : 0,
        oxyNarc: !!s.oxyNarc,
        gasVolUnit: s.gasVolUnit || 'ltr',
        mix_units: parseInt(s.mix_units, 10) || 0,
        mix_temp_units: parseInt(s.mix_temp_units, 10) || 0,
        mix_temp: parseInt(s.mix_temp, 10) || 0,
        mix_banked32: !!s.mix_banked32
    };
}
function collectToolsDebugConstants() {
    const constants = {};
    if (typeof DiveTools === 'undefined') return constants;
    constants.DiveTools = {};
    Object.keys(DiveTools).sort().forEach(key => {
        if (typeof DiveTools[key] === 'function') return;
        constants.DiveTools[key] = DiveTools[key];
    });
    return constants;
}
function logSettingsToConsole(s) {  }
function logPlanToConsole(result, s) {  }
function copyTextToClipboard(text) {
    const showOK = () => showAlert(window.t ? window.t('MSG_DEBUG_COPIED') : 'Debug Info copied to clipboard.');
    const showFail = () => showAlert(window.t ? window.t('MSG_DEBUG_COPY_FAILED') : 'Failed to copy debug info to clipboard.');
    if (window.Android && typeof window.Android.setClipboardText === 'function') {
        try {
            if (window.Android.setClipboardText(text)) { showOK(); return; }
        } catch (e) {  }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showOK).catch(() => {
            legacyCopy(text) ? showOK() : showFail();
        });
    } else {
        legacyCopy(text) ? showOK() : showFail();
    }
}
function copyDebugToClipboard() {
    let theme = null, language = null;
    try { theme = localStorage.getItem('apexdeco_theme'); } catch (e) {}
    try { language = localStorage.getItem('apexdeco_language'); } catch (e) {}
    const data = {
        settings: appState.settings || {},
        levelsOC: appState.levelsOC || [],
        levelsCCR: appState.levelsCCR || [],
        decos: appState.decos || [],
        theme: theme,
        language: language
    };
    copyTextToClipboard(JSON.stringify(data, null, 2));
}
function loadDebugFromClipboard() {
    const doLoad = (text) => {
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            showAlert(window.t ? window.t('MSG_DEBUG_LOAD_FAILED') : 'Failed to load debug info: invalid JSON.');
            return;
        }
        const loaded = [];
        if (data.settings && typeof data.settings === 'object') {
            appState.settings = Object.assign({}, appState.settings, data.settings);
            if (typeof loadConfigToUI === 'function') loadConfigToUI();
            if (typeof updateDepthUnits === 'function') updateDepthUnits();
            loaded.push('settings');
        }
        if (Array.isArray(data.levelsOC)) {
            appState.levelsOC = data.levelsOC;
            loaded.push('levelsOC');
        }
        if (Array.isArray(data.levelsCCR)) {
            appState.levelsCCR = data.levelsCCR;
            loaded.push('levelsCCR');
        }
        if (Array.isArray(data.decos)) {
            appState.decos = data.decos;
            loaded.push('decos');
        }
        if (typeof data.theme === 'string' && data.theme) {
            try { localStorage.setItem('apexdeco_theme', data.theme); } catch (e) {}
            const themeSel = document.getElementById('cfg-theme');
            if (themeSel) themeSel.value = data.theme;
            if (typeof onThemeChange === 'function') onThemeChange(data.theme);
            loaded.push('theme');
        }
        if (typeof data.language === 'string' && data.language) {
            try { localStorage.setItem('apexdeco_language', data.language); } catch (e) {}
            const langSel = document.getElementById('cfg-language');
            if (langSel) langSel.value = data.language;
            if (window.setLanguage) window.setLanguage(data.language);
            loaded.push('language');
        }
        if (loaded.length === 0) {
            showAlert(window.t ? window.t('MSG_DEBUG_LOAD_FAILED') : 'Failed to load debug info: no recognized data.');
            return;
        }
        applyLevelsForCircuit();
        if (typeof renderLevels === 'function') renderLevels();
        if (typeof renderDecos === 'function') renderDecos();
        saveStateToStorage();
        showAlert(window.t ? window.t('MSG_DEBUG_LOADED') : 'Debug info loaded from clipboard.');
    };
    if (window.Android && typeof window.Android.getClipboardText === 'function') {
        try {
            const text = window.Android.getClipboardText() || '';
            doLoad(text);
            return;
        } catch (e) {  }
    }
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(doLoad).catch(() => {
            showAlert(window.t ? window.t('MSG_DEBUG_LOAD_FAILED') : 'Failed to read clipboard.');
        });
    } else {
        showAlert(window.t ? window.t('MSG_DEBUG_LOAD_FAILED') : 'Clipboard read not supported in this browser.');
    }
}
function copyToolsDebugToClipboard() {
    const sections = [
        buildToolsDebugText(),
        buildJsonDebugSection('TOOLS STATE RAW JSON', typeof captureToolsState === 'function' ? captureToolsState() : {}),
        buildJsonDebugSection('TOOLS RESULTS RAW JSON', collectToolsResultsSnapshot()),
        buildJsonDebugSection('TOOLS SETTINGS RAW JSON', collectToolsDebugSettings(appState.settings)),
        buildJsonDebugSection('TOOLS CONSTANTS RAW JSON', collectToolsDebugConstants())
    ];
    copyTextToClipboard(sections.join('\n\n'));
}
