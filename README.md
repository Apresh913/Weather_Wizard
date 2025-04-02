MIT License

...

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.# Weather Forecast Application

A real-time weather forecasting application that provides current conditions and 5-day forecasts using the OpenWeatherMap API.

## Features

- Search for weather by city name with autocomplete suggestions
- Display current weather conditions (temperature, humidity, wind speed, direction)
- Show 5-day weather forecast with detailed hourly predictions
- Responsive design that works on desktop and mobile devices
- Data caching to reduce API calls and improve performance
- Error handling with user-friendly messages
- Remembers your last searched city

## Technologies Used

- **Python Version**: Flask web framework
- **Java Version**: Spring Boot with Thymeleaf (in development)
- **Frontend**: HTML, CSS, JavaScript
- **API**: OpenWeatherMap API
- **Caching**: In-memory cache with time-based expiration
- **Data Storage**: LocalStorage for saving user preferences
- **UI Features**: Autocomplete for city search, interactive weather cards

## Getting Started

### Prerequisites

- Python 3.7 or higher
- OpenWeatherMap API key (get one at [OpenWeatherMap](https://openweathermap.org/api))

### Installation

1. Clone this repository
```
git clone https://github.com/YOUR_USERNAME/weather-app.git
cd weather-app
```

2. Install dependencies
```
pip install flask requests
```

3. Set your API key as an environment variable
```
export OPENWEATHER_API_KEY=your_api_key_here
```

4. Run the application
```
python app.py
```

5. Open your browser and go to `http://localhost:5000`

## Project Structure

```
weather-app/
  ├── app.py                # Main Flask application
  ├── weather_service.py    # Service for fetching weather data from API
  ├── cache_service.py      # Service for caching API responses
  ├── config.py             # Application configuration
  ├── logger.py             # Logger configuration
  ├── static/               # Static assets
  │   ├── css/              # CSS styles
  │   │   └── style.css     # Main stylesheet
  │   └── js/               # JavaScript files
  │       ├── app.js        # Main application logic
  │       ├── cities.js     # City data for autocomplete
  │       └── utils.js      # Utility functions
  ├── templates/            # HTML templates
  │   └── index.html        # Main page template
  ├── tests/                # Unit tests
  │   ├── mocks/            # Mock data for testing
  │   │   ├── current_weather.json
  │   │   └── forecast.json
  │   ├── test_cache_service.py
  │   └── test_weather_service.py
  ├── LICENSE               # MIT License file
  └── README.md             # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenWeatherMap](https://openweathermap.org/) for providing the weather data API
- [Flask](https://flask.palletsprojects.com/) for the web framework
