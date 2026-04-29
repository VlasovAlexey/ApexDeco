/**
 * ApexDeco - DOMContentLoaded Initialization (load LAST)
 */

document.addEventListener('DOMContentLoaded', () => {
    appState.settings = DecoEngine.createDefaultSettings();
    // Snapshot the HTML-defined default values of all Tools inputs
    // BEFORE restoring persisted state, so Reset Configuration can restore them.
    appState.toolsDefaults = captureToolsState();
    loadStateFromStorage();
    applyLevelsForCircuit();
    loadConfigToUI();
    applyToolsState();
    renderLevels();
    renderDecos();
    updateDepthUnits();

    // Auto-save config on any change in settings screen
    const cfgScreen = document.getElementById('screen-config');
    if (cfgScreen) {
        cfgScreen.addEventListener('change', () => saveConfig());
    }

    // Auto-calculate tools on any input change
    const toolPanelMap = {
        'tool-bestmix': calcBestMix,
        'tool-eadmod': calcEadMod,
        'tool-nitrox': calcNitrox,
        'tool-trimix': calcTrimix,
        'tool-topup': calcTopUp,
        'tool-capacity': calcCapacity,
        'tool-density': calcDensity
    };
    for (const [panelId, fn] of Object.entries(toolPanelMap)) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.addEventListener('change', fn);
            panel.addEventListener('input', fn);
        }
    }

    // Persist tool inputs whenever anything on the Tools screen changes
    const toolsScreen = document.getElementById('screen-tools');
    if (toolsScreen) {
        const persist = () => saveStateToStorage();
        toolsScreen.addEventListener('change', persist);
        toolsScreen.addEventListener('input', persist);
    }

    // Re-render dynamic lists and recalculate tools on language change
    // (so that "No bottom levels...", modal titles, and tool unit labels update).
    document.addEventListener('languagechange', () => {
        if (typeof renderLevels === 'function') renderLevels();
        if (typeof renderDecos === 'function') renderDecos();
        if (typeof updateDepthUnits === 'function') updateDepthUnits();
        if (typeof recalcAllTools === 'function') recalcAllTools();
        if (appState && appState.lastResult && typeof renderResult === 'function') {
            try { renderResult(appState.lastResult); } catch (e) {}
        }
        // Re-render Help in the new language (clears the per-language cache key).
        const helpRoot = document.getElementById('screen-help');
        if (helpRoot) {
            helpRoot.dataset.rendered = '';
            if (helpRoot.classList.contains('active') && typeof renderHelp === 'function') renderHelp();
        }
    });

    // Fix EAD row visibility based on initial radio state
    toggleBmTrimix();
    // Trigger initial calculations for all tools (also updates unit labels)
    recalcAllTools();

    // Demo mode for README screenshots: ?demo=plan|empty|settings|tools|about
    const params = new URLSearchParams(location.search);
    const demo = params.get('demo');
    if (demo) {
        if (demo === 'plan') {
            appState.levels = [
                { depth: 50, time: 25, o2: 18, he: 45, selected: true },
                { depth: 30, time: 15, o2: 18, he: 45, selected: true }
            ];
            appState.decos = [
                { o2: 50, he: 0, selected: true },
                { o2: 100, he: 0, selected: true }
            ];
            appState.settings.decoModel = 'VPMB';
            appState.settings.conservatism = 2;
            renderLevels();
            renderDecos();
            setTimeout(() => calculateDeco(), 50);
        } else if (demo === 'empty') {
            showScreen('main');
        } else if (demo === 'settings') {
            showScreen('config');
        } else if (demo === 'tools') {
            showScreen('tools');
        } else if (demo === 'about') {
            showScreen('about');
        }
    }
});

// Haptic feedback bridge for Android WebView wrapper (no-op in browser).
(function () {
    function fireHaptic() {
        try {
            if (typeof Android !== 'undefined' && Android.haptic) { Android.haptic(); }
            else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptic) {
                window.webkit.messageHandlers.haptic.postMessage('');
            } else if (navigator.vibrate) { navigator.vibrate(20); }
        } catch (e) {}
    }
    var selector = 'button, a, input[type="button"], input[type="submit"], ' +
        'input[type="checkbox"], input[type="radio"], select, ' +
        '.nav-btn, .tab, [role="button"], [data-action]';
    document.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest(selector)) fireHaptic();
    }, true);
})();
