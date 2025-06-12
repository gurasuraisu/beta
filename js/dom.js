// js/dom.js

// Start with an empty object.
const DOM = {};

// This function will be called AFTER the DOM is loaded.
export function initDOM() {
    // --- Create and inject essential overlay elements that are missing from HTML ---
    if (!document.getElementById('brightness-overlay')) {
        const brightnessOverlay = document.createElement('div');
        brightnessOverlay.id = 'brightness-overlay';
        document.body.appendChild(brightnessOverlay);
    }
    if (!document.getElementById('temperature-overlay')) {
        const temperatureOverlay = document.createElement('div');
        temperatureOverlay.id = 'temperature-overlay';
        document.body.appendChild(temperatureOverlay);
    }
    
    // Main containers
    DOM.appDrawer = document.getElementById('app-drawer');
    DOM.appGrid = document.getElementById('app-grid');
    DOM.dock = document.getElementById('dock');
    DOM.drawerHandle = document.querySelector('.drawer-handle');
    DOM.drawerPill = document.querySelector('.drawer-pill');
    
    // Clock & Date
    DOM.clock = document.getElementById('clock');
    DOM.date = document.getElementById('date');
    DOM.persistentClock = document.getElementById('persistent-clock');

    // Weather
    DOM.weatherWidget = document.getElementById('weather');
    DOM.temperature = document.getElementById('temperature');
    DOM.weatherIcon = document.getElementById('weather-icon');

    // Modals & Overlays
    DOM.customizeModal = document.getElementById('customizeModal');
    DOM.blurOverlayControls = document.getElementById('blurOverlayControls');
    DOM.brightnessOverlay = document.getElementById('brightness-overlay');
    DOM.temperatureOverlay = document.getElementById('temperature-overlay');
    
    // --- Quick Controls ---
    DOM.silentSwitchQc = document.getElementById('silent_switch_qc');
    DOM.silentSwitch = document.getElementById('silent_switch');
    DOM.tempControlQc = document.getElementById('temp_control_qc');
    DOM.thermostatValue = document.getElementById('thermostat-value');
    DOM.thermostatPopup = document.getElementById('thermostat-popup');
    DOM.thermostatControl = document.getElementById('thermostat-control');
    DOM.thermostatPopupValue = document.getElementById('thermostat-popup-value');
    DOM.minimalModeQc = document.getElementById('minimal_mode_qc');
    DOM.focusSwitch = document.getElementById('focus-switch');
    DOM.lightModeQc = document.getElementById('light_mode_qc');
    DOM.brightnessControl = document.getElementById('brightness-control');
    DOM.brightnessValue = document.getElementById('brightness-value');
    
    // --- Customization Switches & Inputs ---
    DOM.weatherSwitch = document.getElementById('weather-switch');
    DOM.gurappsSwitch = document.getElementById("gurapps-switch");
    DOM.clockColorSwitch = document.getElementById('clock-color-switch');
    DOM.clockColorPicker = document.getElementById('clock-color-picker');
    DOM.secondsSwitch = document.getElementById('seconds-switch');
    DOM.animationSwitch = document.getElementById('animation-switch');
    DOM.contrastSwitch = document.getElementById('contrast-switch');
    DOM.wallpaperUpload = document.querySelector('.wallpaper-upload');
    DOM.uploadButton = document.getElementById('uploadButton');
    DOM.wallpaperInput = document.getElementById('wallpaperInput');
    DOM.clockStackSwitch = document.getElementById('clock-stack-switch');
    DOM.fontSelect = document.getElementById('font-select');
    DOM.weightSlider = document.getElementById('weight-slider');
    DOM.hourFormatSwitch = document.getElementById('hour-switch');
    DOM.themeSwitch = document.getElementById('theme-switch');
    
    // --- Buttons ---
    DOM.resetButton = document.getElementById('resetButton');
    DOM.versionButton = document.getElementById("versionButton");
}

// Export the object that will be filled by the init function.
export default DOM;
