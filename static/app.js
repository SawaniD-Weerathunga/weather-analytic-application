let auth0Client = null;

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const heroLoginBtn = document.getElementById("heroLoginBtn");

const welcomeSection = document.getElementById("welcomeSection");
const dashboardSection = document.getElementById("dashboardSection");

const cacheInfo = document.getElementById("cacheInfo");
const cityCount = document.getElementById("cityCount");
const topCity = document.getElementById("topCity");
const topScore = document.getElementById("topScore");

const weatherTableBody = document.getElementById("weatherTableBody");
const cityGrid = document.getElementById("cityGrid");

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

async function login() {
  await auth0Client.loginWithRedirect();
}

function logout() {
  auth0Client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
}

async function updateUI() {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    loginBtn.classList.add("hidden");
    if (heroLoginBtn) heroLoginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    welcomeSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    await loadWeatherData();
  } else {
    loginBtn.classList.remove("hidden");
    if (heroLoginBtn) heroLoginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");

    welcomeSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }
}

async function loadWeatherData() {
  try {
    const token = await auth0Client.getTokenSilently();

    const response = await fetch("/api/weather", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load weather data");
    }

    const data = await response.json();
    renderDashboard(data);
  } catch (error) {
    console.error(error);
    alert("Unable to load dashboard data. Please check Auth0 setup and backend.");
  }
}

function renderDashboard(data) {
  const cities = data.cities || [];

  cacheInfo.textContent = data.cache_status || "-";
  cityCount.textContent = cities.length;

  if (cities.length > 0) {
    topCity.textContent = cities[0].city_name;
    topScore.textContent = cities[0].comfort_score;
  } else {
    topCity.textContent = "-";
    topScore.textContent = "-";
  }

  weatherTableBody.innerHTML = "";
  cityGrid.innerHTML = "";

  cities.forEach((city) => {
    const tableRow = document.createElement("tr");
    tableRow.innerHTML = `
      <td><span class="rank-badge">#${city.rank}</span></td>
      <td>${city.city_name}</td>
      <td>${city.weather_description}</td>
      <td>${city.temperature_c} °C</td>
      <td><span class="score-pill">${city.comfort_score}</span></td>
    `;
    weatherTableBody.appendChild(tableRow);

    const card = document.createElement("div");
    card.className = "city-card";
    card.innerHTML = `
      <h3>${city.city_name}</h3>
      <p><strong>Rank Position:</strong> #${city.rank}</p>
      <p><strong>Weather Description:</strong> ${city.weather_description}</p>
      <p><strong>Temperature:</strong> ${city.temperature_c} °C</p>
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

  loginBtn.addEventListener("click", login);
  logoutBtn.addEventListener("click", logout);

  if (heroLoginBtn) {
    heroLoginBtn.addEventListener("click", login);
  }

  await updateUI();
};