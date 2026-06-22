const HELP_CATEGORY_ORDER = ["Dive Planning","Settings","VPM info","About"];
const HELP_ABOUT_HTML = `
    <div class="help-about">
        <h2 data-i18n="ABOUT_TITLE">ApexDeco</h2>
        <p data-i18n="ABOUT_SUBTITLE">Dive Decompression Planner</p>
        <p>
            <span data-i18n="ABOUT_MATH_TESTS_FULL">Math verification tests. The engine is validated against the original Android MultiDeco binary (libmultideco.so). Each gas-mixing tool (Best Mix, EAD/MOD, Nitrox, Trimix, Top-up, Capacity, Density) and every decompression primitive (ZH-L16C Schreiner loading, Gradient Factor ceiling, VPM-B boundary/critical volume, CCR setpoint, extended stops, OTU/CNS, fresh/salt water SLP behavior) is covered by an automated test with tolerance checks against Android-reference values. You can run the full test suite in your browser:</span>
            <a href="https://vlasovalexey.github.io/ApexDeco/html-src/tests.html" target="_blank" rel="noopener" data-i18n="ABOUT_TESTS_LINK">open tests.html</a>.
        </p>
        <p>
            <span data-i18n="ABOUT_ALGORITHMS_FULL">Based on the Bühlmann ZH-L16C algorithm with Gradient Factors. Implements decompression planning for OC diving. Includes gas mixing tools: Best Mix, EAD/MOD, Nitrox, Trimix, Top-up, Capacity, Density.</span>
        </p>
        <p>
            <span data-i18n="ABOUT_COPYRIGHT">Copyright &copy; Alexey Vlasov. Licensed under the</span>
            <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener" data-i18n="ABOUT_LICENSE_LINK">GNU Affero General Public License v3.0 (AGPLv3)</a>.
        </p>
        <div class="warning" style="margin-top:16px; text-align:left;">
            <strong data-i18n="ABOUT_WARNING_TITLE">WARNING!</strong> <span data-i18n="ABOUT_WARNING_TEXT_FULL">THERE IS ALWAYS A RISK OF DECOMPRESSION SICKNESS (DCS) FOR ANY DIVE PROFILE EVEN IF YOU FOLLOW THE DIVE PLAN PRESCRIBED BY DIVE TABLES. NO PROCEDURE OR DIVE TABLE WILL PREVENT THE POSSIBILITY OF DCS OR OXYGEN TOXICITY! An individual's physiological make up can vary from day to day. You are strongly advised to remain well within the exposure limits provided by the planner to minimize the risk of DCS.</span>
        </div>
    </div>
`;
function renderHelp() {
    const root = document.getElementById('screen-help');
    if (!root) return;
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    if (root.dataset.rendered === lang) return;
    const data = (typeof window.getHelpData === 'function') ? window.getHelpData() : {};
    const tabLabel = (typeof window.getHelpTabLabel === 'function') ? window.getHelpTabLabel : (c => c);
    const tabs = HELP_CATEGORY_ORDER.map((c, i) => `
        <button class="help-tab${i === 0 ? ' active' : ''}" data-help-tab="${c}" onclick="selectHelpTab('${c.replace(/'/g, "\'")}', this)">${escapeHelpHtml(tabLabel(c))}</button>
    `).join('');
    const panels = HELP_CATEGORY_ORDER.map((c, i) => {
        let body;
        if (c === 'About') {
            body = HELP_ABOUT_HTML;
        } else {
            body = (data[c] || []).map(it => `
                <details class="help-item">
                    <summary>${escapeHelpHtml(it.q)}</summary>
                    <div class="help-answer">${formatHelpAnswer(it.a)}</div>
                </details>
            `).join('');
        }
        return `<div class="help-panel${i === 0 ? ' active' : ''}" data-help-panel="${c}">${body}</div>`;
    }).join('');
    root.innerHTML = `
        <div class="card help-card">
            <div class="card-body" style="padding:0;">
                <div class="help-tabs">${tabs}</div>
                <div class="help-content">${panels}</div>
            </div>
        </div>
    `;
    root.dataset.rendered = lang;
    if (typeof window.applyTranslations === 'function') window.applyTranslations();
}
function selectHelpTab(name, btn) {
    document.querySelectorAll('.help-tab').forEach(t => t.classList.toggle('active', t === btn));
    document.querySelectorAll('.help-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.helpPanel === name);
    });
}
function escapeHelpHtml(s) {
    return String(s).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
}
const PLAN_LEG_RE = /^(\d+)\s*,\s*(-|\d+)\s*,\s*([0-9A-Za-z/]+)(?:\s*,\s*([0-9.]+|SCR))?\s+(.+)$/;
function parsePlanLeg(line) {
    const m = line.match(PLAN_LEG_RE);
    if (!m) return null;
    return { depth: m[1], time: m[2], mix: m[3], sp: m[4] || '', note: m[5] };
}
function renderPlanTable(rows) {
    const hasSP = rows.some(r => r.sp);
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Depth</th><th>Time</th><th>Mix</th>';
    if (hasSP) html += '<th>SP</th>';
    html += '<th>Note</th></tr></thead><tbody>';
    for (const r of rows) {
        html += '<tr>';
        html += `<td>${escapeHelpHtml(r.depth)}</td>`;
        html += `<td>${escapeHelpHtml(r.time)}</td>`;
        html += `<td>${escapeHelpHtml(r.mix)}</td>`;
        if (hasSP) html += `<td>${escapeHelpHtml(r.sp)}</td>`;
        html += `<td>${escapeHelpHtml(r.note)}</td>`;
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}
function formatHelpAnswer(s) {
    const blocks = String(s).split(/\n\s*\n/);
    let html = '';
    let buf = [];
    let mode = null;
    const flush = () => {
        if (!buf.length) return;
        if (mode === 'h4') {
            html += `<h4 class="help-section">${escapeHelpHtml(buf[0])}</h4>`;
        } else if (mode === 'ul') {
            html += '<ul>' + buf.map(l => `<li>${escapeHelpHtml(l.slice(2))}</li>`).join('') + '</ul>';
        } else if (mode === 'plan') {
            html += renderPlanTable(buf);
        } else if (mode === 'p') {
            html += `<p>${escapeHelpHtml(buf.join(' '))}</p>`;
        }
        buf = [];
        mode = null;
    };
    for (const block of blocks) {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        if (lines.length === 1 && lines[0].startsWith('## ')) {
            flush();
            mode = 'h4';
            buf.push(lines[0].slice(3).trim());
            flush();
            continue;
        }
        for (const l of lines) {
            let m, item;
            if (l.startsWith('- ')) { m = 'ul'; item = l; }
            else if ((item = parsePlanLeg(l))) { m = 'plan'; }
            else { m = 'p'; item = l; }
            if (m !== mode) { flush(); mode = m; }
            buf.push(item);
        }
        if (mode === 'p') flush();
    }
    flush();
    return html;
}
