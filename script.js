var notif = new Notyf();

const weatherAPIKey = "0d87f5672d1d4873a2d14308251901"; // Replace with your WeatherAPI.com key
const ecommerceAPI = "https://fakeproductsapi.glitch.me/categories"; // Replace with actual product API URL
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
    const endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKey}&q=${encodeURIComponent(city)}&days=1`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data && data.current && data.forecast && data.forecast.forecastday.length > 0) {
      const weather = data.current;
      const today = data.forecast.forecastday[0];
      const conditionCode = weather.condition.code;
      const currentTemp = weather.temp_c;
      const conditionText = weather.condition.text;
      const tempMax = today.day.maxtemp_c;
      const tempMin = today.day.mintemp_c;
      const date = new Date(today.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

      document.getElementById("city").textContent = city;
      document.getElementById("weather-info").innerHTML = `
        ${date}<br>${conditionText}<br>High: ${tempMax}°C | Low: ${tempMin}°C
      `;
      document.getElementById("weather-status").textContent = `${currentTemp}°C`;

      updateWeatherImageWithCode(conditionCode);
      return conditionCode; // Return the condition code for fitness recommendations
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

async function fetchForecastWeather(city){
  try {
    const endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKey}&q=${encodeURIComponent(city)}&days=5`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data && data.forecast && data.forecast.forecastday.length > 0) {
      const forecastContainer = document.getElementById("forecast-container");
      forecastContainer.innerHTML = ""; // Clear previous forecast data

      data.forecast.forecastday.forEach((day) => {
        const date = new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
        const condition = day.day.condition.text;
        const tempMax = day.day.maxtemp_c;
        const tempMin = day.day.mintemp_c;
        const iconUrl = day.day.condition.icon;

        const forecastItem = `
          <div class="forecast-item ">
            <h4>${date}</h4>
            <img src="${iconUrl}" alt="${condition}" />
            <p>${condition}</p>
            <p>High: ${tempMax}°C | Low: ${tempMin}°C</p>
          </div>
        `;
        forecastContainer.innerHTML += forecastItem;
      });
    } else {
      document.getElementById("forecast-container").innerHTML = "No forecast data available.";
    }
  } catch (error) {
    console.error("Error fetching forecast weather:", error);
    document.getElementById("forecast-container").innerHTML = "Error loading forecast data.";
  }
}

async function fetchFitnessProducts(conditionCode) {
  try {
    const response = await fetch(ecommerceAPI);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const productList = document.getElementById("products-list");
    productList.innerHTML = ""; // Clear the product list

    // Dynamic mapping of categories
    const categoryMapping = {
      1000: "Workout Equipment", // Clear weather
      1063: "Fitness Accessories", // Light rain
      1066: "Fitness Accessories", // Snow
      1003: "Supplements", // Cloudy
      1006: "Supplements", // Overcast
    };

    const categoryName = categoryMapping[conditionCode] || "General Fitness"; // Default to a general category
    const selectedCategory = data.find((category) => category.name === categoryName);

    const recommendations = selectedCategory ? selectedCategory.products : [];

    if (recommendations.length === 0) {
      productList.innerHTML = "<li>No recommended products available for the current weather.</li>";
      return;
    }

    // Render the recommended products
    recommendations.forEach((product) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="product-item">
          <img src="${product.imageUrl}" alt="${product.name}" />
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <p><strong>$${product.price}</strong> | Stock: ${product.stock}</p>
        </div>
      `;
      productList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching fitness products:", error);
    notif.error("Unable to load fitness products.");
  }
}

document.getElementById("submit-location").addEventListener("click", async () => {
  const cityInput = document.getElementById("location-input").value.trim();
  if (cityInput) {
    const conditionCode = await fetchCurrentWeather(cityInput);
    if (!conditionCode) return;

    fetchForecastWeather(cityInput); // Fetch the 5-day weather forecast
    fetchFitnessProducts(conditionCode); // Fetch fitness products based on weather condition code
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
        const conditionCode = await fetchCurrentWeather(locationData.city);
        if (!conditionCode) return;

        fetchForecastWeather(locationData.city); // Fetch the 5-day weather forecast
        fetchFitnessProducts(conditionCode); // Fetch fitness products based on weather condition code
      }
    },
    (error) => {
      console.error("Error fetching location:", error);
      notif.error("Unable to fetch location. Use the manual input instead.");
    }
  );
}

initialize();
