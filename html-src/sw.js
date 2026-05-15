/* ApexDeco Service Worker
 * Strategy: cache-first; background refresh only when online AND cache age > 90 days.
 * Change CACHE_VERSION to force an immediate update on next deployment.
 */
'use strict';
const CACHE_VERSION = 'apexdeco-v1';
const CACHE_TS_KEY  = '/_sw_cache_ts';
const MAX_AGE_MS    = 90 * 24 * 60 * 60 * 1000; // 90 days
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './light_styles.css',
    './dark_styles.css',
    './app-calculation.js',
    './app-config.js',
    './app-debug.js',
    './app-halloffame.js',
    './app-init.js',
    './app-levels.js',
    './app-modal.js',
    './app-navigation.js',
    './app-result.js',
    './app-state.js',
    './app-tools-ui.js',
    './chart-theme.js',
    './zhl16-engine.js',
    './help-i18n.js',
    './help.js',
    './highcharts.js',
    './highstock.js',
    './i18n.js',
    './lng.js',
    './profile-chart.js',
    './supersat-chart.js',
    './tool-bestmix.js',
    './tool-capacity.js',
    './tool-density.js',
    './tool-eadmod.js',
    './tool-nitrox.js',
    './tool-topup.js',
    './tool-trimix.js',
    './tool-utils.js',
    './tools.js',
    './vpm-engine.js',
    './images/icon-72.png',
    './images/icon-96.png',
    './images/icon-128.png',
    './images/icon-144.png',
    './images/icon-152.png',
    './images/icon-167.png',
    './images/icon-180.png',
    './images/icon-192.png',
    './images/icon-384.png',
    './images/icon-512.png'
];
// ─── helpers ───────────────────────────────────────────────────────────────
async function getTimestamp(cache) {
    const r = await cache.match(CACHE_TS_KEY);
    if (!r) return 0;
    return parseInt(await r.text(), 10) || 0;
}
async function setTimestamp(cache) {
    await cache.put(CACHE_TS_KEY, new Response(String(Date.now()), {
        headers: { 'Content-Type': 'text/plain' }
    }));
}
// ─── install: pre-cache all static assets ──────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(async cache => {
            // addAll with individual error tolerance
            await Promise.all(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(e => console.warn('[SW] pre-cache skip:', url, e))
                )
            );
            await setTimestamp(cache);
        }).then(() => self.skipWaiting())
    );
});
// ─── activate: delete old cache versions ───────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});
// ─── background refresh (called at most once per SW lifetime) ───────────────
let _refreshing = false;
let _refreshChecked = false;
async function maybeRefresh(cache) {
    if (_refreshChecked || _refreshing) return;
    _refreshChecked = true;
    if (!navigator.onLine) return;
    const age = Date.now() - await getTimestamp(cache);
    if (age < MAX_AGE_MS) return;
    _refreshing = true;
    try {
        const keys = await cache.keys();
        await Promise.all(
            keys
                .map(r => r.url)
                .filter(u => !u.endsWith(CACHE_TS_KEY))
                .map(async url => {
                    try {
                        const res = await fetch(url, { cache: 'no-store' });
                        if (res.ok) await cache.put(url, res);
                    } catch (_) {}
                })
        );
        await setTimestamp(cache);
        console.log('[SW] Cache refreshed after', Math.round(age / 86400000), 'days');
    } catch (e) {
        console.warn('[SW] Refresh error:', e);
    } finally {
        _refreshing = false;
    }
}
// ─── fetch: cache-first with background refresh ────────────────────────────
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    // Only handle same-origin requests
    if (url.origin !== self.location.origin) return;
    event.respondWith(
        caches.open(CACHE_VERSION).then(async cache => {
            // Match ignoring query string (handles ?v=XX cache-busting params)
            const cached = await cache.match(event.request, { ignoreSearch: true });
            // Trigger background refresh check (non-blocking, once per lifetime)
            maybeRefresh(cache);
            if (cached) return cached;
            // Not cached yet — fetch, cache, return
            try {
                const response = await fetch(event.request);
                if (response.ok && response.type !== 'opaque') {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch (_) {
                // Offline and nothing in cache
                return new Response(
                    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2em">' +
                    '<h2>ApexDeco — Offline</h2>' +
                    '<p>Open the app while connected to the internet at least once to enable offline use.</p>' +
                    '</body></html>',
                    { status: 503, headers: { 'Content-Type': 'text/html' } }
                );
            }
        })
    );
});
