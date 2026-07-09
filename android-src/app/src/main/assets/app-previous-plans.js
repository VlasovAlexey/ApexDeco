(function () {
    'use strict';

    const STORAGE_KEY = 'apexdeco_previous_plans';
    const MAX_PLANS = 10;
    const M_TO_FT = 3.28084;

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value || null));
    }

    function sortJsonValue(value) {
        if (Array.isArray(value)) return value.map(sortJsonValue);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).sort().forEach(key => {
                out[key] = sortJsonValue(value[key]);
            });
            return out;
        }
        return value;
    }

    function stableStringify(value) {
        return JSON.stringify(sortJsonValue(value));
    }

    function readPlans() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function writePlans(plans) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.slice(0, MAX_PLANS)));
        } catch (e) {}
    }

    function tValue(key, fallback) {
        return window.t ? window.t(key) : fallback;
    }

    function isMetric(settings) {
        return settings && typeof settings.metric === 'boolean' ? settings.metric : true;
    }

    function getCurrentMetric(fallbackMetric) {
        if (typeof appState !== 'undefined' && appState && appState.settings && typeof appState.settings.metric === 'boolean') {
            return appState.settings.metric;
        }
        return typeof fallbackMetric === 'boolean' ? fallbackMetric : true;
    }

    function getDepthUnit(metric) {
        const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
        if (metric) return tValue('UNIT_M', 'm');
        return lang === 'ru' ? 'ф' : tValue('UNIT_FT', 'ft');
    }

    function convertDepthForDisplay(depth, fromMetric, toMetric) {
        const value = Number(depth) || 0;
        if (fromMetric === toMetric) return value;
        return fromMetric ? value * M_TO_FT : value / M_TO_FT;
    }

    function findMaxDepthLevel(levels) {
        const selected = (levels || []).filter(level => level && level.selected !== false);
        if (!selected.length) return null;
        return selected.reduce((best, level) => {
            const bestDepth = Number(best.depth) || 0;
            const depth = Number(level.depth) || 0;
            return depth > bestDepth ? level : best;
        }, selected[0]);
    }

    function getNextDiveNumber(plans) {
        const maxExisting = plans.reduce((max, plan) => Math.max(max, parseInt(plan.diveNumber, 10) || 0), 0);
        return maxExisting + 1;
    }

    function buildPlanSummaryData(result, levels, settings) {
        const s = settings || {};
        const maxLevel = findMaxDepthLevel(levels) || {};
        const gas = `${parseInt(maxLevel.o2, 10) || 21}/${parseInt(maxLevel.he, 10) || 0}`;
        return {
            sourceMetric: isMetric(s),
            circuit: s.circuit === 'CCR' ? 'CCR' : 'OC',
            maxDepth: Number(maxLevel.depth) || 0,
            gas,
            runtime: Math.round(Number(result && result.totalRuntime) || 0)
        };
    }

    function getPlanLevels(data, circuit) {
        if (!data || typeof data !== 'object') return [];
        if (circuit === 'CCR' && Array.isArray(data.levelsCCR)) return data.levelsCCR;
        if (Array.isArray(data.levelsOC)) return data.levelsOC;
        if (Array.isArray(data.levelsCCR)) return data.levelsCCR;
        return [];
    }

    function parseRuntimeFromTitle(title) {
        const parts = String(title || '').split('|');
        const last = parts[parts.length - 1] || '';
        const match = last.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    function buildPlanSummary(plan) {
        const data = plan && plan.data && typeof plan.data === 'object' ? plan.data : {};
        const settings = data.settings && typeof data.settings === 'object' ? data.settings : {};
        const saved = plan && plan.summary && typeof plan.summary === 'object' ? plan.summary : {};
        const circuit = saved.circuit || (settings.circuit === 'CCR' ? 'CCR' : 'OC');
        const sourceMetric = typeof saved.sourceMetric === 'boolean' ? saved.sourceMetric : isMetric(settings);
        const levels = getPlanLevels(data, circuit);
        const maxLevel = findMaxDepthLevel(levels) || {};
        const maxDepth = Number.isFinite(Number(saved.maxDepth)) ? Number(saved.maxDepth) : (Number(maxLevel.depth) || 0);
        const gas = saved.gas || `${parseInt(maxLevel.o2, 10) || 21}/${parseInt(maxLevel.he, 10) || 0}`;
        const runtime = Number.isFinite(Number(saved.runtime)) ? Math.round(Number(saved.runtime)) : parseRuntimeFromTitle(plan && plan.title);
        return { circuit, sourceMetric, maxDepth, gas, runtime };
    }

    function renderPreviousPlanTitle(plan) {
        if (!plan || (!plan.data && !plan.summary)) return escapePreviousPlanHtml(plan && plan.title ? plan.title : '');
        const summary = buildPlanSummary(plan);
        const metric = getCurrentMetric(summary.sourceMetric);
        const depth = Math.round(convertDepthForDisplay(summary.maxDepth, summary.sourceMetric, metric));
        const unit = getDepthUnit(metric);
        const minLabel = tValue('UNIT_MIN', 'min');
        return [
            `#${escapePreviousPlanHtml(plan.diveNumber || '')}`,
            escapePreviousPlanHtml(summary.circuit),
            `<span class="previous-plan-max-depth">${escapePreviousPlanHtml(depth)}${escapePreviousPlanHtml(unit)}</span>.`,
            `<span class="previous-plan-gas">${escapePreviousPlanHtml(summary.gas)}</span>`,
            `${escapePreviousPlanHtml(summary.runtime)} ${escapePreviousPlanHtml(minLabel)}.`
        ].join(' | ');
    }

    function reorderPlans(fromIdx, toIdx) {
        const plans = readPlans();
        if (fromIdx < 0 || fromIdx >= plans.length || toIdx < 0 || toIdx >= plans.length || fromIdx === toIdx) return;
        const item = plans.splice(fromIdx, 1)[0];
        plans.splice(toIdx, 0, item);
        writePlans(plans);
        renderPreviousPlans();
    }

    function attachPreviousPlansDnD() {
        if (typeof attachItemsDnD !== 'function') return;
        attachItemsDnD('previous-plans-list', readPlans, reorderPlans);
    }

    function renderPreviousPlans() {
        const list = document.getElementById('previous-plans-list');
        const clearBtn = document.getElementById('btn-clear-previous-plans');
        if (!list) return;

        const plans = readPlans();
        if (clearBtn) clearBtn.style.display = plans.length ? '' : 'none';
        if (!plans.length) {
            const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || undefined;
            const calculate = (window.t ? window.t('BTN_CALCULATE') : 'Calculate').toLocaleUpperCase(lang);
            list.innerHTML = '<div class="previous-plans-empty">' +
                (window.t ? window.t('MSG_NO_PREVIOUS_PLANS', { calculate }) : `No previous plans yet. Press ${calculate} to save a plan here.`) +
                '</div>';
            return;
        }

        list.innerHTML = plans.map((plan, index) => `
            <div class="item-row previous-plan-row" data-idx="${index}">
                <button class="previous-plan-button" type="button" onclick="loadPreviousPlan(${index})">${renderPreviousPlanTitle(plan)}</button>
                <span class="drag-handle" onclick="event.stopPropagation()" title="${escapePreviousPlanHtml(window.t ? window.t('TITLE_DRAG_TO_REORDER') : 'Drag to reorder')}" aria-label="${escapePreviousPlanHtml(window.t ? window.t('TITLE_DRAG_TO_REORDER') : 'Drag to reorder')}">⋮⋮</span>
            </div>
        `).join('');
        attachPreviousPlansDnD();
    }

    function escapePreviousPlanHtml(value) {
        return String(value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function saveCurrentPlanToHistory(result, levels, settings) {
        if (typeof collectPlannerDebugData !== 'function') return;
        const data = cloneJson(collectPlannerDebugData());
        const signature = stableStringify(data);
        const plans = readPlans();
        if (plans[0] && plans[0].signature === signature) return;

        const diveNumber = getNextDiveNumber(plans);
        const item = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            diveNumber,
            summary: buildPlanSummaryData(result, levels, settings),
            signature,
            data
        };
        plans.unshift(item);
        writePlans(plans);
        renderPreviousPlans();
    }

    function loadPreviousPlan(index) {
        const plans = readPlans();
        const plan = plans[index];
        if (!plan || !plan.data || typeof applyPlannerDebugData !== 'function') return;
        const data = cloneJson(plan.data);
        delete data.theme;
        delete data.language;
        if (!applyPlannerDebugData(data, { showAlert: false })) {
            showAlert(window.t ? window.t('MSG_PREVIOUS_PLAN_LOAD_FAILED') : 'Failed to load previous plan.');
            return;
        }
        if (typeof showScreen === 'function') showScreen('main');
        if (typeof updateResetTissuesButton === 'function') updateResetTissuesButton();
        showAlert(window.t ? window.t('MSG_PREVIOUS_PLAN_LOADED') : 'Previous plan loaded.');
    }

    function clearPreviousPlans() {
        writePlans([]);
        renderPreviousPlans();
        showAlert(window.t ? window.t('MSG_PREVIOUS_PLANS_CLEARED') : 'Previous plans cleared.');
    }

    window.renderPreviousPlans = renderPreviousPlans;
    window.onPreviousPlanCalculated = saveCurrentPlanToHistory;
    window.loadPreviousPlan = loadPreviousPlan;
    window.clearPreviousPlans = clearPreviousPlans;

    document.addEventListener('DOMContentLoaded', renderPreviousPlans);
    document.addEventListener('languagechange', renderPreviousPlans);
})();
