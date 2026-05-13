function _supersatSimulateTissues(result, levels, settings) {
    const eng = DecoEngine;
    if (!eng || !result || !result.plan) return [];
    const surfP = eng.getSurfacePressure(settings);
    const ppH2O = eng.WATER_VAPOR_PRESSURE;
    const tissues = [];
    for (let i = 0; i < eng.NUM_COMPARTMENTS; i++) {
        tissues.push({ pN2: 0.79 * (surfP - ppH2O), pHe: 0 });
    }
    const samples = [];
    const push = (rt, depth) => {
        samples.push({
            runtime: rt,
            depth: depth,
            pAmb: eng.getAmbientPressure(depth, settings),
            n2: tissues.map(t => t.pN2),
            he: tissues.map(t => t.pHe)
        });
    };
    const findSetpoint = (seg) => {
        if (settings.circuit !== 'CCR') return 0;
        if (seg.type === 'stop' || seg.type === 'surface') return 0;
        const gas = `${seg.o2}/${seg.he}`;
        const lvl = (levels || []).find(l => `${l.o2}/${l.he}` === gas);
        if (!lvl || lvl.oc || lvl.scr) return 0;
        return lvl.setpoint || settings.ccrDefaultSP || 1.3;
    };
    let runtime = 0;
    push(0, 0);
    for (const seg of result.plan) {
        if (seg.type === 'surface') break;
        const o2 = (seg.o2 || 21) / 100;
        const he = (seg.he || 0) / 100;
        const sp = findSetpoint(seg);
        const dur = Math.max(0, seg.time || 0);
        if (dur <= 0) continue;
        if (seg.type === 'descent' || seg.type === 'ascent') {
            const startD = seg.startDepth || 0;
            const endD = seg.endDepth || 0;
            const sub = Math.max(2, Math.ceil(dur * 4));
            const dt = dur / sub;
            const dD = (endD - startD) / sub;
            const rate = Math.abs(dD / dt);
            for (let k = 0; k < sub; k++) {
                const d0 = startD + dD * k;
                const d1 = startD + dD * (k + 1);
                eng.loadTissuesLinearDepthChange(tissues, d0, d1, rate, o2, he, settings, sp);
                runtime += dt;
                push(runtime, d1);
            }
        } else {
            const depth = seg.depth || 0;
            const sub = dur < 1 ? 2 : Math.max(2, Math.ceil(dur * 2));
            const dt = dur / sub;
            for (let k = 0; k < sub; k++) {
                eng.loadTissuesConstantDepth(tissues, depth, dt, o2, he, settings, sp);
                runtime += dt;
                push(runtime, depth);
            }
        }
    }
    return samples;
}
function _supersatUnitFactor(settings) {
    const u = (settings && (settings.spUnit || settings.SPUnits)) || 'bar';
    if (String(u).toLowerCase() === 'atm' || String(u).toLowerCase() === 'ata') {
        return { factor: 1 / 1.01325, label: 'ATA' };
    }
    return { factor: 1, label: 'bar' };
}
function _supersatComputeSeries(samples, settings, metric) {
    const eng = DecoEngine;
    const { factor } = _supersatUnitFactor(settings);
    const surfP = eng.getSurfacePressure(settings);
    const ppH2O = eng.WATER_VAPOR_PRESSURE;
    const N = eng.NUM_COMPARTMENTS;
    const data16 = Array.from({ length: N }, () => []);
    const dataMax = [];
    for (const s of samples) {
        const pAmb = s.pAmb;
        let maxVal = -Infinity;
        for (let i = 0; i < N; i++) {
            const pTot = s.n2[i] + s.he[i];
            let v;
            switch (metric) {
                case 'n2offgas':
                    v = Math.max(0, s.n2[i] - 0.79 * (pAmb - ppH2O));
                    break;
                case 'heoffgas':
                    v = Math.max(0, s.he[i] - 0);
                    break;
                case 'surfoffgas':
                    v = Math.max(0, pTot - surfP);
                    break;
                case 'supersat':
                default:
                    v = Math.max(0, pTot - pAmb);
                    break;
            }
            v *= factor;
            data16[i].push([s.runtime, v]);
            if (v > maxVal) maxVal = v;
        }
        dataMax.push([s.runtime, maxVal]);
    }
    return { data16, dataMax };
}
const _supersatState = {
    metric: 'supersat',
    selected: { max: true, all: false, perComp: new Set([0, 15]) }
};
function renderSupersatChart(containerId, result, levels, settings) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    if (!result || !result.plan || !window.Highcharts) {
        wrap.innerHTML = '';
        return;
    }
    const samples = _supersatSimulateTissues(result, levels, settings);
    if (samples.length === 0) {
        wrap.innerHTML = '';
        return;
    }
    const { label: unit } = _supersatUnitFactor(settings);
    const _t = (k, d) => {
        if (!window.t) return d;
        const v = window.t(k);
        return (v === k || v == null) ? d : v;
    };
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    if (wrap.dataset.built !== lang) {
        wrap.dataset.built = lang;
        wrap.innerHTML = `
            <div class="card" style="margin-top:12px;">
                <div class="card-header">${_t('CHART_SUPERSAT_TITLE','Gas Tension in Tissue Compartments')}</div>
                <div class="card-body">
                    <div class="supersat-toolbar">
                        <div class="supersat-modes">
                            <button class="supersat-mode active" data-mode="supersat">${_t('CHART_MODE_SUPERSAT','SuperSat')}</button>
                            <button class="supersat-mode" data-mode="n2offgas">${_t('CHART_MODE_N2','N2 offgas')}</button>
                            <button class="supersat-mode" data-mode="heoffgas">${_t('CHART_MODE_HE','He offgas')}</button>
                            <button class="supersat-mode" data-mode="surfoffgas">${_t('CHART_MODE_SURF','Surface offgas')}</button>
                        </div>
                    </div>
                    <div class="supersat-grid">
                        <div id="${containerId}-plot" class="supersat-plot"></div>
                        <div id="${containerId}-checks" class="supersat-checks"></div>
                    </div>
                </div>
            </div>
        `;
        const checks = wrap.querySelector('.supersat-checks');
        let html = '';
        const maxC = _supersatState.selected.max ? ' checked' : '';
        const allC = _supersatState.selected.all ? ' checked' : '';
        html += `<label><input type="checkbox" data-comp="max"${maxC}> ${_t('CHART_COMP_MAX','Max')}</label>`;
        html += `<label><input type="checkbox" data-comp="all"${allC}> ${_t('CHART_COMP_ALL','All')}</label>`;
        for (let i = 0; i < DecoEngine.NUM_COMPARTMENTS; i++) {
            const c = _supersatState.selected.perComp.has(i) ? ' checked' : '';
            html += `<label><input type="checkbox" data-comp="${i}"${c}> #${i + 1}</label>`;
        }
        checks.innerHTML = html;
        wrap.querySelectorAll('.supersat-mode').forEach(btn => {
            btn.addEventListener('click', () => {
                wrap.querySelectorAll('.supersat-mode').forEach(b => b.classList.toggle('active', b === btn));
                _supersatState.metric = btn.dataset.mode;
                renderSupersatChart(containerId, appState.lastResult, appState.levels, appState.settings);
            });
        });
        checks.addEventListener('change', (e) => {
            const t = e.target;
            if (!t.matches('input[type=checkbox]')) return;
            const c = t.dataset.comp;
            if (c === 'max') {
                _supersatState.selected.max = t.checked;
            } else if (c === 'all') {
                _supersatState.selected.all = t.checked;
                checks.querySelectorAll('input[data-comp]:not([data-comp="max"]):not([data-comp="all"])')
                    .forEach(cb => { cb.checked = t.checked; });
                _supersatState.selected.perComp = t.checked
                    ? new Set(Array.from({ length: DecoEngine.NUM_COMPARTMENTS }, (_, i) => i))
                    : new Set();
            } else {
                const idx = parseInt(c, 10);
                if (t.checked) _supersatState.selected.perComp.add(idx);
                else _supersatState.selected.perComp.delete(idx);
            }
            renderSupersatChart(containerId, appState.lastResult, appState.levels, appState.settings);
        });
    }
    const { data16, dataMax } = _supersatComputeSeries(samples, settings, _supersatState.metric);
    const sel = _supersatState.selected;
    let noDataMsg = '';
    if (_supersatState.metric === 'heoffgas') {
        const hasHe = samples.some(s => s.he.some(v => v > 1e-6));
        if (!hasHe) noDataMsg = _t('CHART_NO_HE','No helium in this dive — nothing to off-gas.');
    }
    const series = [];
    if (sel.max) {
        series.push({
            name: _t('CHART_COMP_MAX', 'Max'),
            data: dataMax,
            color: '#9c8a1f',
            lineWidth: 2,
            marker: { enabled: false }
        });
    }
    for (let i = 0; i < data16.length; i++) {
        if (sel.perComp.has(i)) {
            series.push({
                name: `#${i + 1}`,
                data: data16[i],
                lineWidth: 1.2,
                marker: { enabled: false }
            });
        }
    }
    if (noDataMsg) {
        series.length = 0;
    }
    if (series.length === 0) {
        series.push({ name: '', data: [], showInLegend: false });
    }
    const titleMap = {
        supersat: _t('CHART_TITLE_SUPERSAT','Tissue super-saturation: total Ptis − Pamb'),
        n2offgas: _t('CHART_TITLE_N2','N2 off-gas gradient: pN2 − pAlv·fN2'),
        heoffgas: _t('CHART_TITLE_HE','He off-gas gradient: pHe'),
        surfoffgas: _t('CHART_TITLE_SURF','Surface off-gas: total Ptis − Psurf')
    };
    Highcharts.chart(`${containerId}-plot`, {
        chart: { type: 'line', height: 320, animation: false },
        title: { text: titleMap[_supersatState.metric] || titleMap.supersat, style: { fontSize: '12px' } },
        subtitle: noDataMsg ? { text: noDataMsg, style: { color: '#999', fontStyle: 'italic' } } : undefined,
        xAxis: {
            title: { text: _t('CHART_X_RUNTIME','Runtime (min)') },
            min: 0
        },
        yAxis: {
            title: { text: unit },
            min: 0
        },
        legend: { enabled: true },
        credits: { enabled: false },
        plotOptions: {
            series: { shadow: false, animation: false },
            line: { lineWidth: 1.5 }
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const rt = Math.round(this.x);
                const lbl = _t('TH_RUNTIME', 'RunTime');
                let html = `<b>${lbl} ${rt} min</b><br/>`;
                (this.points || []).forEach(p => {
                    html += `<span style="color:${p.color}">●</span> ${p.series.name}: <b>${p.y.toFixed(2)}</b> ${unit}<br/>`;
                });
                return html;
            }
        },
        series: series
    });
}
