/**
 * ApexDeco - Global State, Persistence & Utility Helpers
 */

// ===== STATE =====
let appState = {
    levels: [],       // [{depth, time, o2, he, selected}]
    decos: [],        // [{o2, he, selected}]
    lastResult: null,
    settings: null,
    tools: null,
    editLevelIdx: -1,
    editDecoIdx: -1
};

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
            levels: appState.levels,
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
        if (data.levels) appState.levels = data.levels;
        if (data.decos) appState.decos = data.decos;
        if (data.settings) appState.settings = { ...appState.settings, ...data.settings };
        if (data.tools) appState.tools = data.tools;
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
