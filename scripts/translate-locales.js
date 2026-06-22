const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', 'html-src');
const localesDir = path.join(root, 'locales');
const helpDir = path.join(localesDir, 'help');

const tabLabelsByCode = {
    fr: { 'Dive Planning': 'Planification', Settings: 'Paramètres', 'VPM info': 'Infos VPM', About: 'À propos' },
    pt: { 'Dive Planning': 'Planeamento', Settings: 'Definições', 'VPM info': 'Info VPM', About: 'Sobre' },
    de: { 'Dive Planning': 'Tauchplanung', Settings: 'Einstellungen', 'VPM info': 'VPM-Info', About: 'Info' },
    it: { 'Dive Planning': 'Pianificazione', Settings: 'Impostazioni', 'VPM info': 'Info VPM', About: 'Informazioni' },
    ko: { 'Dive Planning': '다이빙 계획', Settings: '설정', 'VPM info': 'VPM 정보', About: '정보' },
    bg: { 'Dive Planning': 'Планиране', Settings: 'Настройки', 'VPM info': 'VPM инфо', About: 'За приложението' },
    nb: { 'Dive Planning': 'Dykkplanlegging', Settings: 'Innstillinger', 'VPM info': 'VPM-info', About: 'Om' },
    ja: { 'Dive Planning': 'ダイブ計画', Settings: '設定', 'VPM info': 'VPM情報', About: '情報' },
    pl: { 'Dive Planning': 'Planowanie nurkowania', Settings: 'Ustawienia', 'VPM info': 'Informacje VPM', About: 'O programie' },
    tr: { 'Dive Planning': 'Dalış Planlama', Settings: 'Ayarlar', 'VPM info': 'VPM Bilgisi', About: 'Hakkında' }
};

const protectedTerms = [
    'Bottom Mix & Travel', 'Travel Gas O2% / He%', 'Bottom RMV', 'Deco RMV', 'CCR Dil Metabolic',
    'GF Lo', 'GF Hi', 'GFS Hi', 'Setpoint (CCR)', 'Default Setpoint', 'SP Units', 'Bailout Plan',
    'Bailout Model', 'Bailout GF Lo', 'Bailout GF Hi', 'Bailout GFS Hi', 'Bailout RMV',
    'Bailout Dive #', 'Cave Type Bail', 'Return Portion', 'Surface Interval', '2-Week OTU',
    'Bottom Mix', 'Deco Mixes', 'Best Mix', 'EAD/MOD', 'Mix Nitrox', 'Mix Trimix', 'Mix Topup',
    'Mix Fill', 'Mix Config', 'Travel Gas', 'Bailout', 'bailout', 'Deco', 'deco', 'Diluent', 'diluent',
    'Setpoint', 'setpoint', 'CCR', 'SCR', 'OC', 'RMV', 'GF', 'GFS', 'ppO2', 'pO2', 'OTU', 'CNS',
    'IBCD', 'EAD', 'END', 'EADD', 'MOD', 'VRGA', 'KISS', 'RB80', 'ZH-L16C', 'VPM-B/E', 'VPM-B/FBO',
    'VPM-B', 'VPM', 'Bühlmann', 'Schreiner', 'MultiDeco', 'ApexDeco', 'libmultideco.so',
    'tests.html', 'vpln-out.txt', 'vpln-sht.txt', 'vp-short.csv', 'vp-lost.csv', 'vp-mrlss.csv',
    'Appstore', 'V-Planner', 'Excel', 'DCOM', 'RPC', 'Android', 'Windows', 'Mac', 'Linux',
    'Air', 'EAN', 'Trimix', 'Nitrox', 'Top-up', 'Topup', 'Capacity', 'Density', 'He', 'N2', 'O2',
    'ATA', 'bar', 'psi', 'CuFt', 'sfc', 'SLP', 'ppN2', 'ppHe'
].sort((a, b) => b.length - a.length);

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTokens(text) {
    return text
        .replace(/__\s*([A-Z0-9_]+)\s*__/g, (_m, inner) => `__${inner.replace(/\s+/g, '')}__`)
        .replace(/⟪([^⟫]+)⟫/g, (_m, inner) => `⟪${inner.replace(/\s+/g, '')}⟫`);
}

function loadLocale(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const box = { value: null };
    const ctx = {
        window: {
            registerTranslations(lang, data) { box.value = { lang, data }; },
            registerHelpLocale(lang, data, labels) { box.value = { lang, data, labels }; }
        }
    };
    vm.createContext(ctx);
    vm.runInContext(source, ctx);
    return box.value;
}

function writeJsFile(filePath, text) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, text, 'utf8');
}

function loadEnglishUi() {
    return loadLocale(path.join(localesDir, 'en.js')).data;
}

function loadEnglishHelp() {
    const help = JSON.parse(JSON.stringify(loadLocale(path.join(helpDir, 'en.js')).data));
    if (help.Settings && help.Settings[0] && typeof help.Settings[0].a === 'string') {
        help.Settings[0].a = help.Settings[0].a.replace(
            'Language: UI language (English, Russian, Spanish, Chinese, Hindi).',
            'Language: UI language.'
        );
    }
    return help;
}

function protectText(source) {
    let idx = 0;
    const restore = [];
    function token(value) {
        const key = `__PH${idx++}__`;
        restore.push([key, value]);
        return key;
    }
    let text = source;
    text = text.replace(/\{[^}]+\}/g, (m) => token(m));
    text = text.replace(/\b[\w-]+\.(?:txt|csv|html|so)\b/g, (m) => token(m));
    text = text.replace(/"[A-Z]:\\\\[^"]+"/g, (m) => token(m));
    protectedTerms.forEach((term) => {
        text = text.replace(new RegExp(escapeRegExp(term), 'g'), (m) => token(m));
    });
    return { text, restore };
}

function restoreText(text, restore) {
    let out = normalizeTokens(text);
    for (let i = restore.length - 1; i >= 0; i -= 1) {
        const token = restore[i][0];
        const bare = token.replace(/^__|__$/g, '');
        const value = restore[i][1];
        [
            token,
            bare,
            `"${bare}"`,
            `“${bare}”`,
            `„${bare}“`,
            `「${bare}」`,
            `⟪${bare}⟫`,
            `⟪${bare}`,
            `${bare}⟫`,
            `⟫${bare}⟫`,
            `⟫${bare}`
        ].forEach((variant) => {
            out = out.split(variant).join(value);
        });
    }
    return out;
}

async function fetchTranslation(text, targetLang) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
        encodeURIComponent(targetLang) + '&dt=t&q=' + encodeURIComponent(text);
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await fetch(url);
        if (response.ok) {
            const payload = JSON.parse(await response.text());
            return normalizeTokens(payload[0].map((part) => part[0]).join(''));
        }
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
    }
    throw new Error(`Translation request failed for ${targetLang}`);
}

async function translateSingle(text, targetLang) {
    const packed = protectText(text);
    const translated = await fetchTranslation(packed.text, targetLang);
    return restoreText(translated, packed.restore);
}

async function translateUiBatch(strings, targetLang) {
    const results = [];
    let batch = [];
    let positions = [];
    let size = 0;

    async function flush() {
        if (!batch.length) return;
        const sentinel = '__SEP_BATCH_9D7F1A__';
        const packed = batch.map((value) => protectText(value));
        const translated = await fetchTranslation(packed.map((item) => item.text).join(sentinel), targetLang);
        const parts = translated.split(sentinel);
        if (parts.length !== batch.length) {
            for (let i = 0; i < batch.length; i += 1) {
                const single = await fetchTranslation(packed[i].text, targetLang);
                results[positions[i]] = restoreText(single, packed[i].restore);
                await new Promise((resolve) => setTimeout(resolve, 120));
            }
            batch = [];
            positions = [];
            size = 0;
            return;
        }
        parts.forEach((part, index) => {
            results[positions[index]] = restoreText(part, packed[index].restore);
        });
        batch = [];
        positions = [];
        size = 0;
        await new Promise((resolve) => setTimeout(resolve, 120));
    }

    for (let i = 0; i < strings.length; i += 1) {
        const value = strings[i];
        if (batch.length && (size + value.length > 1200 || batch.length >= 4)) {
            await flush();
        }
        batch.push(value);
        positions.push(i);
        size += value.length;
    }
    await flush();
    return results;
}

function getTargetSpec(code) {
    const codeToLang = {
        fr: 'fr',
        pt: 'pt-PT',
        de: 'de',
        it: 'it',
        ko: 'ko',
        bg: 'bg',
        nb: 'no',
        ja: 'ja',
        pl: 'pl',
        tr: 'tr'
    };
    const labels = tabLabelsByCode[code];
    const tl = codeToLang[code];
    if (!labels || !tl) {
        throw new Error(`Unsupported locale code: ${code}`);
    }
    return { code, tl, tabLabels: labels };
}

async function writeUi(code) {
    const spec = getTargetSpec(code);
    const english = loadEnglishUi();
    const keys = Object.keys(english);
    const translated = await translateUiBatch(keys.map((key) => english[key]), spec.tl);
    const dict = {};
    keys.forEach((key, index) => { dict[key] = translated[index]; });
    writeJsFile(
        path.join(localesDir, `${code}.js`),
        `window.registerTranslations(${JSON.stringify(code)}, ${JSON.stringify(dict, null, 4)});\n`
    );
    return { code, type: 'ui', keys: keys.length };
}

async function writeHelpCategory(code, category) {
    const spec = getTargetSpec(code);
    const english = loadEnglishHelp();
    const outPath = path.join(helpDir, `${code}.js`);
    let current = JSON.parse(JSON.stringify(english));
    if (fs.existsSync(outPath)) {
        current = JSON.parse(JSON.stringify(loadLocale(outPath).data));
    }
    const items = english[category];
    if (!items) {
        throw new Error(`Unknown help category: ${category}`);
    }
    for (let index = 0; index < items.length; index += 1) {
        current[category][index].q = await translateSingle(items[index].q, spec.tl);
        await new Promise((resolve) => setTimeout(resolve, 80));
        current[category][index].a = await translateSingle(items[index].a, spec.tl);
        await new Promise((resolve) => setTimeout(resolve, 80));
    }
    writeJsFile(
        outPath,
        `window.registerHelpLocale(${JSON.stringify(code)}, ${JSON.stringify(current, null, 4)}, ${JSON.stringify(spec.tabLabels, null, 4)});\n`
    );
    return { code, type: 'help', category, items: items.length };
}

async function writeHelpAll(code) {
    const english = loadEnglishHelp();
    for (const category of Object.keys(english)) {
        await writeHelpCategory(code, category);
    }
    return { code, type: 'help-all', categories: Object.keys(english).length };
}

async function main() {
    const [, , mode, code, ...rest] = process.argv;
    if (!mode || !code) {
        throw new Error('Usage: node translate-locales.js <ui|help-cat|help-all> <code> [category]');
    }
    let result;
    if (mode === 'ui') {
        result = await writeUi(code);
    } else if (mode === 'help-all') {
        result = await writeHelpAll(code);
    } else if (mode === 'help-cat') {
        const category = rest.join(' ');
        if (!category) throw new Error('Category is required for help-cat');
        result = await writeHelpCategory(code, category);
    } else {
        throw new Error(`Unsupported mode: ${mode}`);
    }
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
