import DOM from './dom.js';
import { state, saveState } from './state.js';

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

const minimizedEmbeds = {};

function createFullscreenEmbed(url) {
    if (minimizedEmbeds[url]) {
        const embedContainer = minimizedEmbeds[url];
        embedContainer.style.display = 'block';
        setTimeout(() => {
            embedContainer.classList.add('show');
            document.body.classList.add('app-open');
        }, 10);
        delete minimizedEmbeds[url];
        return;
    }

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

    setTimeout(() => {
        embedContainer.classList.add('show');
        document.body.classList.add('app-open');
    }, 10);
}

function minimizeFullscreenEmbed() {
    const embedContainer = document.querySelector('.fullscreen-embed.show');
    if (!embedContainer) return;
    const url = embedContainer.dataset.embedUrl;
    embedContainer.classList.remove('show');
    document.body.classList.remove('app-open');
    setTimeout(() => {
        embedContainer.style.display = 'none';
        if (url) minimizedEmbeds[url] = embedContainer;
    }, 500);
}

function populateDock() {
    DOM.dock.innerHTML = '';
    const sortedApps = Object.entries(apps)
        .map(([name, details]) => ({ name, details, lastOpened: state.appLastOpened[name] || 0 }))
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
            if (document.body.classList.contains('app-open')) minimizeFullscreenEmbed();
            state.appLastOpened[name] = Date.now();
            saveState('appLastOpened', state.appLastOpened);
            setTimeout(() => createFullscreenEmbed(details.url), 50);
            populateDock();
        });
        DOM.dock.appendChild(dockIcon);
    });
}

function createAppIcons() {
    DOM.appGrid.innerHTML = '';
    const sortedApps = Object.entries(apps)
        .map(([name, details]) => ({ name, details, usage: state.appUsage[name] || 0 }))
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
            state.appUsage[app.name] = (state.appUsage[app.name] || 0) + 1;
            state.appLastOpened[app.name] = Date.now();
            saveState('appUsage', state.appUsage);
            saveState('appLastOpened', state.appLastOpened);
            createFullscreenEmbed(app.details.url);
            DOM.appDrawer.classList.remove('open');
            DOM.blurOverlayControls.classList.remove('show');
            populateDock();
        });
        DOM.appGrid.appendChild(appIcon);
    });
}

function updateGurappsVisibility() {
    document.body.classList.toggle('gurapps-disabled', !state.gurappsEnabled);
    if (!state.gurappsEnabled && DOM.appDrawer.classList.contains('open')) {
        DOM.appDrawer.classList.remove('open');
        DOM.blurOverlayControls.classList.remove('show');
    }
}

function setupDrawerInteractions() {
    // Dynamically create helper overlays
    const swipeOverlay = document.createElement('div');
    swipeOverlay.id = 'swipe-overlay';
    document.body.appendChild(swipeOverlay);

    const interactionBlocker = document.createElement('div');
    interactionBlocker.id = 'interaction-blocker';
    document.body.appendChild(interactionBlocker);

    let isDragging = false;
    let startY = 0, currentY = 0, lastY = 0;
    let dragStartTime = 0;
    let velocities = [];
    let initialDrawerPosition = -100; // -100% (closed), 0% (open)

    const flickVelocityThreshold = 0.4;
    const dockThreshold = -2.5; // % movement to show dock
    const openThreshold = -50;  // % movement to open drawer

    const startDrag = (y) => {
        isDragging = true;
        startY = y;
        lastY = y;
        velocities = [];
        dragStartTime = Date.now();
        DOM.appDrawer.classList.add('dragging');
        const openEmbed = document.querySelector('.fullscreen-embed.show');
        if (openEmbed) openEmbed.classList.add('dragging');
    };

    const moveDrawer = (y) => {
        if (!isDragging) return;
        currentY = y;
        
        const now = Date.now();
        const deltaTime = now - dragStartTime;
        if (deltaTime > 0) {
            velocities.push((lastY - y) / deltaTime);
            if (velocities.length > 5) velocities.shift();
        }
        lastY = y;

        const deltaY = startY - currentY;
        const movementPercentage = (deltaY / window.innerHeight) * 100;
        const openEmbed = document.querySelector('.fullscreen-embed.show');

        if (openEmbed) {
            const progress = Math.max(0, movementPercentage / 50);
            openEmbed.style.transform = `scale(${1 - progress * 0.1})`;
            openEmbed.style.borderRadius = `${Math.min(25, progress * 25)}px`;
            openEmbed.style.opacity = 1 - progress;
        } else {
            const newPosition = Math.max(-100, Math.min(0, initialDrawerPosition + movementPercentage));
            DOM.appDrawer.style.transform = `translateY(${100 + newPosition}%)`;
            interactionBlocker.style.display = (newPosition > -100 && newPosition < 0) ? 'block' : 'none';
        }
        
        if (!openEmbed && movementPercentage > 2.5) {
            DOM.dock.classList.add('show');
        } else {
            DOM.dock.classList.remove('show');
        }
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        
        DOM.appDrawer.classList.remove('dragging');
        DOM.appDrawer.style.transform = ''; // Let CSS handle final animation
        const openEmbed = document.querySelector('.fullscreen-embed.show');
        if (openEmbed) openEmbed.classList.remove('dragging');
        
        const deltaY = startY - currentY;
        const movementPercentage = (deltaY / window.innerHeight) * 100;
        let avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : 0;

        if (openEmbed) {
            openEmbed.style.transform = ''; openEmbed.style.borderRadius = ''; openEmbed.style.opacity = '';
            if (movementPercentage > 25 || avgVelocity > flickVelocityThreshold) {
                minimizeFullscreenEmbed();
            }
        } else {
            const isFlick = avgVelocity > flickVelocityThreshold;
            if (isFlick || movementPercentage > 50) {
                DOM.appDrawer.classList.add('open');
                DOM.blurOverlayControls.classList.add('show');
                initialDrawerPosition = 0;
            } else {
                DOM.appDrawer.classList.remove('open');
                DOM.blurOverlayControls.classList.remove('show');
                initialDrawerPosition = -100;
            }
        }

        DOM.dock.classList.remove('show');
        interactionBlocker.style.display = 'none';
    };
    
    const onMouseDown = (e) => {
        if (e.target === DOM.drawerHandle || swipeOverlay.contains(e.target)) {
             startDrag(e.clientY);
        }
    };
    const onMouseMove = (e) => moveDrawer(e.clientY);

    const onTouchStart = (e) => {
        if (e.target === DOM.drawerHandle || swipeOverlay.contains(e.target)) {
             startDrag(e.touches[0].clientY);
        }
    };
    const onTouchMove = (e) => moveDrawer(e.touches[0].clientY);

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', endDrag);

    DOM.blurOverlayControls.addEventListener('click', () => {
        if (DOM.appDrawer.classList.contains('open')) {
            DOM.appDrawer.classList.remove('open');
            DOM.blurOverlayControls.classList.remove('show');
            initialDrawerPosition = -100;
        }
        if (DOM.customizeModal.classList.contains('show')) {
            DOM.customizeModal.classList.remove('show');
            DOM.blurOverlayControls.classList.remove('show');
        }
    });

    // Watch for app-open class to show/hide the swipeOverlay
    new MutationObserver(() => {
        swipeOverlay.style.display = document.body.classList.contains('app-open') ? 'block' : 'none';
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}


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

    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        const { targetApp, ...payload } = event.data;
        if (!targetApp) return;
        const iframe = document.querySelector(`iframe[data-app-id="${targetApp}"]`);
        if (iframe) iframe.contentWindow.postMessage(payload, window.location.origin);
    });

    DOM.clock.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/chronos/index.html'));
    DOM.date.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/fantaskical/index.html'));
    DOM.weatherWidget.addEventListener('click', () => state.gurappsEnabled && createFullscreenEmbed('/weather/index.html'));
    
    DOM.persistentClock.addEventListener('click', () => {
        DOM.customizeModal.style.display = 'block';
        DOM.blurOverlayControls.style.display = 'block';
        setTimeout(() => {
            DOM.customizeModal.classList.add('show');
            DOM.blurOverlayControls.classList.add('show');
        }, 10);
    });
}
