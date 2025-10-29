window.addEventListener('load', () => {
    // --- CHANGE YOUR LOCATION HERE ---
        const CITY_NAME = "bergamo";
    const LATITUDE = 45.41;
    const LONGITUDE = 9.40;
    // ---------------------------------

    // Set the location name in the widget
    document.getElementById('location').textContent = CITY_NAME;

    // Construct the API URL with the fixed coordinates
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true`;

    // Fetching weather data from Open-Meteo
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const { temperature, weathercode } = data.current_weather;
            document.getElementById('temperature').textContent = `${Math.round(temperature)}°C`;
            
            const { icon, description } = getWeatherInfo(weathercode);
            // Use innerHTML to render the Font Awesome icon tag
            document.getElementById('weather-icon').innerHTML = icon;
            document.getElementById('weather-description').textContent = description;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById('weather-description').textContent = 'Weather data unavailable';
        });
});



 function getWeatherInfo(code) {
    const options = {
        0: [
            { icon: '<i class="fas fa-sun"></i>', description: 'sky clear af' },
            { icon: '<i class="fas fa-sun"></i>', description: 'sun showing off' }
        ],
        1: [
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'mostly clear bro' },
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'sun peeking out' },
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'clear-ish' }
        ],
        2: [
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'mainly clear' },
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'not that bad' }
        ],
        3: [
            { icon: '<i class="fas fa-cloud-sun"></i>', description: 'clear-ish' }
        ],
        45: [
            { icon: '<i class="fas fa-smog"></i>', description: 'foggy af' },
            { icon: '<i class="fas fa-smog"></i>', description: 'what is goin on' }
        ],
        48: [
            { icon: '<i class="fas fa-smog"></i>', description: 'foggy day' }
        ],
        51: [
            { icon: '<i class="fas fa-cloud-rain"></i>', description: 'barely even raining' },
            { icon: '<i class="fas fa-cloud-rain"></i>', description: 'slightly raining' }
        ],
        53: [
            { icon: '<i class="fas fa-cloud-rain"></i>', description: 'raining a little' }
        ],
        55: [
            { icon: '<i class="fas fa-cloud-rain"></i>', description: 'barely even raining' }
        ],
        61: [
            { icon: '<i class="fas fa-cloud-showers-heavy"></i>', description: 'yup its raining' }
        ],
        63: [
            { icon: '<i class="fas fa-cloud-showers-heavy"></i>', description: 'raining' }
        ],
        65: [
            { icon: '<i class="fas fa-cloud-showers-heavy"></i>', description: 'probably raining? idk' }
        ],
        66: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'probably snowing? idk' }
        ],
        67: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'maybe its snowing' }
        ],
        71: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'snowy outside' }
        ],
        73: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'check ur window' }
        ],
        75: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'snowing' }
        ],
        77: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'snowing maybe' }
        ],
        80: [
            { icon: '<i class="fas fa-cloud-sun-rain"></i>', description: 'could be raining heavily' }
        ],
        81: [
            { icon: '<i class="fas fa-cloud-sun-rain"></i>', description: 'make up ur mind' }
        ],
        82: [
            { icon: '<i class="fas fa-cloud-sun-rain"></i>', description: 'multiple showers' }
        ],
        85: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'snow showers? what even is that' }
        ],
        86: [
            { icon: '<i class="fas fa-snowflake"></i>', description: 'check ur window' }
        ],
        95: [
            { icon: '<i class="fas fa-bolt"></i>', description: 'its raining bad' }
        ],
        96: [
            { icon: '<i class="fas fa-cloud-bolt"></i>', description: 'brooooo' }
        ],
        99: [
            { icon: '<i class="fas fa-cloud-bolt"></i>', description: 'ur fucked' }
        ]
    };

    const choices = options[code] || [{ icon: '❓', description: 'Weather unknown: consult a psychic' }];
    return choices[Math.floor(Math.random() * choices.length)];
}

