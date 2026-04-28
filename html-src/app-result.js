/**
 * ApexDeco - Result Rendering, Export & Reporting
 */

function _tr(key, def, params) {
    if (window.t) {
        try { return window.t(key, params); } catch (e) {}
    }
    if (params) {
        return Object.keys(params).reduce((s, k) => s.replace('{' + k + '}', params[k]), def);
    }
    return def;
}

function formatStopTime(time) {
    if (time < 10) {
        const mins = Math.floor(time);
        const secs = Math.round((time - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return Math.round(time).toString();
}

function findLevelSetpoint(gas, depth) {
    if (!appState || !appState.levels) return null;
    const cands = appState.levels.filter(l => `${l.o2}/${l.he}` === gas);
    if (cands.length === 0) return null;
    let best = cands[0];
    let bestDiff = Math.abs((cands[0].depth || 0) - depth);
    for (const l of cands) {
        const d = Math.abs((l.depth || 0) - depth);
        if (d < bestDiff) { best = l; bestDiff = d; }
    }
    // OC/SCR leg → not breathing the loop, so no setpoint applies
    if (best.oc || best.scr) return null;
    return best.setpoint;
}

function parseGas(gasStr) {
    if (!gasStr) return { o2: 21, he: 0 };
    const parts = gasStr.split('/');
    return { o2: parseFloat(parts[0]) || 21, he: parseFloat(parts[1]) || 0 };
}

function buildSummaryText(result, s) {
    const depthUnit = _tr(s.metric ? 'UNIT_M' : 'UNIT_FT', result.depthUnit);
    const minU = _tr('UNIT_MIN', 'min');
    const gLU = _tr('UNIT_G_L', 'g/L');
    const volU = (s.gasVolUnit === 'cuft') ? _tr('UNIT_CUFT', 'cu.ft') : _tr('UNIT_L', 'L');
    const modelLabel = result.modelName || getModelName(s.decoModel || 'ZHLC_GF');
    const isCCR = s.circuit === 'CCR';
    const isVPM = (s.decoModel || '').startsWith('VPM');

    let lines = [];

    // Model line
    let modelLine = modelLabel;
    if (isCCR) modelLine += ' (CCR)';
    if (isVPM && s.decoModel !== 'VPMB_GFS') {
        modelLine += `  ${_tr('LABEL_CONSERVATISM','Conservatism')}: ${s.conservatism || 0}`;
    } else if (!isVPM || s.decoModel === 'VPMB_GFS') {
        modelLine += `  ${_tr('SUMMARY_GF_LABEL','GF')}: ${s.gfLo}/${s.gfHi}`;
    }
    lines.push(modelLine);

    // Elevation
    if (s.altitude) {
        lines.push(`${_tr('SUMMARY_ELEVATION_LABEL','Elevation')}: ${s.altitude}${depthUnit}`);
    }

    // Runtime / Deco
    const decoTime = Math.ceil(result.stops.reduce((a, st) => a + st.time, 0));
    lines.push(`${_tr('SUMMARY_RUNTIME_LABEL','Runtime')}: ${result.totalRuntime} ${minU}  ${_tr('SUMMARY_DECO_LABEL','Deco')}: ${decoTime} ${minU}  ${_tr('SUMMARY_STOPS_LABEL','Stops')}: ${result.stops.length}`);

    // CNS / OTU
    lines.push(`${_tr('SUMMARY_CNS_LABEL','CNS')}: ${result.totalCNS.toFixed(0)}%  ${_tr('SUMMARY_OTU_LABEL','OTU')}: ${result.totalOTU}`);

    // Gas usage
    if (result.gasUsage && result.gasUsage.length > 0) {
        for (const g of result.gasUsage) {
            lines.push(`${_tr('SUMMARY_GAS_PREFIX','Gas')} ${g.gas}: ${g.volume} ${volU}`);
        }
    }

    // Gas density for bottom gas at max depth
    try {
        const bottomSegs = result.plan.filter(p => p.type === 'bottom');
        if (bottomSegs.length > 0) {
            const bottomSeg = bottomSegs[0];
            const { o2, he } = parseGas(bottomSeg.gas);
            const depth = bottomSeg.depth || 0;
            const densResult = DiveTools.gasDensity(o2, he, depth, s.metric, s.waterType || 0, 20, 0);
            lines.push(`${_tr('SUMMARY_GAS_DENSITY','Gas density')}: ${densResult.gramsPerLiter.toFixed(2)} ${gLU}`);
        }
    } catch (e) { /* ignore */ }

    // Deco zone start
    if (result.decoZoneStart > 0) {
        lines.push(`${_tr('SUMMARY_DECO_ZONE','Deco zone')}: ${result.decoZoneStart}${depthUnit}`);
    } else if (result.stops && result.stops.length > 0) {
        lines.push(`${_tr('SUMMARY_DECO_ZONE','Deco zone')}: ${result.stops[0].depth}${depthUnit}`);
    }

    return lines.join('\n');
}

function renderResult(result) {
    const s = appState.settings;
    const _lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    const unit = s.metric ? _tr('UNIT_M', 'm') : (_lang === 'ru' ? 'ф' : _tr('UNIT_FT', result.depthUnit || 'ft'));
    const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);

    // Update result title with current dive number
    const diveNum = appState.nextDiveNum || 1;
    const hdr = document.getElementById('result-card-header');
    if (hdr) hdr.textContent = _tr('RESULT_DIVE_HEADER', `Dive #${diveNum} Plan Result`, { n: diveNum });

    // Profile chart
    if (typeof drawProfileChart === 'function') {
        drawProfileChart('profile-chart-container', result);
    }

    // Warnings
    let warningsHTML = '';
    if (result.warnings && result.warnings.length > 0) {
        warningsHTML = result.warnings.map(w =>
            `<div class="warning ${w.level}">${w.msg}</div>`
        ).join('');
    }
    document.getElementById('result-warnings').innerHTML = warningsHTML;

    // Plan table — 7 columns: Action, Depth, Stop, Run, Mix, pO2, EAD
    const tbody = document.getElementById('result-tbody');
    tbody.innerHTML = result.plan.map(seg => {
        let rowClass = '';
        let action = '';
        let depthStr = '';
        let stopStr = '';
        let pO2Str = '';
        let eadStr = '';

        const isCCRMode = s.circuit === 'CCR';
        const isTravelSeg = (seg.type === 'descent' || seg.type === 'ascent');
        const showPpO2EAD = (seg.type === 'bottom' || seg.type === 'stop' || (isCCRMode && isTravelSeg));
        const depth = seg.depth !== undefined ? seg.depth : (seg.endDepth || 0);

        if (showPpO2EAD && seg.gas) {
            const { o2, he } = parseGas(seg.gas);
            const pAmb = depth / slp + 1;
            const fO2 = o2 / 100;
            const fHe = he / 100;
            const fN2 = 1 - fO2 - fHe;
            const sp = isCCRMode ? findLevelSetpoint(seg.gas, depth) : null;
            if (sp) {
                pO2Str = Math.min(sp, pAmb).toFixed(2);
            } else {
                pO2Str = (fO2 * pAmb).toFixed(2);
            }
            const eadVal = Math.max(0, Math.round((fN2 / 0.7902) * (depth + 10) - 10));
            eadStr = eadVal.toString();
        }

        switch (seg.type) {
            case 'descent':
                rowClass = 'descent-row';
                action = _tr('ACTION_DES_SHORT', 'Des');
                depthStr = `${seg.startDepth}→${seg.endDepth}${unit}`;
                stopStr = formatStopTime(seg.time || 0);
                break;
            case 'bottom':
                action = _tr('ACTION_LVL_SHORT', 'Lvl');
                depthStr = `${seg.depth}${unit}`;
                stopStr = formatStopTime(seg.time || 0);
                break;
            case 'ascent':
                action = _tr('ACTION_ASC_SHORT', 'Asc');
                depthStr = `${seg.startDepth}→${seg.endDepth}${unit}`;
                stopStr = formatStopTime(seg.time || 0);
                break;
            case 'stop':
                rowClass = 'stop-row';
                action = _tr('ACTION_STP_SHORT', 'Stp');
                depthStr = `${seg.depth}${unit}`;
                stopStr = formatStopTime(seg.time || 0);
                break;
            case 'surface':
                rowClass = 'surface-row';
                action = _tr('ACTION_SFC_SHORT', 'Sfc');
                depthStr = `0${unit}`;
                stopStr = formatStopTime(seg.time || 0);
                break;
        }

        const run = Math.floor(seg.runtime || 0);

        return `<tr class="${rowClass}">
            <td>${action}</td>
            <td>${depthStr}</td>
            <td>${stopStr}</td>
            <td>${run}</td>
            <td>${seg.gas || '--'}</td>
            <td>${pO2Str}</td>
            <td>${eadStr}</td>
        </tr>`;
    }).join('');

    // Plain text summary after table
    document.getElementById('result-summary').textContent = buildSummaryText(result, s);

    // Gas Usage
    if (result.gasUsage && result.gasUsage.length > 0) {
        const isCCR = s.circuit === 'CCR';
        // Collect bottom gas labels to mark as "Dil" in CCR mode
        const bottomGases = new Set();
        if (isCCR) {
            for (const l of appState.levels) {
                bottomGases.add(`${l.o2}/${l.he}`);
            }
        }

        const isPsi = s.pressureUnit === 'psi';
        const pConv = isPsi ? 14.5038 : 1;
        const pUnit = isPsi ? _tr('UNIT_PSI','psi') : _tr('UNIT_BAR','bar');
        const fmtP = (bar) => `${Math.round(bar * pConv)} ${pUnit}`;

        const volU = (s.gasVolUnit === 'cuft') ? _tr('UNIT_CUFT','cu.ft') : _tr('UNIT_L','L');
        const lU = _tr('UNIT_L','L');
        let gasHTML = '<div class="card" style="margin-top:12px"><div class="card-header">' + _tr('RESULT_GAS_USAGE','Gas Usage') + '</div><div class="card-body">';
        gasHTML += '<table class="data-table"><thead><tr><th>' + _tr('TH_GAS','Gas') + '</th><th>' + _tr('RESULT_TH_VOLUME','Volume') + '</th><th>11' + lU + '</th><th>12' + lU + '</th><th>15' + lU + '</th><th>24' + lU + ' x2</th></tr></thead><tbody>';
        for (const g of result.gasUsage) {
            if (isCCR && bottomGases.has(g.gas)) {
                gasHTML += `<tr><td>${g.gas}</td><td>Dil</td><td>Dil</td><td>Dil</td><td>Dil</td><td>Dil</td></tr>`;
            } else {
                gasHTML += `<tr><td>${g.gas}</td><td>${g.volume} ${volU}</td><td>${fmtP(g.bar11)}</td><td>${fmtP(g.bar12)}</td><td>${fmtP(g.bar15)}</td><td>${fmtP(g.bar24)}</td></tr>`;
            }
        }
        gasHTML += '</tbody></table></div></div>';
        const gasDiv = document.getElementById('result-gas-usage');
        if (gasDiv) gasDiv.innerHTML = gasHTML;
    }

    // Bailout Plan
    if (result.bailoutPlan) {
        renderBailoutPlan(result.bailoutPlan, unit);
    }

    // --- New blocks: Gas Partial Pressures, Tissue Tension, Grid Plan ---
    renderPPChart(result);
    renderTissueChart(result);
    renderGridPlan(result);
}

// ===== Gas Partial Pressures chart =====
function renderPPChart(result) {
    const container = document.getElementById('result-pp-chart');
    if (!container) return;
    container.innerHTML = '<div class="card" style="margin-top:12px"><div class="card-header">' + _tr('RESULT_PP_TITLE','Gas Partial Pressures') + '</div><div class="card-body"><div id="pp-chart-container" style="height:320px; min-width:280px;"></div></div></div>';
    if (typeof Highcharts === 'undefined' || !result.plan || result.plan.length === 0) return;

    const s = appState.settings;
    const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);
    const isCCR = s.circuit === 'CCR';

    const pO2 = [], pN2 = [], pHe = [], pAmb = [];
    // Starting point at t=0, depth=0
    pO2.push([0, 0.21]); pN2.push([0, 0.79]); pHe.push([0, 0]); pAmb.push([0, 1]);

    for (const seg of result.plan) {
        const rt = seg.runtime || 0;
        const depth = (seg.depth !== undefined) ? seg.depth : (seg.endDepth !== undefined ? seg.endDepth : 0);
        const { o2, he } = parseGas(seg.gas || '21/0');
        const fO2 = o2 / 100, fHe = he / 100, fN2 = Math.max(0, 1 - fO2 - fHe);
        const pa = depth / slp + 1;
        let ppO2;
        if (isCCR && seg.type !== 'stop' && seg.type !== 'surface') {
            // Bottom/descent/ascent in CCR: use setpoint when available
            const sp = s.setpoint || 1.3;
            ppO2 = Math.min(sp, pa);
            // Remaining diluent fractions
            const remaining = Math.max(0.001, pa - ppO2);
            const dilN2 = fN2 * pa;
            const dilHe = fHe * pa;
            const scale = remaining / Math.max(0.001, dilN2 + dilHe);
            pN2.push([rt, dilN2 * scale]);
            pHe.push([rt, dilHe * scale]);
        } else {
            ppO2 = fO2 * pa;
            pN2.push([rt, fN2 * pa]);
            pHe.push([rt, fHe * pa]);
        }
        pO2.push([rt, ppO2]);
        pAmb.push([rt, pa]);
    }

    Highcharts.setOptions(ChartThemeLight());
    Highcharts.chart('pp-chart-container', {
        chart: { type: 'line', backgroundColor: '#ffffff' },
        title: { text: null },
        xAxis: { title: { text: _tr('CHART_XAXIS_RUNTIME','Runtime (min)') } },
        yAxis: {
            title: { text: _tr('CHART_YAXIS_PRESSURE','Pressure (bar)') },
            min: 0,
            plotLines: [
                { value: 1.4, color: '#ff9800', width: 1, dashStyle: 'Dash', label: { text: 'pO2 = 1.4', style: { color: '#ff9800' } } },
                { value: 1.6, color: '#e53935', width: 1, dashStyle: 'Dash', label: { text: 'pO2 = 1.6', style: { color: '#e53935' } } }
            ]
        },
        legend: { enabled: true },
        tooltip: { shared: true, valueDecimals: 2, valueSuffix: ' ' + _tr('UNIT_BAR','bar') },
        credits: { enabled: false },
        series: [
            { name: 'pO2', data: pO2, color: '#e53935' },
            { name: 'pN2', data: pN2, color: '#1565c0' },
            { name: 'pHe', data: pHe, color: '#43a047' },
            { name: 'pAmb', data: pAmb, color: '#757575', dashStyle: 'ShortDot' }
        ]
    });
}

// ===== Gas Tension in Tissue Compartments chart =====
function renderTissueChart(result) {
    const container = document.getElementById('result-tissue-chart');
    if (!container) return;
    container.innerHTML = '<div class="card" style="margin-top:12px"><div class="card-header">' + _tr('RESULT_TISSUE_TITLE','Gas Tension in Tissue Compartments') + '</div><div class="card-body"><div id="tissue-chart-container" style="height:380px; min-width:280px;"></div></div></div>';
    if (typeof Highcharts === 'undefined' || !result.plan || result.plan.length === 0) return;

    const plan = result.plan;
    const pH2O = 0.0627;
    const initN2 = 0.79 * (1 - pH2O);
    const n = (plan[0]._tissues && plan[0]._tissues.length) || 16;

    const series = [];
    const palette = ['#e53935','#d81b60','#8e24aa','#5e35b1','#3949ab','#1e88e5','#039be5','#00acc1','#00897b','#43a047','#7cb342','#c0ca33','#fdd835','#ffb300','#fb8c00','#f4511e'];
    for (let i = 0; i < n; i++) {
        const data = [[0, initN2]];
        for (const seg of plan) {
            if (!seg._tissues || !seg._tissues[i]) continue;
            const t = seg._tissues[i];
            data.push([seg.runtime || 0, (t.pN2 || 0) + (t.pHe || 0)]);
        }
        series.push({
            name: _tr('CHART_COMP', `Comp ${i + 1}`, { n: i + 1 }),
            data: data,
            color: palette[i % palette.length],
            lineWidth: 1.2,
            marker: { enabled: false }
        });
    }

    Highcharts.setOptions(ChartThemeLight());
    Highcharts.chart('tissue-chart-container', {
        chart: { type: 'line', backgroundColor: '#ffffff' },
        title: { text: null },
        xAxis: { title: { text: _tr('CHART_XAXIS_RUNTIME','Runtime (min)') } },
        yAxis: { title: { text: _tr('CHART_YAXIS_TENSION','Total tension pN2+pHe (bar)') }, min: 0 },
        legend: { enabled: true, itemStyle: { fontSize: '10px' } },
        tooltip: { shared: false, valueDecimals: 3, valueSuffix: ' ' + _tr('UNIT_BAR','bar') },
        credits: { enabled: false },
        series: series
    });
}

// ===== Grid Plan table =====
function formatHMS(minutes) {
    const totalSec = Math.round((minutes || 0) * 60);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function formatMS(minutes) {
    const totalSec = Math.round((minutes || 0) * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function renderGridPlan(result) {
    const container = document.getElementById('result-grid-plan');
    if (!container) return;
    if (!result.plan || result.plan.length === 0) { container.innerHTML = ''; return; }

    const s = appState.settings;
    const _lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    const unit = s.metric ? _tr('UNIT_M', 'm') : (_lang === 'ru' ? 'ф' : _tr('UNIT_FT', result.depthUnit || 'ft'));
    const slp = s.metric ? (s.waterType === 0 ? 10.078 : 10.337) : (s.waterType === 0 ? 33.066 : 33.914);
    const isCCR = s.circuit === 'CCR';

    // Monotone patch for cumulative OTU/CNS (engine ordering quirks)
    let maxO = 0, maxC = 0;
    for (const seg of result.plan) {
        if (typeof seg._cumOTU === 'number') maxO = Math.max(maxO, seg._cumOTU);
        if (typeof seg._cumCNS === 'number') maxC = Math.max(maxC, seg._cumCNS);
        seg._dispOTU = maxO;
        seg._dispCNS = maxC;
    }

    let html = '<div class="card" style="margin-top:12px"><div class="card-header">' + _tr('RESULT_GRID_PLAN','Grid Plan') + '</div><div class="card-body" style="padding:0;">';
    html += '<div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">';
    html += '<table class="data-table" style="font-family:Consolas,\'Courier New\',monospace; font-size:12px; white-space:nowrap; min-width:720px;">';
    html += '<thead><tr>'
        + '<th>' + _tr('TH_ACTION','Action') + '</th><th>' + _tr('TH_DEPTH','Depth') + '</th><th>' + _tr('TH_TIME','Time') + '</th><th>' + _tr('TH_RUNTIME','RunTime') + '</th>'
        + '<th>' + _tr('TH_O2','O2') + '</th><th>' + _tr('TH_HE','He') + '</th><th>' + (isCCR ? _tr('TH_SETPOINT','Setpoint') : _tr('TH_PPO2','pO2')) + '</th>'
        + '<th>' + _tr('TH_EAD','EAD') + '</th><th>' + _tr('TH_END','END') + '</th><th>' + _tr('TH_CNS','CNS') + '</th><th>' + _tr('TH_OTU',"OTU's") + '</th>'
        + '</tr></thead><tbody>';

    for (const seg of result.plan) {
        let action = '';
        switch (seg.type) {
            case 'descent': action = _tr('ACTION_DESCENT','Descent'); break;
            case 'bottom':  action = _tr('ACTION_LEVEL','Level');   break;
            case 'ascent':  action = _tr('ACTION_ASCENT','Ascent');  break;
            case 'stop':    action = _tr('ACTION_STOP','Stop');    break;
            case 'surface': action = _tr('ACTION_SURFACE','Surface'); break;
            default: action = seg.type || '';
        }
        const depth = (seg.depth !== undefined) ? seg.depth : (seg.endDepth !== undefined ? seg.endDepth : 0);
        let depthStr;
        if (seg.type === 'descent' || seg.type === 'ascent') {
            depthStr = `${seg.startDepth}→${seg.endDepth}${unit}`;
        } else {
            depthStr = `${depth}${unit}`;
        }
        const { o2, he } = parseGas(seg.gas || '21/0');
        const fO2 = o2 / 100, fHe = he / 100, fN2 = Math.max(0, 1 - fO2 - fHe);
        const pa = depth / slp + 1;
        let setpointStr;
        const sp = isCCR ? findLevelSetpoint(seg.gas, depth) : null;
        if (sp) {
            setpointStr = Math.min(sp, pa).toFixed(2);
        } else {
            setpointStr = (fO2 * pa).toFixed(2);
        }
        // EAD (m equiv): always compute (in native depth unit)
        const eadNative = Math.max(0, Math.round((fN2 / 0.7902) * (depth + (s.metric ? 10 : 33)) - (s.metric ? 10 : 33)));
        // END: equivalent narcotic depth — treat He as non-narcotic
        const endNative = Math.max(0, Math.round((1 - fHe) * (depth + (s.metric ? 10 : 33)) - (s.metric ? 10 : 33)));

        const timeStr = formatMS(seg.time || 0);
        const runStr = formatHMS(seg.runtime || 0);
        const cns = (seg._dispCNS || 0).toFixed(1);
        const otu = Math.round(seg._dispOTU || 0);

        html += `<tr>
            <td>${action}</td>
            <td>${depthStr}</td>
            <td>${timeStr}</td>
            <td>${runStr}</td>
            <td>${o2}</td>
            <td>${he}</td>
            <td>${setpointStr}</td>
            <td>${eadNative}${unit}</td>
            <td>${endNative}${unit}</td>
            <td>${cns}%</td>
            <td>${otu}</td>
        </tr>`;
    }
    html += '</tbody></table></div></div></div>';
    container.innerHTML = html;
}

function renderBailoutPlan(bailout, unit) {
    const container = document.getElementById('result-bailout');
    if (!container) return;

    const bailHeader = _tr('RESULT_BAILOUT_PLAN', `Bailout Plan — ${bailout.modelName || 'OC'}`, { model: bailout.modelName || 'OC' });
    let html = `<div class="card" style="margin-top:12px; border-left:3px solid #e53935;">
        <div class="card-header" style="color:#e53935;">${bailHeader}</div>
        <div class="card-body">
            <table class="data-table"><thead><tr><th>${_tr('TH_SEG','Seg')}</th><th>${_tr('TH_DEPTH','Depth')}</th><th>${_tr('TABLE_STOP','Stop')}</th><th>${_tr('TH_RUNTIME','Runtime')}</th><th>${_tr('TH_GAS','Gas')}</th></tr></thead><tbody>`;

    for (const seg of bailout.plan) {
        let rowClass = seg.type === 'stop' ? 'stop-row' : (seg.type === 'surface' ? 'surface-row' : '');
        let label = seg.type === 'stop' ? _tr('ACTION_STOP_SHORT','Stop') : seg.type === 'descent' ? _tr('ACTION_DESC_SHORT','Desc') : seg.type === 'ascent' ? _tr('ACTION_ASC_SHORT','Asc') : seg.type === 'bottom' ? _tr('ACTION_BOTTOM_SHORT','Bottom') : _tr('ACTION_SURF_SHORT','Surf');
        let depth = seg.depth ? `${seg.depth}${unit}` : seg.startDepth !== undefined ? `${seg.startDepth}→${seg.endDepth}${unit}` : `0${unit}`;
        html += `<tr class="${rowClass}"><td>${label}</td><td>${depth}</td><td>${seg.time ? formatStopTime(seg.time) : '--'}</td><td>${seg.runtime}</td><td>${seg.gas || '--'}</td></tr>`;
    }

    html += '</tbody></table>';

    // Bailout gas usage
    if (bailout.gasUsage && bailout.gasUsage.length > 0) {
        const sb = appState.settings;
        const isPsiB = sb.pressureUnit === 'psi';
        const pConvB = isPsiB ? 14.5038 : 1;
        const pUnitB = isPsiB ? _tr('UNIT_PSI','psi') : _tr('UNIT_BAR','bar');
        const fmtPB = (bar) => `${Math.round(bar * pConvB)} ${pUnitB}`;
        const volHdr = _tr('RESULT_TH_VOLUME','Volume');

        const volUB = (sb.gasVolUnit === 'cuft') ? _tr('UNIT_CUFT','cu.ft') : _tr('UNIT_L','L');
        const lUB = _tr('UNIT_L','L');
        html += '<h4 style="margin:8px 0 4px; color:#e53935;">' + _tr('RESULT_BAILOUT_GAS_REQ','Bailout Gas Required') + '</h4>';
        html += `<table class="data-table"><thead><tr><th>${_tr('TH_GAS','Gas')}</th><th>${volHdr}</th><th>11${lUB}</th><th>12${lUB}</th><th>15${lUB}</th><th>24${lUB} x2</th></tr></thead><tbody>`;
        for (const g of bailout.gasUsage) {
            const volStr = (g.volume !== undefined)
                ? `${g.volume} ${volUB}`
                : `${g.liters} ${lUB}`;
            html += `<tr><td>${g.gas}</td><td>${volStr}</td><td>${fmtPB(g.bar11)}</td><td>${fmtPB(g.bar12)}</td><td>${fmtPB(g.bar15)}</td><td>${fmtPB(g.bar24)}</td></tr>`;
        }
        html += '</tbody></table>';
    }

    html += '</div></div>';
    container.innerHTML = html;
}

function copyResultToClipboard() {
    const text = generateReportText();
    // Try modern Clipboard API first; fall back to legacy execCommand.
    // Always show the "Dive plan copied to clipboard." modal on success.
    const showCopied = () => showAlert(window.t ? window.t('MSG_COPIED') : 'Dive plan copied to clipboard.');
    const showFailed = () => showAlert(window.t ? window.t('MSG_COPY_FAILED') : 'Failed to copy to clipboard.');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(() => {
            legacyCopy(text) ? showCopied() : showFailed();
        });
    } else {
        legacyCopy(text) ? showCopied() : showFailed();
    }
}

// Legacy clipboard fallback using a hidden textarea + execCommand('copy').
// Returns true on success.
function legacyCopy(text) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (e) {
        return false;
    }
}

function showResultText() {
    document.getElementById('report-text').textContent = generateReportText();
    document.getElementById('report-modal').classList.add('active');
}

function copyReportText() {
    const text = document.getElementById('report-text').textContent;
    navigator.clipboard.writeText(text).then(() => showAlert(window.t ? window.t('MSG_COPIED_SHORT') : 'Copied!')).catch(() => {});
}

function generateReportText() {
    if (!appState.lastResult) return 'No result available.';
    const r = appState.lastResult;
    const unit = r.depthUnit;
    const s = appState.settings;
    const T = (k, f) => (window.t ? window.t(k) : f);

    // Translated depth unit (override raw unit when t() available)
    const depthUnitT = window.t
        ? (s.metric ? window.t('UNIT_M') : window.t('UNIT_FT'))
        : unit;
    const minT = T('UNIT_MIN', 'min');

    const modelName = r.modelName || getModelName(s.decoModel || 'ZHLC_GF');
    let text = T('REPORT_TITLE', 'ApexDeco - Dive Plan') + '\n';
    text += '========================\n\n';
    text += `${T('REPORT_CIRCUIT', 'Circuit')}: ${s.circuit || 'OC'}\n`;
    text += `${T('REPORT_MODEL', 'Model')}: ${modelName}`;
    if (s.decoModel && s.decoModel.startsWith('VPM') && s.decoModel !== 'VPMB_GFS') {
        text += ` (${T('LABEL_CONSERVATISM', 'Conservatism')}: ${s.conservatism || 0})`;
    } else {
        text += ` ${s.gfLo}/${s.gfHi}`;
    }
    text += '\n';
    const unitsLabel = s.metric ? T('REPORT_UNITS_METRIC', 'Metric') : T('REPORT_UNITS_IMPERIAL', 'Imperial');
    const waterLabel = s.waterType === 0 ? T('REPORT_WATER_SALT', 'Salt water') : T('REPORT_WATER_FRESH', 'Fresh water');
    text += `${T('REPORT_UNITS', 'Units')}: ${unitsLabel}, ${waterLabel}\n\n`;

    // Only show selected (checked) levels
    const selectedLevels = appState.levels.filter(l => l.selected !== false);
    text += T('REPORT_BOTTOM_LEVELS', 'Bottom Levels:') + '\n';
    selectedLevels.forEach(l => {
        text += `  ${l.depth}${depthUnitT} / ${l.time}${minT} / ${l.o2}/${l.he}\n`;
    });

    // Only show decos that were selected and appear in the final plan
    const planGases = new Set(r.plan.map(seg => seg.gas).filter(Boolean));
    const selectedDecos = appState.decos.filter(d => {
        if (d.selected === false) return false;
        const gasLabel = `${d.o2}/${d.he}`;
        return planGases.has(gasLabel);
    });
    if (selectedDecos.length > 0) {
        text += '\n' + T('REPORT_DECO_MIXES', 'Deco Mixes:') + '\n';
        selectedDecos.forEach(d => {
            text += `  ${d.o2}/${d.he}\n`;
        });
    }

    text += '\n' + T('REPORT_PLAN', 'Plan:') + '\n';
    text += padRight(T('REPORT_TH_SEGMENT', 'Segment'), 10)
         + padRight(T('REPORT_TH_DEPTH', 'Depth'), 16)
         + padRight(T('REPORT_TH_TIME', 'Time'), 8)
         + padRight(T('REPORT_TH_RUN', 'Run'), 8)
         + T('REPORT_TH_GAS', 'Gas') + '\n';
    text += '-'.repeat(50) + '\n';

    const segKey = {
        descent: 'ACTION_DESCENT',
        level: 'ACTION_LEVEL',
        bottom: 'ACTION_LEVEL',
        ascent: 'ACTION_ASCENT',
        stop: 'ACTION_STOP',
        surface: 'ACTION_SURFACE'
    };
    r.plan.forEach(seg => {
        const fallback = seg.type.charAt(0).toUpperCase() + seg.type.slice(1);
        const segLabel = segKey[seg.type] ? T(segKey[seg.type], fallback) : fallback;
        let depthStr = '';
        if (seg.type === 'descent' || seg.type === 'ascent') {
            depthStr = `${seg.startDepth}→${seg.endDepth}${depthUnitT}`;
        } else if (seg.depth !== undefined) {
            depthStr = `${seg.depth}${depthUnitT}`;
        }
        const timeStr = formatStopTime(seg.time || 0);
        const runStr = String(Math.floor(seg.runtime || 0));
        text += padRight(segLabel, 10) + padRight(depthStr, 16) + padRight(timeStr, 8) + padRight(runStr, 8) + (seg.gas || '') + '\n';
    });

    text += '-'.repeat(50) + '\n';
    text += `${T('REPORT_TOTAL_RUNTIME', 'Total Runtime')}: ${r.totalRuntime} ${minT}\n`;
    text += `${T('REPORT_OTU', 'OTU')}: ${r.totalOTU}  ${T('REPORT_CNS', 'CNS')}: ${r.totalCNS.toFixed(0)}%\n`;

    return text;
}

function padRight(str, len) {
    return (str + ' '.repeat(len)).substring(0, len);
}
