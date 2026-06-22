window.translations = window.translations || {};
window.registerTranslations = window.registerTranslations || function registerTranslations(lang, dict) {
    if (!lang || !dict) return;
    window.translations[lang] = dict;
};
