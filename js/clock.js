import DOM from './dom.js';
import { state } from './state.js';
import { weatherConditionsForTitle } from './weather.js'; // We'll need this for the title

/**
 * Wraps each character of a string in a span if it's a digit.
 * This is used for monospacing the clock digits.
 * @param {string} timeString - The string to wrap.
 * @returns {string} HTML string with wrapped digits.
 */
function wrapDigits(timeString) {
    return timeString.split('').map(char => 
        /\d/.test(char) ? `<span class="digit">${char}</span>` : char
    ).join('');
}

/**
 * Updates the main clock and date display on the home screen.
 */
function updateClockAndDate() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    let displayHours;
    let period = '';

    // Handle 12/24 hour format
    if (state.use12HourFormat) {
        period = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12 || 12; // Convert 0 to 12
    } else {
        displayHours = hours;
    }
    displayHours = String(displayHours).padStart(2, '0');

    // Handle stacked vs. inline layout
    if (state.clockStackEnabled) {
        let clockHTML = `
            <div>${wrapDigits(displayHours)}</div>
            <div>${wrapDigits(minutes)}</div>
        `;
        if (state.showSeconds) {
            clockHTML += `<div>${wrapDigits(seconds)}</div>`;
        }
        if (period) {
            clockHTML += `<div>${period.trim()}</div>`;
        }
        DOM.clock.innerHTML = clockHTML;
    } else {
        let timeString = `${displayHours}:${minutes}`;
        if (state.showSeconds) {
            timeString += `:${seconds}`;
        }
        timeString += period;
        DOM.clock.innerHTML = wrapDigits(timeString);
    }
        
    // Update the date string
    const formattedDate = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    DOM.date.textContent = formattedDate;

    // Update the modal title as well
    const modalTitle = DOM.customizeModal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = formattedDate;
}

/**
 * Updates the persistent clock displayed when an app or the app drawer is open.
 */
function updatePersistentClock() {
    // Determine if the clock should be visible
    const isModalOpen =
      (DOM.appDrawer && DOM.appDrawer.classList.contains('open')) ||
      document.querySelector('.fullscreen-embed[style*="display: block"]');
    
    if (isModalOpen) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        let displayHours;
        if (state.use12HourFormat) {
            displayHours = hours % 12 || 12;
        } else {
            displayHours = hours;
        }
        displayHours = String(displayHours).padStart(2, '0');
        
        DOM.persistentClock.textContent = `${displayHours}:${minutes}`;
    } else {
        // When not active, show the info icon
        DOM.persistentClock.innerHTML = '<span class="material-symbols-rounded">page_info</span>';
    }
}

/**
 * Updates the document's title to show the current time and weather.
 */
function updateTitle() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    let displayHours;
    let period = '';

    if (state.use12HourFormat) {
        period = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12 || 12;
    } else {
        displayHours = hours;
    }
    
    let timeString = `${displayHours}:${minutes}`;
    if (state.showSeconds) {
        timeString += `:${seconds}`;
    }
    timeString += period;

    let weatherString = '';
    if (state.showWeather) {
        const temp = DOM.temperature.textContent.replace('°', '');
        const weatherCode = parseInt(DOM.weatherIcon.dataset.weatherCode);
        const condition = weatherConditionsForTitle[weatherCode];

        if (temp && condition) {
            weatherString = ` | ${temp}° ${condition.icon}`;
        }
    }

    document.title = `${timeString}${weatherString}`;
}

/**
 * Synchronizes the clock update to the start of the next second for accuracy.
 */
function startSynchronizedClock() {
    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();
    
    setTimeout(() => {
        updateClockAndDate();
        setInterval(updateClockAndDate, 1000);
    }, msUntilNextSecond);
}

/**
 * Initializes all clock-related functionalities and sets up intervals.
 */
export function initClock() {
    // Initial calls to populate the UI immediately
    updateClockAndDate();
    updatePersistentClock();
    updateTitle();

    // Start synchronized updates
    startSynchronizedClock();
    setInterval(updatePersistentClock, 30000); // Persistent clock doesn't need second-level accuracy
    setInterval(updateTitle, 1000);

    // Event listener for the 12/24 hour format switch
    DOM.hourFormatSwitch.addEventListener('change', function() {
        state.use12HourFormat = this.checked;
        updateClockAndDate(); // Update immediately on change
    });
    
    // Set initial state of the switch
    DOM.hourFormatSwitch.checked = state.use12HourFormat;
}
