import { state } from './state.js';
import { preventLeaving, goFullscreen, isFullScreen, checkIfPWA } from './utils.js';
import { initI18n } from './i18n.js';
import { initNotifications, showPopup } from './notifications.js';
import { initClock } from './clock.js';
import { initWeather } from './weather.js';
import { initCustomization } from './customization.js';
import { initWallpaper } from './wallpaper.js';
import { initApps } from './apps.js';
import { initSetup } from './setup.js';
import { getCurrentLanguage } from './i18n.js';


/**
 * Main application initialization function.
 * This function is called once the DOM is fully loaded.
 */
function main() {
    console.log("Initializing Gurasu Raisu...");

    // Initialize core modules first
    initI18n();
    initNotifications();

    // Show setup screen for first-time users.
    // This must run after i18n is ready.
    initSetup();

    // Initialize all feature modules
    initClock();
    initWeather();
    initCustomization();
    initWallpaper(); // Depends on customization for clock styles
    initApps();

    // Attach global event listeners and run initial checks
    preventLeaving();
    addFullscreenCheck();
    checkScreenSize();
    promptToInstallPWA();

    console.log("Gurasu Raisu initialized successfully.");
}

// --- Helper Functions for main.js ---

function addFullscreenCheck() {
    const check = () => {
        if (!isFullScreen()) {
            showPopup(getCurrentLanguage().NOT_FULLSCREEN);
        }
    };
    
    // Check on load and on any fullscreen change event
    window.addEventListener('load', check);
    document.addEventListener('fullscreenchange', check);
    document.addEventListener('webkitfullscreenchange', check);
    document.addEventListener('mozfullscreenchange', check);
    document.addEventListener('MSFullscreenChange', check);
}

function checkScreenSize() {
    const check = () => {
        if (window.innerWidth < 680) {
            showPopup(getCurrentLanguage().LARGE_SCR_REQ);
        }
    };
    window.addEventListener('load', check);
    window.addEventListener('resize', check);
}

function promptToInstallPWA() {
    if (!state.pwaPromptShown && !checkIfPWA()) {
        showPopup(getCurrentLanguage().INSTALL_PROMPT);
        state.pwaPromptShown = true; // Use state module to save
    }
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before running the main function.
document.addEventListener('DOMContentLoaded', main);
