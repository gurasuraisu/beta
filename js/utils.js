// js/utils.js

const DB_NAME = "WallpaperDB";
const STORE_NAME = "wallpapers";
const DB_VERSION = 1;

export function initDB() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function storeDBItem(key, data) {
    let db = await initDB();
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([STORE_NAME], "readwrite");
        let store = transaction.objectStore(STORE_NAME);
        let request = store.put(data, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function getDBItem(key) {
    let db = await initDB();
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([STORE_NAME], "readonly");
        let store = transaction.objectStore(STORE_NAME);
        let request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function deleteDBItem(key) {
    let db = await initDB();
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([STORE_NAME], "readwrite");
        let store = transaction.objectStore(STORE_NAME);
        let request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}


export function checkIfPWA() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    return 'serviceWorker' in navigator && false;
}

export function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

export function isFullScreen() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
}

export function goFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }
}

export function preventLeaving() {
    window.addEventListener('beforeunload', function (e) {
      e.preventDefault();
      e.returnValue = ''; // Standard for most browsers
      return ''; // For some older browsers
    });
}
