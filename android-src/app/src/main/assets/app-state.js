/**
 * ApexDeco - Global State, Persistence & Utility Helpers
 */

// ===== STATE =====
let appState = {
    levels: [],       // [{depth, time, o2, he, selected}]
    decos: [],        // [{o2, he, selected}]
    lastResult: null,
    settings: null,
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
            settings: appState.settings
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
    } catch (e) { /* ignore */ }
}
