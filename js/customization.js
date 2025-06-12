import DOM from './dom.js';
import { state, saveState } from './state.js';
import { showPopup } from './notifications.js';
import { getCurrentLanguage } from './i18n.js';

// --- State Variables ---
let minimalMode = state.minimalMode;

// --- Clock & Font Styling ---

/**
 * Applies all clock-related styles based on current state.
 */
function applyClockStyles() {
    const { clockFont, clockWeight, clockColor, clockColorEnabled, clockStackEnabled } = state;

    const fontFamily = clockFont;
    const fontWeight = clockWeight;

    // Apply font family and weight
    DOM.clock.style.fontFamily = fontFamily;
    DOM.clock.style.fontWeight = fontWeight;
    DOM.date.style.fontFamily = fontFamily; // Date should match clock font

    // Apply custom color only if the switch is enabled
    if (clockColorEnabled) {
        DOM.clock.style.color = clockColor;
        DOM.date.style.color = clockColor;
    } else {
        DOM.clock.style.color = ''; // Revert to CSS-defined color
        DOM.date.style.color = '';
    }
    
    // Apply stacked layout if enabled
    if (clockStackEnabled) {
        DOM.clock.style.flexDirection = 'column';
        DOM.clock.style.lineHeight = '0.9';
    } else {
        DOM.clock.style.flexDirection = '';
        DOM.clock.style.lineHeight = '';
    }
}

/**
 * Saves the current clock style settings to the active wallpaper's profile.
 */
function saveClockStylesToWallpaper() {
    window.dispatchEvent(new CustomEvent('save-clock-style-request'));
}

function setupFontSelection() {
    // Load saved preferences into UI elements
    DOM.fontSelect.value = state.clockFont;
    DOM.weightSlider.value = parseInt(state.clockWeight) / 100;
    DOM.clockColorPicker.value = state.clockColor;
    DOM.clockColorSwitch.checked = state.clockColorEnabled;
    DOM.clockStackSwitch.checked = state.clockStackEnabled;

    // Set initial visibility of color picker
    DOM.clockColorPicker.style.display = state.clockColorEnabled ? 'inline-block' : 'none';

    // Event Listeners
    DOM.fontSelect.addEventListener('change', () => {
        state.clockFont = DOM.fontSelect.value;
        applyClockStyles();
        saveClockStylesToWallpaper();
    });

    DOM.weightSlider.addEventListener('input', () => {
        state.clockWeight = (DOM.weightSlider.value * 100).toString();
        applyClockStyles();
        saveClockStylesToWallpaper();
    });

    DOM.clockColorPicker.addEventListener('input', () => {
        state.clockColor = DOM.clockColorPicker.value;
        applyClockStyles();
        saveClockStylesToWallpaper();
    });

    DOM.clockColorSwitch.addEventListener('change', () => {
        state.clockColorEnabled = DOM.clockColorSwitch.checked;
        DOM.clockColorPicker.style.display = state.clockColorEnabled ? 'inline-block' : 'none';
        applyClockStyles();
        saveClockStylesToWallpaper();
    });

    DOM.clockStackSwitch.addEventListener('change', () => {
        state.clockStackEnabled = DOM.clockStackSwitch.checked;
        applyClockStyles();
        // This implicitly calls updateClockAndDate which handles the layout
        window.dispatchEvent(new Event('clock-layout-changed'));
        saveClockStylesToWallpaper();
    });
}


// --- Theme & Appearance ---

function applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    // Notify any embedded iframes about the theme change
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.contentWindow.postMessage({ type: 'themeUpdate', theme }, window.location.origin);
    });
}

function updateMinimalMode() {
    const elementsToHide = [
        DOM.weatherWidget,
        document.querySelector('.info'),
        document.querySelector('.clockwidgets')
    ];
    
    if (minimalMode) {
        elementsToHide.forEach(el => el && (el.style.display = 'none'));
        document.body.classList.add('minimal-active');
    } else {
        if (DOM.weatherWidget) {
            DOM.weatherWidget.style.display = state.showWeather ? 'block' : 'none';
        }
        const info = document.querySelector('.info');
        if(info) info.style.display = '';
        const clockwidgets = document.querySelector('.clockwidgets');
        if(clockwidgets) clockwidgets.style.display = '';
        
        document.body.classList.remove('minimal-active');
    }
}

// --- Quick Controls (Temperature & Brightness) ---

function updateBrightness(value) {
    DOM.brightnessValue.textContent = `${value}%`;
    const darknessLevel = (100 - value) / 100;
    DOM.brightnessOverlay.style.backgroundColor = `rgba(0, 0, 0, ${darknessLevel})`;
    
    const icon = DOM.brightnessValue.previousElementSibling;
    icon.textContent = value <= 60 ? 'brightness_5' : 'brightness_7';
}

function updateTemperature(value) {
    const tempValue = parseInt(value);
    const intensity = Math.abs(tempValue) / 10;
    let r, g, b, a;

    if (tempValue < 0) { // Cool
        r = 200; g = 220; b = 255; a = intensity;
    } else if (tempValue > 0) { // Warm
        r = 255; g = 220; b = 180; a = intensity;
    } else { // Neutral
        r = g = b = 255; a = 0;
    }
    DOM.temperatureOverlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
}

function updateQuickControlIcons() {
    DOM.lightModeQc.querySelector('.material-symbols-rounded').textContent = state.theme === 'light' ? 'light_mode' : 'dark_mode';
    DOM.minimalModeQc.querySelector('.material-symbols-rounded').textContent = state.minimalMode ? 'fullscreen_exit' : 'fullscreen';
    DOM.silentSwitchQc.querySelector('.material-symbols-rounded').textContent = state.silentMode ? 'notifications_off' : 'notifications';
    
    const tempValue = parseInt(state.temperature);
    let tempIcon = 'thermostat';
    if (tempValue <= -3) tempIcon = 'ac_unit';
    else if (tempValue >= 3) tempIcon = 'local_fire_department';
    DOM.tempControlQc.querySelector('.material-symbols-rounded').textContent = tempIcon;
}

// --- Initialization ---

export function initCustomization() {
    // Apply initial states
    applyTheme(state.theme);
    updateMinimalMode();
    applyClockStyles();
    document.body.classList.toggle('high-contrast', state.highContrast);
    document.body.classList.toggle('reduce-animations', !state.animationsEnabled);
    updateBrightness(state.brightness);
    updateTemperature(state.temperature);
    updateQuickControlIcons();

    // Set initial UI control states
    DOM.themeSwitch.checked = state.theme === 'light';
    DOM.focusSwitch.checked = state.minimalMode;
    DOM.contrastSwitch.checked = state.highContrast;
    DOM.animationSwitch.checked = state.animationsEnabled;
    DOM.silentSwitch.checked = state.silentMode;
    DOM.brightnessControl.value = state.brightness;
    DOM.thermostatControl.value = state.temperature;
    DOM.thermostatValue.textContent = state.temperature;
    DOM.thermostatPopupValue.textContent = state.temperature;

    // Setup event listeners
    setupFontSelection();

    // --- General Switches ---
    DOM.themeSwitch.addEventListener('change', () => {
        state.theme = DOM.themeSwitch.checked ? 'light' : 'dark';
        applyTheme(state.theme);
        updateQuickControlIcons();
    });

    DOM.contrastSwitch.addEventListener('change', () => {
        state.highContrast = DOM.contrastSwitch.checked;
        document.body.classList.toggle('high-contrast', state.highContrast);
    });

    DOM.animationSwitch.addEventListener('change', () => {
        state.animationsEnabled = DOM.animationSwitch.checked;
        document.body.classList.toggle('reduce-animations', !state.animationsEnabled);
    });
    
    DOM.secondsSwitch.addEventListener('change', function() {
        state.showSeconds = this.checked;
        window.dispatchEvent(new Event('clock-layout-changed'));
        saveClockStylesToWallpaper();
    });

    // --- Quick Controls ---
    DOM.lightModeQc.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        DOM.themeSwitch.checked = state.theme === 'light';
        applyTheme(state.theme);
        updateQuickControlIcons();
    });

    DOM.minimalModeQc.addEventListener('click', () => {
        minimalMode = !minimalMode;
        state.minimalMode = minimalMode;
        DOM.focusSwitch.checked = minimalMode;
        updateMinimalMode();
        updateQuickControlIcons();
    });

    DOM.silentSwitchQc.addEventListener('click', () => {
        state.silentMode = !state.silentMode;
        DOM.silentSwitch.checked = state.silentMode;
        updateQuickControlIcons();
    });
    
    DOM.brightnessControl.addEventListener('input', (e) => {
        state.brightness = e.target.value;
        updateBrightness(state.brightness);
    });

    DOM.thermostatControl.addEventListener('input', (e) => {
        const value = e.target.value;
        state.temperature = value;
        DOM.thermostatValue.textContent = value;
        DOM.thermostatPopupValue.textContent = value;
        updateTemperature(value);
        updateQuickControlIcons();
    });
    
    DOM.tempControlQc.addEventListener('click', () => {
        const rect = DOM.tempControlQc.getBoundingClientRect();
        Object.assign(DOM.thermostatPopup.style, {
            display: 'block',
            top: `${rect.bottom + 5}px`,
            left: `${rect.left + (rect.width / 2) - (155 / 2)}px`,
        });
    });
    
    // Close thermostat popup when clicking outside
    document.addEventListener('click', (e) => {
        if (DOM.thermostatPopup.style.display === 'block' && 
            !DOM.thermostatPopup.contains(e.target) && 
            !DOM.tempControlQc.contains(e.target)) {
            DOM.thermostatPopup.style.display = 'none';
        }
    });

    window.addEventListener('style-settings-changed', () => {
        // This function will be called when the wallpaper changes.
        // It re-applies styles and updates the UI controls to match the new wallpaper's settings.
        applyClockStyles();
        setupFontSelection(); // Re-initializes sliders/pickers to the new state
        DOM.secondsSwitch.checked = state.showSeconds;
        // Add other UI updates here if needed
    });

    // Reset Button
    DOM.resetButton.addEventListener('click', () => {
        if (confirm(getCurrentLanguage().RESET_CONFIRM)) {
            localStorage.clear();
            sessionStorage.clear();
            // Also clear IndexedDB
            indexedDB.deleteDatabase("WallpaperDB");
            alert(getCurrentLanguage().RESET_SUCCESS);
            window.location.reload();
        }
    });
    
    DOM.versionButton.addEventListener("click", () => {
        window.open("https://kirbindustries.gitbook.io/gurasuraisu", "_blank");
    });
}
