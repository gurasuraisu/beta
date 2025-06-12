// js/state.js

// Central state management for localStorage access.

const DEFAULTS = {
    // Behavior
    hasVisitedBefore: false,
    pwaPromptShown: false,
    selectedLanguage: 'EN',
    gurappsEnabled: true,
    // Clock
    use12HourFormat: false,
    showSeconds: true,
    // UI & Theme
    theme: 'dark',
    highContrast: false,
    animationsEnabled: true,
    minimalMode: false,
    silentMode: false,
    page_brightness: 100,
    display_temperature: 0,
    // Clock Style
    clockFont: 'Inter',
    clockWeight: '700',
    clockColor: '#ffffff',
    clockColorEnabled: false,
    clockStackEnabled: false,
    // Weather
    showWeather: true,
};

function getItem(key) {
    const value = localStorage.getItem(key);
    if (value === null) return DEFAULTS[key];
    try {
        // Attempt to parse JSON, fall back to string value if it fails
        return JSON.parse(value);
    } catch (e) {
        return value;
    }
}

function setItem(key, value) {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(key, valueToStore);
}

// The main state object, populated from localStorage or defaults.
export const state = {
    get hasVisitedBefore() { return getItem('hasVisitedBefore'); },
    set hasVisitedBefore(val) { setItem('hasVisitedBefore', val); },

    get selectedLanguage() { return getItem('selectedLanguage'); },
    set selectedLanguage(val) { setItem('selectedLanguage', val); },

    get use12HourFormat() { return getItem('use12HourFormat'); },
    set use12HourFormat(val) { setItem('use12HourFormat', val); },

    get showSeconds() { return getItem('showSeconds'); },
    set showSeconds(val) { setItem('showSeconds', val); },
    
    get showWeather() { return getItem('showWeather'); },
    set showWeather(val) { setItem('showWeather', val); },

    get theme() { return getItem('theme'); },
    set theme(val) { setItem('theme', val); },

    get highContrast() { return getItem('highContrast'); },
    set highContrast(val) { setItem('highContrast', val); },

    get animationsEnabled() { return getItem('animationsEnabled'); },
    set animationsEnabled(val) { setItem('animationsEnabled', val); },
    
    get gurappsEnabled() { return getItem('gurappsEnabled'); },
    set gurappsEnabled(val) { setItem('gurappsEnabled', val); },

    get minimalMode() { return getItem('minimalMode'); },
    set minimalMode(val) { setItem('minimalMode', val); },
    
    get silentMode() { return getItem('silentMode'); },
    set silentMode(val) { setItem('silentMode', val); },
    
    get brightness() { return getItem('page_brightness'); },
    set brightness(val) { setItem('page_brightness', val); },
    
    get temperature() { return getItem('display_temperature'); },
    set temperature(val) { setItem('display_temperature', val); },
    
    // Complex state (objects/arrays)
    appUsage: getItem('appUsage') || {},
    appLastOpened: getItem('appLastOpened') || {},
    recentWallpapers: getItem('recentWallpapers') || [],
    slideshowWallpapers: getItem('wallpapers') || [],
    lastWeatherData: getItem('lastWeatherData') || null,
};

// Functions to save complex state parts
export function saveState(key, value) {
    state[key] = value;
    setItem(key, value);
}
