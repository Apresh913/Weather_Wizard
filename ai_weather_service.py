import os
import numpy as np
from datetime import datetime, timedelta
import requests
import logging
from sklearn.linear_model import LinearRegression
from cache_service import CacheService

class AIWeatherService:
    """
    AI-powered weather service for enhanced predictions and personalized weather alerts.
    This service augments standard weather data with AI predictions for improved accuracy.
    """
    
    def __init__(self, api_key, cache_service):
        """
        Initialize the AI weather service.
        
        Args:
            api_key (str): OpenWeatherMap API key
            cache_service (CacheService): Cache service for caching API responses and predictions
        """
        self.api_key = api_key
        self.cache = cache_service
        self.logger = logging.getLogger('weather_app')
        self.models = {}  # Store prediction models for different cities
        
    def get_enhanced_forecast(self, city):
        """
        Get AI-enhanced weather forecast with improved accuracy based on historical patterns.
        
        Args:
            city (str): City name
            
        Returns:
            dict: Enhanced forecast data
        """
        # Check cache first
        cache_key = f"enhanced_forecast:{city}"
        cached_data = self.cache.get(cache_key)
        if cached_data:
            self.logger.info(f"Returning enhanced forecast for {city} from cache")
            return cached_data
            
        # Get standard forecast from OpenWeatherMap
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "q": city,
            "appid": self.api_key,
            "units": "metric"
        }
        
        try:
            response = requests.get(forecast_url, params=params)
            response.raise_for_status()
            forecast_data = response.json()
            
            # Apply AI enhancement to the forecast (using simple ML model for demo)
            enhanced_data = self._enhance_forecast_with_ai(city, forecast_data)
            
            # Cache the enhanced forecast
            self.cache.set(cache_key, enhanced_data)
            return enhanced_data
            
        except Exception as e:
            self.logger.error(f"Error fetching enhanced forecast for {city}: {str(e)}")
            raise Exception(f"Failed to fetch enhanced forecast: {str(e)}")
    
    def get_personalized_alerts(self, city, user_preferences):
        """
        Generate personalized weather alerts based on user preferences.
        Detects severe weather events and generates real-time alerts.
        
        Args:
            city (str): City name
            user_preferences (dict): User preferences for alerts
                {
                    "rain_sensitivity": float (0-1),
                    "temp_sensitivity": float (0-1),
                    "wind_sensitivity": float (0-1),
                    "alert_threshold": float (0-1)
                }
                
        Returns:
            list: Personalized alerts based on forecast and preferences
        """
        alerts = []
        
        try:
            # Get enhanced forecast
            forecast = self.get_enhanced_forecast(city)
            
            # Get current weather data for immediate alerts
            current_url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(current_url, params=params)
            response.raise_for_status()
            current_data = response.json()
            
            # Generate alerts based on forecast and user preferences
            rain_sensitivity = user_preferences.get('rain_sensitivity', 0.5)
            temp_sensitivity = user_preferences.get('temp_sensitivity', 0.5)
            wind_sensitivity = user_preferences.get('wind_sensitivity', 0.5)
            alert_threshold = user_preferences.get('alert_threshold', 0.7)
            
            # Check for severe weather conditions in current data
            weather_condition = current_data['weather'][0]['main'].lower()
            weather_description = current_data['weather'][0]['description'].lower()
            current_temp = current_data['main']['temp']
            current_wind = current_data.get('wind', {}).get('speed', 0)
            current_humidity = current_data['main']['humidity']
            
            # Check for immediate severe weather events
            self._check_severe_weather_conditions(alerts, weather_condition, weather_description, 
                                                 current_temp, current_wind, current_humidity, 
                                                 user_preferences, 'now')
            
            # Add available weather warnings from API if they exist
            if 'alerts' in current_data:
                for alert in current_data['alerts']:
                    alerts.append({
                        'type': 'severe_alert',
                        'time': 'now',
                        'message': f"WEATHER ALERT: {alert.get('event', 'Severe weather')}. {alert.get('description', '')}",
                        'severity': 1.0
                    })
            
            # Process forecast data to generate personalized alerts for future time periods
            for day in forecast['list'][:16]:  # Next 48 hours (3-hour intervals)
                time = day['dt_txt']
                forecast_weather = day['weather'][0]['main'].lower()
                forecast_description = day['weather'][0]['description'].lower()
                forecast_temp = day['main']['temp']
                forecast_wind = day['wind']['speed']
                forecast_humidity = day['main']['humidity']
                
                # Check for severe weather in forecast
                self._check_severe_weather_conditions(alerts, forecast_weather, forecast_description, 
                                                     forecast_temp, forecast_wind, forecast_humidity, 
                                                     user_preferences, time)
                
                # Standard alerts (rain, temp, wind)
                # Rain alerts
                if 'rain' in day and rain_sensitivity > 0.3:
                    rain_volume = day['rain'].get('3h', 0)
                    if rain_volume > 1.0 * rain_sensitivity:
                        alerts.append({
                            'type': 'rain',
                            'time': time,
                            'message': f"Expected rainfall of {rain_volume}mm at {time}",
                            'severity': min(rain_volume / 10, 1.0)
                        })
                
                # Temperature alerts
                if temp_sensitivity > 0.3:
                    temp = day['main']['temp']
                    feels_like = day['main']['feels_like']
                    
                    if temp > 30 * temp_sensitivity:
                        alerts.append({
                            'type': 'high_temp',
                            'time': time,
                            'message': f"High temperature of {temp}°C (feels like {feels_like}°C) at {time}",
                            'severity': min((temp - 25) / 15, 1.0)
                        })
                    elif temp < 5 * temp_sensitivity:
                        alerts.append({
                            'type': 'low_temp',
                            'time': time,
                            'message': f"Low temperature of {temp}°C (feels like {feels_like}°C) at {time}",
                            'severity': min((5 - temp) / 10, 1.0)
                        })
                
                # Wind alerts
                if wind_sensitivity > 0.3:
                    wind_speed = day['wind']['speed']
                    if wind_speed > 10.0 * wind_sensitivity:
                        alerts.append({
                            'type': 'wind',
                            'time': time,
                            'message': f"Strong winds of {wind_speed} m/s at {time}",
                            'severity': min(wind_speed / 20, 1.0)
                        })
            
            # Filter alerts by threshold and sort by severity (most severe first)
            alerts = [alert for alert in alerts if alert['severity'] >= alert_threshold]
            alerts.sort(key=lambda x: x['severity'], reverse=True)
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"Error generating personalized alerts for {city}: {str(e)}")
            raise Exception(f"Failed to generate personalized alerts: {str(e)}")
            
    def _check_severe_weather_conditions(self, alerts, weather_condition, weather_description, 
                                        temp, wind, humidity, user_preferences, time):
        """Check for severe weather conditions and add appropriate alerts."""
        # Heavy storm detection
        if any(term in weather_condition or term in weather_description 
               for term in ['thunderstorm', 'storm', 'thunder']):
            severity = 1.0
            alerts.append({
                'type': 'severe_storm',
                'time': time,
                'message': f"SEVERE WEATHER ALERT: Thunderstorm expected at {time}. Take shelter and stay indoors.",
                'severity': severity
            })
            
        # Heavy rainfall detection
        if ('heavy' in weather_description and ('rain' in weather_condition or 'rain' in weather_description)) or \
           'torrential' in weather_description:
            severity = 0.9
            alerts.append({
                'type': 'heavy_rain',
                'time': time,
                'message': f"SEVERE WEATHER ALERT: Heavy rainfall expected at {time}. Flooding possible, avoid travel if possible.",
                'severity': severity
            })
            
        # Heatwave detection (high temp + high humidity for extended time)
        if temp > 35 and humidity > 60:
            severity = 0.95
            alerts.append({
                'type': 'heatwave',
                'time': time,
                'message': f"SEVERE WEATHER ALERT: Extreme heat conditions at {time}. Temperature {temp}°C with high humidity {humidity}%. Stay hydrated and avoid outdoor activities.",
                'severity': severity
            })
            
        # Severe winter/blizzard conditions
        if (('snow' in weather_condition or 'snow' in weather_description) and 
            ('heavy' in weather_description or wind > 10)) or \
           ('blizzard' in weather_description):
            severity = 0.95
            alerts.append({
                'type': 'winter_storm',
                'time': time,
                'message': f"SEVERE WEATHER ALERT: Severe winter conditions at {time}. Heavy snow and limited visibility. Avoid unnecessary travel.",
                'severity': severity
            })
            
        # Hurricane/cyclone detection
        if any(term in weather_condition or term in weather_description 
               for term in ['hurricane', 'typhoon', 'cyclone']):
            severity = 1.0
            alerts.append({
                'type': 'hurricane',
                'time': time,
                'message': f"EMERGENCY WEATHER ALERT: Hurricane/cyclone conditions at {time}. Seek immediate shelter and follow evacuation orders.",
                'severity': severity
            })
            
        # Tornado warning
        if 'tornado' in weather_description:
            severity = 1.0
            alerts.append({
                'type': 'tornado',
                'time': time,
                'message': f"EMERGENCY WEATHER ALERT: Tornado conditions at {time}. Seek shelter immediately in a basement or interior room.",
                'severity': severity
            })
            
        # Extreme cold/frost warning
        if temp < -15:
            severity = 0.9
            alerts.append({
                'type': 'extreme_cold',
                'time': time,
                'message': f"SEVERE WEATHER ALERT: Extreme cold conditions at {time}. Temperature {temp}°C. Risk of frostbite and hypothermia.",
                'severity': severity
            })
    
    def get_clothing_recommendations(self, city):
        """
        Generate clothing recommendations based on current weather and forecast.
        
        Args:
            city (str): City name
            
        Returns:
            dict: Clothing recommendations with time-specific suggestions
        """
        try:
            # Get current weather
            current_url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(current_url, params=params)
            response.raise_for_status()
            current_data = response.json()
            
            # Get forecast for later today
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast"
            forecast_params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric"
            }
            
            forecast_response = requests.get(forecast_url, params=forecast_params)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            # Current conditions
            current_temp = current_data['main']['temp']
            current_weather = current_data['weather'][0]['main'].lower()
            current_humidity = current_data['main']['humidity']
            current_wind_speed = current_data['wind']['speed']
            current_uv = current_data.get('uvi', 0)  # UV index if available
            
            # Current time and calculate morning/evening time
            current_time = datetime.now()
            
            # Find morning and evening forecast data
            morning_data = None
            evening_data = None
            
            for item in forecast_data['list']:
                forecast_time = datetime.strptime(item['dt_txt'], '%Y-%m-%d %H:%M:%S')
                
                # Skip if it's not today
                if forecast_time.date() != current_time.date():
                    continue
                    
                # Morning around 9-10 AM
                if 8 <= forecast_time.hour <= 10 and not morning_data:
                    morning_data = item
                
                # Evening around 6-8 PM
                if 18 <= forecast_time.hour <= 20 and not evening_data:
                    evening_data = item
            
            # Create recommendations object
            recommendations = {
                'current': {
                    'time': 'Now',
                    'top': self._recommend_top(current_temp, current_weather),
                    'bottom': self._recommend_bottom(current_temp),
                    'accessories': self._recommend_accessories(current_temp, current_weather, current_wind_speed),
                    'umbrella': 'rain' in current_weather or 'drizzle' in current_weather,
                },
                'explanation': self._generate_recommendation_explanation(current_temp, current_weather, current_humidity, current_wind_speed)
            }
            
            # Add morning recommendations if available
            if morning_data and current_time.hour < 12:  # Only show morning if it's still before noon
                morning_temp = morning_data['main']['temp']
                morning_weather = morning_data['weather'][0]['main'].lower()
                morning_wind = morning_data['wind']['speed']
                
                recommendations['morning'] = {
                    'time': 'Morning',
                    'top': self._recommend_top(morning_temp, morning_weather),
                    'bottom': self._recommend_bottom(morning_temp),
                    'accessories': self._recommend_accessories(morning_temp, morning_weather, morning_wind),
                    'umbrella': 'rain' in morning_weather or 'drizzle' in morning_weather,
                }
            
            # Add evening recommendations if available
            if evening_data and current_time.hour < 18:  # Only show evening if it's before evening
                evening_temp = evening_data['main']['temp']
                evening_weather = evening_data['weather'][0]['main'].lower()
                evening_wind = evening_data['wind']['speed']
                
                recommendations['evening'] = {
                    'time': 'Evening',
                    'top': self._recommend_top(evening_temp, evening_weather),
                    'bottom': self._recommend_bottom(evening_temp),
                    'accessories': self._recommend_accessories(evening_temp, evening_weather, evening_wind),
                    'umbrella': 'rain' in evening_weather or 'drizzle' in evening_weather,
                }
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error generating clothing recommendations for {city}: {str(e)}")
            raise Exception(f"Failed to generate clothing recommendations: {str(e)}")
    
    def _enhance_forecast_with_ai(self, city, forecast_data):
        """
        Enhance standard forecast with AI predictions.
        
        Args:
            city (str): City name
            forecast_data (dict): Standard forecast data from OpenWeatherMap
            
        Returns:
            dict: Enhanced forecast data
        """
        # For a simple demonstration, we'll apply a basic correction to the temperature forecast
        # In a real implementation, this would use more sophisticated models trained on historical data
        
        # Create or retrieve model for this city
        if city not in self.models:
            # Initialize a simple model (linear regression)
            self.models[city] = LinearRegression()
            
            # In a real implementation, the model would be trained on historical data
            # Here we're just initializing it with some simple adjustments
            
        enhanced_data = forecast_data.copy()
        
        # Simple enhancement: adjust temperature predictions based on time of day
        # This is a very simplified approach - a real implementation would use more sophisticated models
        for i, item in enumerate(enhanced_data['list']):
            dt = datetime.strptime(item['dt_txt'], '%Y-%m-%d %H:%M:%S')
            hour = dt.hour
            
            # Simple temperature adjustment based on time of day
            temp_adjustment = 0
            
            # Temperature tends to be underestimated during the day and overestimated at night
            if 10 <= hour <= 16:  # Middle of the day
                temp_adjustment = 0.5  # Slightly warmer than predicted
            elif 22 <= hour or hour <= 4:  # Night
                temp_adjustment = -0.3  # Slightly cooler than predicted
                
            # Apply the adjustment
            enhanced_data['list'][i]['main']['temp'] += temp_adjustment
            enhanced_data['list'][i]['main']['feels_like'] += temp_adjustment
            
            # Add AI confidence score to each prediction (simplified for demo)
            forecast_time_delta = (dt - datetime.now()).total_seconds() / 3600  # hours from now
            confidence = max(0.95 - (forecast_time_delta * 0.005), 0.6)  # Confidence decreases with time
            enhanced_data['list'][i]['ai_confidence'] = confidence
            
            # Add a flag to indicate this is an AI-enhanced forecast
            enhanced_data['ai_enhanced'] = True
            
        return enhanced_data
    
    def _recommend_top(self, temp, weather_condition):
        """Recommend specific top clothing based on temperature and weather."""
        if 'rain' in weather_condition or 'drizzle' in weather_condition:
            if temp > 25:
                return 'Light waterproof jacket with a breathable t-shirt'
            elif temp > 18:
                return 'Waterproof raincoat with a cotton shirt'
            elif temp > 10:
                return 'Waterproof jacket with a warm sweater underneath'
            else:
                return 'Insulated waterproof coat with thermal layer'
        elif 'snow' in weather_condition:
            return 'Insulated winter coat with thermal base layer'
        elif 'cloud' in weather_condition:
            if temp > 28:
                return 'Light cotton t-shirt or tank top'
            elif temp > 22:
                return 'Short-sleeve cotton shirt or light blouse'
            elif temp > 15:
                return 'Long-sleeve shirt with light cardigan or hoodie'
            elif temp > 10:
                return 'Sweater with light jacket or fleece'
            elif temp > 5:
                return 'Thick sweater with insulated jacket'
            else:
                return 'Thermal base layer with heavy winter coat'
        elif 'clear' in weather_condition:
            if temp > 30:
                return 'Loose, light cotton t-shirt or linen shirt'
            elif temp > 25:
                return 'Breathable cotton t-shirt or sleeveless top'
            elif temp > 20:
                return 'Light short-sleeve shirt or polo'
            elif temp > 15:
                return 'Long-sleeve cotton shirt or light sweater'
            elif temp > 10:
                return 'Medium-weight sweater or pullover'
            elif temp > 5:
                return 'Thick sweater with jacket or blazer'
            else:
                return 'Thermal base layer with insulated winter coat'
        else:
            # Default case for other weather conditions
            if temp > 25:
                return 'Light cotton t-shirt or short-sleeve shirt'
            elif temp > 18:
                return 'Light long-sleeve shirt or blouse'
            elif temp > 10:
                return 'Sweater or fleece jacket'
            elif temp > 5:
                return 'Thick sweater with wind-resistant jacket'
            else:
                return 'Multiple layers with winter coat'
    
    def _recommend_bottom(self, temp):
        """Recommend specific bottom clothing based on temperature."""
        if temp > 30:
            return 'Light, breathable shorts or skirt'
        elif temp > 25:
            return 'Cotton shorts, skirt, or light chinos'
        elif temp > 20:
            return 'Lightweight pants, jeans, or capris'
        elif temp > 15:
            return 'Regular jeans, chinos, or casual pants'
        elif temp > 10:
            return 'Jeans or medium-weight pants'
        elif temp > 5:
            return 'Thick jeans or warm trousers'
        elif temp > 0:
            return 'Thermal-lined pants or jeans with thermals underneath'
        else:
            return 'Insulated winter pants with thermal base layer'
    
    def _recommend_accessories(self, temp, weather_condition, wind_speed):
        """Recommend specific accessories based on weather conditions."""
        accessories = []
        
        # Temperature-based accessories
        if temp < 12:
            accessories.append('Warm gloves or mittens')
        if temp < 8:
            accessories.append('Thermal neck gaiter or scarf')
        if temp < 5:
            accessories.append('Insulated beanie or winter hat')
        elif temp > 28:
            accessories.append('Breathable hat or cap for sun protection')
        
        # Weather condition accessories
        if 'rain' in weather_condition or 'drizzle' in weather_condition:
            accessories.append('Compact umbrella')
            if temp < 15:
                accessories.append('Waterproof boots')
            else:
                accessories.append('Water-resistant footwear')
        
        if 'snow' in weather_condition:
            accessories.append('Insulated waterproof boots')
            accessories.append('Thermal socks')
        
        if ('clear' in weather_condition or 'sun' in weather_condition) and temp > 20:
            accessories.append('UV-protective sunglasses')
            accessories.append('SPF 30+ sunscreen')
            if temp > 28:
                accessories.append('Water bottle to stay hydrated')
        
        # Wind-based accessories
        if wind_speed > 8:
            if temp < 15:
                accessories.append('Wind-resistant face protection')
            if temp < 10:
                accessories.append('Windproof gloves')
            else:
                accessories.append('Windbreaker or wind-resistant layer')
        
        return accessories
    
    def _generate_recommendation_explanation(self, temp, weather_condition, humidity, wind_speed):
        """Generate detailed explanation for clothing recommendations with real-time advice."""
        # Start with an empty explanation
        explanation = ""
        
        # Add real-time specific advice based on conditions
        if 'rain' in weather_condition or 'drizzle' in weather_condition:
            if temp > 20:
                explanation += "The warm rain means you'll want waterproof outer layers that are still breathable. "
            else:
                explanation += "Stay dry and warm with waterproof, insulated clothing. "
        
        elif 'snow' in weather_condition:
            explanation += "Protect against snow with waterproof, insulated layers. Focus on keeping extremities warm. "
        
        elif 'clear' in weather_condition:
            if temp > 28:
                explanation += "It's hot and sunny! Wear lightweight, breathable fabrics and protect against UV exposure. "
            elif temp > 20:
                explanation += "Pleasant temperatures, but still protect against UV rays if you're outside for long periods. "
            elif temp < 5:
                explanation += "Clear but very cold! Layering is essential with a windproof outer layer. "
        
        elif 'cloud' in weather_condition:
            if temp > 25:
                explanation += "Overcast but warm. Light clothing is still appropriate. "
            elif temp < 10:
                explanation += "Gray and cold - focus on insulation with a medium-weight outer layer. "
        
        # Add advice for specific conditions
        if wind_speed > 8:
            explanation += "Secure any loose items of clothing due to strong winds. "
        
        if humidity > 80 and temp > 25:
            explanation += "High humidity will make it feel hotter than it is - dress lighter than the temperature suggests. "
        
        if temp < 0:
            explanation += "Risk of frostbite for exposed skin - cover up completely when outdoors. "
        
        return explanation
