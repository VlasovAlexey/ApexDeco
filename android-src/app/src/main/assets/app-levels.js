/**
 * ApexDeco - Bottom Levels & Deco Mixes Management
 */

// ===== LEVELS MANAGEMENT =====
function renderLevels() {
    const list = document.getElementById('levels-list');
    if (appState.levels.length === 0) {
        list.innerHTML = '<div style="color:var(--text-secondary); font-size:12px; padding:8px;">' + (window.t ? window.t('MSG_NO_BOTTOM_LEVELS') : 'No bottom levels. Click + Add Level.') + '</div>';
        return;
    }
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    const unit = appState.settings.metric
        ? _t('UNIT_M', 'm')
        : (lang === 'ru' ? 'ф' : _t('UNIT_FT', 'ft'));
    const minLabel = _t('UNIT_MIN', 'min');
    const isCCR = appState.settings.circuit === 'CCR';
    list.innerHTML = appState.levels.map((l, i) => `
        <div class="item-row" ondblclick="editLevel(${i})">
            <input type="checkbox" ${l.selected ? 'checked' : ''} onchange="appState.levels[${i}].selected=this.checked">
            <span class="item-depth">${l.depth}${unit}</span>
            <span class="item-time">${l.time}${minLabel}</span>
            <span class="item-gas">${l.o2}/${l.he}</span>
            ${isCCR ? `<span class="item-sp">SP${l.setpoint || 1.3}</span>` : ''}
            ${isCCR && l.oc ? `<span class="item-sp" style="background:#e53935;color:#fff;">OC</span>` : ''}
            ${isCCR && l.scr ? `<span class="item-sp" style="background:#fb8c00;color:#fff;">SCR</span>` : ''}
        </div>
    `).join('');
}

function updateCCRVisibility() {
    const isCCR = appState.settings.circuit === 'CCR';
    document.querySelectorAll('.ccr-field').forEach(el => {
        el.style.display = isCCR ? 'flex' : 'none';
    });
}

function addLevel() {
    appState.editLevelIdx = -1;
    document.getElementById('level-modal-title').textContent = window.t ? window.t('MODAL_TITLE_ADD_LEVEL') : 'Add Bottom Mix & Travel';
    document.getElementById('lvl-depth').value = appState.settings.metric ? 30 : 100;
    document.getElementById('lvl-time').value = 20;
    document.getElementById('lvl-o2').value = 21;
    document.getElementById('lvl-he').value = 0;
    document.getElementById('lvl-sp').value = 1.3;
    document.getElementById('lvl-oc').checked = false;
    document.getElementById('lvl-scr').checked = false;
    updateCCRVisibility();
    document.getElementById('level-modal').classList.add('active');
}

function editLevel(idx) {
    appState.editLevelIdx = idx;
    const l = appState.levels[idx];
    document.getElementById('level-modal-title').textContent = window.t ? window.t('MODAL_TITLE_EDIT_LEVEL') : 'Edit Bottom Mix & Travel';
    document.getElementById('lvl-depth').value = l.depth;
    document.getElementById('lvl-time').value = l.time;
    document.getElementById('lvl-o2').value = l.o2;
    document.getElementById('lvl-he').value = l.he;
    document.getElementById('lvl-sp').value = l.setpoint || 1.3;
    document.getElementById('lvl-oc').checked = !!l.oc;
    document.getElementById('lvl-scr').checked = !!l.scr;
    updateCCRVisibility();
    document.getElementById('level-modal').classList.add('active');
}

function saveLevelModal() {
    const depth = parseInt(document.getElementById('lvl-depth').value) || 0;
    const time = parseInt(document.getElementById('lvl-time').value) || 0;
    const o2 = parseInt(document.getElementById('lvl-o2').value) || 21;
    const he = parseInt(document.getElementById('lvl-he').value) || 0;
    const sp = parseFloat(document.getElementById('lvl-sp').value) || 1.3;
    const oc = document.getElementById('lvl-oc').checked;
    const scr = document.getElementById('lvl-scr').checked;

    if (depth <= 0 || time <= 0) return;
    if (o2 + he > 100) { showAlert(window.t ? window.t('ERR_O2_HE_EXCEED') : 'O2 + He cannot exceed 100%'); return; }

    const level = { depth, time, o2, he, selected: true };
    if (appState.settings.circuit === 'CCR') {
        level.setpoint = sp;
        if (oc) level.oc = true;
        if (scr) level.scr = true;
    }

    if (appState.editLevelIdx >= 0) {
        appState.levels[appState.editLevelIdx] = level;
    } else {
        appState.levels.push(level);
    }

    document.getElementById('level-modal').classList.remove('active');
    renderLevels();
    saveStateToStorage();
}

function deleteSelectedLevels() {
    const filtered = appState.levels.filter(l => !l.selected);
    if (appState.settings.circuit === 'CCR') appState.levelsCCR = filtered;
    else appState.levelsOC = filtered;
    appState.levels = filtered;
    renderLevels();
    saveStateToStorage();
}

// ===== DECO MIXES MANAGEMENT =====
function renderDecos() {
    const list = document.getElementById('decos-list');
    if (appState.decos.length === 0) {
        list.innerHTML = '<div style="color:var(--text-secondary); font-size:12px; padding:8px;">' + (window.t ? window.t('MSG_NO_DECO_MIXES') : 'No deco mixes. Click + Add Deco.') + '</div>';
        return;
    }
    list.innerHTML = appState.decos.map((d, i) => `
        <div class="item-row" ondblclick="editDeco(${i})">
            <input type="checkbox" ${d.selected ? 'checked' : ''} onchange="appState.decos[${i}].selected=this.checked">
            <span class="item-gas">${d.o2}/${d.he}</span>
            <span style="color:var(--text-secondary); font-size:11px;">(${d.o2 === 100 ? 'O2' : d.he > 0 ? 'Trimix' : 'Nitrox'})</span>
        </div>
    `).join('');
}

function addDeco() {
    appState.editDecoIdx = -1;
    document.getElementById('deco-modal-title').textContent = window.t ? window.t('MODAL_TITLE_ADD_DECO') : 'Add Deco Mix';
    document.getElementById('deco-o2').value = 50;
    document.getElementById('deco-he').value = 0;
    document.getElementById('deco-modal').classList.add('active');
}

function editDeco(idx) {
    appState.editDecoIdx = idx;
    const d = appState.decos[idx];
    document.getElementById('deco-modal-title').textContent = window.t ? window.t('MODAL_TITLE_EDIT_DECO') : 'Edit Deco Mix';
    document.getElementById('deco-o2').value = d.o2;
    document.getElementById('deco-he').value = d.he;
    document.getElementById('deco-modal').classList.add('active');
}

function saveDecoModal() {
    const o2 = parseInt(document.getElementById('deco-o2').value) || 21;
    const he = parseInt(document.getElementById('deco-he').value) || 0;
    if (o2 + he > 100) { showAlert(window.t ? window.t('ERR_O2_HE_EXCEED') : 'O2 + He cannot exceed 100%'); return; }

    if (appState.editDecoIdx >= 0) {
        appState.decos[appState.editDecoIdx] = { o2, he, selected: true };
    } else {
        appState.decos.push({ o2, he, selected: true });
    }

    document.getElementById('deco-modal').classList.remove('active');
    renderDecos();
    saveStateToStorage();
}

function deleteSelectedDecos() {
    appState.decos = appState.decos.filter(d => !d.selected);
    renderDecos();
    saveStateToStorage();
}
