// Configuration
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

// State
let isCelsius = false;
let currentWeatherData = null;

// DOM Elements
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const celsiusBtn = document.getElementById('celsiusBtn');
const useLocationBtn = document.getElementById('useLocationBtn');
const enterCityBtn = document.getElementById('enterCityBtn');
const citySearchGroup = document.getElementById('citySearchGroup');
const zipInput = document.getElementById('zipInput');
const useZipBtn = document.getElementById('useZipBtn');
const locationDisplay = document.getElementById('locationDisplay');
const targetTempSlider = document.getElementById('targetTempSlider');
const targetTempValue = document.getElementById('targetTempValue');
const targetTempUnit = document.getElementById('targetTempUnit');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

// Event Listeners
fahrenheitBtn.addEventListener('click', () => handleUnitToggle(false));
celsiusBtn.addEventListener('click', () => handleUnitToggle(true));
useLocationBtn.addEventListener('click', handleUseLocationClick);
enterCityBtn.addEventListener('click', handleEnterCityClick);
useZipBtn.addEventListener('click', handleUseZip);
zipInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUseZip();
});
targetTempSlider.addEventListener('input', handleSliderChange);

// Initialize
updateSliderDisplay();

// Temperature Conversion Functions
function fahrenheitToCelsius(f) {
    return (f - 32) * 5 / 9;
}

function celsiusToFahrenheit(c) {
    return (c * 9 / 5) + 32;
}

// Psychrometric Calculations
function calculateSaturationVaporPressure(tempC) {
    // August-Roche-Magnus formula for saturation vapor pressure (in Pa)
    return 610.78 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

function calculateAbsoluteHumidity(tempC, relativeHumidity) {
    // Calculate absolute humidity in g/m³
    const satVaporPressure = calculateSaturationVaporPressure(tempC);
    const actualVaporPressure = satVaporPressure * (relativeHumidity / 100);
    // Using the ideal gas law approximation
    return (actualVaporPressure * 2.16679) / (tempC + 273.15);
}

function calculateIndoorRH(outdoorTempC, outdoorRH, indoorTempC) {
    // Calculate the absolute humidity from outdoor conditions
    const absoluteHumidity = calculateAbsoluteHumidity(outdoorTempC, outdoorRH);
    
    // Calculate indoor saturation vapor pressure at indoor temperature
    const indoorSatVaporPressure = calculateSaturationVaporPressure(indoorTempC);
    
    // Calculate indoor actual vapor pressure from absolute humidity
    const indoorActualVaporPressure = (absoluteHumidity * (indoorTempC + 273.15)) / 2.16679;
    
    // Calculate indoor relative humidity
    const indoorRH = (indoorActualVaporPressure / indoorSatVaporPressure) * 100;
    
    return Math.min(100, Math.max(0, indoorRH)); // Clamp between 0 and 100
}

// UI Update Functions
function handleUnitToggle(toCelsius) {
    // Don't switch if already on the selected unit
    if (isCelsius === toCelsius) {
        return;
    }
    
    isCelsius = toCelsius;
    
    // Update button states
    if (isCelsius) {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }
    
    updateSliderRange();
    updateSliderDisplay();
    if (currentWeatherData) {
        updateResults();
    }
}

function updateSliderRange() {
    if (isCelsius) {
        // Convert 60-80°F to °C (approximately 15.5-26.7°C)
        const currentF = parseInt(targetTempSlider.value);
        const currentC = Math.round(fahrenheitToCelsius(currentF));
        targetTempSlider.min = '16';
        targetTempSlider.max = '27';
        targetTempSlider.value = currentC;
    } else {
        // Fahrenheit range
        const currentC = parseInt(targetTempSlider.value);
        const currentF = Math.round(celsiusToFahrenheit(currentC));
        targetTempSlider.min = '60';
        targetTempSlider.max = '80';
        targetTempSlider.value = currentF;
    }
}

function updateSliderDisplay() {
    targetTempValue.textContent = targetTempSlider.value;
    targetTempUnit.textContent = isCelsius ? '°C' : '°F';
}

function handleSliderChange() {
    updateSliderDisplay();
    if (currentWeatherData) {
        updateResults();
    }
}

// Location Handlers
function handleUseLocationClick() {
    // Toggle active state
    useLocationBtn.classList.add('active');
    enterCityBtn.classList.remove('active');
    
    // Hide city search inputs
    citySearchGroup.style.display = 'none';
    
    // Trigger geolocation
    handleUseLocation();
}

function handleEnterCityClick() {
    // Toggle active state
    enterCityBtn.classList.add('active');
    useLocationBtn.classList.remove('active');
    
    // Show city search inputs
    citySearchGroup.style.display = 'flex';
    
    // Focus on input
    zipInput.focus();
}

async function handleUseLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading();
    hideError();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
            hideLoading();
            showError('Unable to retrieve your location. Please use city search instead.');
            console.error(err);
        }
    );
}

async function handleUseZip() {
    const zip = zipInput.value.trim();
    if (!zip) {
        showError('Please enter a ZIP code');
        return;
    }

    showLoading();
    hideError();

    await fetchWeatherByZip(zip);
}

// Weather API Functions
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `${OPEN_METEO_BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }

        const data = await response.json();
        
        // Get city name using reverse geocoding
        const locationName = await reverseGeocode(lat, lon);
        
        processWeatherData(data, locationName);
    } catch (err) {
        hideLoading();
        showError('Failed to fetch weather data. Please try again.');
        console.error(err);
    }
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `${REVERSE_GEOCODING_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        
        if (response.ok) {
            const data = await response.json();
            
            // Validate data object exists
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response data');
            }
            
            // Build location string from available data with validation
            const parts = [];
            
            if (data.city || data.locality) {
                parts.push(data.city || data.locality);
            }
            
            if (data.principalSubdivision) {
                parts.push(data.principalSubdivision);
            } else if (data.countryCode === 'US' && typeof data.principalSubdivisionCode === 'string') {
                // For US locations, use state code (safely handle string replacement)
                parts.push(data.principalSubdivisionCode.replace('US-', ''));
            }
            
            if (data.countryCode && data.countryCode !== 'US') {
                parts.push(data.countryCode);
            }
            
            if (parts.length > 0) {
                return parts.join(', ');
            }
        }
    } catch (err) {
        console.error('Reverse geocoding failed:', err);
    }
    
    // Fallback to coordinates if reverse geocoding fails
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

async function fetchWeatherByZip(zip) {
    try {
        // Use geocoding API to search for the location
        // Works best with city names, but can handle some postal codes
        const geoResponse = await fetch(
            `${GEOCODING_API_URL}?name=${encodeURIComponent(zip)}&count=1&language=en&format=json`
        );
        
        if (!geoResponse.ok) {
            throw new Error('Location search failed');
        }

        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Location not found');
        }

        const { latitude, longitude, name, admin1, country } = geoData.results[0];
        
        // Fetch weather data for those coordinates
        const weatherResponse = await fetch(
            `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Weather data not available');
        }

        const weatherData = await weatherResponse.json();
        
        const locationName = `${name}${admin1 ? ', ' + admin1 : ''}${country ? ', ' + country : ''}`;
        processWeatherData(weatherData, locationName);
    } catch (err) {
        hideLoading();
        showError('Location not found. Please try a different city name or use your current location.');
        console.error(err);
    }
}

function processWeatherData(data, locationName) {
    currentWeatherData = {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        location: locationName
    };
    
    // Update location display
    locationDisplay.textContent = `📍 ${locationName}`;
    locationDisplay.classList.add('active');
    
    hideLoading();
    updateResults();
}

function getWeatherDescription(code) {
    // WMO Weather interpretation codes
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    
    return weatherCodes[code] || 'Unknown';
}

function updateResults() {
    if (!currentWeatherData) return;

    // Extract weather data (now from Open-Meteo format)
    const outdoorTempC = currentWeatherData.temperature;
    const humidity = currentWeatherData.humidity;
    const weatherCode = currentWeatherData.weatherCode;

    // Convert temperatures
    const outdoorTempF = celsiusToFahrenheit(outdoorTempC);

    // Get target temperature
    const targetTemp = parseInt(targetTempSlider.value);
    const targetTempC = isCelsius ? targetTemp : fahrenheitToCelsius(targetTemp);
    
    // Display outdoor temperature
    const outdoorDisplayTemp = isCelsius ? 
        `${outdoorTempC.toFixed(1)}°C` : 
        `${outdoorTempF.toFixed(1)}°F`;
    
    document.getElementById('outdoorTemp').textContent = outdoorDisplayTemp;
    document.getElementById('outdoorHumidity').textContent = `${humidity}%`;

    // Calculate indoor RH
    const indoorRH = calculateIndoorRH(outdoorTempC, humidity, targetTempC);
    
    // Display results
    document.getElementById('indoorRH').textContent = indoorRH.toFixed(1);

    // Show recommendation
    updateRecommendation(indoorRH);

    // Show results section
    resultsSection.style.display = 'block';
}

function updateRecommendation(indoorRH) {
    const recommendationDiv = document.getElementById('recommendation');
    let message = '';
    let className = '';

    if (indoorRH < 30) {
        className = 'bad';
        message = '❌ Not recommended. Indoor humidity would be too low, which can cause dry skin, irritated airways, and static electricity.';
    } else if (indoorRH >= 30 && indoorRH <= 50) {
        className = 'good';
        message = '✅ Great time to open windows! The indoor humidity will be in the optimal comfort range (30-50%).';
    } else if (indoorRH > 50 && indoorRH <= 60) {
        className = 'warning';
        message = '⚠️ Caution. Indoor humidity would be slightly high. You may feel comfortable, but prolonged exposure could promote mold growth.';
    } else {
        className = 'bad';
        message = '❌ Not recommended. Indoor humidity would be too high, increasing the risk of mold growth and discomfort.';
    }

    recommendationDiv.textContent = message;
    recommendationDiv.className = `recommendation ${className}`;
}

// UI Helper Functions
function showLoading() {
    loading.style.display = 'flex';
    resultsSection.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
}

function hideError() {
    error.style.display = 'none';
}
