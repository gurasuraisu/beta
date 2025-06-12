import DOM from './dom.js';
import { state, saveState } from './state.js';
import { showPopup } from './notifications.js';
import { getCurrentLanguage } from './i18n.js';

// --- App Definitions & State ---

const apps = {
    "Chronos": { url: "/chronos/index.html", icon: "alarm.png" },
    "Ailuator": { url: "/ailuator/index.html", icon: "calculator.png" },
    "Wordy": { url: "/wordy/index.html", icon: "docs.png" },
    "Fantaskical": { url: "/fantaskical/index.html", icon: "tasks.png" },
    "Moments": { url: "/moments/index.html", icon: "photos.png" },
    "Music": { url: "/music/index.html", icon: "music.png" },
    "Clapper": { url: "/clapper/index.html", icon: "video.png" },
    "Waves": { url: "/waves/index.html", icon: "home.png" },
    "SketchPad": { url: "/sketchpad/index.html", icon: "sketch.png" },
    "Invitations": { url: "/invitations/index.html", icon: "mail.png" },
    "Weather": { url: "/weather/index.html", icon: "weather.png" },
    "Camera": { url: "/camera/index.html", icon: "camera.png" }
};

// A cache for minimized app iframes to allow for quick restoration.
const minimizedEmbeds = {};

// --- Core App Management Functions ---

/**
 * Creates and displays a fullscreen iframe for the given app URL.
 * @param {string} url - The URL of the app to embed.
 */
function createFullscreenEmbed(url) {
    // If the app is already minimized, restore it.
    if (minimizedEmbeds[url]) {
        const embedContainer = minimizedEmbeds[url];
        embedContainer.style.display = 'block';
        
        // Force a reflow before applying animation classes
        void embedContainer.offsetWidth;

        embedContainer.classList.add('restoring');
        setTimeout(() => embedContainer.classList.remove('restoring'), 10);
        
        document.body.classList.add('app-open');
        delete minimizedEmbeds[url];
        return;
    }

    // Create a new embed.
    const embedContainer = document.createElement('div');
    embedContainer.className = 'fullscreen-embed';
    embedContainer.dataset.embedUrl = url;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.dataset.appId = Object.keys(apps).find(k => apps[k].url === url);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    
    embedContainer.appendChild(iframe);
    document.body.appendChild(embedContainer);
    
    // Animate in
    embedContainer.classList.add('restoring');
    setTimeout(() => embedContainer.classList.remove('restoring'), 10);

    document.body.classList.add('app-open');
}

/**
 * Minimizes the currently active fullscreen embed.
 */
function minimizeFullscreenEmbed() {
    const embedContainer = document.querySelector('.fullscreen-embed:not(.minimizing)');
    if (!embedContainer) return;

    const url = embedContainer.dataset.embedUrl;
    embedContainer.classList.add('minimizing');
    
    // Hide the container after the animation and cache it.
    setTimeout(() => {
        embedContainer.style.display = 'none';
        embedContainer.classList.remove('minimizing');
        if (url) {
            minimizedEmbeds[url] = embedContainer;
        }
    }, 300);

    document.body.classList.remove('app-open');
}

// --- App Drawer and Dock UI ---

/**
 * Populates the dock with the 4 most recently used apps.
 */
function populateDock() {
    DOM.dock.innerHTML = ''; // Clear existing icons
    
    const sortedApps = Object.entries(apps)
        .map(([name, details]) => ({
            name,
            details,
            lastOpened: state.appLastOpened[name] || 0
        }))
        .sort((a, b) => b.lastOpened - a.lastOpened)
        .slice(0, 4);
    
    sortedApps.forEach(({ name, details }) => {
        const dockIcon = document.createElement('div');
        dockIcon.className = 'dock-icon';
        const img = document.createElement('img');
        img.src = `/assets/appicon/${details.icon}`;
        img.alt = name;
        dockIcon.appendChild(img);
        
        dockIcon.addEventListener('click', () => {
            // Update last opened time and save state
            state.appLastOpened[name] = Date.now();
            saveState('appLastOpened', state.appLastOpened);
            createFullscreenEmbed(details.url);
            populateDock(); // Refresh dock order
        });
        
        DOM.dock.appendChild(dockIcon);
    });
}

/**
 * Creates and populates the app icons in the main app drawer grid.
 */
function createAppIcons() {
    DOM.appGrid.innerHTML = '';
    
    const sortedApps = Object.entries(apps)
        .map(([name, details]) => ({
            name,
            details,
            usage: state.appUsage[name] || 0
        }))
        .sort((a, b) => b.usage - a.usage);

    sortedApps.forEach(app => {
        const appIcon = document.createElement('div');
        appIcon.className = 'app-icon';
        
        const img = document.createElement('img');
        img.src = `/assets/appicon/${app.details.icon}`;
        img.alt = app.name;
        
        const label = document.createElement('span');
        label.textContent = app.name;
        
        appIcon.append(img, label);
        
        appIcon.addEventListener('click', () => {
            // Update usage and last opened stats
            state.appUsage[app.name] = (state.appUsage[app.name] || 0) + 1;
            state.appLastOpened[app.name] = Date.now();
            saveState('appUsage', state.appUsage);
            saveState('appLastOpened', state.appLastOpened);
            
            createFullscreenEmbed(app.details.url);
            
            // Close the drawer
            DOM.appDrawer.classList.remove('open');
            document.body.classList.remove('drawer-open');
            populateDock();
        });
        DOM.appGrid.appendChild(appIcon);
    });
}

/**
 * Toggles the visibility of Gurapps-related UI elements based on the user setting.
 */
function updateGurappsVisibility() {
    document.body.classList.toggle('gurapps-disabled', !state.gurappsEnabled);
    if (!state.gurappsEnabled && DOM.appDrawer.classList.contains('open')) {
        DOM.appDrawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
    }
}

// --- Gesture Handling ---

function setupDrawerInteractions() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleDragStart = (y) => {
        isDragging = true;
        startY = y;
        DOM.appDrawer.classList.add('dragging');
    };

    const handleDragMove = (y) => {
        if (!isDragging) return;
        currentY = y;
        const deltaY = startY - currentY;
        
        const openEmbed = document.querySelector('.fullscreen-embed:not(.minimizing)');
        if (openEmbed) {
            // Handle swipe-to-close gesture for apps
            if (deltaY > 50) { // Threshold to start animating close
                const progress = (deltaY - 50) / (window.innerHeight * 0.5);
                openEmbed.style.transform = `scale(${1 - progress * 0.1})`;
                openEmbed.style.borderRadius = `${progress * 25}px`;
                openEmbed.style.opacity = 1 - progress;
            }
        } else {
            // Handle opening the app drawer
            const progress = deltaY / window.innerHeight;
            if (deltaY > 0) {
                DOM.appDrawer.style.transform = `translateY(${-progress * 100}vh)`;
            }
        }
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        DOM.appDrawer.classList.remove('dragging');
        DOM.appDrawer.style.transform = '';

        const deltaY = startY - currentY;
        
        const openEmbed = document.querySelector('.fullscreen-embed:not(.minimizing)');
        if (openEmbed) {
            // If swipe up was significant, close the app
            if (deltaY > 150) {
                minimizeFullscreenEmbed();
            } else {
                // Otherwise, reset the app's transform
                openEmbed.style.transform = '';
                openEmbed.style.borderRadius = '';
                openEmbed.style.opacity = '';
            }
        } else {
            // If swipe up was significant, open the drawer fully
            if (deltaY > 100) {
                DOM.appDrawer.classList.add('open');
                document.body.classList.add('drawer-open');
            }
        }
    };
    
    // Add listeners to drawer handle and body (for closing apps)
    document.body.addEventListener('mousedown', (e) => {
        if (DOM.drawerHandle.contains(e.target) || document.body.classList.contains('app-open')) {
            handleDragStart(e.clientY);
        }
    });
    document.body.addEventListener('mousemove', (e) => handleDragMove(e.clientY));
    document.body.addEventListener('mouseup', handleDragEnd);

    document.body.addEventListener('touchstart', (e) => {
        if (DOM.drawerHandle.contains(e.target) || document.body.classList.contains('app-open')) {
            handleDragStart(e.touches[0].clientY);
        }
    }, { passive: true });
    document.body.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientY), { passive: true });
    document.body.addEventListener('touchend', handleDragEnd);
    
    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
        if (DOM.appDrawer.classList.contains('open') && !DOM.appDrawer.contains(e.target)) {
            DOM.appDrawer.classList.remove('open');
            document.body.classList.remove('drawer-open');
        }
    });
}

// --- Initialization ---

export function initApps() {
    updateGurappsVisibility();
    createAppIcons();
    populateDock();
    setupDrawerInteractions();

    DOM.gurappsSwitch.checked = state.gurappsEnabled;
    DOM.gurappsSwitch.addEventListener('change', function() {
        state.gurappsEnabled = this.checked;
        updateGurappsVisibility();
    });

    // Inter-app communication listener
    window.addEventListener('message', event => {
        if (event.origin !== window.location.origin) return;
        const { targetApp, ...payload } = event.data;
        if (!targetApp) return;

        const iframe = document.querySelector(`iframe[data-app-id="${targetApp}"]`);
        if (iframe) {
            iframe.contentWindow.postMessage(payload, window.location.origin);
        } else {
            console.warn(`No iframe found for target app "${targetApp}"`);
        }
    });

    // Add click listeners to main widgets to launch their corresponding apps
    DOM.clock.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/chronos/index.html'));
    DOM.date.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/fantaskical/index.html'));
    DOM.weatherWidget.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/weather/index.html'));
}
