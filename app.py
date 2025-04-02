import os
from flask import Flask, render_template, request, jsonify
from weather_service import WeatherService
from ai_weather_service import AIWeatherService
from cache_service import CacheService
from logger import setup_logger
import traceback

# Initialize Flask app
app = Flask(__name__)

# Configure the logger
logger = setup_logger()

# Set up the cache service
cache_service = CacheService(expiry=600)  # Cache for 10 minutes

# Set up the weather service with API key from environment variables
api_key = os.getenv("OPENWEATHER_API_KEY")
if not api_key:
    logger.error("OpenWeatherMap API key not found in environment variables")
    raise ValueError("OpenWeatherMap API key not set. Please set the OPENWEATHER_API_KEY environment variable.")
    
weather_service = WeatherService(api_key, cache_service)
ai_weather_service = AIWeatherService(api_key, cache_service)

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/weather/current', methods=['GET'])
def get_current_weather():
    """API endpoint to get current weather data for a specific city."""
    city = request.args.get('city')
    
    if not city:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    try:
        logger.info(f"Fetching current weather for {city}")
        weather_data = weather_service.get_current_weather(city)
        return jsonify(weather_data)
    except Exception as e:
        logger.error(f"Error fetching current weather for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/weather/forecast', methods=['GET'])
def get_forecast():
    """API endpoint to get 5-day weather forecast for a specific city."""
    city = request.args.get('city')
    
    if not city:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    try:
        logger.info(f"Fetching 5-day forecast for {city}")
        forecast_data = weather_service.get_forecast(city)
        return jsonify(forecast_data)
    except Exception as e:
        logger.error(f"Error fetching forecast for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/weather/all', methods=['GET'])
def get_all_weather_data():
    """API endpoint to get both current weather and forecast for a specific city."""
    city = request.args.get('city')
    
    if not city:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    try:
        logger.info(f"Fetching all weather data for {city}")
        current = weather_service.get_current_weather(city)
        forecast = weather_service.get_forecast(city)
        
        return jsonify({
            "current": current,
            "forecast": forecast
        })
    except Exception as e:
        logger.error(f"Error fetching weather data for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    logger.warning(f"404 error: {request.path}")
    return jsonify({"error": "Not found"}), 404

@app.route('/api/weather/enhanced-forecast', methods=['GET'])
def get_enhanced_forecast():
    """API endpoint to get AI-enhanced weather forecast for a specific city."""
    city = request.args.get('city')
    
    if not city:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    try:
        logger.info(f"Fetching AI-enhanced forecast for {city}")
        forecast_data = ai_weather_service.get_enhanced_forecast(city)
        return jsonify(forecast_data)
    except Exception as e:
        logger.error(f"Error fetching AI-enhanced forecast for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/weather/alerts', methods=['POST'])
def get_personalized_alerts():
    """API endpoint to get personalized weather alerts based on user preferences."""
    data = request.json
    
    if not data or 'city' not in data:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    city = data.get('city')
    user_preferences = data.get('preferences', {})
    
    try:
        logger.info(f"Generating personalized alerts for {city}")
        alerts = ai_weather_service.get_personalized_alerts(city, user_preferences)
        return jsonify({"alerts": alerts})
    except Exception as e:
        logger.error(f"Error generating personalized alerts for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommendations/clothing', methods=['GET'])
def get_clothing_recommendations():
    """API endpoint to get clothing recommendations based on weather."""
    city = request.args.get('city')
    
    if not city:
        logger.warning("API request missing city parameter")
        return jsonify({"error": "City parameter is required"}), 400
    
    try:
        logger.info(f"Generating clothing recommendations for {city}")
        recommendations = ai_weather_service.get_clothing_recommendations(city)
        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Error generating clothing recommendations for {city}: {str(e)}")
        logger.debug(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    logger.error(f"500 error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
