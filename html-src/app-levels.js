function formatLevelTimeLabel(time, minLabel = '') {
    const numericTime = Number(time);
    return numericTime <= 0 ? '-' : `${time}${minLabel}`;
}
function shouldIgnoreRowEditClick(event) {
    const target = event && event.target;
    return !!(target && (
        target.closest('.drag-handle') ||
        target.closest('input[type="checkbox"]')
    ));
}
function onLevelRowClick(event, idx) {
    if (shouldIgnoreRowEditClick(event)) return;
    editLevel(idx);
}
function onDecoRowClick(event, idx) {
    if (shouldIgnoreRowEditClick(event)) return;
    editDeco(idx);
}
function isDecoDepthOverrideEnabled(deco) {
    return deco && (deco.depthOverrideOn === true || deco.depthOverrideOn === 1 || deco.depthOverrideOn === '1');
}
function getDecoDepthOverrideValue(deco) {
    if (!deco) return null;
    const value = Number(deco.depthOverride);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}
function normalizeDecoMix(deco) {
    return {
        o2: parseInt(deco && deco.o2, 10) || 21,
        he: parseInt(deco && deco.he, 10) || 0,
        selected: deco ? deco.selected !== false : true,
        depthOverrideOn: isDecoDepthOverrideEnabled(deco),
        depthOverride: getDecoDepthOverrideValue(deco)
    };
}
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
        <div class="item-row" data-idx="${i}" onclick="onLevelRowClick(event, ${i})">
            <input type="checkbox" ${l.selected ? 'checked' : ''} onclick="event.stopPropagation()" onchange="appState.levels[${i}].selected=this.checked">
            <span class="item-depth">${l.depth}${unit}</span>
            <span class="item-time">${formatLevelTimeLabel(l.time, minLabel)}</span>
            <span class="item-gas">${l.o2}/${l.he}</span>
            ${isCCR ? `<span class="item-sp">SP${l.setpoint || 1.3}</span>` : ''}
            ${isCCR && l.oc ? `<span class="item-sp" style="background:#e53935;color:#fff;">OC</span>` : ''}
            ${isCCR && l.scr ? `<span class="item-sp" style="background:#fb8c00;color:#fff;">SCR</span>` : ''}
            <span class="drag-handle" onclick="event.stopPropagation()" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</span>
        </div>
    `).join('');
    attachLevelsDnD();
}
function attachItemsDnD(listId, getArray, onReorder) {
    const list = document.getElementById(listId);
    if (!list) return;
    let dragging = null; 
    const cleanupHints = () => {
        list.querySelectorAll('.item-row').forEach(r => {
            r.classList.remove('drop-above', 'drop-below');
        });
    };
    list.querySelectorAll('.drag-handle').forEach(handle => {
        const row = handle.closest('.item-row');
        if (!row) return;
        handle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            try { handle.setPointerCapture(e.pointerId); } catch (_) {}
            dragging = { idx: parseInt(row.dataset.idx, 10), startY: e.clientY, row };
            row.classList.add('dragging');
        });
        handle.addEventListener('pointermove', (e) => {
            if (!dragging || dragging.row !== row) return;
            const dy = e.clientY - dragging.startY;
            row.style.transform = `translateY(${dy}px)`;
            cleanupHints();
            const others = Array.from(list.querySelectorAll('.item-row')).filter(r => r !== row);
            for (const r of others) {
                const rect = r.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY >= rect.top - 4 && e.clientY < mid) {
                    r.classList.add('drop-above');
                    break;
                } else if (e.clientY >= mid && e.clientY <= rect.bottom + 4) {
                    r.classList.add('drop-below');
                    break;
                }
            }
        });
        const finish = () => {
            if (!dragging || dragging.row !== row) return;
            const fromIdx = dragging.idx;
            let target = null, pos = 'above';
            list.querySelectorAll('.item-row').forEach(r => {
                if (r.classList.contains('drop-above')) { target = r; pos = 'above'; }
                else if (r.classList.contains('drop-below')) { target = r; pos = 'below'; }
            });
            cleanupHints();
            row.classList.remove('dragging');
            row.style.transform = '';
            if (target && target !== row) {
                let toIdx = parseInt(target.dataset.idx, 10);
                if (pos === 'below') toIdx += 1;
                if (toIdx > fromIdx) toIdx -= 1; 
                if (toIdx !== fromIdx) onReorder(fromIdx, toIdx);
            }
            dragging = null;
        };
        handle.addEventListener('pointerup', finish);
        handle.addEventListener('pointercancel', finish);
    });
}
function attachLevelsDnD() {
    attachItemsDnD('levels-list', () => appState.levels, (fromIdx, toIdx) => {
        const item = appState.levels.splice(fromIdx, 1)[0];
        appState.levels.splice(toIdx, 0, item);
        renderLevels();
        saveStateToStorage();
    });
}
function attachDecosDnD() {
    attachItemsDnD('decos-list', () => appState.decos, (fromIdx, toIdx) => {
        const item = appState.decos.splice(fromIdx, 1)[0];
        appState.decos.splice(toIdx, 0, item);
        renderDecos();
        saveStateToStorage();
    });
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
    const depthRaw = document.getElementById('lvl-depth').value.trim();
    const timeRaw = document.getElementById('lvl-time').value.trim();
    const depth = depthRaw === '' ? NaN : parseInt(depthRaw, 10);
    const time = timeRaw === '' ? NaN : parseInt(timeRaw, 10);
    const o2 = parseInt(document.getElementById('lvl-o2').value) || 21;
    const he = parseInt(document.getElementById('lvl-he').value) || 0;
    const sp = parseFloat(document.getElementById('lvl-sp').value) || 1.3;
    const oc = document.getElementById('lvl-oc').checked;
    const scr = document.getElementById('lvl-scr').checked;
    if (!Number.isFinite(depth) || depth <= 0) return;
    if (!Number.isFinite(time) || time < 0) return;
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
function renderDecos() {
    const list = document.getElementById('decos-list');
    if (appState.decos.length === 0) {
        list.innerHTML = '<div style="color:var(--text-secondary); font-size:12px; padding:8px;">' + (window.t ? window.t('MSG_NO_DECO_MIXES') : 'No deco mixes. Click + Add Deco.') + '</div>';
        return;
    }
    const _t = (k, d) => (window.t ? window.t(k) : d);
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    const unit = appState.settings.metric
        ? _t('UNIT_M', 'm')
        : (lang === 'ru' ? 'ф' : _t('UNIT_FT', 'ft'));
    list.innerHTML = appState.decos.map((rawDeco, i) => {
        const d = normalizeDecoMix(rawDeco);
        const gasType = d.o2 === 100
            ? 'O2'
            : (d.he > 0 ? _t('GAS_TRIMIX', 'Trimix') : _t('GAS_NITROX', 'Nitrox'));
        const depthOverride = d.depthOverrideOn && d.depthOverride != null
            ? `<span class="item-depth">${d.depthOverride}${unit}</span>`
            : '';
        return `
        <div class="item-row" data-idx="${i}" onclick="onDecoRowClick(event, ${i})">
            <input type="checkbox" ${d.selected ? 'checked' : ''} onclick="event.stopPropagation()" onchange="appState.decos[${i}].selected=this.checked">
            <span class="item-gas">${d.o2}/${d.he}</span>
            <span style="color:var(--text-secondary); font-size:11px;">(${gasType})</span>
            ${depthOverride}
            <span class="drag-handle" onclick="event.stopPropagation()" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</span>
        </div>
    `;
    }).join('');
    attachDecosDnD();
}
function updateDecoOverrideVisibility() {
    const row = document.getElementById('deco-depth-override-row');
    const input = document.getElementById('deco-depth-override-depth');
    const enabled = getRadio('deco-depth-override-toggle') === '1';
    if (row) row.style.display = enabled ? 'flex' : 'none';
    if (input) input.disabled = !enabled;
}
function addDeco() {
    appState.editDecoIdx = -1;
    document.getElementById('deco-modal-title').textContent = window.t ? window.t('MODAL_TITLE_ADD_DECO') : 'Add Deco Mix';
    document.getElementById('deco-o2').value = 50;
    document.getElementById('deco-he').value = 0;
    document.getElementById('deco-depth-override-depth').value = '';
    setRadio('deco-depth-override-toggle', '0');
    updateDecoOverrideVisibility();
    document.getElementById('deco-modal').classList.add('active');
}
function editDeco(idx) {
    appState.editDecoIdx = idx;
    const d = normalizeDecoMix(appState.decos[idx]);
    document.getElementById('deco-modal-title').textContent = window.t ? window.t('MODAL_TITLE_EDIT_DECO') : 'Edit Deco Mix';
    document.getElementById('deco-o2').value = d.o2;
    document.getElementById('deco-he').value = d.he;
    document.getElementById('deco-depth-override-depth').value = d.depthOverride != null ? d.depthOverride : '';
    setRadio('deco-depth-override-toggle', d.depthOverrideOn ? '1' : '0');
    updateDecoOverrideVisibility();
    document.getElementById('deco-modal').classList.add('active');
}
function saveDecoModal() {
    const o2 = parseInt(document.getElementById('deco-o2').value) || 21;
    const he = parseInt(document.getElementById('deco-he').value) || 0;
    const depthOverrideOn = getRadio('deco-depth-override-toggle') === '1';
    const depthOverrideRaw = document.getElementById('deco-depth-override-depth').value.trim();
    const depthOverride = depthOverrideRaw === '' ? NaN : parseInt(depthOverrideRaw, 10);
    if (o2 + he > 100) { showAlert(window.t ? window.t('ERR_O2_HE_EXCEED') : 'O2 + He cannot exceed 100%'); return; }
    if (depthOverrideOn && (!Number.isFinite(depthOverride) || depthOverride <= 0)) {
        showAlert(window.t ? window.t('ERR_INVALID_DECO_SWITCH_DEPTH') : 'Enter a valid deco switch depth.');
        return;
    }
    const deco = {
        o2,
        he,
        selected: true,
        depthOverrideOn
    };
    if (depthOverrideOn) {
        deco.depthOverride = depthOverride;
    }
    if (appState.editDecoIdx >= 0) {
        appState.decos[appState.editDecoIdx] = deco;
    } else {
        appState.decos.push(deco);
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
