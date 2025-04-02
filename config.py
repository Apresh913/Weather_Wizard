import os

class Config:
    """Configuration settings for the application."""
    
    # OpenWeatherMap API key
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
    
    # Cache configuration
    CACHE_EXPIRY = 600  # 10 minutes in seconds
    
    # App configuration
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    HOST = "0.0.0.0"
    PORT = 5000
