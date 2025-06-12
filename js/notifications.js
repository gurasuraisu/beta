import { state } from './state.js';
import { getCurrentLanguage } from './i18n.js';
import { goFullscreen } from './utils.js';

// This is the primary, simplified popup function that most modules will use.
// It respects silent mode.
export function showPopup(message) {
    if (state.silentMode) {
        console.log('Silent ON; suppressing popup:', message);
        return;
    }
    createPopup(message);
}

// This function creates a more advanced notification with optional icons and buttons.
// It also respects silent mode.
export function showNotification(message, options = {}) {
    if (state.silentMode) {
        console.log('Silent ON; suppressing notification:', message);
        return { close: () => {}, update: () => {} }; // Return dummy controls
    }
    // In this refactor, we'll use the same underlying popup creator for simplicity.
    // The original code had two very similar systems. We can merge them.
    return createPopup(message, options);
}

/**
 * The core function that creates and manages on-screen popups.
 * @param {string} message - The message to display.
 * @param {object} [options={}] - Optional parameters for the popup.
 * @param {string} [options.icon] - A specific material icon to show.
 * @param {string} [options.buttonText] - Text for an action button.
 * @param {function} [options.buttonAction] - Function to run when the button is clicked.
 */
function createPopup(message, options = {}) {
    const currentLanguage = getCurrentLanguage();
    const popup = document.createElement('div');
    popup.className = 'transient-popup'; // Use a consistent class name

    // Base styles for all popups
    Object.assign(popup.style, {
        position: 'fixed',
        bottom: '10vh',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--search-background)',
        backdropFilter: 'blur(20px)',
        color: 'var(--text-color)',
        padding: '20px',
        borderRadius: '40px',
        zIndex: '9999996',
        transition: 'opacity 0.5s, filter 0.5s, bottom 0.5s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid var(--glass-border)',
    });

    // Determine the icon based on message content or options
    const checkWords = currentLanguage.CHECK_WORDS || [];
    const closeWords = currentLanguage.CLOSE_WORDS || [];
    let iconType = options.icon || '';

    if (!iconType) {
        if (checkWords.some(word => message.toLowerCase().includes(word))) {
            iconType = 'check';
        } else if (closeWords.some(word => message.toLowerCase().includes(word))) {
            iconType = 'close';
        }
    }

    if (iconType) {
        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded';
        icon.textContent = iconType;
        popup.appendChild(icon);
    }
    
    const messageNode = document.createTextNode(message);
    popup.appendChild(messageNode);

    // Special handling for the 'NOT_FULLSCREEN' message to add a button
    if (message === currentLanguage.NOT_FULLSCREEN) {
        popup.innerHTML = ''; // Clear previous content
        popup.style.backgroundColor = 'transparent';
        popup.style.backdropFilter = 'none';
        popup.style.padding = '0';
        popup.style.border = 'none';

        const fullscreenBtn = document.createElement('button');
        Object.assign(fullscreenBtn.style, {
            padding: '10px 20px',
            borderRadius: '25px',
            border: 'var(--glass-border)',
            backgroundColor: 'var(--search-background)',
            backdropFilter: 'blur(20px)',
            color: 'var(--text-color)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
        });
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded';
        icon.textContent = 'fullscreen';
        
        const text = document.createElement('span');
        text.textContent = currentLanguage.FULLSCREEN;

        fullscreenBtn.append(icon, text);
        fullscreenBtn.addEventListener('click', () => {
            goFullscreen();
            dismissPopup(popup);
        });

        popup.appendChild(fullscreenBtn);
    }
    
    // Handle action button from options
    if (options.buttonText && typeof options.buttonAction === 'function') {
         const actionButton = document.createElement('button');
         actionButton.textContent = options.buttonText;
         Object.assign(actionButton.style, {
             marginLeft: '10px',
             padding: '8px 16px',
             borderRadius: '18px',
             border: 'none',
             backgroundColor: 'var(--accent-color, #0084ff)',
             color: 'white',
             cursor: 'pointer',
         });
         actionButton.addEventListener('click', (e) => {
             e.stopPropagation();
             options.buttonAction();
             dismissPopup(popup);
         });
         popup.appendChild(actionButton);
    }

    // --- Popup Management ---
    document.body.appendChild(popup);
    positionPopups(); // Position this new popup and any existing ones

    const timeoutId = setTimeout(() => dismissPopup(popup), 5000);

    const controls = {
        close: () => dismissPopup(popup),
        update: (newMessage) => {
            messageNode.textContent = newMessage;
        }
    };
    
    function dismissPopup(p) {
        clearTimeout(timeoutId);
        p.style.opacity = '0';
        p.style.filter = 'blur(5px)';
        setTimeout(() => {
            if (p.parentElement) {
                p.parentElement.removeChild(p);
                positionPopups(); // Reposition remaining popups
            }
        }, 500);
    }
    
    return controls;
}

/**
 * Positions all visible popups, stacking them vertically from the bottom.
 */
function positionPopups() {
    const existingPopups = document.querySelectorAll('.transient-popup');
    const baseOffset = 10; // in vh
    const spacing = 80; // in px

    existingPopups.forEach((p, index) => {
        p.style.bottom = `calc(${baseOffset}vh + ${index * spacing}px)`;
    });
}

/**
 * Initializes the notification system, primarily handling online/offline events.
 */
export function initNotifications() {
    window.addEventListener('online', () => {
        showPopup(getCurrentLanguage().ONLINE);
        // We can trigger a custom event for other modules to listen to.
        window.dispatchEvent(new Event('app-online'));
    });

    window.addEventListener('offline', () => {
        showPopup(getCurrentLanguage().OFFLINE);
    });
}
