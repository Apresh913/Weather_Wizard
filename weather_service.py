import requests
from logger import setup_logger

class WeatherService:
    """Service for fetching weather data from OpenWeatherMap API."""
    
    def __init__(self, api_key, cache_service):
        """
        Initialize the weather service.
        
        Args:
            api_key (str): OpenWeatherMap API key
            cache_service (CacheService): Cache service for caching API responses
        """
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.cache_service = cache_service
        self.logger = setup_logger()
    
    def get_current_weather(self, city):
        """
        Fetch current weather data for a specific city.
        
        Args:
            city (str): Name of the city
            
        Returns:
            dict: Current weather data
            
        Raises:
            Exception: If the API request fails
        """
        cache_key = f"current_weather_{city}"
        cached_data = self.cache_service.get(cache_key)
        
        if cached_data:
            self.logger.info(f"Using cached current weather data for {city}")
            return cached_data
        
        self.logger.info(f"Fetching current weather data for {city} from API")
        url = f"{self.base_url}/weather"
        params = {
            "q": city,
            "appid": self.api_key,
            "units": "metric"  # Use metric units by default
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Format the response to include only the data we need
            formatted_data = {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "wind_direction": data["wind"]["deg"],
                "weather_main": data["weather"][0]["main"],
                "weather_description": data["weather"][0]["description"],
                "weather_icon": data["weather"][0]["icon"],
                "timestamp": data["dt"]
            }
            
            # Cache the formatted data
            self.cache_service.set(cache_key, formatted_data)
            
            return formatted_data
        except requests.exceptions.RequestException as e:
            # Create a redacted error message without the API key
            error_message = str(e)
            if self.api_key in error_message:
                # Replace the API key with [REDACTED] in the error message
                error_message = error_message.replace(self.api_key, "[REDACTED]")
            
            self.logger.error(f"Error fetching current weather data: {error_message}")
            
            if hasattr(e, "response") and e.response:
                # Also redact any response content that might contain the API key
                response_text = e.response.text
                if self.api_key in response_text:
                    response_text = response_text.replace(self.api_key, "[REDACTED]")
                self.logger.error(f"Response content: {response_text}")
                
            raise Exception(f"Failed to fetch current weather data: {error_message}")
    
    def get_forecast(self, city):
        """
        Fetch 5-day weather forecast for a specific city.
        
        Args:
            city (str): Name of the city
            
        Returns:
            dict: 5-day forecast data
            
        Raises:
            Exception: If the API request fails
        """
        cache_key = f"forecast_{city}"
        cached_data = self.cache_service.get(cache_key)
        
        if cached_data:
            self.logger.info(f"Using cached forecast data for {city}")
            return cached_data
        
        self.logger.info(f"Fetching forecast data for {city} from API")
        url = f"{self.base_url}/forecast"
        params = {
            "q": city,
            "appid": self.api_key,
            "units": "metric"  # Use metric units by default
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Format the response to include only the data we need
            # The API returns forecasts in 3-hour intervals for 5 days
            # We'll organize it by day to make it easier to display
            
            # Get city info
            city_info = {
                "id": data["city"]["id"],
                "name": data["city"]["name"],
                "country": data["city"]["country"],
                "timezone": data["city"]["timezone"]
            }
            
            # Organize forecast by day
            days = {}
            for item in data["list"]:
                # Extract date from timestamp (yyyy-mm-dd)
                date = item["dt_txt"].split(" ")[0]
                
                if date not in days:
                    days[date] = []
                
                forecast_item = {
                    "time": item["dt_txt"].split(" ")[1],
                    "timestamp": item["dt"],
                    "temperature": item["main"]["temp"],
                    "feels_like": item["main"]["feels_like"],
                    "humidity": item["main"]["humidity"],
                    "pressure": item["main"]["pressure"],
                    "wind_speed": item["wind"]["speed"],
                    "wind_direction": item["wind"]["deg"],
                    "weather_main": item["weather"][0]["main"],
                    "weather_description": item["weather"][0]["description"],
                    "weather_icon": item["weather"][0]["icon"]
                }
                
                days[date].append(forecast_item)
            
            formatted_data = {
                "city": city_info,
                "days": days
            }
            
            # Cache the formatted data
            self.cache_service.set(cache_key, formatted_data)
            
            return formatted_data
        except requests.exceptions.RequestException as e:
            # Create a redacted error message without the API key
            error_message = str(e)
            if self.api_key in error_message:
                # Replace the API key with [REDACTED] in the error message
                error_message = error_message.replace(self.api_key, "[REDACTED]")
            
            self.logger.error(f"Error fetching forecast data: {error_message}")
            
            if hasattr(e, "response") and e.response:
                # Also redact any response content that might contain the API key
                response_text = e.response.text
                if self.api_key in response_text:
                    response_text = response_text.replace(self.api_key, "[REDACTED]")
                self.logger.error(f"Response content: {response_text}")
                
            raise Exception(f"Failed to fetch forecast data: {error_message}")
