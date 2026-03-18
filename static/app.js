let auth0Client = null;

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeSection = document.getElementById("welcomeSection");
const dashboardSection = document.getElementById("dashboardSection");
const cityGrid = document.getElementById("cityGrid");
const cacheInfo = document.getElementById("cacheInfo");

async function configureAuth0() {
  auth0Client = await auth0.createAuth0Client({
    domain: "YOUR_AUTH0_DOMAIN",
    clientId: "YOUR_AUTH0_CLIENT_ID",
    authorizationParams: {
      audience: "https://weather-api",
      redirect_uri: window.location.origin
    },
    cacheLocation: "memory"
  });
}

async function updateUI() {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    welcomeSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    await loadWeatherData();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    welcomeSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }
}

async function loadWeatherData() {
  const token = await auth0Client.getTokenSilently();

  const response = await fetch("/api/weather", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    alert("Failed to load weather data");
    return;
  }

  const data = await response.json();
  cacheInfo.textContent = "Cache: " + data.cache_status;

  cityGrid.innerHTML = "";

  data.cities.forEach(city => {
    const card = document.createElement("div");
    card.className = "city-card";

    card.innerHTML = `
      <h3>${city.city_name}</h3>
      <p class="rank">Rank #${city.rank}</p>
      <p><strong>Weather:</strong> ${city.weather_description}</p>
      <p><strong>Temperature:</strong> ${city.temperature_c} °C</p>
      <p><strong>Humidity:</strong> ${city.humidity}%</p>
      <p><strong>Wind Speed:</strong> ${city.wind_speed} m/s</p>
      <p><strong>Cloudiness:</strong> ${city.cloudiness}%</p>
      <p><strong>Comfort Score:</strong> ${city.comfort_score}</p>
    `;

    cityGrid.appendChild(card);
  });
}

window.onload = async () => {
  await configureAuth0();

  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  loginBtn.addEventListener("click", async () => {
    await auth0Client.loginWithRedirect();
  });

  logoutBtn.addEventListener("click", () => {
    auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  });

  await updateUI();
};