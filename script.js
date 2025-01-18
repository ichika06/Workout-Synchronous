var notif = new Notyf();



const weatherAPIKey = "gD3tMfmdWV1Gn9bGGlGEhF7reBEEkgSD"; // Replace with your AccuWeather API key
  const ecommerceAPI = "https://fakestoreapi.com/products";
  const wgerAPIUrl = "https://wger.de/api/v2/";
  let locationKey = "";

  // Fetch Location Key
  async function fetchLocationKey(city) {
    try {
      const endpoint = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${weatherAPIKey}&q=${city}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data && data.length > 0) {
        locationKey = data[0].Key;
        return true;
      } else {
        notif.warning("City not found. Please enter a valid city.");
        return false;
      }
    } catch (error) {
      console.error("Error fetching location key:", error);
      notif.error("Error fetching location data. Please try again.");
      return false;
    }
  }

// Fetch Current Weather
    async function fetchCurrentWeather() {
      try {
        const endpoint = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${weatherAPIKey}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data && data[0]) {
          const weather = data[0];
          const city = document.getElementById("location-input").value.trim();
          document.getElementById("weather-info").textContent =
            `The current weather in ${city} is ${weather.WeatherText} with a temperature of ${weather.Temperature.Metric.Value}°C.`;

          updateWeatherImage(weather.WeatherIcon);
          return weather.WeatherText.toLowerCase();
        } else {
          document.getElementById("weather-info").textContent = "Error retrieving weather data.";
          return null;
        }
      } catch (error) {
        console.error("Error fetching current weather:", error);
        notif.error("Can't fetch weather status.");
        return null;
      }
    }

    // Fetch Forecast Weather (including Air and Pollen data)
    async function fetchForecastWeather() {
      try {
        const endpoint = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${weatherAPIKey}&details=true`;
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data && data.DailyForecasts && data.DailyForecasts.length > 0) {
          const today = data.DailyForecasts[0]; // Today's forecast
          const airAndPollen = today.AirAndPollen || [];

          let airAndPollenInfo = "Air and Pollen levels:\n";
          airAndPollen.forEach((item) => {
            airAndPollenInfo += `${item.Name}: ${item.Value} (${item.Category})\n`;
          });

          document.getElementById("airpollen-info").textContent = airAndPollenInfo;
        } else {
          document.getElementById("airpollen-info").textContent = "No air and pollen data available.";
        }
      } catch (error) {
        console.error("Error fetching forecast weather:", error);
        document.getElementById("airpollen-info").textContent = "Error fetching air and pollen data.";
      }
    }

    // Update Weather Image Based on API Icon
    function updateWeatherImage(iconNumber) {
      const weatherImg = document.getElementById("weather-img");
      const iconCode = String(iconNumber).padStart(2, '0'); // Ensure two-digit format
      weatherImg.src = `https://developer.accuweather.com/sites/default/files/${iconCode}-s.png`; // Small icon URL
      weatherImg.alt = `Weather icon ${iconCode}`;
    }

    // Fetch Workout Suggestions
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
        console.error("Error fetching workout suggestions:");
        notif.error("Error fetching workout data.");
      }
    }

    // Fetch Fitness Products
    async function fetchFitnessProducts() {
      try {
        const response = await fetch(ecommerceAPI);
        const products = await response.json();
        const productList = document.getElementById("products-list");
        productList.innerHTML = "";

        products.forEach(product => {
          const li = document.createElement("li");
          li.textContent = `${product.title} - $${product.price}`;
          productList.appendChild(li);
        });
      } catch (error) {
        console.error("Error fetching fitness products:", error);
        document.getElementById("products-list").textContent = "Error fetching product data.";
      }
    }

    // Initialize the Application
    async function initialize() {
      const city = document.getElementById("location-input").value.trim();
      if (!city) {
        alert("Please enter a city name.");
        return;
      }
      const isValidCity = await fetchLocationKey(city);
      if (!isValidCity) return;

      const weatherText = await fetchCurrentWeather();
      if (!weatherText) return;

      fetchForecastWeather();
      fetchWorkoutSuggestions(weatherText);
      fetchFitnessProducts();
    }