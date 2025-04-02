/**
 * Format a date into different display formats
 * @param {Date} date - The date to format
 * @param {string} format - The format to use ('full', 'short', 'day')
 * @returns {string} The formatted date string
 */
function formatDate(date, format) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const shortOptions = {
        month: 'short',
        day: 'numeric'
    };

    switch (format) {
        case 'full':
            // Get weekday
            const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
            
            // Get month, day, year
            const month = date.toLocaleDateString(undefined, { month: 'long' });
            const day = date.getDate();
            const year = date.getFullYear();
            
            // Format time with AM/PM
            let hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            // Format as a simple string
            return `${weekday}, ${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
            
        case 'short':
            return date.toLocaleDateString(undefined, shortOptions);
        case 'day':
            return date.toLocaleDateString(undefined, { weekday: 'long' });
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Convert wind direction in degrees to cardinal direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Cardinal direction
 */
function getWindDirection(degrees) {
    const directions = [
        'N', 'NNE', 'NE', 'ENE', 
        'E', 'ESE', 'SE', 'SSE', 
        'S', 'SSW', 'SW', 'WSW', 
        'W', 'WNW', 'NW', 'NNW'
    ];
    
    // Convert degrees to index in the directions array
    const index = Math.round(degrees / 22.5) % 16;
    
    return `${degrees}° (${directions[index]})`;
}

/**
 * Convert temperature from Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

/**
 * Convert temperature from Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

/**
 * Format temperature for display with appropriate units
 * @param {number} temp - Temperature value
 * @param {string} unit - Temperature unit ('C' or 'F')
 * @returns {string} Formatted temperature with unit
 */
function formatTemperature(temp, unit = 'C') {
    const roundedTemp = Math.round(temp);
    return `${roundedTemp}°${unit}`;
}
