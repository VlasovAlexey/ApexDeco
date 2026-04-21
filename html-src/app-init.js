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
});
