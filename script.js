var notif = new Notyf();

const weatherAPIKey = "0d87f5672d1d4873a2d14308251901";
const ecommerceAPI = "https://fakeproductsapi.glitch.me/categories";

const weatherIconMapping = {
  1000: { day: "assets/status/animated/clear-day.svg", night: "assets/status/animated/clear-night.svg" },
  1003: { day: "assets/status/animated/cloudy-1-day.svg", night: "assets/status/animated/cloudy-1-night.svg" },
  1006: { day: "assets/status/animated/cloudy.svg", night: "assets/status/animated/cloudy-night.svg" },
  1009: { day: "assets/status/animated/cloudy-3-day.svg", night: "assets/status/animated/cloudy-3-night.svg" },
  1030: { day: "assets/status/animated/fog-day.svg", night: "assets/status/animated/fog-night.svg" },
  1063: { day: "assets/status/animated/rainy-1-day.svg", night: "assets/status/animated/rainy-1-night.svg" },
  1066: { day: "assets/status/animated/snowy-1-day.svg", night: "assets/status/animated/snowy-1-night.svg" },
  1069: { day: "assets/status/animated/snow-and-sleet-mix.svg", night: "assets/status/animated/snow-and-sleet-mix.svg" },
  default: { day: "assets/status/animated/clear-day.svg", night: "assets/status/animated/clear-night.svg" },
};


function updateWeatherImageWithCode(conditionCode, isDay) {
  const weatherImg = document.getElementById("weather-img");
  const customIcon =
    (weatherIconMapping[conditionCode] && weatherIconMapping[conditionCode][isDay ? "day" : "night"]) ||
    weatherIconMapping.default[isDay ? "day" : "night"];
  weatherImg.src = customIcon;
  weatherImg.alt = `Weather icon for ${isDay ? "day" : "night"} condition code ${conditionCode}`;
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
      const isDay = weather.is_day;
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

      updateWeatherImageWithCode(conditionCode, isDay);
      return conditionCode;
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
      forecastContainer.innerHTML = "";

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
    productList.innerHTML = "";

    const categoryMapping = {
      1000: "Workout Equipment", // Clear weather
      1063: "Fitness Accessories", // Light rain
      1066: "Fitness Accessories", // Snow
      1003: "Supplements", // Cloudy
      1006: "Supplements", // Overcast
    };

    const categoryName = categoryMapping[conditionCode] || "Workout Equipment";

    const selectedCategory = data.find((category) =>
      category.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    if (!selectedCategory || !selectedCategory.products.length) {
      productList.innerHTML = "<li>No recommended products available for the current weather.</li>";
      return;
    }

    Productnames = [];
    selectedCategory.products.forEach((product) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="product-item md-card2">
            <img src="${product.imageUrl}" alt="${product.name}"
             style="border-radius: 13px;"
            />
          <div>
            <h4>${product.name}</h4>
            <p>${product.description}</p>
            <p><strong>$${product.price}</strong> | Stock: ${product.stock}</p>
          </div>
        </div>
      `;
      productList.appendChild(li);
      Productnames.push(product.name);
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

    fetchForecastWeather(cityInput);
    fetchFitnessProducts(conditionCode);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await askLlama();
  } else {
    notif.error("Please enter a city name.");
  }
});

let Productnames = [];
let cachedResponse = null;
async function askLlama() {
  const city = document.getElementById("city").textContent;
  const conditionCode = document.getElementById("weather-status").textContent;
  
  const userMessage = `Suggest fitness and workout routines suitable for the current weather in ${city}, ${conditionCode}, and that can be paired with products such as: ${Productnames.join(", ")}. Format your response with each suggestion having a category (starting with ** and ending with ** for the category), on a new line, without numbering. Provide at least 10 suggestions, including the category, detailed instructions or tutorials related to the categories, and also include step-by-step instructions on how to perform each exercise.`;
  if (!userMessage) return;

  document.getElementById("workout-suggestion-reponse").innerHTML = "Thinking...";

  try {
      const res = await fetch("https://backend-for-workout-synchronous.onrender.com/ask-llama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: userMessage }] })
      });

      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));

      const rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");
      if (rateLimitRemaining === "0") {
          console.log("Rate limit reached. Caching the response.");
          cachedResponse = data;
      }

      document.getElementById("workout-suggestion-reponse").innerHTML = data.choices?.[0]?.message?.content
        .split(/\n|\.\s/) 
        .filter(line => line.trim() !== "")
        .map(line => {
          if (line.startsWith("**")) {
            return `<h3>${line.replace(/\*\*/g, '').trim()}</h3>`;
          }
          return `<p>${line.replace(/\*\*/g, '').trim()}</p>`;
        })
        .join("") || "No response.";

  } catch (error) {
      if (cachedResponse) {
          console.log("Using cached response.");
          document.getElementById("workout-suggestion-reponse").innerHTML = cachedResponse.choices?.[0]?.message?.content
            .split(/\n|\.\s/)
            .filter(line => line.trim() !== "")
            .map(line => {
              if (line.startsWith("**")) {
                return `<h3>${line.replace(/\*\*/g, '').trim()}</h3>`;
              }
              return `<p>${line.replace(/\*\*/g, '').trim()}</p>`;
            })
            .join("") || "No response.";
      } else {
          document.getElementById("workout-suggestion-reponse").innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
      }
  }
}




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

        fetchForecastWeather(locationData.city);
        fetchFitnessProducts(conditionCode);
      }

    await new Promise(resolve => setTimeout(resolve, 1000));
    await askLlama();
    },
    (error) => {
      console.error("Error fetching location:", error);
      notif.error("Unable to fetch location. Use the manual input instead.");
    }
  );
}

initialize();
