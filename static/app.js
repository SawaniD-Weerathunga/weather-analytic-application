let auth0Client = null;

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const heroLoginBtn = document.getElementById("heroLoginBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const welcomeSection = document.getElementById("welcomeSection");
const dashboardSection = document.getElementById("dashboardSection");

const cacheInfo = document.getElementById("cacheInfo");
const cityCount = document.getElementById("cityCount");
const topCity = document.getElementById("topCity");
const topScore = document.getElementById("topScore");

const weatherTableBody = document.getElementById("weatherTableBody");
const cityGrid = document.getElementById("cityGrid");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const comfortChartCanvas = document.getElementById("comfortChart");

let allCities = [];
let currentCacheStatus = "-";
let comfortChartInstance = null;

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "Dark Mode";
  } else {
    document.body.classList.remove("light-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "Light Mode";
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");

  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("theme", isLight ? "light" : "dark");

  if (themeToggleBtn) {
    themeToggleBtn.textContent = isLight ? "Dark Mode" : "Light Mode";
  }
}

function renderChart(cities) {
  if (!comfortChartCanvas || typeof Chart === "undefined") return;

  const labels = cities.map((city) => city.city_name);
  const scores = cities.map((city) => city.comfort_score);

  if (comfortChartInstance) {
    comfortChartInstance.destroy();
  }

  comfortChartInstance = new Chart(comfortChartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Comfort Score",
          data: scores,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function applyFiltersAndSort() {
  let cities = [...allCities];

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const sortBy = sortSelect ? sortSelect.value : "rank";

  if (searchTerm) {
    cities = cities.filter((city) =>
      city.city_name.toLowerCase().includes(searchTerm)
    );
  }

  if (sortBy === "score") {
    cities.sort((a, b) => b.comfort_score - a.comfort_score);
  } else if (sortBy === "temperature") {
    cities.sort((a, b) => b.temperature_c - a.temperature_c);
  } else if (sortBy === "name") {
    cities.sort((a, b) => a.city_name.localeCompare(b.city_name));
  } else {
    cities.sort((a, b) => a.rank - b.rank);
  }

  if (cacheInfo) cacheInfo.textContent = currentCacheStatus || "-";
  if (cityCount) cityCount.textContent = cities.length;

  if (cities.length > 0) {
    if (topCity) topCity.textContent = cities[0].city_name;
    if (topScore) topScore.textContent = cities[0].comfort_score;
  } else {
    if (topCity) topCity.textContent = "-";
    if (topScore) topScore.textContent = "-";
  }

  if (weatherTableBody) weatherTableBody.innerHTML = "";
  if (cityGrid) cityGrid.innerHTML = "";

  cities.forEach((city) => {
    if (weatherTableBody) {
      const tableRow = document.createElement("tr");
      tableRow.innerHTML = `
        <td><span class="rank-badge">#${city.rank}</span></td>
        <td>${city.city_name}</td>
        <td>${city.weather_description}</td>
        <td>${city.temperature_c} °C</td>
        <td><span class="score-pill">${city.comfort_score}</span></td>
      `;
      weatherTableBody.appendChild(tableRow);
    }

    if (cityGrid) {
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
    }
  });

  renderChart(cities);
}

async function configureAuth0() {
  console.log("Configuring Auth0...");

  if (typeof auth0 === "undefined") {
    throw new Error("Auth0 SDK script did not load.");
  }

  auth0Client = await auth0.createAuth0Client({
    domain: "dev-hvevtfwqmfs8qlvp.us.auth0.com",
    clientId: "K0Xu9N9prlc0kxsS9k6U7WMV7lw3VEGC",
    authorizationParams: {
      audience: "https://weather-api",
      redirect_uri: window.location.origin
    },
    cacheLocation: "memory"
  });

  console.log("Auth0 configured successfully.");
}

async function login() {
  try {
    console.log("Login button clicked");

    if (!auth0Client) {
      throw new Error("Auth0 client is not initialized.");
    }

    await auth0Client.loginWithRedirect();
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Check browser console.");
  }
}

function logout() {
  try {
    if (!auth0Client) {
      throw new Error("Auth0 client is not initialized.");
    }

    auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed. Check browser console.");
  }
}

async function updateUI() {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    loginBtn?.classList.add("hidden");
    heroLoginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    welcomeSection?.classList.add("hidden");
    dashboardSection?.classList.remove("hidden");

    await loadWeatherData();
  } else {
    loginBtn?.classList.remove("hidden");
    heroLoginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");

    welcomeSection?.classList.remove("hidden");
    dashboardSection?.classList.add("hidden");
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
    console.error("Dashboard load error:", error);
    alert("Unable to load dashboard data. Please check Auth0 setup and backend.");
  }
}

function renderDashboard(data) {
  allCities = [...(data.cities || [])];
  currentCacheStatus = data.cache_status || "-";
  applyFiltersAndSort();
}

window.onload = async () => {
  try {
    console.log("Page loaded");

    applySavedTheme();
    await configureAuth0();

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    loginBtn?.addEventListener("click", login);
    logoutBtn?.addEventListener("click", logout);
    heroLoginBtn?.addEventListener("click", login);
    themeToggleBtn?.addEventListener("click", toggleTheme);

    searchInput?.addEventListener("input", applyFiltersAndSort);
    sortSelect?.addEventListener("change", applyFiltersAndSort);

    console.log("Event listeners attached");

    await updateUI();
  } catch (error) {
    console.error("Startup error:", error);
    alert("Startup failed. Open browser console (F12) and check the error.");
  }
};