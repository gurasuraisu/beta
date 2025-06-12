import DOM from './dom.js';
import { state } from './state.js';
import { LANG_EN, LANG_JP, LANG_DE, LANG_FR, LANG_ES, LANG_KO, LANG_ZH } from './lang.js';

// Module-level variable to hold the currently active language object
let currentLanguage = LANG_EN;

// Mapping of language codes to their respective string objects
const languageMap = {
    'EN': LANG_EN, 'JP': LANG_JP, 'DE': LANG_DE,
    'FR': LANG_FR, 'ES': LANG_ES, 'KO': LANG_KO,
    'ZH': LANG_ZH
};

/**
 * Applies the given language object to all relevant DOM elements.
 * @param {object} language - The language object (e.g., LANG_EN).
 */
function applyLanguage(language) {
    console.log('Applying language:', language.NAME);
    currentLanguage = language; // Update the module-level variable

    // --- Apply text from the language object to the DOM ---
    // Using the centralized DOM module for cleaner access
    DOM.customizeModal.querySelector('h2').innerText = language.CONTROLS;
    DOM.silentSwitchQc.querySelector('.qc-label').innerText = language.SILENT;
    DOM.tempControlQc.querySelector('.qc-label').innerText = language.TONE;
    DOM.minimalModeQc.querySelector('.qc-label').innerText = language.MINIMAL;
    DOM.lightModeQc.querySelector('.qc-label').innerText = language.DAYLIGHT;

    // Update text content for elements with icons
    DOM.weatherSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.WEATHER;
    DOM.gurappsSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.GURAPPS;
    DOM.clockColorSwitch.parentElement.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.CLOCK_COLOR;
    DOM.secondsSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.SECONDS;
    DOM.animationSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.MOTION;
    DOM.contrastSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.CONTRAST;
    DOM.wallpaperUpload.querySelector('.cust-label').childNodes[2].textContent = language.WALLPAPER;
    DOM.uploadButton.innerText = language.ADD;
    DOM.clockStackSwitch.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.CLOCK_STACK;
    DOM.fontSelect.parentElement.querySelector('.cust-label').childNodes[2].textContent = language.STYLE;
    
    document.getElementById('language-label').textContent = language.LANGPICK;
    document.querySelector('.version-info button#versionButton').textContent = language.GET_DOCS;
    document.getElementById('reset-label').textContent = language.RESET;
    DOM.resetButton.textContent = language.RESET_BTN;

    // Update font selection dropdown options
    DOM.fontSelect.querySelector('option[value="Inter"]').textContent = language.DEFAULT;
    DOM.fontSelect.querySelector('option[value="Roboto"]').textContent = language.WORK;
    DOM.fontSelect.querySelector('option[value="DynaPuff"]').textContent = language.PUFFY;
    DOM.fontSelect.querySelector('option[value="DM Serif Display"]').textContent = language.CLASSIC;
    DOM.fontSelect.querySelector('option[value="Iansui"]').textContent = language.STROKES;
    DOM.fontSelect.querySelector('option[value="JetBrains Mono"]').textContent = language.MONO;
    DOM.fontSelect.querySelector('option[value="DotGothic16"]').textContent = language.PIXEL;
    DOM.fontSelect.querySelector('option[value="Patrick Hand"]').textContent = language.WRITTEN;
    DOM.fontSelect.querySelector('option[value="Rampart One"]').textContent = language.RAISED;
    DOM.fontSelect.querySelector('option[value="Doto"]').textContent = language.DOT;
    DOM.fontSelect.querySelector('option[value="Nunito"]').textContent = language.ROUND;
    
    // Update thermostat popup label
    const adjustLabel = DOM.thermostatPopup.querySelector('.adjust-label');
    if (adjustLabel) {
        adjustLabel.textContent = language.ADJUST;
    }

    // Update global words used by the notification system
    window.checkWords = language.CHECK_WORDS;
    window.closeWords = language.CLOSE_WORDS;
}

/**
 * Selects a new language, saves the preference, and applies it.
 * @param {string} languageCode - The two-letter code for the language (e.g., 'EN', 'JP').
 */
export function selectLanguage(languageCode) {
    const newLanguage = languageMap[languageCode] || LANG_EN;
    state.selectedLanguage = languageCode; // Save preference to localStorage via state module
    
    applyLanguage(newLanguage);
    
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.value = languageCode;
    }
}

/**
 * Provides safe, read-only access to the current language object for other modules.
 * @returns {object} The currently active language object.
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

function consoleLicense() {
    console.info(currentLanguage.LICENCE);
}

/**
 * Initializes the internationalization system on application startup.
 */
export function initI18n() {
    // Set the initial language from saved state
    selectLanguage(state.selectedLanguage);

    // Add event listener to the language switcher in the settings modal
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.addEventListener('change', function () {
            selectLanguage(this.value);
        });
    }

    // Log the license and a success message to the console on startup
    consoleLicense();
    console.log(currentLanguage.LOAD_SUCCESS);
}
