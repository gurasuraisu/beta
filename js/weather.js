import DOM from './dom.js';
import { state, saveState } from './state.js';
import { showPopup } from './notifications.js';
import { getCurrentLanguage } from './i18n.js';
import { isDaytime } from './utils.js';

// Weather condition codes with descriptions and icons for the main widget
const weatherConditions = {
    0: { description: 'Clear Sky', icon: () => isDaytime() ? 'clear_day' : 'clear_night' },
    1: { description: 'Mainly Clear', icon: () => isDaytime() ? 'partly_cloudy_day' : 'partly_cloudy_night' },
    2: { description: 'Partly Cloudy', icon: () => isDaytime() ? 'partly_cloudy_day' : 'partly_cloudy_night' },
    3: { description: 'Overcast', icon: () => 'cloudy' },
    45: { description: 'Fog', icon: () => 'foggy' },
    48: { description: 'Depositing Rime Fog', icon: () => 'foggy' },
    51: { description: 'Light Drizzle', icon: () => 'rainy_light' },
    53: { description: 'Moderate Drizzle', icon: () => 'rainy' },
    55: { description: 'Dense Drizzle', icon: () => 'rainy' },
    56: { description: 'Light Freezing Drizzle', icon: () => 'cloudy_snowing' },
    57: { description: 'Dense Freezing Drizzle', icon: () => 'cloudy_snowing' },
    61: { description: 'Slight Rain', icon: () => 'rainy_light' },
    63: { description: 'Moderate Rain', icon: () => 'rainy' },
    65: { description: 'Heavy Rain', icon: () => 'rainy_heavy' },
    66: { description: 'Light Freezing Rain', icon: () => 'cloudy_snowing' },
    67: { description: 'Heavy Freezing Rain', icon: () => 'cloudy_snowing' },
    71: { description: 'Slight Snow', icon: () => 'weather_snowy' },
    73: { description: 'Moderate Snow', icon: () => 'weather_snowy' },
    75: { description: 'Heavy Snow', icon: () => 'weather_snowy' },
    77: { description: 'Snow Grains', icon: () => 'weather_snowy' },
    80: { description: 'Slight Showers', icon: () => 'rainy_light' },
    81: { description: 'Moderate Showers', icon: () => 'rainy' },
    82: { description: 'Violent Showers', icon: () => 'thunderstorm' },
    85: { description: 'Slight Snow Showers', icon: () => 'weather_snowy' },
    86: { description: 'Heavy Snow Showers', icon: () => 'weather_snowy' },
    95: { description: 'Thunderstorm', icon: () => 'thunderstorm' },
    96: { description: 'Thunderstorm with Hail', icon: () => 'thunderstorm' },
    99: { description: 'Heavy Thunderstorm with Hail', icon: () => 'thunderstorm' }
};

// Simplified weather conditions for the document title (using emojis)
export const weatherConditionsForTitle = {
    0: { icon: '☀️' }, 1: { icon: '🌤️' }, 2: { icon: '⛅' }, 3: { icon: '☁️' }, 45: { icon: '🌫️' },
    48: { icon: '🌫️' }, 51: { icon: '🌦️' }, 53: { icon: '🌦️' }, 55: { icon: '🌧️' }, 56: { icon: '🌧️' },
    57: { icon: '🌧️' }, 61: { icon: '🌧️' }, 63: { icon: '🌧️' }, 65: { icon: '🌧️' }, 66: { icon: '🌧️' },
    67: { icon: '🌧️' }, 71: { icon: '🌨️' }, 73: { icon: '❄️' }, 75: { icon: '❄️' }, 77: { icon: '❄️' },
    80: { icon: '🌦️' }, 81: { icon: '🌧️' }, 82: { icon: '⛈️' }, 85: { icon: '🌨️' }, 86: { icon: '❄️' },
    95: { icon: '⛈️' }, 96: { icon: '⛈️' }, 99: { icon: '🌩️' }
};

function getTemperatureUnit(countryCode) {
    const fahrenheitCountries = ['US', 'BS', 'KY', 'LR', 'PW', 'FM', 'MH'];
    return fahrenheitCountries.includes(countryCode?.toUpperCase()) ? 'fahrenheit' : 'celsius';
}

async function fetchLocationAndWeather() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation is not supported by your browser.'));
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`;
                
                const geoResponse = await fetch(geocodingUrl);
                const geoData = await geoResponse.json();
                
                const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Unknown Location';
                const countryCode = geoData.address.country_code;
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                const temperatureUnit = getTemperatureUnit(countryCode);
                const tempUnitParam = `&temperature_unit=${temperatureUnit}`;
                
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}current_weather=true&timezone=${encodeURIComponent(timezone)}${tempUnitParam}`;
                
                const weatherResponse = await fetch(weatherUrl);
                const weatherData = await weatherResponse.json();

                const combinedData = {
                    city,
                    temperatureUnit,
                    current: weatherData.current_weather,
                };
 
                saveState('lastWeatherData', combinedData);
                resolve(combinedData);
                
            } catch (error) {
                console.error('Error fetching weather data:', error);
                if (!navigator.onLine) {
                    showPopup(getCurrentLanguage().OFFLINE);
                }
                // Attempt to use cached data if fetching fails
                if (state.lastWeatherData) {
                    resolve(state.lastWeatherData);
                } else {
                    reject(error);
                }
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            showPopup(getCurrentLanguage().FAIL_LOCATION);
            reject(error);
        }, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 3600000 // Cache location for 1 hour
        });
    });
}

export async function updateWeatherWidget() {
    if (!state.showWeather) {
        DOM.weatherWidget.style.display = 'none';
        return;
    }

    try {
        const weatherData = await fetchLocationAndWeather();
        if (!weatherData || !weatherData.current) throw new Error('Weather data not available');
        
        DOM.weatherWidget.style.display = 'block';

        const { temperature, weathercode } = weatherData.current;
        const tempUnitSymbol = weatherData.temperatureUnit === 'fahrenheit' ? '°F' : '°C';
        const weatherInfo = weatherConditions[weathercode] || { icon: () => '❓' };
        
        DOM.temperature.textContent = `${Math.round(temperature)}${tempUnitSymbol}`;
        DOM.weatherIcon.textContent = weatherInfo.icon();
        DOM.weatherIcon.dataset.weatherCode = weathercode;

    } catch (error) {
        console.error('Error updating weather widget:', error);
        DOM.weatherWidget.style.display = 'none';
        showPopup(getCurrentLanguage().FAIL_WEATHER);
    }
}

function updateWeatherVisibility() {
    DOM.weatherWidget.style.display = state.showWeather ? 'block' : 'none';
    // When hiding weather, trigger a title update to remove the weather info
    if (!state.showWeather) {
        window.dispatchEvent(new Event('title-update-request'));
    }
}

export function initWeather() {
    // Set initial visibility
    updateWeatherVisibility();
    
    // Set initial state of the switch
    DOM.weatherSwitch.checked = state.showWeather;

    // Fetch weather on startup if enabled
    if (state.showWeather) {
        updateWeatherWidget();
    }
    
    // Set up recurring weather updates (e.g., every 15 minutes)
    setInterval(updateWeatherWidget, 900000);

    // Listen for online event to refresh weather
    window.addEventListener('app-online', updateWeatherWidget);

    // Event listener for the weather toggle switch
    DOM.weatherSwitch.addEventListener('change', function() {
        state.showWeather = this.checked;
        updateWeatherVisibility();
        if (state.showWeather) {
            updateWeatherWidget();
        }
        // This event could be listened to by the wallpaper module
        window.dispatchEvent(new CustomEvent('setting-changed', { detail: { key: 'showWeather', value: state.showWeather }}));
    });
}
