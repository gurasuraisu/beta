// js/dom.js

// Exporting all DOM element queries to a single file for easy management.
export default {
    // Main containers
    appDrawer: document.getElementById('app-drawer'),
    appGrid: document.getElementById('app-grid'),
    dock: document.getElementById('dock'),
    drawerHandle: document.querySelector('.drawer-handle'),
    drawerPill: document.querySelector('.drawer-pill'),
    
    // Clock & Date
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    persistentClock: document.getElementById('persistent-clock'),

    // Weather
    weatherWidget: document.getElementById('weather'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weather-icon'),

    // Modals & Overlays
    customizeModal: document.getElementById('customizeModal'),
    blurOverlayControls: document.getElementById('blurOverlayControls'),
    brightnessOverlay: document.getElementById('brightness-overlay'),
    temperatureOverlay: document.getElementById('temperature-overlay'),
    
    // --- Quick Controls ---
    // Silent Mode
    silentSwitchQc: document.getElementById('silent_switch_qc'),
    silentSwitch: document.getElementById('silent_switch'),
    // Tone (Temperature)
    tempControlQc: document.getElementById('temp_control_qc'),
    thermostatValue: document.getElementById('thermostat-value'),
    thermostatPopup: document.getElementById('thermostat-popup'),
    thermostatControl: document.getElementById('thermostat-control'),
    thermostatPopupValue: document.getElementById('thermostat-popup-value'),
    // Minimal Mode
    minimalModeQc: document.getElementById('minimal_mode_qc'),
    focusSwitch: document.getElementById('focus-switch'),
    // Daylight (Theme)
    lightModeQc: document.getElementById('light_mode_qc'),
    // Brightness
    brightnessControl: document.getElementById('brightness-control'),
    brightnessValue: document.getElementById('brightness-value'),
    
    // --- Customization Switches & Inputs ---
    // Weather
    weatherSwitch: document.getElementById('weather-switch'),
    // Gurapps
    gurappsSwitch: document.getElementById("gurapps-switch"),
    // Clock Color
    clockColorSwitch: document.getElementById('clock-color-switch'),
    clockColorPicker: document.getElementById('clock-color-picker'),
    // Seconds
    secondsSwitch: document.getElementById('seconds-switch'),
    // Motion (Animations)
    animationSwitch: document.getElementById('animation-switch'),
    // Contrast
    contrastSwitch: document.getElementById('contrast-switch'),
    // Wallpaper
    wallpaperUpload: document.querySelector('.wallpaper-upload'),
    uploadButton: document.getElementById('uploadButton'),
    wallpaperInput: document.getElementById('wallpaperInput'),
    // Clock Stack
    clockStackSwitch: document.getElementById('clock-stack-switch'),
    // Font Style
    fontSelect: document.getElementById('font-select'),
    weightSlider: document.getElementById('weight-slider'),
    // Hour Format
    hourFormatSwitch: document.getElementById('hour-switch'),
    // Theme
    themeSwitch: document.getElementById('theme-switch'),
    
    // --- Buttons ---
    resetButton: document.getElementById('resetButton'),
    versionButton: document.getElementById("versionButton"),
};
