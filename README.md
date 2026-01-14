# Outdoor to Indoor RH Calculator

Can I open my windows today? This simple web application helps you determine what the relative humidity will be like inside your home if you open the windows, based on current outdoor conditions.

## Features

- 🌡️ **Temperature Control**: Adjust your target indoor temperature using an interactive slider (default: 70°F)
- 🔄 **Unit Toggle**: Switch between Fahrenheit and Celsius
- 📍 **Geolocation**: Use your current location automatically
- 📮 **Location Search**: Enter a city name or ZIP code as an alternative to geolocation
- 💧 **Humidity Prediction**: Calculates expected indoor relative humidity using psychrometric principles
- ✅ **Smart Recommendations**: Get clear advice on whether it's a good time to open windows
- 🔓 **No API Key Required**: Uses Open-Meteo API - no registration or API key needed!

## Setup

**No setup required!** Simply open `index.html` in any modern web browser.

## How It Works

The calculator uses psychrometric principles to determine indoor humidity:

1. Gets current outdoor temperature and relative humidity from Open-Meteo API (free, no API key required)
2. Calculates the absolute humidity (moisture content) of outdoor air
3. Determines what the relative humidity would be if that air is brought indoors and heated/cooled to your target temperature
4. Provides recommendations based on optimal humidity ranges (30-50% RH)

### Optimal Indoor Humidity

- **30-50% RH**: Ideal comfort range, prevents mold and maintains air quality
- **< 30% RH**: Too dry, can cause discomfort and health issues
- **> 50% RH**: Too humid, increases mold risk and discomfort

## Usage

1. **Set Your Location**: Click "Use My Location" or enter a city name/ZIP code
2. **Adjust Target Temperature**: Use the slider to set your desired indoor temperature
3. **Toggle Units**: Switch between °F and °C as preferred
4. **View Results**: See outdoor conditions and predicted indoor humidity
5. **Follow Recommendations**: Check whether it's a good time to open windows

## Technologies Used

- Pure HTML, CSS, and JavaScript (no frameworks required)
- Open-Meteo API for weather data (free, no API key required)
- Geolocation API for automatic location detection
- Psychrometric equations for humidity calculations

## Note

This calculator provides estimates based on simplified psychrometric principles. Actual indoor conditions may vary depending on:
- Air exchange rate
- Home insulation
- HVAC system operation
- Internal moisture sources
- Building materials

## License

MIT License - Feel free to use and modify as needed.
