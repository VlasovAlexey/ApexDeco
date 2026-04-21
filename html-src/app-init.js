/**
 * ApexDeco - DOMContentLoaded Initialization (load LAST)
 */

document.addEventListener('DOMContentLoaded', () => {
    appState.settings = DecoEngine.createDefaultSettings();
    loadStateFromStorage();
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
