/**
 * ApexDeco i18n Language Manager.
 * Translations are loaded from lng.js (window.translations).
 *
 * Usage in HTML:
 *   <span data-i18n="BTN_CALCULATE">Calculate</span>
 *   <input data-i18n-placeholder="PH_DEPTH" placeholder="Depth">
 *   <button data-i18n-title="TT_ADD" title="Add">+</button>
 *
 * Usage in JS:
 *   window.t('BTN_SAVE')
 *   window.t('WARN_PPO2_HI_DETAIL', {val:'1.62', threshold:'1.40', depth:30, gas:'21/35'})
 *   window.setLanguage('ru')
 *
 * When language changes, custom event 'languagechange' is dispatched on document.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'apexdeco_language';
    var DEFAULT_LANG = 'en';

    var translations = window.translations || {};

    function LanguageManager() {
        this.currentLanguage = DEFAULT_LANG;
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (saved && translations[saved]) {
            this.currentLanguage = saved;
        }
    }

    LanguageManager.prototype.t = function (key, params) {
        var dict = translations[this.currentLanguage] || translations[DEFAULT_LANG] || {};
        var fallback = translations[DEFAULT_LANG] || {};
        var value = (dict[key] !== undefined) ? dict[key] : (fallback[key] !== undefined ? fallback[key] : key);
        if (typeof value === 'string' && params) {
            value = value.replace(/\{(\w+)\}/g, function (m, name) {
                return params[name] !== undefined ? params[name] : m;
            });
        }
        return value;
    };

    LanguageManager.prototype.setLanguage = function (lang) {
        if (!translations[lang]) return false;
        this.currentLanguage = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        this.applyToDom();
        document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
        return true;
    };

    LanguageManager.prototype.getCurrentLanguage = function () {
        return this.currentLanguage;
    };

    /**
     * Walk the DOM and apply translations to elements with data-i18n*.
     * data-i18n      → textContent (or value for inputs)
     * data-i18n-placeholder → placeholder attribute
     * data-i18n-title → title attribute
     * data-i18n-html → innerHTML (use sparingly, for rich text)
     * data-i18n-aria-label → aria-label attribute
     */
    LanguageManager.prototype.applyToDom = function (root) {
        var scope = root || document;
        var self = this;

        var textNodes = scope.querySelectorAll('[data-i18n]');
        for (var i = 0; i < textNodes.length; i++) {
            var el = textNodes[i];
            var key = el.getAttribute('data-i18n');
            var translated = self.t(key);
            var tag = el.tagName;
            if (tag === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                el.value = translated;
            } else {
                el.textContent = translated;
            }
        }

        var htmlNodes = scope.querySelectorAll('[data-i18n-html]');
        for (var j = 0; j < htmlNodes.length; j++) {
            htmlNodes[j].innerHTML = self.t(htmlNodes[j].getAttribute('data-i18n-html'));
        }

        var phNodes = scope.querySelectorAll('[data-i18n-placeholder]');
        for (var k = 0; k < phNodes.length; k++) {
            phNodes[k].placeholder = self.t(phNodes[k].getAttribute('data-i18n-placeholder'));
        }

        var titleNodes = scope.querySelectorAll('[data-i18n-title]');
        for (var m = 0; m < titleNodes.length; m++) {
            titleNodes[m].title = self.t(titleNodes[m].getAttribute('data-i18n-title'));
        }

        var ariaNodes = scope.querySelectorAll('[data-i18n-aria-label]');
        for (var n = 0; n < ariaNodes.length; n++) {
            ariaNodes[n].setAttribute('aria-label', self.t(ariaNodes[n].getAttribute('data-i18n-aria-label')));
        }

        // Update <html lang="..."> for accessibility/screen readers.
        if (document.documentElement) {
            document.documentElement.setAttribute('lang', self.currentLanguage);
        }
    };

    var manager = new LanguageManager();

    window.languageManager = manager;
    window.t = function (key, params) { return manager.t(key, params); };
    window.setLanguage = function (lang) { return manager.setLanguage(lang); };
    window.getCurrentLanguage = function () { return manager.getCurrentLanguage(); };

    document.addEventListener('DOMContentLoaded', function () {
        manager.applyToDom();
        var sel = document.getElementById('cfg-language');
        if (sel) {
            sel.value = manager.getCurrentLanguage();
            sel.addEventListener('change', function (e) {
                window.setLanguage(e.target.value);
            });
        }
    });
})();
