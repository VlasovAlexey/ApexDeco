/**
 * ApexDeco - Tools Screen UI Functions
 */

function showTool(name, btn) {
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tool-' + name).classList.add('active');
    if (btn) btn.classList.add('active');
}

function toggleBmTrimix() {
    const val = getRadio('bm-trimix');
    document.getElementById('bm-ead-row').style.display = val === '1' ? 'flex' : 'none';
}

function calcBestMix() {
    const depth = parseFloat(document.getElementById('bm-depth').value) || 30;
    const ppO2 = parseFloat(document.getElementById('bm-ppo2').value) || 1.4;
    const trimix = getRadio('bm-trimix') === '1';
    const eadDepth = parseFloat(document.getElementById('bm-ead').value) || 30;
    const s = appState.settings;

    const result = DiveTools.bestMix(depth, ppO2, s.metric, s.waterType, trimix, eadDepth, s.oxyNarc);

    const _t = (k, d) => (window.t ? window.t(k) : d);
    let mixStr = result.he > 0
        ? `${result.o2}/${result.he} (${_t('GAS_TRIMIX', 'Trimix')})`
        : `${result.o2}% O2 (${_t('GAS_NITROX', 'Nitrox')})`;
    document.getElementById('bm-result-value').textContent = mixStr;
}

function calcEadMod() {
    const o2 = parseFloat(document.getElementById('em-o2').value) || 21;
    const he = parseFloat(document.getElementById('em-he').value) || 0;
    const depth = parseFloat(document.getElementById('em-depth').value) || 30;
    const ppO2 = parseFloat(document.getElementById('em-ppo2').value) || 1.4;
    const sp = parseFloat(document.getElementById('em-sp').value) || 0;
    const s = appState.settings;

    const result = DiveTools.eadMod(o2, he, depth, s.metric, s.waterType, ppO2, s.oxyNarc, sp);
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const unit = s.metric ? _t('UNIT_M', 'm') : ((window.getCurrentLanguage && window.getCurrentLanguage() === 'ru') ? 'ф' : _t('UNIT_FT', 'ft'));

    document.getElementById('em-mod').textContent = result.mod + ' ' + unit;
    document.getElementById('em-ead').textContent = result.ead + ' ' + unit;
    document.getElementById('em-end').textContent = result.end + ' ' + unit;
    document.getElementById('em-eadd').textContent = result.eadd + ' ' + unit;
}

function calcNitrox() {
    const startP = parseFloat(document.getElementById('nx-startP').value) || 0;
    const startO2 = parseFloat(document.getElementById('nx-startO2').value) || 21;
    const endP = parseFloat(document.getElementById('nx-endP').value) || 200;
    const endO2 = parseFloat(document.getElementById('nx-endO2').value) || 32;
    const s = appState.settings;
    const isPSI = s.pressureUnit === 'psi';
    const tempC = s.temperature != null ? s.temperature : 20;

    const result = DiveTools.mixNitrox(startP, startO2, endP, endO2, isPSI, tempC);
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const pressUnit = ' ' + (isPSI ? _t('UNIT_PSI', 'psi') : _t('UNIT_BAR', 'bar'));

    document.getElementById('nx-addO2').textContent = result.addO2.toFixed(1) + pressUnit;
    document.getElementById('nx-addAir').textContent = result.addAir.toFixed(1) + pressUnit;

    if (!result.valid) {
        document.getElementById('nx-results').innerHTML += '<div class="warning error">' + (window.t ? window.t('WARN_INVALID_MIX') : 'Invalid mix - check values.') + '</div>';
    }
}

function calcTrimix() {
    const startP = parseFloat(document.getElementById('tx-startP').value) || 0;
    const startO2 = parseFloat(document.getElementById('tx-startO2').value) || 21;
    const startHe = parseFloat(document.getElementById('tx-startHe').value) || 0;
    const endP = parseFloat(document.getElementById('tx-endP').value) || 200;
    const endO2 = parseFloat(document.getElementById('tx-endO2').value) || 21;
    const endHe = parseFloat(document.getElementById('tx-endHe').value) || 35;
    const heFirst = getRadio('tx-order') === 'he';
    const s = appState.settings;
    const isPSI = s.pressureUnit === 'psi';
    const tempC = s.temperature != null ? s.temperature : 20;

    const result = DiveTools.mixTrimix(startP, startO2, startHe, endP, endO2, endHe, isPSI, heFirst, tempC);
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const pressUnit = ' ' + (isPSI ? _t('UNIT_PSI', 'psi') : _t('UNIT_BAR', 'bar'));

    document.getElementById('tx-addHe').textContent = result.addHe.toFixed(1) + pressUnit;
    document.getElementById('tx-addO2').textContent = result.addO2.toFixed(1) + pressUnit;
    document.getElementById('tx-addAir').textContent = result.addAir.toFixed(1) + pressUnit;
    document.getElementById('tx-testO2').textContent = result.testO2.toFixed(1) + '%';
}

function calcTopUp() {
    const s = appState.settings;
    const isPSI = s.pressureUnit === 'psi';
    const BAR_PER_PSI = 0.0689476;

    const startP = parseFloat(document.getElementById('tu-startP').value) || 0;
    const startO2 = parseFloat(document.getElementById('tu-startO2').value) || 21;
    const startHe = parseFloat(document.getElementById('tu-startHe').value) || 0;
    const addP = parseFloat(document.getElementById('tu-addP').value) || 0;
    const topO2 = parseFloat(document.getElementById('tu-topO2').value) || 21;
    const topHe = parseFloat(document.getElementById('tu-topHe').value) || 0;
    const tempC = s.temperature != null ? s.temperature : 20;

    // topUp works in BAR internally; convert PSI inputs → BAR, result → PSI
    const startPBar = isPSI ? startP * BAR_PER_PSI : startP;
    const addPBar   = isPSI ? addP   * BAR_PER_PSI : addP;

    const result = DiveTools.topUp(startPBar, startO2, startHe, addPBar, topO2, topHe, tempC);

    const finalP = isPSI ? result.finalPressure / BAR_PER_PSI : result.finalPressure;
    document.getElementById('tu-finalO2').textContent = result.finalO2.toFixed(1) + '%';
    document.getElementById('tu-finalHe').textContent = result.finalHe.toFixed(1) + '%';
    document.getElementById('tu-finalP').textContent = finalP.toFixed(0);
}

function calcCapacity() {
    const s = appState.settings;
    const isPSI = s.pressureUnit === 'psi';
    const isCuFt = s.gasVolUnit === 'cuft';
    const BAR_PER_PSI = 0.0689476;
    const LITERS_PER_CUFT = 28.3168;

    const supplySize = parseFloat(document.getElementById('cap-supplySize').value) || 50;
    const supplyP = parseFloat(document.getElementById('cap-supplyP').value) || 200;
    const recvSize = parseFloat(document.getElementById('cap-recvSize').value) || 12;
    const recvP = parseFloat(document.getElementById('cap-recvP').value) || 50;
    const tempC = s.temperature != null ? s.temperature : 20;

    // equalize works in BAR + liters internally; convert inputs as needed
    const supplyPBar  = isPSI ? supplyP   * BAR_PER_PSI    : supplyP;
    const recvPBar    = isPSI ? recvP     * BAR_PER_PSI    : recvP;
    const supplySizeL = isCuFt ? supplySize * LITERS_PER_CUFT : supplySize;
    const recvSizeL   = isCuFt ? recvSize   * LITERS_PER_CUFT : recvSize;

    const result = DiveTools.equalize(supplySizeL, supplyPBar, recvSizeL, recvPBar, tempC);

    const eqP = isPSI ? result.equalizedPressure / BAR_PER_PSI : result.equalizedPressure;
    document.getElementById('cap-eqP').textContent = eqP.toFixed(1);
}

function calcDensity() {
    const o2 = parseFloat(document.getElementById('dens-o2').value) || 21;
    const he = parseFloat(document.getElementById('dens-he').value) || 0;
    const depth = parseFloat(document.getElementById('dens-depth').value) || 30;
    const sp = parseFloat(document.getElementById('dens-sp').value) || 0;
    const s = appState.settings;
    const tempC = s.temperature != null ? s.temperature : 20;

    const result = DiveTools.gasDensity(o2, he, depth, s.metric, s.waterType, tempC, sp);

    document.getElementById('dens-val').textContent = result.gramsPerLiter.toFixed(2);
    document.getElementById('dens-ata').textContent = result.ata.toFixed(2);

    const warnEl = document.getElementById('dens-warning');
    if (result.gramsPerLiter > 6.2) {
        warnEl.style.display = 'block';
        warnEl.textContent = window.t ? window.t('WARN_DENSITY_HIGH') : 'Gas density exceeds 6.2 g/L - high risk of CO2 retention!';
        warnEl.className = 'warning error';
    } else if (result.gramsPerLiter > 5.2) {
        warnEl.style.display = 'block';
        warnEl.textContent = window.t ? window.t('WARN_DENSITY_MEDIUM') : 'Gas density above 5.2 g/L - increased work of breathing.';
        warnEl.className = 'warning';
    } else {
        warnEl.style.display = 'none';
    }
}
