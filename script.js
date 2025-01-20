var notif = new Notyf();

const weatherAPIKey = "0d87f5672d1d4873a2d14308251901"; // Replace with your WeatherAPI.com key
const ecommerceAPI = "https://fakestoreapi.com/products";
const wgerAPIUrl = "https://wger.de/api/v2/";

const weatherIconMapping = {
  1000: "assets/status/animated/clear-day.svg",
  1003: "assets/status/animated/cloudy-1-day.svg",
  1006: "assets/status/animated/cloudy.svg",
  1009: "assets/status/animated/cloudy-3-day.svg",
  1030: "assets/status/animated/fog-day.svg",
  1063: "assets/status/animated/rainy-1-day.svg",
  1066: "assets/status/animated/snowy-1-day.svg",
  1069: "assets/status/animated/snow-and-sleet-mix.svg",
  default: "assets/status/animated/clear-day.svg",
};

function updateWeatherImageWithCode(conditionCode) {
  const weatherImg = document.getElementById("weather-img");
  const customIcon = weatherIconMapping[conditionCode] || weatherIconMapping.default;
  weatherImg.src = customIcon;
  weatherImg.alt = `Weather icon for condition code ${conditionCode}`;
}

async function fetchCityAndCountry(lat, lon) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await response.json();
    const city = data.city || data.locality || "Unknown City";
    const country = data.countryName || "Unknown Country";
    return { city, country };
  } catch (error) {
    console.error("Error fetching city and country:", error);
    notif.error("Error retrieving city and country.");
    return { city: "Error", country: "Error" };
  }
}

async function fetchCurrentWeather(city) {
  try {
    const endpoint = `https://api.weatherapi.com/v1/current.json?key=${weatherAPIKey}&q=${encodeURIComponent(city)}`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data && data.current) {
      const weather = data.current;
      const conditionCode = weather.condition.code;
      const temperature = weather.temp_c;

      document.getElementById("city").textContent = city;
      document.getElementById("weather-info").textContent = weather.condition.text;
      document.getElementById("weather-status").textContent = `${temperature}°C`;

      updateWeatherImageWithCode(conditionCode);
      return weather.condition.text.toLowerCase();
    } else {
      notif.error("Error retrieving weather data.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching current weather:", error);
    notif.error("Can't fetch weather status.");
    return null;
  }
}

async function fetchForecastWeather(city) {
  try {
    const endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKey}&q=${encodeURIComponent(city)}&days=5`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data && data.forecast && data.forecast.forecastday.length > 0) {
      const today = data.forecast.forecastday[0];
      document.getElementById("airpollen-info").textContent = `UV Index: ${today.day.uv}`;
    } else {
      document.getElementById("airpollen-info").textContent = "No air and pollen data available.";
    }
  } catch (error) {
    console.error("Error fetching forecast weather:", error);
  }
}

async function fetchWorkoutSuggestions(weatherText) {
  try {
    const endpoint = `${wgerAPIUrl}exercise/?limit=5`;
    const response = await fetch(endpoint);
    const data = await response.json();
    let workoutMessage = "Suggested workouts: ";

    if (weatherText.includes("sunny") || weatherText.includes("clear")) {
      workoutMessage += "Try outdoor activities like jogging or cycling.";
    } else if (weatherText.includes("rainy") || weatherText.includes("stormy")) {
      workoutMessage += "Indoor exercises such as yoga or pilates are recommended.";
    } else {
      workoutMessage += "Consider a mix of indoor and outdoor exercises.";
    }

    document.getElementById("workout-info").textContent = workoutMessage;
  } catch (error) {
    console.error("Error fetching workout suggestions:", error);
  }
}

async function fetchFitnessProducts() {
  try {
    const response = await fetch(ecommerceAPI);
    const products = await response.json();
    const productList = document.getElementById("products-list");
    productList.innerHTML = "";

    products.forEach((product) => {
      const li = document.createElement("li");
      li.textContent = `${product.title} - $${product.price}`;
      productList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching fitness products:", error);
  }
}

document.getElementById("submit-location").addEventListener("click", async () => {
  const cityInput = document.getElementById("location-input").value.trim();
  if (cityInput) {
    const weatherText = await fetchCurrentWeather(cityInput);
    if (!weatherText) return;

    fetchForecastWeather(cityInput);
    fetchWorkoutSuggestions(weatherText);
    fetchFitnessProducts();
  } else {
    notif.error("Please enter a city name.");
  }
});

async function initialize() {
  if (!navigator.geolocation) {
    notif.error("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const locationData = await fetchCityAndCountry(latitude, longitude);

      if (locationData.city && locationData.country) {
        const weatherText = await fetchCurrentWeather(locationData.city);
        if (!weatherText) return;

        fetchForecastWeather(locationData.city);
        fetchWorkoutSuggestions(weatherText);
        fetchFitnessProducts();
      }
    },
    (error) => {
      console.error("Error fetching location:", error);
      notif.error("Unable to fetch location. Use the manual input instead.");
    }
  );
}

initialize();

