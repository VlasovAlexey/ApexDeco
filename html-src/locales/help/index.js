window.helpTranslations = window.helpTranslations || {};
window.helpTabLabels = window.helpTabLabels || {};
window.registerHelpLocale = window.registerHelpLocale || function registerHelpLocale(lang, data, labels) {
    if (!lang || !data) return;
    window.helpTranslations[lang] = data;
    if (labels) window.helpTabLabels[lang] = labels;
};

window.getHelpData = window.getHelpData || function getHelpData() {
    var lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    return window.helpTranslations[lang] || window.helpTranslations.en || {};
};

window.getHelpTabLabel = window.getHelpTabLabel || function getHelpTabLabel(category) {
    var lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
    var labels = window.helpTabLabels[lang] || window.helpTabLabels.en || {};
    return labels[category] || category;
};
