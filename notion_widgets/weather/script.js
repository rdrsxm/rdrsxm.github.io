window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Reverse geocoding to get city name
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    const city = data.address.city || data.address.town || data.address.village;
                    document.getElementById('location').textContent = city;
                })
                .catch(error => {
                    console.error('Error fetching location name:', error);
                    document.getElementById('location').textContent = 'Location not found';
                });

            // Fetching weather data from Open-Meteo
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                .then(response => response.json())
                .then(data => {
                    const { temperature, weathercode } = data.current_weather;
                    document.getElementById('temperature').textContent = `${Math.round(temperature)}°C`;
                    
                    const { icon, description } = getWeatherInfo(weathercode);
                    document.getElementById('weather-icon').textContent = icon;
                    document.getElementById('weather-description').textContent = description;
                })
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    document.getElementById('weather-description').textContent = 'Weather data unavailable';
                });
        });
    }
});

function getWeatherInfo(code) {
    let info = {
        icon: '❓',
        description: 'Unknown'
    };

    if (code === 0) info = { icon: '☀️', description: 'Clear sky' };
    else if (code === 1 || code === 2 || code === 3) info = { icon: '⛅', description: 'Mainly clear' };
    else if (code === 45 || code === 48) info = { icon: '🌫️', description: 'Fog' };
    else if (code === 51 || code === 53 || code === 55) info = { icon: '🌧️', description: 'Drizzle' };
    else if (code === 61 || code === 63 || code === 65) info = { icon: '💧', description: 'Rain' };
    else if (code === 66 || code === 67) info = { icon: '❄️', description: 'Freezing rain' };
    else if (code === 71 || code === 73 || code === 75) info = { icon: '🌨️', description: 'Snow fall' };
    else if (code === 77) info = { icon: '❄️', description: 'Snow grains' };
    else if (code === 80 || code === 81 || code === 82) info = { icon: '🌦️', description: 'Rain showers' };
    else if (code === 85 || code === 86) info = { icon: '🌨️', description: 'Snow showers' };
    else if (code === 95) info = { icon: '⛈️', description: 'Thunderstorm' };
    else if (code === 96 || code === 99) info = { icon: '🌩️', description: 'Thunderstorm with hail' };

    return info;
}