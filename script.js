// Configuration
const OPENWEATHER_API_KEY = 'YOUR_API_KEY_HERE'; // Users will need to replace this
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// State
let isCelsius = false;
let currentWeatherData = null;

// DOM Elements
const unitToggle = document.getElementById('unitToggle');
const useLocationBtn = document.getElementById('useLocationBtn');
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
unitToggle.addEventListener('change', handleUnitToggle);
useLocationBtn.addEventListener('click', handleUseLocation);
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

function kelvinToFahrenheit(k) {
    return (k - 273.15) * 9 / 5 + 32;
}

function kelvinToCelsius(k) {
    return k - 273.15;
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
function handleUnitToggle() {
    isCelsius = unitToggle.checked;
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
            showError('Unable to retrieve your location. Please use ZIP code instead.');
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
            `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }

        const data = await response.json();
        processWeatherData(data);
    } catch (err) {
        hideLoading();
        showError('Failed to fetch weather data. Please check your API key configuration.');
        console.error(err);
    }
}

async function fetchWeatherByZip(zip) {
    try {
        const response = await fetch(
            `${OPENWEATHER_BASE_URL}?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Invalid ZIP code or weather data not available');
        }

        const data = await response.json();
        processWeatherData(data);
    } catch (err) {
        hideLoading();
        showError('Failed to fetch weather data. Please check the ZIP code and try again.');
        console.error(err);
    }
}

function processWeatherData(data) {
    currentWeatherData = data;
    
    // Update location display
    locationDisplay.textContent = `📍 ${data.name}${data.sys.country ? ', ' + data.sys.country : ''}`;
    locationDisplay.classList.add('active');
    
    hideLoading();
    updateResults();
}

function updateResults() {
    if (!currentWeatherData) return;

    // Extract weather data
    const tempK = currentWeatherData.main.temp;
    const humidity = currentWeatherData.main.humidity;
    const conditions = currentWeatherData.weather[0].description;

    // Convert temperatures
    const outdoorTempF = kelvinToFahrenheit(tempK);
    const outdoorTempC = kelvinToCelsius(tempK);

    // Display outdoor conditions
    const displayTemp = isCelsius ? 
        `${outdoorTempC.toFixed(1)}°C` : 
        `${outdoorTempF.toFixed(1)}°F`;
    
    document.getElementById('outdoorTemp').textContent = displayTemp;
    document.getElementById('outdoorHumidity').textContent = `${humidity}%`;
    document.getElementById('conditions').textContent = 
        conditions.charAt(0).toUpperCase() + conditions.slice(1);

    // Calculate indoor RH
    const targetTemp = parseInt(targetTempSlider.value);
    const targetTempC = isCelsius ? targetTemp : fahrenheitToCelsius(targetTemp);
    
    const indoorRH = calculateIndoorRH(outdoorTempC, humidity, targetTempC);
    
    // Display results
    document.getElementById('indoorRH').textContent = indoorRH.toFixed(1);
    document.getElementById('targetTempDisplay').textContent = 
        `${targetTemp}${isCelsius ? '°C' : '°F'}`;

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

// Check for API key configuration
window.addEventListener('DOMContentLoaded', () => {
    if (OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ API Key not configured. Please get a free API key from OpenWeatherMap.org and update the script.js file.');
    }
});
