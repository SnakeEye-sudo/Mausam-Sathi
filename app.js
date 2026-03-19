"use strict";
(() => {
  // src/app.ts
  (() => {
    const root = document.getElementById("appRoot");
    if (!root) return;
    const state = {
      city: "Delhi",
      weather: null,
      locationLabel: "Delhi, IN",
      hourlyNote: "--"
    };
    const weatherCodes = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      71: "Snow",
      80: "Rain showers",
      95: "Thunderstorm"
    };
    root.innerHTML = `
    <section class="section-stack">
      <article class="tool-card">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Weather desk</p>
            <h3>Search city, get current + 5 day outlook</h3>
          </div>
          <button class="ghost-btn" id="useLocationBtn" type="button">Use my location</button>
        </div>
        <label class="field-label" for="cityInput">City search</label>
        <div class="split-row">
          <input class="text-input" id="cityInput" type="text" placeholder="Delhi, Patna, Lucknow...">
          <button class="action-btn primary" id="searchBtn" type="button">Search</button>
        </div>
        <div class="weather-stage">
          <div class="weather-summary">
            <div>
              <p class="mini-label" id="placeLabel">Delhi, IN</p>
              <strong class="weather-temp" id="tempText">--</strong>
              <p class="muted" id="weatherDesc">Loading weather...</p>
            </div>
            <div class="stat-grid">
              <div class="stat-box"><p class="mini-label">Feels like</p><strong id="feelText">--</strong></div>
              <div class="stat-box"><p class="mini-label">Wind</p><strong id="windText">--</strong></div>
            </div>
          </div>
          <div class="result-panel">
            <p class="mini-label">Hourly note</p>
            <strong id="hourlyNote">--</strong>
            <p class="muted">Powered by Open-Meteo forecast + geocoding.</p>
          </div>
        </div>
      </article>
    </section>

    <aside class="section-stack">
      <article class="info-card">
        <p class="eyebrow">5 day forecast</p>
        <div class="forecast-grid" id="forecastGrid"></div>
      </article>
      <article class="info-card">
        <p class="eyebrow">Planning hint</p>
        <div class="history-grid">
          <div class="history-card"><strong>Morning check</strong><span class="muted">Rain chance aur max temp dekh lo.</span></div>
          <div class="history-card"><strong>Travel check</strong><span class="muted">Wind speed aur weather code se idea milta hai.</span></div>
        </div>
      </article>
    </aside>
  `;
    const placeLabel = document.getElementById("placeLabel");
    const tempText = document.getElementById("tempText");
    const weatherDesc = document.getElementById("weatherDesc");
    const feelText = document.getElementById("feelText");
    const windText = document.getElementById("windText");
    const hourlyNote = document.getElementById("hourlyNote");
    const forecastGrid = document.getElementById("forecastGrid");
    const cityInput = document.getElementById("cityInput");
    function codeLabel(code) {
      return weatherCodes[code] || "Weather update";
    }
    function render() {
      if (!state.weather) {
        tempText.textContent = "--";
        weatherDesc.textContent = "Search any city to load weather.";
        feelText.textContent = "--";
        windText.textContent = "--";
        hourlyNote.textContent = state.hourlyNote;
        forecastGrid.innerHTML = "";
        return;
      }
      placeLabel.textContent = state.locationLabel;
      tempText.textContent = `${Math.round(state.weather.current.temperature_2m)}\xB0C`;
      weatherDesc.textContent = codeLabel(state.weather.current.weather_code);
      feelText.textContent = `${Math.round(state.weather.current.apparent_temperature)}\xB0C`;
      windText.textContent = `${Math.round(state.weather.current.wind_speed_10m)} km/h`;
      hourlyNote.textContent = state.hourlyNote;
      forecastGrid.innerHTML = state.weather.daily.time.slice(0, 5).map((day, index) => `
      <div class="forecast-card">
        <strong>${new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(day))}</strong>
        <span class="muted">${codeLabel(state.weather.daily.weather_code[index])}</span>
        <span>${Math.round(state.weather.daily.temperature_2m_max[index])}\xB0 / ${Math.round(state.weather.daily.temperature_2m_min[index])}\xB0</span>
      </div>
    `).join("");
    }
    async function loadForecast(lat, lon, label) {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
      url.searchParams.set("timezone", "auto");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Weather request failed");
      const weather = await response.json();
      state.weather = weather;
      state.locationLabel = label;
      state.hourlyNote = `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      render();
    }
    async function searchCity(query) {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.searchParams.set("name", query);
      url.searchParams.set("count", "1");
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Location search failed");
      const data = await response.json();
      if (!data.results || !data.results.length) throw new Error("No city found");
      const match = data.results[0];
      const label = [match.name, match.admin1, match.country_code].filter(Boolean).join(", ");
      await loadForecast(match.latitude, match.longitude, label);
    }
    document.getElementById("searchBtn")?.addEventListener("click", async () => {
      const query = cityInput.value.trim() || "Delhi";
      try {
        weatherDesc.textContent = "Loading weather...";
        await searchCity(query);
      } catch (error) {
        weatherDesc.textContent = error instanceof Error ? error.message : "Search failed";
      }
    });
    cityInput?.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      document.getElementById("searchBtn")?.click();
    });
    document.getElementById("useLocationBtn")?.addEventListener("click", () => {
      if (!navigator.geolocation) {
        weatherDesc.textContent = "Browser geolocation available nahi hai.";
        return;
      }
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          weatherDesc.textContent = "Loading your local weather...";
          await loadForecast(
            position.coords.latitude,
            position.coords.longitude,
            "My location"
          );
        } catch (error) {
          weatherDesc.textContent = error instanceof Error ? error.message : "Location weather failed";
        }
      }, () => {
        weatherDesc.textContent = "Location permission denied.";
      });
    });
    cityInput.value = state.city;
    void searchCity(state.city).catch(() => {
      weatherDesc.textContent = "Default city load nahi ho paaya.";
    });
  })();
})();
