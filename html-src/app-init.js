function shouldUseMobileNumericKeyboard() {
    try {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    } catch (e) {}
    try {
        if ((navigator.maxTouchPoints || 0) > 1) return true;
    } catch (e) {}
    const ua = (navigator.userAgent || navigator.vendor || '');
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}
function normalizeNumericInputValue(rawValue) {
    const compact = String(rawValue || '')
        .replace(/\s+/g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '');
    const firstDot = compact.indexOf('.');
    if (firstDot === -1) return compact;
    return compact.slice(0, firstDot + 1) + compact.slice(firstDot + 1).replace(/\./g, '');
}
function enhanceMobileNumericInputs() {
    if (!shouldUseMobileNumericKeyboard()) return;
    document.querySelectorAll('input[type="number"]').forEach((input) => {
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('pattern', '[0-9]*[\\.,]?[0-9]*');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        input.dataset.mobileNumeric = '1';
    });
    const normalizeTarget = (input) => {
        if (!input || input.tagName !== 'INPUT' || input.type !== 'number' || input.dataset.mobileNumeric !== '1') return;
        const normalized = normalizeNumericInputValue(input.value);
        if (normalized !== input.value) input.value = normalized;
    };
    document.addEventListener('beforeinput', (e) => {
        const input = e.target;
        if (!input || input.tagName !== 'INPUT' || input.type !== 'number' || input.dataset.mobileNumeric !== '1') return;
        if (typeof e.data === 'string' && e.inputType && e.inputType.startsWith('insert') && /[^0-9.,]/.test(e.data)) {
            e.preventDefault();
        }
    }, true);
    document.addEventListener('input', (e) => normalizeTarget(e.target), true);
    document.addEventListener('change', (e) => normalizeTarget(e.target), true);
}
function adjustAppBarTitleDensity() {
    const bar = document.querySelector('.app-bar');
    const title = bar && bar.querySelector('h1');
    if (!bar || !title) return;
    const buttons = Array.from(bar.querySelectorAll('.app-bar-btn'));
    if (!buttons.length) return;

    bar.classList.remove('app-bar-tight', 'app-bar-very-tight');

    const style = window.getComputedStyle(bar);
    const horizontalPadding = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
    const available = Math.max(0, bar.clientWidth - horizontalPadding);
    const navWidth = buttons.reduce((sum, btn) => {
        const btnStyle = window.getComputedStyle(btn);
        const margins = parseFloat(btnStyle.marginLeft || '0') + parseFloat(btnStyle.marginRight || '0');
        return sum + btn.getBoundingClientRect().width + margins;
    }, 0);
    const titleNeed = title.scrollWidth;
    const remaining = available - navWidth;

    if (navWidth > available * 0.78 || remaining < 54) {
        bar.classList.add('app-bar-very-tight');
    } else if (navWidth + titleNeed > available || navWidth > available * 0.66 || remaining < 88) {
        bar.classList.add('app-bar-tight');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    appState.settings = DecoEngine.createDefaultSettings();
    enhanceMobileNumericInputs();
    appState.toolsDefaults = captureToolsState();
    loadStateFromStorage();
    applyLevelsForCircuit();
    loadConfigToUI();
    if (typeof loadMixConfigToUI === 'function') loadMixConfigToUI();
    applyToolsState();
    if (typeof syncMixConfigFromUI === 'function') syncMixConfigFromUI(false);
    renderLevels();
    renderDecos();
    updateDepthUnits();
    adjustAppBarTitleDensity();
    const cfgScreen = document.getElementById('screen-config');
    if (cfgScreen) {
        cfgScreen.addEventListener('change', () => saveConfig());
    }
    const toolPanelMap = {
        'tool-eadmod': calcEadMod,
        'tool-bestmix': calcBestMix,
        'tool-mixconfig': onMixConfigChange,
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
    const toolsScreen = document.getElementById('screen-tools');
    if (toolsScreen) {
        const persist = () => saveStateToStorage();
        toolsScreen.addEventListener('change', persist);
        toolsScreen.addEventListener('input', persist);
    }
    document.addEventListener('languagechange', () => {
        setTimeout(adjustAppBarTitleDensity, 0);
        if (typeof renderLevels === 'function') renderLevels();
        if (typeof renderDecos === 'function') renderDecos();
        if (typeof updateDepthUnits === 'function') updateDepthUnits();
        if (typeof recalcAllTools === 'function') recalcAllTools();
        if (appState && appState.lastResult && typeof renderResult === 'function') {
            try { renderResult(appState.lastResult); } catch (e) {}
        }
        const helpRoot = document.getElementById('screen-help');
        if (helpRoot) {
            helpRoot.dataset.rendered = '';
            if (helpRoot.classList.contains('active') && typeof renderHelp === 'function') renderHelp();
        }
    });
    window.addEventListener('resize', adjustAppBarTitleDensity);
    toggleBmTrimix();
    toggleEadModSPRow();
    toggleDensityModeRows();
    recalcAllTools();
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
(function () {
    let lastHapticAt = 0;
    function canFireHaptic(minIntervalMs) {
        const now = Date.now();
        const interval = minIntervalMs || 0;
        if (now - lastHapticAt < interval) return false;
        lastHapticAt = now;
        return true;
    }
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
        if (e.target && e.target.closest && e.target.closest(selector) && canFireHaptic(30)) fireHaptic();
    }, true);
    document.addEventListener('input', function (e) {
        const target = e.target;
        if (!e.isTrusted || !target || target.tagName !== 'INPUT' || target.type !== 'number') return;
        if (!canFireHaptic(25)) return;
        fireHaptic();
    }, true);
    document.addEventListener('focusin', function (e) {
        const target = e.target;
        if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
        if (!canFireHaptic(60)) return;
        fireHaptic();
    }, true);
})();
