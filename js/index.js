import { initLocalization } from './i18n.js';
import { startSynchronizedClockAndDate } from './ui/clock.js';
import { initWeather } from './ui/weather.js';
import { initWallpaper } from './ui/wallpaper.js';
import { initAppDrawer } from './ui/appDrawer.js';
import { initCustomizationModal } from './ui/customize.js';
import { initQuickControls } from './ui/quickControls.js';
import { initGeneralEventListeners } from './utils/events.js';
import { firstSetup } from './setup.js';
import { initPwa } from './pwa.js';

/**
 * Main application entry point.
 * Initializes all modules once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Core initializations
    initLocalization();
    firstSetup(); // Must run after localization to get correct text
    
    // UI Modules
    startSynchronizedClockAndDate();
    initWeather();
    initWallpaper();
    initAppDrawer();
    initCustomizationModal();
    initQuickControls();

    // PWA and general event listeners
    initPwa();
    initGeneralEventListeners();
    
    console.log("Gurasu Raisu: Load successful.");
});
