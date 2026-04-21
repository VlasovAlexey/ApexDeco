/**
 * ApexDeco - Screen Navigation
 */

function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + name);
    if (screen) screen.classList.add('active');

    document.querySelectorAll('.app-bar-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.app-bar-btn');
    btns.forEach(b => {
        if (b.textContent.trim().toLowerCase() === name ||
            (name === 'main' && b.textContent.trim() === 'Plan') ||
            (name === 'result' && b.textContent.trim() === 'Plan')) {
            b.classList.add('active');
        }
    });

    if (name === 'config') loadConfigToUI();
    if (name === 'result' && appState.lastResult) renderResult(appState.lastResult);

    // Sticky result action bar visibility
    const actionBar = document.getElementById('result-actionbar');
    if (actionBar) {
        if (name === 'result') actionBar.classList.add('visible');
        else actionBar.classList.remove('visible');
    }
}
