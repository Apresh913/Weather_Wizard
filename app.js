// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const searchButton = document.getElementById('search-button');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    const loadingContainer = document.getElementById('loading-container');
    const weatherContainer = document.getElementById('weather-container');
    const emptyState = document.getElementById('empty-state');
    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherDescription = document.getElementById('weather-description');
    const temperature = document.getElementById('temperature');
    const feelsLike = document.getElementById('feels-like');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const windDirection = document.getElementById('wind-direction');
    const forecastCards = document.getElementById('forecast-cards');
    
    // AI Features DOM Elements
    const aiAlerts = document.getElementById('ai-alerts');
    const alertsContainer = document.getElementById('alerts-container');
    const alertsPreferences = document.getElementById('alerts-preferences');
    
    const clothingRecommendations = document.getElementById('clothing-recommendations');
    const clothingTop = document.getElementById('clothing-top');
    const clothingBottom = document.getElementById('clothing-bottom');
    const clothingAccessories = document.getElementById('clothing-accessories');
    const clothingExplanation = document.getElementById('clothing-explanation');
    
    // Forecast toggle buttons removed
    
    const celsiusBtn = document.getElementById('celsius-btn');
    const fahrenheitBtn = document.getElementById('fahrenheit-btn');
    
    // Temperature unit preference (default: celsius)
    let temperatureUnit = 'C';

    // Check if there's a saved city in localStorage and load it
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
        cityInput.value = savedCity;
        fetchWeatherData(savedCity);
    }

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Temperature unit toggle
    celsiusBtn.addEventListener('click', () => {
        if (temperatureUnit !== 'C') {
            temperatureUnit = 'C';
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            updateTemperatureDisplay();
        }
    });
    
    fahrenheitBtn.addEventListener('click', () => {
        if (temperatureUnit !== 'F') {
            temperatureUnit = 'F';
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            updateTemperatureDisplay();
        }
    });
    
    // AI Alerts with fixed preferences (customize button removed)
    // No event listeners needed as the customize feature has been removed
    
    // Forecast toggle buttons removed
    
    // Initialize range input display values
    document.querySelectorAll('.preference-item input[type="range"]').forEach(input => {
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            let label = '';
            
            if (value <= 0.3) label = 'Low';
            else if (value <= 0.7) label = 'Medium';
            else label = 'High';
            
            input.nextElementSibling.textContent = label;
        });
    });
    
    // Initialize autocomplete
    initAutocomplete();

    // Handle search button click or Enter key press
    function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
            // Save to localStorage for future visits
            localStorage.setItem('lastSearchedCity', city);
        } else {
            showError('Please enter a city name');
        }
    }

    // Fetch weather data from the API
    async function fetchWeatherData(city) {
        try {
            // Show loading, hide other containers
            showLoading();

            // Fetch all weather data (current and forecast)
            const response = await fetch(`/api/weather/all?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (response.ok) {
                // Hide loading, show weather container
                hideLoading();
                showWeatherContainer();

                // Update UI with weather data
                updateCurrentWeather(data.current);
                updateForecast(data.forecast);
                
                // Fetch AI features
                fetchClothingRecommendations(city);
                fetchPersonalizedAlerts(city);
            } else {
                throw new Error(data.error || 'Failed to fetch weather data');
            }
        } catch (error) {
            hideLoading();
            showError(error.message || 'An unexpected error occurred');
            console.error('Error fetching weather data:', error);
        }
    }
    
    // Fetch AI-enhanced forecast data
    async function fetchEnhancedForecast(city) {
        try {
            showLoading();
            
            const response = await fetch(`/api/weather/enhanced-forecast?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (response.ok) {
                hideLoading();
                updateEnhancedForecast(data);
            } else {
                throw new Error(data.error || 'Failed to fetch enhanced forecast');
            }
        } catch (error) {
            hideLoading();
            showError(error.message || 'Unable to load AI-enhanced forecast');
            console.error('Error fetching enhanced forecast:', error);
            
            // Toggle buttons removed - using standard forecast
        }
    }
    
    // Fetch standard forecast (reuse the existing forecast data)
    async function fetchStandardForecast(city) {
        try {
            const response = await fetch(`/api/weather/forecast?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (response.ok) {
                updateForecast(data);
            } else {
                throw new Error(data.error || 'Failed to fetch forecast');
            }
        } catch (error) {
            showError(error.message || 'Unable to load standard forecast');
            console.error('Error fetching standard forecast:', error);
        }
    }
    
    // Fetch personalized weather alerts
    async function fetchPersonalizedAlerts(city) {
        try {
            // Get user preferences (now using fixed values from hidden inputs)
            const preferences = getAlertPreferences();
            
            const response = await fetch('/api/weather/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city: city,
                    preferences: preferences
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Filter alerts to only show today's alerts
                const todaysAlerts = filterTodayAlerts(data.alerts);
                updateAlerts(todaysAlerts);
                aiAlerts.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Failed to fetch personalized alerts');
            }
        } catch (error) {
            console.error('Error fetching personalized alerts:', error);
            // Don't show error to user, just hide the alerts section
            aiAlerts.classList.add('hidden');
        }
    }
    
    // Filter alerts to only show one latest high temperature alert for today
    function filterTodayAlerts(alerts) {
        if (!alerts || alerts.length === 0) return [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
        
        // Filter to get only today's alerts
        const todaysAlerts = alerts.filter(alert => {
            try {
                // For 'now' alerts, check if they're high temp alerts
                if (alert.time === 'now') {
                    return alert.type === 'high_temp';
                }
                
                const alertDate = new Date(alert.time);
                return alertDate >= today && alertDate < tomorrow;
            } catch (e) {
                // If date parsing fails, only include high temp alerts
                return alert.type === 'high_temp';
            }
        });
        
        // Filter to get only high temperature alerts
        const highTempAlerts = todaysAlerts.filter(alert => alert.type === 'high_temp');
        
        // Sort by time (most recent first for those with timestamp, 'now' alerts first)
        highTempAlerts.sort((a, b) => {
            if (a.time === 'now') return -1;
            if (b.time === 'now') return 1;
            
            try {
                return new Date(b.time) - new Date(a.time);
            } catch (e) {
                return 0;
            }
        });
        
        // Return just the most recent high temperature alert, or empty array if none
        return highTempAlerts.length > 0 ? [highTempAlerts[0]] : [];
    }
    
    // Fetch clothing recommendations
    async function fetchClothingRecommendations(city) {
        try {
            const response = await fetch(`/api/recommendations/clothing?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (response.ok) {
                updateClothingRecommendations(data);
                clothingRecommendations.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Failed to fetch clothing recommendations');
            }
        } catch (error) {
            console.error('Error fetching clothing recommendations:', error);
            // Don't show error to user, just hide the recommendations section
            clothingRecommendations.classList.add('hidden');
        }
    }

    // Update current weather section
    function updateCurrentWeather(weatherData) {
        // Set city name and date
        cityName.textContent = `${weatherData.city}, ${weatherData.country}`;
        
        // Get date parts
        const dateString = formatDate(new Date(), 'full');
        
        // Create date display with blue underlines for Friday and time
        const parts = dateString.split(',');
        if (parts.length >= 3) {
            const weekday = parts[0]; // Friday
            const dateAndYearPart = parts[1] + ',' + parts[2].split(' at ')[0]; // March 28, 2025
            const timePart = parts[2].split(' at ')[1]; // 4:35 PM
            
            currentDate.innerHTML = `<span class="blue-underline">${weekday}</span>, ${dateAndYearPart} at <span class="blue-underline">${timePart}</span>`;
        } else {
            // Fallback if split doesn't work as expected
            currentDate.textContent = dateString;
        }

        // Set weather icon and description
        const iconCode = weatherData.weather_icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = weatherData.weather_main;
        weatherDescription.textContent = weatherData.weather_description;

        // Set temperature and feels like
        temperature.textContent = `${Math.round(weatherData.temperature)}°C`;
        feelsLike.textContent = `Feels like: ${Math.round(weatherData.feels_like)}°C`;

        // Set details
        humidity.textContent = `${weatherData.humidity}%`;
        windSpeed.textContent = `${weatherData.wind_speed} m/s`;
        windDirection.textContent = `${getWindDirection(weatherData.wind_direction)}`;
    }

    // Update forecast section
    function updateForecast(forecastData) {
        // Clear previous forecast cards
        forecastCards.innerHTML = '';

        // Get all days from the forecast
        const days = forecastData.days;
        
        // Create a card for each day (up to 5 days)
        const dayKeys = Object.keys(days).slice(0, 5);
        
        dayKeys.forEach(dayKey => {
            const dayData = days[dayKey];
            
            // Create forecast day card
            const dayCard = document.createElement('div');
            dayCard.classList.add('forecast-day');
            
            // Format the date header
            const dayDate = new Date(dayKey);
            const dayName = formatDate(dayDate, 'day');
            const formattedDate = formatDate(dayDate, 'short');
            
            // Create day header
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('forecast-day-header');
            dayHeader.innerHTML = `
                <h3>${dayName}</h3>
                <p>${formattedDate}</p>
            `;
            
            // Create container for forecast items
            const forecastItems = document.createElement('div');
            forecastItems.classList.add('forecast-items');
            
            // Add forecast items for this day
            dayData.forEach(item => {
                const forecastItem = document.createElement('div');
                forecastItem.classList.add('forecast-item');
                
                // Format time to 12-hour format with AM/PM
                const timeStr = item.time.substring(0, 5);
                const [hours24, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
                
                // Convert to 12-hour format
                const period = hours24 >= 12 ? 'PM' : 'AM';
                const hours12 = hours24 % 12 || 12; // Convert 0 to 12
                const formattedTime = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                
                forecastItem.innerHTML = `
                    <div class="forecast-item-time">${formattedTime}</div>
                    <img class="forecast-item-icon" src="https://openweathermap.org/img/wn/${item.weather_icon}.png" alt="${item.weather_main}">
                    <div class="forecast-item-temp">${Math.round(item.temperature)}°C</div>
                    <div class="forecast-item-desc">${item.weather_description}</div>
                `;
                
                forecastItems.appendChild(forecastItem);
            });
            
            // Assemble the day card
            dayCard.appendChild(dayHeader);
            dayCard.appendChild(forecastItems);
            
            // Add to forecast cards container
            forecastCards.appendChild(dayCard);
        });
    }

    // Helper functions for showing/hiding containers
    function showLoading() {
        loadingContainer.classList.remove('hidden');
        weatherContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    }

    function hideLoading() {
        loadingContainer.classList.add('hidden');
    }

    function showWeatherContainer() {
        weatherContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }

    function showError(message) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000); // Hide after 5 seconds
    }
    
    // Update temperature display when unit is changed
    function updateTemperatureDisplay() {
        const city = cityInput.value.trim();
        if (!city) return;
        
        // Get current temp values (remove the units)
        const tempText = temperature.textContent;
        const feelsLikeText = feelsLike.textContent;
        
        const tempValue = parseFloat(tempText);
        const feelsLikeValue = parseFloat(feelsLikeText.replace('Feels like: ', ''));
        
        if (isNaN(tempValue) || isNaN(feelsLikeValue)) return;
        
        // Convert and update based on selected unit
        if (temperatureUnit === 'C') {
            temperature.textContent = `${Math.round(fahrenheitToCelsius(tempValue))}°C`;
            feelsLike.textContent = `Feels like: ${Math.round(fahrenheitToCelsius(feelsLikeValue))}°C`;
        } else {
            temperature.textContent = `${Math.round(celsiusToFahrenheit(tempValue))}°F`;
            feelsLike.textContent = `Feels like: ${Math.round(celsiusToFahrenheit(feelsLikeValue))}°F`;
        }
        
        // Update forecast temperatures too
        updateForecastTemperatures();
    }
    
    // Update forecast temperatures when unit is changed
    function updateForecastTemperatures() {
        const tempElements = document.querySelectorAll('.forecast-item-temp');
        
        tempElements.forEach(element => {
            const tempText = element.textContent;
            const tempValue = parseFloat(tempText);
            
            if (isNaN(tempValue)) return;
            
            if (temperatureUnit === 'C') {
                element.textContent = `${Math.round(fahrenheitToCelsius(tempValue))}°C`;
            } else {
                element.textContent = `${Math.round(celsiusToFahrenheit(tempValue))}°F`;
            }
        });
    }
    
    // Update the AI-enhanced forecast display
    function updateEnhancedForecast(forecastData) {
        // Similar to updateForecast but with confidence scores
        forecastCards.innerHTML = '';
        
        const days = {};
        
        // Group forecast items by day
        forecastData.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push({
                time: item.dt_txt.split(' ')[1],
                temperature: item.main.temp,
                feels_like: item.main.feels_like,
                weather_icon: item.weather[0].icon,
                weather_main: item.weather[0].main,
                weather_description: item.weather[0].description,
                ai_confidence: item.ai_confidence || 0.9 // Default if not provided
            });
        });
        
        const dayKeys = Object.keys(days).slice(0, 5);
        
        dayKeys.forEach(dayKey => {
            const dayData = days[dayKey];
            
            const dayCard = document.createElement('div');
            dayCard.classList.add('forecast-day');
            
            const dayDate = new Date(dayKey);
            const dayName = formatDate(dayDate, 'day');
            const formattedDate = formatDate(dayDate, 'short');
            
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('forecast-day-header');
            dayHeader.innerHTML = `
                <h3>${dayName}</h3>
                <p>${formattedDate}</p>
                <span class="ai-badge"><i class="fas fa-robot"></i> AI Enhanced</span>
            `;
            
            const forecastItems = document.createElement('div');
            forecastItems.classList.add('forecast-items');
            
            dayData.forEach(item => {
                const forecastItem = document.createElement('div');
                forecastItem.classList.add('forecast-item');
                
                // Format time to 12-hour format with AM/PM
                const timeStr = item.time.substring(0, 5);
                const [hours24, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
                
                // Convert to 12-hour format
                const period = hours24 >= 12 ? 'PM' : 'AM';
                const hours12 = hours24 % 12 || 12; // Convert 0 to 12
                const formattedTime = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                
                const confidence = Math.round(item.ai_confidence * 100);
                
                forecastItem.innerHTML = `
                    <div class="forecast-item-time">${formattedTime}</div>
                    <img class="forecast-item-icon" src="https://openweathermap.org/img/wn/${item.weather_icon}.png" alt="${item.weather_main}">
                    <div class="forecast-item-temp">${Math.round(item.temperature)}°C</div>
                    <div class="forecast-item-desc">${item.weather_description}</div>
                    <div class="ai-confidence">AI Confidence: ${confidence}%</div>
                `;
                
                forecastItems.appendChild(forecastItem);
            });
            
            dayCard.appendChild(dayHeader);
            dayCard.appendChild(forecastItems);
            
            forecastCards.appendChild(dayCard);
        });
    }
    
    // Update the alerts section with personalized alerts
    function updateAlerts(alerts) {
        alertsContainer.innerHTML = '';
        
        if (!alerts || alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="empty-alerts">No weather alerts at this time</div>';
            return;
        }
        
        // Sort alerts by severity (most severe first)
        alerts.sort((a, b) => b.severity - a.severity);
        
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.classList.add('alert-item', alert.type);
            
            // Determine icon based on alert type
            let icon = 'exclamation-circle';
            let isSevere = false;
            
            // Handle standard alerts
            if (alert.type === 'rain') icon = 'cloud-rain';
            else if (alert.type === 'high_temp') icon = 'temperature-high';
            else if (alert.type === 'low_temp') icon = 'temperature-low';
            else if (alert.type === 'wind') icon = 'wind';
            
            // Handle severe weather alerts
            else if (alert.type === 'severe_storm') {
                icon = 'bolt';
                isSevere = true;
            }
            else if (alert.type === 'heavy_rain') {
                icon = 'cloud-showers-heavy';
                isSevere = true;
            }
            else if (alert.type === 'heatwave') {
                icon = 'fire';
                isSevere = true;
            }
            else if (alert.type === 'winter_storm') {
                icon = 'snowflake';
                isSevere = true;
            }
            else if (alert.type === 'hurricane') {
                icon = 'hurricane';
                isSevere = true;
            }
            else if (alert.type === 'tornado') {
                icon = 'wind';
                isSevere = true;
            }
            else if (alert.type === 'extreme_cold') {
                icon = 'icicles';
                isSevere = true;
            }
            else if (alert.type === 'severe_alert') {
                icon = 'exclamation-triangle';
                isSevere = true;
            }
            
            // Determine title based on alert type
            let title = 'Weather Alert';
            if (alert.type === 'rain') title = 'Rain Alert';
            else if (alert.type === 'high_temp') title = 'High Temperature Alert';
            else if (alert.type === 'low_temp') title = 'Low Temperature Alert';
            else if (alert.type === 'wind') title = 'Wind Alert';
            else if (alert.type === 'severe_storm') title = 'Severe Thunderstorm Warning';
            else if (alert.type === 'heavy_rain') title = 'Heavy Rainfall Warning';
            else if (alert.type === 'heatwave') title = 'Extreme Heat Warning';
            else if (alert.type === 'winter_storm') title = 'Winter Storm Warning';
            else if (alert.type === 'hurricane') title = 'Hurricane Warning';
            else if (alert.type === 'tornado') title = 'Tornado Warning';
            else if (alert.type === 'extreme_cold') title = 'Extreme Cold Warning';
            else if (alert.type === 'severe_alert') title = 'Severe Weather Alert';
            
            // Format the time display
            let timeDisplay = alert.time;
            if (alert.time === 'now') {
                timeDisplay = 'Current conditions';
            } else {
                try {
                    timeDisplay = formatDate(new Date(alert.time), 'full');
                } catch (e) {
                    timeDisplay = alert.time; // Fallback if date is invalid
                }
            }
            
            // Create the alert HTML with severity indicator for severe alerts
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">
                        ${isSevere ? '<span class="alert-severity-indicator"></span>' : ''}
                        ${title}
                    </div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">
                        <i class="fas fa-clock"></i>
                        ${timeDisplay}
                    </div>
                </div>
            `;
            
            alertsContainer.appendChild(alertItem);
        });
    }
    
    // Update clothing recommendations section to show most relevant timeframe
    function updateClothingRecommendations(data) {
        // Clear the recommendations content first
        const recommendationsContainer = document.getElementById('recommendations-content');
        recommendationsContainer.innerHTML = '';
        
        // Determine most relevant time period based on current time
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        
        // Logic to determine which time period to show:
        // Morning: 5 AM to 11:59 AM
        // Evening: 5 PM to 9:59 PM
        // Current: All other times or as fallback
        
        let relevantTimeSlot = 'current'; // Default fallback
        
        if (currentHour >= 5 && currentHour < 12) {
            relevantTimeSlot = 'morning';
        } else if (currentHour >= 17 && currentHour < 22) {
            relevantTimeSlot = 'evening';
        }
        
        // If the preferred slot doesn't exist, try alternatives in order of relevance
        const timeSlots = [relevantTimeSlot, 'current', 'morning', 'evening'];
        
        // Find the first available time slot
        let selectedSlot = null;
        for (const slot of timeSlots) {
            if (data[slot]) {
                selectedSlot = slot;
                break;
            }
        }
        
        // If no slot is available, show a message
        if (!selectedSlot) {
            recommendationsContainer.innerHTML = '<p>No clothing recommendations available at this time.</p>';
            return;
        }
        
        const slotData = data[selectedSlot];
        
        // Choose appropriate icon for the time period
        let timeIcon = 'fa-clock';
        if (selectedSlot === 'current') timeIcon = 'fa-sun';
        if (selectedSlot === 'morning') timeIcon = 'fa-coffee';
        if (selectedSlot === 'evening') timeIcon = 'fa-moon';
        
        // Create card for this time period
        const cardHTML = `
            <div class="clothing-item">
                <div class="item-icon">
                    <i class="fas ${timeIcon}"></i>
                </div>
                <div class="item-details">
                    <h3>${slotData.time}</h3>
                    <p class="clothing-recommendation">
                        <strong>Top:</strong> ${slotData.top}<br>
                        <strong>Bottom:</strong> ${slotData.bottom}
                    </p>
                    ${slotData.accessories && slotData.accessories.length > 0 ? 
                        `<ul class="accessories-list">
                            ${slotData.accessories.map(item => `<li>${item}</li>`).join('')}
                        </ul>` : 
                        '<p class="clothing-recommendation">No accessories needed</p>'
                    }
                    ${slotData.umbrella ? 
                        '<p class="clothing-recommendation"><strong>Don\'t forget your umbrella!</strong></p>' : 
                        ''
                    }
                </div>
            </div>
        `;
        
        recommendationsContainer.innerHTML = cardHTML;
    }
    
    // Get alert preferences from inputs or localStorage
    function getAlertPreferences() {
        // Get values from hidden form elements
        const rainSensitivity = parseFloat(document.getElementById('rain-sensitivity').value) || 0.5;
        const tempSensitivity = parseFloat(document.getElementById('temp-sensitivity').value) || 0.5;
        const windSensitivity = parseFloat(document.getElementById('wind-sensitivity').value) || 0.5;
        const alertThreshold = parseFloat(document.getElementById('alert-threshold').value) || 0.7;
        
        // Return fixed preferences (customize functionality removed)
        return {
            rain_sensitivity: rainSensitivity,
            temp_sensitivity: tempSensitivity,
            wind_sensitivity: windSensitivity,
            alert_threshold: alertThreshold
        };
    }
    
    // Save alert preferences
    function saveAlertPreferences() {
        const preferences = {
            rain_sensitivity: parseFloat(document.getElementById('rain-sensitivity').value),
            temp_sensitivity: parseFloat(document.getElementById('temp-sensitivity').value),
            wind_sensitivity: parseFloat(document.getElementById('wind-sensitivity').value),
            alert_threshold: parseFloat(document.getElementById('alert-threshold').value)
        };
        
        localStorage.setItem('alertPreferences', JSON.stringify(preferences));
        return preferences;
    }
    
    // Autocomplete functionality
    function initAutocomplete() {
        const autocompleteList = document.getElementById('autocomplete-list');
        let currentFocus = -1;
        
        // Add input event listener to show suggestions as user types
        cityInput.addEventListener("input", function() {
            // Close any already open lists
            closeAllLists();
            
            if (!this.value) { return false; }
            currentFocus = -1;
            
            // Filter the cities based on input
            const matches = popularCities.filter(city => 
                city.toLowerCase().startsWith(this.value.toLowerCase())
            );
            
            // Limit matches to top 5 for better UI
            const limitedMatches = matches.slice(0, 7);
            
            // Create suggestions only if we have matches
            if (limitedMatches.length > 0) {
                limitedMatches.forEach(city => {
                    // Create a suggestion item
                    const suggestionItem = document.createElement("div");
                    suggestionItem.innerHTML = city;
                    suggestionItem.addEventListener("click", function() {
                        cityInput.value = this.innerText;
                        closeAllLists();
                        // Trigger search on selection
                        handleSearch();
                    });
                    autocompleteList.appendChild(suggestionItem);
                });
            }
        });
        
        // Add keyboard navigation for autocomplete
        cityInput.addEventListener("keydown", function(e) {
            let items = autocompleteList.getElementsByTagName("div");
            
            if (items.length === 0) return;
            
            // Down arrow
            if (e.keyCode === 40) {
                currentFocus++;
                addActive(items);
                e.preventDefault(); // Prevent cursor from moving
            } 
            // Up arrow
            else if (e.keyCode === 38) {
                currentFocus--;
                addActive(items);
                e.preventDefault(); // Prevent cursor from moving
            } 
            // Enter key
            else if (e.keyCode === 13 && currentFocus > -1) {
                if (items) items[currentFocus].click();
            }
        });
        
        // Add active class to current focus item
        function addActive(items) {
            if (!items) return false;
            
            // Remove active from all items
            removeActive(items);
            
            // Handle bounds
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (items.length - 1);
            
            // Add active class
            items[currentFocus].classList.add("autocomplete-active");
        }
        
        // Remove active class from all items
        function removeActive(items) {
            for (let i = 0; i < items.length; i++) {
                items[i].classList.remove("autocomplete-active");
            }
        }
        
        // Close all autocomplete lists except the one passed as argument
        function closeAllLists(element) {
            autocompleteList.innerHTML = '';
        }
        
        // Close suggestions when clicking outside
        document.addEventListener("click", function(e) {
            closeAllLists(e.target);
        });
    }
});
