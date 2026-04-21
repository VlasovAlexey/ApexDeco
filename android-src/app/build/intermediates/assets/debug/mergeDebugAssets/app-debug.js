/**
 * ApexDeco - Debug Logging
 * logSettingsToConsole / logPlanToConsole output is no longer written to the
 * browser console. Instead the text is built and returned so the "DEBUG INFO
 * TO DEVELOPER" button can copy it to the clipboard.
 */

function buildSettingsDebugText(s) {
    const yn = v => v ? 'Yes' : 'No';
    const u  = s.metric ? 'm' : 'ft';
    const lines = [
        '===== SETTINGS DEBUG =====',
        `Circuit: ${s.circuit || 'OC'}`,
        `Deco Model: ${s.decoModel || 'ZHLC_GF'}`,
        `GF Lo: ${s.gfLo}%`,
        `GF Hi: ${s.gfHi}%`,
        `GFS Hi: ${s.gfs || 85}%`,
        `Conservatism: ${s.conservatism || 0}`,
        `O2 Narcotic: ${yn(s.oxyNarc)}`,
        `Depth Units: ${s.metric ? 'Metric (m)' : 'Imperial (ft)'}`,
        `Water Type: ${s.waterType === 1 ? 'Fresh' : 'Salt'}`,
        `Altitude: ${s.altitude || 0} m`,
        `Acclimatized: ${s.acclimatized || 0} m`,
        `Gas Volume: ${s.gasVolUnit === 'cuft' ? 'CuFt' : 'Liter'}`,
        `Pressure Units: ${s.pressureUnit === 'psi' ? 'PSI' : 'BAR'}`,
        `Temperature: ${s.temperature != null ? s.temperature : 20} C`,
        `Gauge Type: ${s.gaugeType === 1 ? 'Digital' : 'Simple'}`,
        `Descent Rate: ${s.descentRate} ${u}/min`,
        `Ascent Rate: ${s.ascentRate} ${u}/min`,
        `Deco Ascent Rate: ${s.decoAscentRate} ${u}/min`,
        `Surface Ascent Rate: ${s.surfaceAscentRate || 9} ${u}/min`,
        `Step Size: ${s.stepSize} ${u}`,
        `Last Stop (OC): ${s.lastStop} ${u}`,
        `Last Stop (CCR): ${s.lastStopCCR || 3} ${u}`,
        `Min Stop Time: ${s.minStopTime} min`,
        `ppO2 Deco Swap: ${s.ppO2Deco} bar`,
        `ppO2 <=28% mix: ${s.ppO2Low || 1.4} bar`,
        `ppO2 28-45% mix: ${s.ppO2Mid || 1.5} bar`,
        `ppO2 45-99% mix: ${s.ppO2High || 1.6} bar`,
        `ppO2 Bottom Max: ${s.ppO2Bottom} bar`,
        `O2 100% Max Depth: ${s.o2MaxDepth || 6} ${u}`,
        `First Stop 30sec: ${yn(s.firstStop30sec)}`,
        `First Stop Double Step: ${yn(s.firstStopDoubleStep)}`,
        `CCR Default Setpoint: ${s.ccrDefaultSP || 1.3} bar`,
        `SP Units: ${s.spUnits || 'bar'}`,
        `Bottom RMV: ${s.rmvBottom} L/min`,
        `Deco RMV: ${s.rmvDeco} L/min`,
        `Extended Stops: ${yn(s.extendedStops)}`,
        `Ext Stop (7..30m / 21..100ft): ${s.extStopShallow || 0} min`,
        `Ext Stop (30+m / 100+ft): ${s.extStopDeep || 0} min`,
        `Ext Add to Existing Stop: ${yn(s.extendAdd)}`,
        `Ext All Mix Changes: ${yn(s.extendAllMix)}`,
        `Ext O2 Window Effect: ${yn(s.extendO2Window)}`,
        `Warn ppO2 High: ${yn(s.warnPpO2Hi)} @ ${s.ppO2HighThreshold || 1.6} bar`,
        `Warn ppO2 Low: ${yn(s.warnPpO2Lo)} @ ${s.ppO2LowThreshold || 0.16} bar`,
        `Warn CNS: ${yn(s.warnCNS)} above ${s.cnsHigh || 80}%`,
        `Warn OTU: ${yn(s.warnOTU)} above ${s.otuHigh || 300}`,
        `Warn IBCD N2: ${yn(s.warnIBCDN2)} @ ${s.ibcdN2Threshold || 0.5}`,
        `Warn IBCD He: ${yn(s.warnIBCDHe)} @ ${s.ibcdHeThreshold || 0.5}`,
        `CCR Dil ppO2 Check: ${yn(s.ccrDilCheck)}`,
        `Bailout Plan: ${yn(s.bailoutActive)}`,
        `Bailout Extra Bottom Min: ${yn(s.bailExtraMin)} (${s.bailExtraMinTime || 1} min)`,
        `Bailout Dive #: ${s.bailDiveNum || 1}`,
        `Cave Type Bailout: ${yn(s.bailCaveBail)} (${s.bailCavePortion || 33}%)`,
        `Surface Interval: ${s.surfaceInterval || 0} min`,
        `2-Week OTU: ${s.twoWeekOTU || 0}`,
        `Travel Gas: O2=${s.travelO2 || 21}% He=${s.travelHe || 0}%`,
        '=========================='
    ];
    return lines.join('\n');
}

function buildPlanDebugText(result, s) {
    const unit = result.depthUnit;
    const slp = s.metric
        ? (s.waterType === 0 ? 10.078 : 10.337)
        : (s.waterType === 0 ? 33.066 : 33.914);
    const isVPM = (s.decoModel || '').startsWith('VPM');

    function fmtGas(gasStr) {
        if (!gasStr) return '--';
        const { o2, he } = parseGas(gasStr);
        return he > 0 ? `${o2}/${he}` : `${o2}`;
    }

    const header = 'Action  Depth    Stop   Run  Mix      pO2   EAD';
    const rows = result.plan.map(seg => {
        let action  = '???';
        let depthStr = '-';
        let stopStr  = '-';
        let pO2Str   = '-';
        let eadStr   = '-';

        const depth = (seg.type === 'descent' || seg.type === 'ascent')
            ? seg.endDepth
            : (seg.depth !== undefined ? seg.depth : 0);

        if ((seg.type === 'bottom' || seg.type === 'stop') && seg.gas) {
            const { o2, he } = parseGas(seg.gas);
            const pAmb = depth / slp + 1;
            const fO2 = o2 / 100;
            const fN2 = 1 - fO2 - he / 100;
            pO2Str = (fO2 * pAmb).toFixed(2);
            eadStr = Math.max(0, Math.round((fN2 / 0.7902) * (depth + 10) - 10)).toString();
        }

        switch (seg.type) {
            case 'descent': action = 'Des'; depthStr = String(depth); break;
            case 'bottom':  action = 'Lvl'; depthStr = String(depth); stopStr = formatStopTime(seg.time || 0); break;
            case 'ascent':  action = 'Asc'; depthStr = String(depth); break;
            case 'stop':    action = 'Stp'; depthStr = String(depth); stopStr = formatStopTime(seg.time || 0); break;
            case 'surface': action = 'Sfc'; break;
        }

        const run = Math.floor(seg.runtime || 0);
        const mix = fmtGas(seg.gas);
        return `${action.padEnd(4)} ${depthStr.padStart(5)}  ${stopStr.padStart(6)}  ${String(run).padStart(4)}  ${mix.padEnd(6)}  ${pO2Str.padStart(5)}  ${eadStr.padStart(4)}`;
    });

    const diveNum = (appState && appState.nextDiveNum) ? appState.nextDiveNum - 1 : 1;
    const modelLabel = result.modelName || getModelName(s.decoModel || 'ZHLC_GF');
    const modelLine = isVPM
        ? `Dive# ${diveNum},  ${modelLabel}  Conservatism: ${s.conservatism || 0}`
        : `Dive# ${diveNum},  ${modelLabel}  GF ${s.gfLo}/${s.gfHi}`;

    const summaryLines = [modelLine];
    summaryLines.push(`Elevation = ${s.altitude || 0} m`);
    summaryLines.push(`CNS = ${result.totalCNS.toFixed(0)}%`);
    summaryLines.push(`OTU's = ${result.totalOTU}`);

    if (result.gasUsage && result.gasUsage.length > 0) {
        for (const g of result.gasUsage) {
            summaryLines.push(`Gas  ${g.gas} = ${g.volume} ${g.volumeUnit}.  [11L:${g.bar11}bar  12L:${g.bar12}bar  15L:${g.bar15}bar  24Lx2:${g.bar24}bar]`);
        }
    }

    try {
        const bottomSegs = result.plan.filter(p => p.type === 'bottom');
        if (bottomSegs.length > 0) {
            const bs = bottomSegs[0];
            const { o2, he } = parseGas(bs.gas);
            const tempC = s.temperature != null ? s.temperature : 20;
            const dens = DiveTools.gasDensity(o2, he, bs.depth || 0, s.metric, s.waterType || 0, tempC, 0);
            summaryLines.push(`Gas density = ${dens.gramsPerLiter.toFixed(1)}g/l`);
        }
    } catch (e) { /* ignore */ }

    if (result.decoZoneStart > 0) {
        summaryLines.push(`Decozone start = ${result.decoZoneStart} ${unit}`);
    } else if (result.stops && result.stops.length > 0) {
        summaryLines.push(`Decozone start = ${result.stops[0].depth} ${unit}`);
    }

    // NEXT DIVE tissue state
    const nextDiveLines = [];
    if (result.finalTissues && result.finalTissues.length > 0) {
        const si = s.surfaceInterval || 0;
        nextDiveLines.push('');
        nextDiveLines.push(`--- NEXT DIVE TISSUES (after ${si} min surface interval) ---`);
        // Apply surface interval to show pre-loaded state for next dive
        let displayTissues = result.finalTissues;
        if (si > 0 && typeof DecoEngine !== 'undefined') {
            const tempTissues = result.finalTissues.map(t => ({ pN2: t.pN2, pHe: t.pHe }));
            const tempSettings = Object.assign({}, s);
            DecoEngine.applySurfaceInterval(tempTissues, si, tempSettings);
            displayTissues = tempTissues;
        }
        for (let i = 0; i < displayTissues.length; i++) {
            const t = displayTissues[i];
            nextDiveLines.push(`  C${String(i+1).padStart(2,'0')}  N2=${t.pN2.toFixed(4)}  He=${t.pHe.toFixed(4)}`);
        }
    }

    return [
        '===== DIVE PLAN =====',
        header,
        ...rows,
        '',
        ...summaryLines,
        ...nextDiveLines,
        '====================='
    ].join('\n');
}

// These are kept for backward compatibility with calculateDeco() calls.
// They no longer print to the browser console.
function logSettingsToConsole(s) { /* console output removed */ }
function logPlanToConsole(result, s) { /* console output removed */ }

function copyDebugToClipboard() {
    if (!appState.lastResult) {
        showAlert('No result available. Calculate a dive plan first.');
        return;
    }
    const text = buildSettingsDebugText(appState.settings) + '\n\n' + buildPlanDebugText(appState.lastResult, appState.settings);
    const showOK = () => showAlert('Debug Info copied to clipboard.');
    const showFail = () => showAlert('Failed to copy debug info to clipboard.');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showOK).catch(() => {
            legacyCopy(text) ? showOK() : showFail();
        });
    } else {
        legacyCopy(text) ? showOK() : showFail();
    }
}
