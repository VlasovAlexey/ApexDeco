const MIX_TEMP_VALUES_C = [0, 5, 10, 15, 20, 25, 30, 35];
function toolText(key, fallback) {
    return window.t ? window.t(key) : fallback;
}
function toNum(value, fallback) {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : fallback;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function getMixerUnitFlag() {
    return appState && appState.settings ? (parseInt(appState.settings.mix_units, 10) || 0) : 0;
}
function getMixerTempUnitFlag() {
    return appState && appState.settings ? (parseInt(appState.settings.mix_temp_units, 10) || 0) : 0;
}
function getMixerTempIndex() {
    const idx = appState && appState.settings ? (parseInt(appState.settings.mix_temp, 10) || 0) : 0;
    return clamp(idx, 0, MIX_TEMP_VALUES_C.length - 1);
}
function getMixerTempC(index) {
    return MIX_TEMP_VALUES_C[clamp(parseInt(index, 10) || 0, 0, MIX_TEMP_VALUES_C.length - 1)];
}
function getMixerPressureUnitLabel() {
    return getMixerUnitFlag() === 1 ? toolText('UNIT_PSI', 'psi') : toolText('UNIT_BAR', 'bar');
}
function formatMixerPressure(value, unitFlag) {
    const decimals = unitFlag === 1 ? 0 : 1;
    return Number(value).toFixed(decimals);
}
function formatMixerPressureStep(value, cumulative, unitFlag) {
    return `${formatMixerPressure(value, unitFlag)}  (${formatMixerPressure(cumulative, unitFlag)})`;
}
function setToolWarning(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (text) {
        el.textContent = text;
        el.style.display = 'block';
    } else {
        el.textContent = '';
        el.style.display = 'none';
    }
}
function rebuildMixTempOptions() {
    const select = document.getElementById('mixcfg-temp');
    if (!select) return;
    const unitFlag = getMixerTempUnitFlag();
    const selected = select.value !== '' ? String(select.value) : String(getMixerTempIndex());
    select.innerHTML = MIX_TEMP_VALUES_C.map((celsius, idx) => {
        const display = unitFlag === 1 ? Math.round((celsius * 9 / 5) + 32) : celsius;
        return `<option value="${idx}">${display}</option>`;
    }).join('');
    select.value = selected;
}
function applyMixerUnitLabels() {
    const pressLabel = getMixerPressureUnitLabel();
    document.querySelectorAll('.mixer-press-unit').forEach(el => {
        el.textContent = pressLabel;
    });
    const volLabel = appState.settings.gasVolUnit === 'cuft'
        ? toolText('UNIT_CUFT', 'cu.ft')
        : toolText('UNIT_LITERS_WORD', 'liters');
    document.querySelectorAll('.vol-unit').forEach(el => {
        el.textContent = volLabel;
    });
}
function updateNitroxLabels() {
    const label = document.getElementById('nx-addtop-label');
    if (!label) return;
    const key = appState.settings.mix_banked32 ? 'RESULT_ADD_32' : 'RESULT_ADD_AIR';
    label.textContent = toolText(key, appState.settings.mix_banked32 ? 'Add 32' : 'Add Air');
}
function updateTrimixLabels() {
    const heFirst = getRadio('tx-order') !== 'o2';
    const firstLabel = document.getElementById('tx-first-label');
    const secondLabel = document.getElementById('tx-second-label');
    const topLabel = document.getElementById('tx-top-label');
    if (firstLabel) firstLabel.textContent = heFirst ? toolText('RESULT_ADD_HE', 'Add He') : toolText('RESULT_ADD_O2', 'Add O2');
    if (secondLabel) secondLabel.textContent = heFirst ? toolText('RESULT_ADD_O2', 'Add O2') : toolText('RESULT_ADD_HE', 'Add He');
    if (topLabel) {
        const key = appState.settings.mix_banked32 ? 'RESULT_ADD_32' : 'RESULT_ADD_AIR';
        topLabel.textContent = toolText(key, appState.settings.mix_banked32 ? 'Add 32' : 'Add Air');
    }
}
function loadMixConfigToUI() {
    const s = appState.settings;
    setRadio('mixcfg-units', String(parseInt(s.mix_units, 10) || 0));
    setRadio('mixcfg-tempunits', String(parseInt(s.mix_temp_units, 10) || 0));
    setRadio('mixcfg-banked', s.mix_banked32 ? '1' : '0');
    rebuildMixTempOptions();
    const tempSelect = document.getElementById('mixcfg-temp');
    if (tempSelect) tempSelect.value = String(getMixerTempIndex());
    applyMixerUnitLabels();
    updateNitroxLabels();
    updateTrimixLabels();
}
function syncMixConfigFromUI(persist) {
    const s = appState.settings;
    s.mix_units = parseInt(getRadio('mixcfg-units'), 10) || 0;
    s.mix_temp_units = parseInt(getRadio('mixcfg-tempunits'), 10) || 0;
    rebuildMixTempOptions();
    const tempSelect = document.getElementById('mixcfg-temp');
    s.mix_temp = tempSelect ? clamp(parseInt(tempSelect.value, 10) || 0, 0, MIX_TEMP_VALUES_C.length - 1) : 4;
    if (tempSelect) tempSelect.value = String(s.mix_temp);
    s.mix_banked32 = getRadio('mixcfg-banked') === '1';
    applyMixerUnitLabels();
    updateNitroxLabels();
    updateTrimixLabels();
    if (persist && typeof saveStateToStorage === 'function') saveStateToStorage();
}
function onMixConfigChange() {
    syncMixConfigFromUI(true);
    recalcAllTools();
}
function toggleBmTrimix() {
    const val = getRadio('bm-trimix');
    const row = document.getElementById('bm-ead-row');
    if (row) row.style.display = val === '1' ? 'flex' : 'none';
}
function toggleEadModSPRow() {
    const row = document.getElementById('em-sp-row');
    if (!row) return;
    const isCCR = appState.settings && appState.settings.circuit === 'CCR';
    row.style.display = isCCR ? 'flex' : 'none';
}
function toggleDensityModeRows() {
    const row = document.getElementById('dens-sp-row');
    if (!row) return;
    row.style.display = getRadio('dens-mode') === 'sp' ? 'flex' : 'none';
}
function calcBestMix() {
    const depth = toNum(document.getElementById('bm-depth').value, 40);
    const ppO2 = toNum(document.getElementById('bm-ppo2').value, 1.4);
    const trimix = getRadio('bm-trimix') === '1';
    const eadDepth = toNum(document.getElementById('bm-ead').value, 40);
    const s = appState.settings;
    const result = DiveTools.bestMix(depth, ppO2, s.metric, s.waterType, trimix, eadDepth, s.oxyNarc);
    const mixStr = result.he > 0
        ? `${result.o2}/${result.he} (${toolText('GAS_TRIMIX', 'Trimix')})`
        : `${result.o2}% O2 (${toolText('GAS_NITROX', 'Nitrox')})`;
    document.getElementById('bm-result-value').textContent = mixStr;
}
function calcEadMod() {
    const o2 = toNum(document.getElementById('em-o2').value, 21);
    const he = toNum(document.getElementById('em-he').value, 0);
    const depth = toNum(document.getElementById('em-depth').value, 40);
    const ppO2 = toNum(document.getElementById('em-ppo2').value, 1.4);
    const isCCR = appState.settings.circuit === 'CCR';
    const sp = isCCR ? toNum(document.getElementById('em-sp').value, 1.25) : 0;
    const s = appState.settings;
    const unit = s.metric ? toolText('UNIT_M', 'm') : toolText('UNIT_FT', 'ft');
    const result = DiveTools.eadMod(o2, he, depth, s.metric, s.waterType, ppO2, s.oxyNarc, sp);
    document.getElementById('em-mod').textContent = `${result.mod} ${unit}`;
    document.getElementById('em-ead').textContent = `${result.ead} ${unit}`;
    document.getElementById('em-end').textContent = `${result.end} ${unit}`;
    document.getElementById('em-eadd').textContent = `${result.eadd} ${unit}`;
}
function calcNitrox() {
    const unitFlag = getMixerUnitFlag();
    const oldPressure = toNum(document.getElementById('nx-oldP').value, 50);
    const newPressure = toNum(document.getElementById('nx-newP').value, 200);
    const oldO2 = toNum(document.getElementById('nx-oldO2').value, 21);
    const newO2 = toNum(document.getElementById('nx-newO2').value, 32);
    const result = DiveTools.mixNitrox(
        oldPressure,
        newPressure,
        oldO2,
        newO2,
        unitFlag,
        getMixerTempIndex(),
        !!appState.settings.mix_banked32
    );
    document.getElementById('nx-addO2').textContent = result.valid
        ? formatMixerPressureStep(result.addO2, result.afterO2Pressure, unitFlag)
        : '--';
    document.getElementById('nx-addTop').textContent = result.valid
        ? formatMixerPressureStep(result.addTop, result.finalPressure, unitFlag)
        : '--';
    setToolWarning('nx-warning', result.valid ? '' : toolText('WARN_INVALID_MIX', 'Invalid mix - check values.'));
}
function calcTrimix() {
    const unitFlag = getMixerUnitFlag();
    const oldPressure = toNum(document.getElementById('tx-oldP').value, 0);
    const newPressure = toNum(document.getElementById('tx-newP').value, 200);
    const oldO2 = toNum(document.getElementById('tx-oldO2').value, 21);
    const newO2 = toNum(document.getElementById('tx-newO2').value, 21);
    const oldHe = toNum(document.getElementById('tx-oldHe').value, 0);
    const newHe = toNum(document.getElementById('tx-newHe').value, 35);
    const heFirst = getRadio('tx-order') !== 'o2';
    const result = DiveTools.mixTrimix(
        oldPressure,
        newPressure,
        oldO2,
        oldHe,
        newO2,
        newHe,
        unitFlag,
        getMixerTempIndex(),
        !!appState.settings.mix_banked32,
        heFirst
    );
    document.getElementById('tx-first-result').textContent = result.valid
        ? formatMixerPressureStep(result.firstAdd, result.firstPressure, unitFlag)
        : '--';
    document.getElementById('tx-second-result').textContent = result.valid
        ? formatMixerPressureStep(result.secondAdd, result.secondPressure, unitFlag)
        : '--';
    document.getElementById('tx-addTop').textContent = result.valid
        ? formatMixerPressureStep(result.topAdd, result.finalPressure, unitFlag)
        : '--';
    document.getElementById('tx-testO2').textContent = result.valid
        ? result.testO2.toFixed(1)
        : '--';
    setToolWarning('tx-warning', result.valid ? '' : toolText('WARN_INVALID_MIX', 'Invalid mix - check values.'));
}
function calcTopUp() {
    const oldPressure = toNum(document.getElementById('tu-oldP').value, 100);
    const newPressure = toNum(document.getElementById('tu-newP').value, 200);
    const oldO2 = toNum(document.getElementById('tu-oldO2').value, 32);
    const oldHe = toNum(document.getElementById('tu-oldHe').value, 0);
    const withO2 = toNum(document.getElementById('tu-withO2').value, 21);
    const withHe = toNum(document.getElementById('tu-withHe').value, 0);
    const result = DiveTools.topUp(
        oldPressure,
        newPressure,
        oldO2,
        oldHe,
        withO2,
        withHe,
        getMixerUnitFlag()
    );
    document.getElementById('tu-result').textContent = result.valid ? result.result : '--';
    setToolWarning('tu-warning', result.valid ? '' : toolText('WARN_INVALID_MIX', 'Invalid mix - check values.'));
}
function calcCapacity() {
    const supplyPressure = toNum(document.getElementById('cap-supplyP').value, 200);
    const supplySize = toNum(document.getElementById('cap-supplySize').value, 50);
    const receiveSize = toNum(document.getElementById('cap-recvSize').value, 12);
    const receivePressure = toNum(document.getElementById('cap-recvP').value, 50);
    const receiveAdd = toNum(document.getElementById('cap-addP').value, 100);
    const unitFlag = getMixerUnitFlag();
    const result = DiveTools.mixFill(supplyPressure, supplySize, receivePressure, receiveSize, receiveAdd);
    document.getElementById('cap-supplyResult').textContent = result.valid
        ? formatMixerPressure(result.supplyResult, unitFlag)
        : '--';
    document.getElementById('cap-recvResult').textContent = result.valid
        ? formatMixerPressure(result.receiveResult, unitFlag)
        : '--';
    setToolWarning(
        'cap-warning',
        !result.valid
            ? toolText('WARN_INVALID_MIX', 'Invalid mix - check values.')
            : (result.warning ? toolText('WARN_MIXFILL_LOW_SUPPLY', 'Supply result is lower than receive result.') : '')
    );
}
function calcCapacityEqualize() {
    const supplyPressure = toNum(document.getElementById('cap-supplyP').value, 200);
    const supplySize = toNum(document.getElementById('cap-supplySize').value, 50);
    const receiveSize = toNum(document.getElementById('cap-recvSize').value, 12);
    const receivePressure = toNum(document.getElementById('cap-recvP').value, 50);
    const equalized = DiveTools.mixFillEqualize(supplyPressure, supplySize, receivePressure, receiveSize);
    document.getElementById('cap-supplyP').value = formatMixerPressure(equalized, getMixerUnitFlag());
    document.getElementById('cap-recvP').value = formatMixerPressure(equalized, getMixerUnitFlag());
    calcCapacity();
}
function calcCapacityRepeat() {
    const supplyResult = document.getElementById('cap-supplyResult').textContent;
    const nextSupply = parseFloat(String(supplyResult).replace(',', '.'));
    if (Number.isFinite(nextSupply)) {
        document.getElementById('cap-supplyP').value = formatMixerPressure(nextSupply, getMixerUnitFlag());
    }
    calcCapacity();
}
function calcDensity() {
    const o2 = toNum(document.getElementById('dens-o2').value, 21);
    const he = toNum(document.getElementById('dens-he').value, 0);
    const depth = toNum(document.getElementById('dens-depth').value, 40);
    const spMode = getRadio('dens-mode') === 'sp';
    const setpoint = spMode ? toNum(document.getElementById('dens-sp').value, 1.3) : 0;
    const tempMode = parseInt(getRadio('dens-temp'), 10);
    const s = appState.settings;
    const result = DiveTools.gasDensity(o2, he, depth, s.metric, s.waterType, Number.isFinite(tempMode) ? tempMode : 20, setpoint);
    document.getElementById('dens-val').textContent = result.gramsPerLiter.toFixed(2);
    document.getElementById('dens-ata').textContent = result.ata.toFixed(2);
    const warnEl = document.getElementById('dens-warning');
    if (result.gramsPerLiter > 6.2) {
        warnEl.style.display = 'block';
        warnEl.textContent = toolText('WARN_DENSITY_HIGH', 'Gas density exceeds 6.2 g/L - high risk of CO2 retention!');
        warnEl.className = 'warning error';
    } else if (result.gramsPerLiter > 5.2) {
        warnEl.style.display = 'block';
        warnEl.textContent = toolText('WARN_DENSITY_MEDIUM', 'Gas density above 5.2 g/L - increased work of breathing.');
        warnEl.className = 'warning';
    } else {
        warnEl.style.display = 'none';
        warnEl.textContent = '';
        warnEl.className = 'warning';
    }
}
function recalcAllTools() {
    toggleBmTrimix();
    toggleEadModSPRow();
    toggleDensityModeRows();
    applyMixerUnitLabels();
    updateNitroxLabels();
    updateTrimixLabels();
    calcEadMod();
    calcBestMix();
    calcNitrox();
    calcTrimix();
    calcTopUp();
    calcCapacity();
    calcDensity();
}
