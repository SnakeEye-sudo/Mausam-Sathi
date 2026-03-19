(() => {
  const root = document.getElementById("appRoot");
  if (!root) return;

  const weatherCodes = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Dense fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snow",
    80: "Showers",
    81: "Heavy showers",
    95: "Thunderstorm"
  };

  const state = {
    city: "Delhi",
    label: "Delhi, IN",
    weather: null,
    hourlyText: "Loading weather..."
  };

  root.innerHTML = `
    <section class="section-stack">
      <article class="tool-card weather-shell">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Weather live</p>
            <h3>Precise location weather</h3>
          </div>
          <button class="ghost-btn" id="useLocationBtn" type="button">Use my location</button>
        </div>
        <div class="split-row">
          <input class="text-input" id="cityInput" type="text" placeholder="Delhi, Noida, Patna...">
          <button class="action-btn primary" id="searchBtn" type="button">Search</button>
        </div>
        <div class="weather-stage premium-weather">
          <div class="weather-summary premium-summary">
            <div>
              <p class="mini-label" id="placeLabel">Delhi, IN</p>
              <strong class="weather-temp" id="tempText">--</strong>
              <p class="muted" id="weatherDesc">Loading weather...</p>
            </div>
            <div class="stat-grid weather-main-stats">
              <div class="stat-box"><p class="mini-label">Feels like</p><strong id="feelText">--</strong></div>
              <div class="stat-box"><p class="mini-label">Wind</p><strong id="windText">--</strong></div>
            </div>
          </div>
          <div class="result-panel">
            <p class="mini-label">Live note</p>
            <strong id="hourlyNote">--</strong>
            <p class="muted" id="precisionLabel">Exact latitude / longitude aur local timezone ka data use hota hai.</p>
          </div>
          <div class="cards-grid weather-detail-grid" id="detailGrid"></div>
          <div class="history-grid" id="hourlyGrid"></div>
        </div>
      </article>
    </section>

    <aside class="section-stack">
      <article class="info-card">
        <p class="eyebrow">6 day forecast</p>
        <div class="forecast-grid" id="forecastGrid"></div>
      </article>
      <article class="info-card">
        <p class="eyebrow">Outside mood</p>
        <div class="history-grid">
          <div class="history-card"><strong id="outsideMood">Mausam ka wait...</strong><span class="muted">Bahar ka mahaul yahan simple line me aayega.</span></div>
          <div class="history-card"><strong>Tip</strong><span class="muted">Morning aur evening change ko hourly strip me dekhte raho.</span></div>
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
  const precisionLabel = document.getElementById("precisionLabel");
  const detailGrid = document.getElementById("detailGrid");
  const hourlyGrid = document.getElementById("hourlyGrid");
  const forecastGrid = document.getElementById("forecastGrid");
  const outsideMood = document.getElementById("outsideMood");
  const cityInput = document.getElementById("cityInput");

  function codeLabel(code) {
    return weatherCodes[code] || "Weather update";
  }

  function render() {
    if (!state.weather) return;
    const current = state.weather.current;
    const daily = state.weather.daily;
    placeLabel.textContent = state.label;
    tempText.textContent = `${Math.round(current.temperature_2m)}°C`;
    weatherDesc.textContent = codeLabel(current.weather_code);
    feelText.textContent = `${Math.round(current.apparent_temperature)}°C`;
    windText.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    hourlyNote.textContent = state.hourlyText;
    precisionLabel.textContent = `Lat ${state.weather.latitude.toFixed(2)} • Lon ${state.weather.longitude.toFixed(2)} • ${state.weather.timezone}`;
    outsideMood.textContent = current.weather_code <= 2
      ? "Bahar ka mahaul clean aur open feel de raha hai."
      : current.weather_code >= 61
        ? "Bahar halka ya strong wet mood me hai, outing plan check kar lo."
        : "Mausam mixed hai, sky aur air dono shift me hain.";

    detailGrid.innerHTML = `
      <div class="history-card"><strong>Humidity</strong><span class="muted">${Math.round(current.relative_humidity_2m)}%</span></div>
      <div class="history-card"><strong>Pressure</strong><span class="muted">${Math.round(current.surface_pressure_msl)} hPa</span></div>
      <div class="history-card"><strong>Rain chance</strong><span class="muted">${Math.round(daily.precipitation_probability_max[0])}%</span></div>
      <div class="history-card"><strong>Sunrise / Sunset</strong><span class="muted">${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(daily.sunrise[0]))} / ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(daily.sunset[0]))}</span></div>
    `;

    hourlyGrid.innerHTML = state.weather.hourly.time.slice(0, 6).map((value, index) => `
      <div class="history-card">
        <strong>${new Intl.DateTimeFormat("en-IN", { hour: "numeric" }).format(new Date(value))}</strong>
        <span class="muted">${Math.round(state.weather.hourly.temperature_2m[index])}°C • ${codeLabel(state.weather.hourly.weather_code[index])}</span>
      </div>
    `).join("");

    forecastGrid.innerHTML = state.weather.daily.time.slice(0, 6).map((day, index) => `
      <div class="forecast-card">
        <strong>${new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(day))}</strong>
        <span class="muted">${codeLabel(state.weather.daily.weather_code[index])}</span>
        <span>${Math.round(state.weather.daily.temperature_2m_max[index])}° / ${Math.round(state.weather.daily.temperature_2m_min[index])}°</span>
      </div>
    `).join("");
  }

  async function loadForecast(lat, lon, label) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure_msl");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max");
    url.searchParams.set("hourly", "temperature_2m,weather_code");
    url.searchParams.set("forecast_hours", "6");
    url.searchParams.set("timezone", "auto");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather request failed");
    state.weather = await response.json();
    state.label = label;
    state.hourlyText = `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
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
    if (!data.results?.length) throw new Error("City nahi mila");
    const match = data.results[0];
    const label = [match.name, match.admin1, match.country_code].filter(Boolean).join(", ");
    await loadForecast(match.latitude, match.longitude, label);
  }

  document.getElementById("searchBtn")?.addEventListener("click", async () => {
    const query = cityInput.value.trim() || state.city;
    try {
      weatherDesc.textContent = "Loading weather...";
      await searchCity(query);
    } catch (error) {
      weatherDesc.textContent = error instanceof Error ? error.message : "Search failed";
    }
  });

  cityInput?.addEventListener("keydown", (event) => {
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
        weatherDesc.textContent = "Loading your exact weather...";
        await loadForecast(position.coords.latitude, position.coords.longitude, "My location");
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
