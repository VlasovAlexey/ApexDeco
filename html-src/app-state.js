/**
 * ApexDeco - Global State, Persistence & Utility Helpers
 */

// ===== STATE =====
let appState = {
    levels: [],       // active list — alias for levelsOC or levelsCCR depending on circuit
    levelsOC: [],     // OC bottom levels
    levelsCCR: [],    // CCR bottom levels (with optional .setpoint, .oc, .scr per level)
    decos: [],        // [{o2, he, selected}]
    lastResult: null,
    settings: null,
    tools: null,
    editLevelIdx: -1,
    editDecoIdx: -1
};

// Switch active levels list according to current circuit. Call after settings.circuit changes.
function applyLevelsForCircuit() {
    const isCCR = appState.settings && appState.settings.circuit === 'CCR';
    appState.levels = isCCR ? appState.levelsCCR : appState.levelsOC;
}

// ===== HELPERS =====
function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
}

function setRadio(name, value) {
    const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (el) el.checked = true;
}

// ===== PERSISTENCE (localStorage) =====
function saveStateToStorage() {
    try {
        const data = {
            levelsOC: appState.levelsOC,
            levelsCCR: appState.levelsCCR,
            decos: appState.decos,
            settings: appState.settings,
            tools: captureToolsState()
        };
        localStorage.setItem('multideco_state', JSON.stringify(data));
    } catch (e) { /* ignore */ }
}

function loadStateFromStorage() {
    try {
        const raw = localStorage.getItem('multideco_state');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.levelsOC) appState.levelsOC = data.levelsOC;
        if (data.levelsCCR) appState.levelsCCR = data.levelsCCR;
        // Backwards compat: older storage put one merged "levels" array
        if (!data.levelsOC && !data.levelsCCR && Array.isArray(data.levels)) {
            const wasCCR = data.settings && data.settings.circuit === 'CCR';
            if (wasCCR) appState.levelsCCR = data.levels;
            else appState.levelsOC = data.levels;
        }
        if (data.decos) appState.decos = data.decos;
        if (data.settings) appState.settings = { ...appState.settings, ...data.settings };
        if (data.tools) appState.tools = data.tools;
        applyLevelsForCircuit();
    } catch (e) { /* ignore */ }
}

// ===== TOOLS STATE (inputs/selects/radios inside #screen-tools) =====
function captureToolsState() {
    const screen = document.getElementById('screen-tools');
    if (!screen) return appState.tools || {};
    const state = { values: {}, radios: {} };
    screen.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'radio') {
            if (el.checked && el.name) state.radios[el.name] = el.value;
        } else if (el.type === 'checkbox') {
            if (el.id) state.values[el.id] = el.checked;
        } else if (el.id) {
            state.values[el.id] = el.value;
        }
    });
    return state;
}

function applyToolsState() {
    const screen = document.getElementById('screen-tools');
    if (!screen || !appState.tools) return;
    const { values = {}, radios = {} } = appState.tools;
    for (const [id, v] of Object.entries(values)) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v;
    }
    for (const [name, v] of Object.entries(radios)) {
        const el = screen.querySelector(`input[name="${name}"][value="${v}"]`);
        if (el) el.checked = true;
    }
}
