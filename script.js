const API_KEY = "5589c0c82bc98425ae025be864d7ca13";
document.getElementById('modeToggle').addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');
  const label = document.getElementById('modeLabel');
  label.textContent = document.body.classList.contains('dark-mode') ? 'Dark Mode' : 'Light Mode';
});

function getWeather() {
  const city = document.getElementById("cityInput").value;
  if (!city) return;
  fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
  )
    .then((res) => res.json())
    .then((data) => {
      const forecastDiv = document.getElementById("forecast");
      forecastDiv.innerHTML = "";
      const dailyData = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) dailyData[date] = [];
        dailyData[date].push(item);
      });

      const emojis = {
        Clear: '☀️',
        Clouds: '☁️',
        Rain: '🌧️',
        Snow: '❄️',
        Thunderstorm: '⛈️'
      };

      const days = Object.keys(dailyData).slice(0, 5);

      days.forEach(date => {
        const items = dailyData[date];
        const temps = items.map(i => i.main.temp);
        const avgTemp = (temps.reduce((a, b) => a + b) / temps.length).toFixed(1);
        const weatherMain = items[0].weather[0].main;
        const emoji = emojis[weatherMain] || '';

        const dateParts = date.split("-");
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        let suggestion = "🤖 AI Suggestion: ";
        if (avgTemp > 30) suggestion += "Wear light clothes & stay hydrated!";
        else if (avgTemp < 15) suggestion += "Wear warm clothes!";
        else suggestion += "Perfect weather! Dress comfortably.";

        forecastDiv.innerHTML += `
          <div class="forecast-day">
            <h3>${formattedDate} ${emoji}</h3>
            <p>Avg Temp: ${avgTemp}°C</p>
            <p>Condition: ${weatherMain}</p>
            <p>${suggestion}</p>
          </div>
        `;
      });
    });
}
