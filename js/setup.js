import { state } from './state.js';
import { selectLanguage, getCurrentLanguage } from './i18n.js';
import { goFullscreen } from './utils.js';
import { updateWeatherWidget } from './weather.js';

let setupContainer;
let currentPage = 0;
let setupPages = []; // Will be populated dynamically based on language

function createSetupPages() {
    const lang = getCurrentLanguage();
    return [
        {
            title: lang.SETUP_HI_THERE,
            description: lang.SETUP_HI_THERE_DESC,
            icon: "waving_hand",
            options: []
        },
        {
            title: lang.SETUP_SELECT_LANGUAGE,
            description: lang.SETUP_SELECT_LANGUAGE_DESC,
            icon: "language",
            type: 'language',
            options: [
                { name: "English", value: "EN" }, { name: "日本語", value: "JP" },
                { name: "Deutsch", value: "DE" }, { name: "Français", value: "FR" },
                { name: "Español", value: "ES" }, { name: "한국어", value: "KO" },
                { name: "中文", value: "ZH" }
            ]
        },
        {
            title: lang.SETUP_CANNIBALIZE,
            description: lang.SETUP_CANNIBALIZE_DESC,
            icon: "palette",
            type: 'theme',
            options: [
                { name: lang.SETUP_DARK, value: "dark", default: true },
                { name: lang.SETUP_LIGHT, value: "light" }
            ]
        },
        {
            title: lang.SETUP_SHOW_WEATHER,
            description: lang.SETUP_SHOW_WEATHER_DESC,
            icon: "partly_cloudy_day",
            type: 'weather',
            options: [
                { name: lang.SETUP_SHOW, value: true, default: true },
                { name: lang.SETUP_HIDE, value: false }
            ]
        },
        {
            title: lang.SETUP_ALLOW_PERMISSIONS,
            description: lang.SETUP_ALLOW_PERMISSIONS_DESC,
            icon: "enable",
            type: 'permissions',
            options: [
                { name: lang.SETUP_LOCATION_ACCESS, description: lang.SETUP_LOCATION_ACCESS_DESC, permission: "geolocation" }
            ]
        },
        {
            title: lang.SETUP_CONFIGURE_OPTIONS,
            description: lang.SETUP_CONFIGURE_OPTIONS_DESC,
            icon: "page_info",
            options: []
        },
    ];
}

function updateSetup() {
    setupPages = createSetupPages(); // Regenerate pages with current language
    const oldPage = setupContainer.querySelector('.setup-page');
    if (oldPage) oldPage.remove();

    const newPage = createPage(setupPages[currentPage]);
    setupContainer.querySelector('.setup-content').appendChild(newPage);
    
    // Update progress dots
    const dots = setupContainer.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentPage));
}

function createPage(pageData) {
    const lang = getCurrentLanguage();
    const page = document.createElement('div');
    page.className = 'setup-page';

    page.innerHTML = `
        <div class="setup-icon material-symbols-rounded">${pageData.icon}</div>
        <h1 class="setup-title">${pageData.title}</h1>
        <p class="setup-description">${pageData.description || ''}</p>
        <div class="setup-options"></div>
        <div class="setup-buttons">
            <button class="setup-button primary">
                ${currentPage === setupPages.length - 1 ? lang.SETUP_GET_STARTED : lang.SETUP_CONTINUE}
            </button>
        </div>
    `;

    const optionsContainer = page.querySelector('.setup-options');
    pageData.options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'setup-option';
        optionEl.innerHTML = `
            <div class="option-content">
                <span class="option-title">${option.name}</span>
                ${option.description ? `<span class="option-description">${option.description}</span>` : ''}
            </div>
            <span class="material-symbols-rounded">check_circle</span>
        `;
        optionsContainer.appendChild(optionEl);

        // Add click listener based on page type
        optionEl.addEventListener('click', async () => {
            // Handle single-choice options
            if (pageData.type !== 'permissions') {
                optionsContainer.querySelectorAll('.setup-option').forEach(el => el.classList.remove('selected'));
            }
            optionEl.classList.toggle('selected'); // Toggle for permissions, select for others

            switch(pageData.type) {
                case 'language':
                    selectLanguage(option.value);
                    updateSetup(); // Re-render page with new language
                    break;
                case 'theme':
                    state.theme = option.value;
                    document.body.classList.toggle('light-theme', option.value === 'light');
                    break;
                case 'weather':
                    state.showWeather = option.value;
                    break;
                case 'permissions':
                    if (option.permission === 'geolocation' && optionEl.classList.contains('selected')) {
                        try {
                            await updateWeatherWidget(); // This will trigger the permission prompt
                        } catch (e) {
                            optionEl.classList.remove('selected'); // Uncheck if denied
                        }
                    }
                    break;
            }
        });

        // Set default selected state
        let isSelected = false;
        if (pageData.type === 'language' && option.value === state.selectedLanguage) isSelected = true;
        if (pageData.type === 'theme' && option.value === state.theme) isSelected = true;
        if (pageData.type === 'weather' && option.value === state.showWeather) isSelected = true;
        if (isSelected) optionEl.classList.add('selected');
    });

    page.querySelector('.setup-button').addEventListener('click', () => {
        if (currentPage === setupPages.length - 1) {
            // Finish setup
            state.hasVisitedBefore = true;
            setupContainer.classList.add('fade-out');
            setTimeout(() => {
                setupContainer.remove();
                goFullscreen();
            }, 500);
        } else {
            currentPage++;
            updateSetup();
        }
    });

    return page;
}

function createSetupScreen() {
    setupContainer = document.createElement('div');
    setupContainer.className = 'setup-screen';
    
    // Create the main content area and progress dots
    setupContainer.innerHTML = `
        <div class="setup-content"></div>
        <div class="setup-progress"></div>
    `;
    
    document.body.appendChild(setupContainer);
    
    // Populate progress dots
    const progressContainer = setupContainer.querySelector('.setup-progress');
    setupPages.forEach(() => {
        progressContainer.innerHTML += '<div class="progress-dot"></div>';
    });
    
    updateSetup(); // Create and show the first page
}

export function initSetup() {
    if (!state.hasVisitedBefore) {
        setupPages = createSetupPages();
        createSetupScreen();
    }
}
