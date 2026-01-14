# Outdoor to Indoor RH Calculator

Can I open my windows today? This simple web application helps you determine what the relative humidity will be like inside your home if you open the windows, based on current outdoor conditions.

## Features

- 🌡️ **Temperature Control**: Adjust your target indoor temperature using an interactive slider (default: 70°F)
- 🔄 **Unit Toggle**: Switch between Fahrenheit and Celsius
- 📍 **Geolocation**: Use your current location automatically
- 📮 **ZIP Code Support**: Enter a ZIP code as an alternative to geolocation
- 💧 **Humidity Prediction**: Calculates expected indoor relative humidity using psychrometric principles
- ✅ **Smart Recommendations**: Get clear advice on whether it's a good time to open windows

## Setup

1. **Get a Free API Key**
   - Visit [OpenWeatherMap.org](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate an API key

2. **Configure the Application**
   - Open `script.js`
   - Replace `YOUR_API_KEY_HERE` with your actual API key:
     ```javascript
     const OPENWEATHER_API_KEY = 'your_actual_api_key';
     ```

3. **Run the Application**
   - Open `index.html` in a web browser
   - Or serve it using a local web server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

## How It Works

The calculator uses psychrometric principles to determine indoor humidity:

1. Gets current outdoor temperature and relative humidity from OpenWeatherMap API
2. Calculates the absolute humidity (moisture content) of outdoor air
3. Determines what the relative humidity would be if that air is brought indoors and heated/cooled to your target temperature
4. Provides recommendations based on optimal humidity ranges (30-50% RH)

### Optimal Indoor Humidity

- **30-50% RH**: Ideal comfort range, prevents mold and maintains air quality
- **< 30% RH**: Too dry, can cause discomfort and health issues
- **> 50% RH**: Too humid, increases mold risk and discomfort

## Usage

1. **Set Your Location**: Click "Use My Location" or enter a ZIP code
2. **Adjust Target Temperature**: Use the slider to set your desired indoor temperature
3. **Toggle Units**: Switch between °F and °C as preferred
4. **View Results**: See outdoor conditions and predicted indoor humidity
5. **Follow Recommendations**: Check whether it's a good time to open windows

## Technologies Used

- Pure HTML, CSS, and JavaScript (no frameworks required)
- OpenWeatherMap API for weather data
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
