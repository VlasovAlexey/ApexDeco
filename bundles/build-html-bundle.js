const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'html-src');
const outDir = path.join(rootDir, 'bundles');
const outFile = path.join(outDir, 'ApexDeco-bundle.html');
const zipFile = path.join(outDir, 'ApexDeco-bundle-Win-Linux-MacOS-ARM.zip');

const textFiles = {
    index: path.join(srcDir, 'index.html'),
    lightCss: path.join(srcDir, 'light_styles.css'),
    darkCss: path.join(srcDir, 'dark_styles.css'),
    manifest: path.join(srcDir, 'manifest.json'),
    hallOfFame: path.join(srcDir, 'app-halloffame.js')
};

const mimeByExt = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/manifest+json'
};

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function escapeInlineScript(source) {
    return source.replace(/<\/script/gi, '<\\/script');
}

function escapeInlineStyle(source) {
    return source.replace(/<\/style/gi, '<\\/style');
}

function toDataUrl(filePath, explicitMime) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = explicitMime || mimeByExt[ext];
    if (!mime) {
        throw new Error(`Unsupported MIME type for ${filePath}`);
    }
    const data = fs.readFileSync(filePath);
    return `data:${mime};base64,${data.toString('base64')}`;
}

function extractScriptSources(indexHtml) {
    const matches = [...indexHtml.matchAll(/<script\s+src="([^"]+)"><\/script>/g)];
    return matches.map((match) => match[1]);
}

function listAllJsFiles() {
    const result = [];
    function walk(dirPath, relativeDir) {
        fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
            const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            const nextPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                walk(nextPath, nextRelative);
                return;
            }
            if (entry.isFile() && entry.name.toLowerCase().endsWith('.js')) {
                result.push(nextRelative.replace(/\\/g, '/'));
            }
        });
    }
    walk(srcDir, '');
    return result.sort();
}

function replaceAll(text, from, to) {
    return text.split(from).join(to);
}

const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let j = 0; j < 8; j += 1) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function computeCrc32(buffer) {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i += 1) {
        crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createDosDateTime(date) {
    const year = Math.max(1980, date.getFullYear());
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);
    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = ((year - 1980) << 9) | (month << 5) | day;
    return { dosDate, dosTime };
}

function createZipArchive(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach((entry) => {
        const nameBuffer = Buffer.from(entry.name, 'utf8');
        const contentBuffer = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content);
        const compressedBuffer = zlib.deflateRawSync(contentBuffer, { level: zlib.constants.Z_BEST_COMPRESSION });
        const useCompression = compressedBuffer.length < contentBuffer.length;
        const payloadBuffer = useCompression ? compressedBuffer : contentBuffer;
        const method = useCompression ? 8 : 0;
        const crc32 = computeCrc32(contentBuffer);
        const { dosDate, dosTime } = createDosDateTime(entry.date || new Date());

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0x0800, 6);
        localHeader.writeUInt16LE(method, 8);
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(crc32, 14);
        localHeader.writeUInt32LE(payloadBuffer.length, 18);
        localHeader.writeUInt32LE(contentBuffer.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);

        localParts.push(localHeader, nameBuffer, payloadBuffer);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0x0800, 8);
        centralHeader.writeUInt16LE(method, 10);
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(crc32, 16);
        centralHeader.writeUInt32LE(payloadBuffer.length, 20);
        centralHeader.writeUInt32LE(contentBuffer.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);

        centralParts.push(centralHeader, nameBuffer);
        offset += localHeader.length + nameBuffer.length + payloadBuffer.length;
    });

    const centralDirectory = Buffer.concat(centralParts);
    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(entries.length, 8);
    endRecord.writeUInt16LE(entries.length, 10);
    endRecord.writeUInt32LE(centralDirectory.length, 12);
    endRecord.writeUInt32LE(offset, 16);
    endRecord.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function buildManifestDataUrl(imageDataUrls) {
    const manifest = JSON.parse(readText(textFiles.manifest));
    manifest.icons = (manifest.icons || []).map((icon) => {
        if (icon.src && imageDataUrls[icon.src]) {
            return { ...icon, src: imageDataUrls[icon.src] };
        }
        return icon;
    });
    const manifestJson = JSON.stringify(manifest);
    return `data:application/manifest+json;base64,${Buffer.from(manifestJson, 'utf8').toString('base64')}`;
}

function buildThemeBlock(lightCss, darkCss) {
    const light = escapeInlineStyle(lightCss);
    const dark = escapeInlineStyle(darkCss);
    return [
        '<style id="theme-style-light">',
        light,
        '</style>',
        '<style id="theme-style-dark" media="not all">',
        dark,
        '</style>',
        '<script>',
        escapeInlineScript(`(function () {
    function applyBundledTheme(theme) {
        var nextTheme = theme === 'dark' ? 'dark' : 'light';
        var light = document.getElementById('theme-style-light');
        var dark = document.getElementById('theme-style-dark');
        if (light) light.media = nextTheme === 'dark' ? 'not all' : 'all';
        if (dark) dark.media = nextTheme === 'dark' ? 'all' : 'not all';
        document.documentElement.setAttribute('data-theme', nextTheme);
    }
    window.__applyBundledTheme = applyBundledTheme;
    var savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('apexdeco_theme') || 'light';
    } catch (e) {}
    applyBundledTheme(savedTheme);
})();`),
        '</script>'
    ].join('\n');
}

function buildThemeRuntimeScript() {
    return [
        '<script>',
        escapeInlineScript(`window.onThemeChange = function (theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';
    if (typeof window.__applyBundledTheme === 'function') {
        window.__applyBundledTheme(nextTheme);
    }
    try { localStorage.setItem('apexdeco_theme', nextTheme); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
    try {
        if (window.Android && typeof window.Android.onThemeChanged === 'function') {
            window.Android.onThemeChanged(nextTheme === 'dark');
        }
    } catch (e) {}
};
document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('cfg-theme');
    var saved = 'light';
    try { saved = localStorage.getItem('apexdeco_theme') || 'light'; } catch (e) {}
    if (typeof window.__applyBundledTheme === 'function') {
        window.__applyBundledTheme(saved);
    }
    if (sel) sel.value = saved;
    try {
        if (window.Android && typeof window.Android.onThemeChanged === 'function') {
            window.Android.onThemeChanged(saved === 'dark');
        }
    } catch (e) {}
});`),
        '</script>'
    ].join('\n');
}

function inlineScripts(indexHtml, imageDataUrls) {
    return indexHtml.replace(/<script\s+src="([^"]+)"><\/script>/g, (_match, src) => {
        const cleanSrc = src.split('?')[0];
        const filePath = path.join(srcDir, cleanSrc);
        let scriptBody = readText(filePath);
        Object.entries(imageDataUrls).forEach(([assetPath, dataUrl]) => {
            scriptBody = replaceAll(scriptBody, assetPath, dataUrl);
        });
        scriptBody = escapeInlineScript(scriptBody);
        return `<script data-bundled-src="${cleanSrc}">\n${scriptBody}\n</script>`;
    });
}

function buildInactiveScriptSources(activeScripts, imageDataUrls) {
    const activeSet = new Set(activeScripts);
    const inactiveScripts = listAllJsFiles().filter((fileName) => !activeSet.has(fileName));
    if (inactiveScripts.length === 0) return '';
    return inactiveScripts.map((fileName) => {
        let scriptBody = readText(path.join(srcDir, fileName));
        Object.entries(imageDataUrls).forEach(([assetPath, dataUrl]) => {
            scriptBody = replaceAll(scriptBody, assetPath, dataUrl);
        });
        scriptBody = escapeInlineScript(scriptBody);
        return `<script type="text/plain" data-bundled-src="${fileName}" data-bundled-executable="false">\n${scriptBody}\n</script>`;
    }).join('\n');
}

function main() {
    fs.mkdirSync(outDir, { recursive: true });

    const imageFiles = fs.readdirSync(path.join(srcDir, 'images'))
        .filter((name) => fs.statSync(path.join(srcDir, 'images', name)).isFile());
    const imageDataUrls = {};
    imageFiles.forEach((fileName) => {
        const rel = `images/${fileName}`;
        imageDataUrls[rel] = toDataUrl(path.join(srcDir, rel));
    });

    let html = readText(textFiles.index);
    const lightCss = readText(textFiles.lightCss);
    const darkCss = readText(textFiles.darkCss);
    const manifestDataUrl = buildManifestDataUrl(imageDataUrls);
    const activeScripts = extractScriptSources(html).map((src) => src.split('?')[0]);

    const originalThemeBlock = /<link id="theme-stylesheet" rel="stylesheet" href="light_styles\.css\?v=\d+">\s*<script>[\s\S]*?<\/script>/;
    html = html.replace(originalThemeBlock, buildThemeBlock(lightCss, darkCss));

    html = replaceAll(html, 'href="manifest.json"', `href="${manifestDataUrl}"`);

    Object.entries(imageDataUrls).forEach(([assetPath, dataUrl]) => {
        html = replaceAll(html, `href="${assetPath}"`, `href="${dataUrl}"`);
        html = replaceAll(html, `'${assetPath}'`, `'${dataUrl}'`);
        html = replaceAll(html, `"${assetPath}"`, `"${dataUrl}"`);
    });

    const originalThemeRuntime = /<script>\s*window\.onThemeChange = function \(theme\) \{[\s\S]*?document\.addEventListener\('DOMContentLoaded', function \(\) \{[\s\S]*?<\/script>/;
    html = html.replace(originalThemeRuntime, buildThemeRuntimeScript());

    html = inlineScripts(html, imageDataUrls);

    const serviceWorkerBlock = /<script>\s*if \('serviceWorker' in navigator\) \{[\s\S]*?<\/script>\s*<\/body>/;
    html = html.replace(
        serviceWorkerBlock,
        '<!-- Service worker registration omitted in single-file bundle -->\n</body>'
    );

    const inactiveScriptSources = buildInactiveScriptSources(activeScripts, imageDataUrls);
    if (inactiveScriptSources) {
        html = html.replace(
            /<!-- Service worker registration omitted in single-file bundle -->\s*<\/body>/,
            `<!-- Additional bundled source files -->\n${inactiveScriptSources}\n<!-- Service worker registration omitted in single-file bundle -->\n</body>`
        );
    }

    html = html.replace(
        /<head>/,
        '<head>\n    <!-- Generated by scripts/build-html-bundle.js -->'
    );

    fs.writeFileSync(outFile, html, 'utf8');

    const htmlBuffer = Buffer.from(html, 'utf8');
    const zipBuffer = createZipArchive([{
        name: path.basename(outFile),
        content: htmlBuffer,
        date: new Date()
    }]);
    fs.writeFileSync(zipFile, zipBuffer);

    console.log(`Bundled ${activeScripts.length} executable scripts into ${outFile}`);
    console.log(`Embedded ${listAllJsFiles().length} total JS source files and ${imageFiles.length} image assets.`);
    console.log(`Packed ${path.basename(outFile)} into ${zipFile}`);
}

main();
