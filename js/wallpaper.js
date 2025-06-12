import DOM from './dom.js';
import { state, saveState } from './state.js';
import { showPopup } from './notifications.js';
import { getCurrentLanguage } from './i18n.js';
import { storeDBItem, getDBItem, deleteDBItem } from './utils.js';

// --- Module State & Constants ---
const MAX_RECENT_WALLPAPERS = 10;
const SLIDESHOW_INTERVAL = 600000; // 10 minutes
let slideshowIntervalId = null;
let currentWallpaperPosition = 0;
let currentSlideshowIndex = 0;

// Swipe detection variables
let touchStartX = 0;
let isSwiping = false;

// --- Core Wallpaper Functions ---

/**
 * Compresses an image file to WebP format for storage efficiency.
 * @param {File} file - The image file to compress.
 * @returns {Promise<string>} A promise that resolves with the compressed image as a Data URL.
 */
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const maxDimension = 2560;
            let { width, height } = img;

            if (width > height && width > maxDimension) {
                height *= maxDimension / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width *= maxDimension / height;
                height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL("image/webp", 0.85);
            URL.revokeObjectURL(img.src);
            resolve(dataUrl);
        };
        img.onerror = reject;
    });
}

/**
 * Applies the currently selected wallpaper (single or slideshow) to the background.
 */
async function applyCurrentWallpaper() {
    clearInterval(slideshowIntervalId);
    
    if (state.recentWallpapers.length === 0) {
        // No wallpapers, apply default
        document.body.style.setProperty('--bg-image', 'none');
        return;
    }
    
    const wallpaper = state.recentWallpapers[currentWallpaperPosition];
    if (!wallpaper) return;

    if (wallpaper.isSlideshow) {
        isSwiping = false; // Disable swiping during slideshow
        const applySlide = async () => {
            if (state.slideshowWallpapers.length === 0) return;
            const slide = state.slideshowWallpapers[currentSlideshowIndex];
            await applyWallpaperData(slide.id, slide.isVideo);
            currentSlideshowIndex = (currentSlideshowIndex + 1) % state.slideshowWallpapers.length;
        };
        applySlide();
        slideshowIntervalId = setInterval(applySlide, SLIDESHOW_INTERVAL);
    } else {
        isSwiping = true;
        await applyWallpaperData(wallpaper.id, wallpaper.isVideo);
    }
}

/**
 * Fetches wallpaper data from IndexedDB and sets it as the background.
 * @param {string} id - The ID of the wallpaper in IndexedDB.
 * @param {boolean} isVideo - True if the wallpaper is a video.
 */
async function applyWallpaperData(id, isVideo) {
    const existingVideo = document.querySelector("#background-video");
    if (existingVideo) existingVideo.remove();

    try {
        const data = await getDBItem(id);
        if (!data) throw new Error("Wallpaper data not found in DB.");

        if (isVideo) {
            const video = document.createElement("video");
            video.id = "background-video";
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.src = URL.createObjectURL(data.blob);
            document.body.insertBefore(video, document.body.firstChild);
            document.body.style.setProperty('--bg-image', 'none');
            video.onended = () => URL.revokeObjectURL(video.src); // Clean up
        } else {
            document.body.style.setProperty('--bg-image', `url('${data.dataUrl}')`);
        }
    } catch (error) {
        console.error("Error applying wallpaper:", error);
        showPopup(getCurrentLanguage().WALLPAPER_LOAD_FAIL);
    }
}

/**
 * Saves a new wallpaper file (image or video).
 * @param {File} file - The file to save.
 */
async function saveNewWallpaper(file) {
    const isVideo = file.type.startsWith("video/");
    const wallpaperId = `wallpaper_${Date.now()}`;
    
    try {
        // Store the file in IndexedDB
        if (isVideo) {
            await storeDBItem(wallpaperId, { blob: file, type: file.type });
        } else {
            const compressedData = await compressImage(file);
            await storeDBItem(wallpaperId, { dataUrl: compressedData, type: file.type });
        }

        // Create a new wallpaper entry
        const newWallpaperEntry = {
            id: wallpaperId,
            type: file.type,
            isVideo,
            timestamp: Date.now(),
            clockStyles: { // Inherit current styles
                font: state.clockFont,
                weight: state.clockWeight,
                color: state.clockColor,
                colorEnabled: state.clockColorEnabled,
                stackEnabled: state.clockStackEnabled,
                showSeconds: state.showSeconds,
                showWeather: state.showWeather,
            },
        };

        // Add to recent wallpapers history
        state.recentWallpapers.unshift(newWallpaperEntry);

        // Trim history if it exceeds the max limit
        if (state.recentWallpapers.length > MAX_RECENT_WALLPAPERS) {
            const removed = state.recentWallpapers.pop();
            if (removed.id) await deleteDBItem(removed.id);
        }

        saveState('recentWallpapers', state.recentWallpapers);
        currentWallpaperPosition = 0; // The new wallpaper is now active
        switchWallpaper('none'); // Apply the new wallpaper and update UI
        showPopup(getCurrentLanguage().WALLPAPER_UPDATED);

    } catch (error) {
        console.error("Error saving wallpaper:", error);
        showPopup(getCurrentLanguage().WALLPAPER_SAVE_FAIL);
    }
}

// --- Navigation & UI ---

/**
 * Switches to a new wallpaper and updates all associated UI and state.
 * @param {'left' | 'right' | 'none'} direction - The direction to switch, or 'none' to re-apply.
 */
export function switchWallpaper(direction) {
    if (state.recentWallpapers.length <= 1 && direction !== 'none') return;

    if (direction === 'right') {
        currentWallpaperPosition = (currentWallpaperPosition + 1) % state.recentWallpapers.length;
    } else if (direction === 'left') {
        currentWallpaperPosition = (currentWallpaperPosition - 1 + state.recentWallpapers.length) % state.recentWallpapers.length;
    }
    
    const wallpaper = state.recentWallpapers[currentWallpaperPosition];
    if (!wallpaper) return;

    // Apply the clock styles associated with this wallpaper
    if (wallpaper.clockStyles) {
        Object.assign(state, wallpaper.clockStyles);
        // Dispatch an event to notify other modules of the style change
        window.dispatchEvent(new Event('style-settings-changed'));
    }

    applyCurrentWallpaper();
    updatePageIndicator();
}

function handleSwipe(endX) {
    if (!isSwiping || state.recentWallpapers.length <= 1) return;
    const swipeDistance = endX - touchStartX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
        switchWallpaper(swipeDistance > 0 ? 'left' : 'right');
    }
}

function updatePageIndicator() {
    let indicator = document.getElementById('page-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'page-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = '';
    if (state.recentWallpapers.length > 1) {
        state.recentWallpapers.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'indicator-dot';
            if (index === currentWallpaperPosition) {
                dot.classList.add('active');
            }
            indicator.appendChild(dot);
        });
    }
}

// --- Event Handlers & Initialization ---

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length === 1) {
        saveNewWallpaper(files[0]);
    } else {
        // Slideshow functionality can be added here by creating a slideshow entry
        showPopup("Slideshows are not yet supported in this version.");
    }
}

/**
 * Saves the current UI settings (like weather toggle) to the active wallpaper's style profile.
 * @param {CustomEvent} event - The event carrying the setting key and value.
 */
function saveSettingToWallpaper(event) {
    const { key, value } = event.detail;
    if (state.recentWallpapers.length > 0) {
        const wallpaper = state.recentWallpapers[currentWallpaperPosition];
        if (wallpaper && wallpaper.clockStyles) {
            wallpaper.clockStyles[key] = value;
            saveState('recentWallpapers', state.recentWallpapers);
        }
    }
}

export function initWallpaper() {
    // Initial setup
    updatePageIndicator();
    applyCurrentWallpaper();

    // Event Listeners
    DOM.uploadButton.addEventListener('click', () => DOM.wallpaperInput.click());
    DOM.wallpaperInput.addEventListener('change', handleFileUpload);
    
    // Listen for swipe gestures
    document.body.addEventListener('mousedown', e => {
        if (e.target === document.body || e.target.id === 'background-video') {
            isSwiping = true;
            touchStartX = e.clientX;
        }
    });
    document.body.addEventListener('mouseup', e => {
        if (isSwiping) handleSwipe(e.clientX);
        isSwiping = false;
    });
    document.body.addEventListener('touchstart', e => {
        if (e.target === document.body || e.target.id === 'background-video') {
            isSwiping = true;
            touchStartX = e.touches[0].clientX;
        }
    }, { passive: true });
    document.body.addEventListener('touchend', e => {
        if (isSwiping) handleSwipe(e.changedTouches[0].clientX);
        isSwiping = false;
    });

    // Listen for requests to save style changes
    window.addEventListener('save-clock-style-request', () => {
        if (state.recentWallpapers.length > 0) {
            const styles = state.recentWallpapers[currentWallpaperPosition].clockStyles;
            Object.assign(styles, {
                font: state.clockFont,
                weight: state.clockWeight,
                color: state.clockColor,
                colorEnabled: state.clockColorEnabled,
                stackEnabled: state.clockStackEnabled,
                showSeconds: state.showSeconds,
                showWeather: state.showWeather,
            });
            saveState('recentWallpapers', state.recentWallpapers);
        }
    });

    // Listen for individual setting changes from other modules
    window.addEventListener('setting-changed', saveSettingToWallpaper);
}
