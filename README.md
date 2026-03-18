# Weather Analytics Application

A secure full-stack weather analytics application built with **Python (FastAPI)** and **HTML/CSS/JavaScript**, featuring:

- live weather retrieval from **OpenWeatherMap**
- a custom backend-computed **Comfort Index Score**
- city ranking from most comfortable to least comfortable
- **server-side caching**
- **responsive UI** for desktop and mobile
- **authentication and authorization with Auth0**
- **MFA support**
- bonus enhancements such as **dark mode**, **sorting/filtering**, and **graph visualization**

---

## Features

### Core Requirements
- Reads city codes from `cities.json`
- Extracts `CityCode` values into an array
- Fetches weather data from OpenWeatherMap using city IDs
- Computes a custom Comfort Index score on the backend
- Ranks cities from most comfortable to least comfortable
- Displays:
  - City Name
  - Weather Description
  - Temperature
  - Comfort Score
  - Rank Position
- Caches weather data server-side for 5 minutes
- Supports both mobile and desktop layouts
- Protects dashboard access using Auth0 authentication

### Bonus Features
- Dark mode / light mode toggle
- Frontend sorting and filtering
- Comfort score chart
- Unit tests for the Comfort Index function

---

## Tech Stack

### Backend
- Python
- FastAPI
- Requests
- Pydantic
- Python-JOSE
- python-dotenv

### Frontend
- HTML
- CSS
- JavaScript
- Chart.js

### Authentication
- Auth0
- JWT-based API protection
- MFA through Auth0

### External API
- OpenWeatherMap Current Weather API

---

## Project Structure

```text
weather-analytic-application/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── auth.py
│   ├── cache.py
│   ├── comfort.py
│   ├── models.py
│   └── weather_service.py
│
├── static/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── data/
│   └── cities.json
│
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
````

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd weather-analytic-application
```

### 2. Create and activate virtual environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### Mac / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create `.env` file

Create a `.env` file in the project root and add:

```env
OPENWEATHER_API_KEY=your_openweather_api_key
AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
AUTH0_AUDIENCE=https://weather-api
AUTH0_CLIENT_ID=your_auth0_spa_client_id
AUTH0_ISSUER=https://your-auth0-domain.us.auth0.com/
```

### 5. Add the provided `cities.json`

Place the provided assignment file inside:

```text
data/cities.json
```

This project expects the file structure to contain a top-level `List` array and extract `CityCode` values from it. 

### 6. Run the backend server

```bash
uvicorn app.main:app --reload
```

### 7. Open the app

Open in browser:

```text
http://localhost:8000
```

Do not open `index.html` directly with `file:///...`; the app must run through FastAPI so static assets and Auth0 flow work correctly.

---

## How the Application Works

1. The backend reads `cities.json`
2. It extracts `CityCode` values into an array
3. It fetches weather data from OpenWeatherMap using each city ID
4. It computes a custom Comfort Index score on the backend
5. It sorts cities by score in descending order
6. It returns ranked weather data to the frontend
7. The frontend displays the results in a responsive dashboard
8. Auth0 protects dashboard access so only authenticated users can view it

This matches the assignment flow for city code extraction, weather retrieval, backend scoring, ranking, caching, and protected access. 

---

## Comfort Index Formula

The application uses a custom **Comfort Index Score** from **0 to 100**.

### Parameters used

* Temperature
* Humidity
* Wind Speed
* Cloudiness

This satisfies the assignment requirement of using at least three weather parameters and computing the score on the backend. 

### Formula Overview

The Comfort Index is computed as a weighted score:

* **Temperature** → 40%
* **Humidity** → 25%
* **Wind Speed** → 20%
* **Cloudiness** → 15%

### Formula logic

Each weather factor is individually scored from 0 to 100 based on how close it is to an “ideal” value:

#### Temperature score

* Ideal temperature is around **26°C**
* The farther the actual temperature is from 26°C, the lower the score

#### Humidity score

* Ideal humidity is around **50%**
* Very high or very low humidity reduces comfort

#### Wind speed score

* Moderate wind is considered most comfortable
* Very low or very high wind reduces comfort

#### Cloudiness score

* Moderate cloudiness is treated as more comfortable than extreme clear sky or fully overcast conditions

### Final weighted score

```text
Comfort Score =
(Temperature Score × 0.40) +
(Humidity Score × 0.25) +
(Wind Score × 0.20) +
(Cloudiness Score × 0.15)
```

The result is clamped between **0 and 100**.

---

## Reasoning Behind Variable Weights

### Temperature — 40%

Temperature has the highest impact on human comfort in day-to-day weather conditions. Extreme heat or cold is usually the first factor people notice.

### Humidity — 25%

Humidity strongly affects how temperature feels. High humidity can make warm weather feel much hotter, while very low humidity can feel dry and uncomfortable.

### Wind Speed — 20%

A light to moderate breeze improves comfort, but strong winds reduce it. Wind also affects perceived temperature.

### Cloudiness — 15%

Cloudiness influences sun exposure and visual weather comfort, but it usually affects comfort less than temperature or humidity.

### Why this weighting was chosen

The goal was to create a formula that is:

* simple to explain
* realistic enough for the assignment
* easy to maintain
* computed consistently across different cities

---

## Ranking Logic

After all cities are scored:

* the list is sorted in descending order by `comfort_score`
* the city with the highest score gets `rank = 1`
* lower scores receive lower ranking positions

This produces a ranked list from **Most Comfortable** to **Least Comfortable**, as required by the assignment. 

---

## Weather Data Retrieval

The app uses the OpenWeatherMap current weather endpoint:

```text
https://api.openweathermap.org/data/2.5/weather?id={city_id}&appid={API_key}
```

For each city:

* the backend reads the `CityCode`
* sends a request to OpenWeatherMap
* extracts:

  * city name
  * weather description
  * temperature
  * humidity
  * wind speed
  * cloudiness
  * pressure
  * visibility

Temperature is converted from Kelvin to Celsius before being displayed and scored.

---

## Cache Design Explanation

The assignment requires server-side caching for 5 minutes and a debug endpoint showing `HIT` / `MISS`. 

### Current cache design

The application uses a simple in-memory cache implemented in Python.

### Cache layers

#### 1. Raw weather cache

Each city’s raw OpenWeatherMap response is cached separately using a key like:

```text
weather_raw_<city_code>
```

Example:

```text
weather_raw_1248991
```

#### 2. Processed dashboard cache

The final ranked city list is cached separately using:

```text
processed_weather_data
```

### Cache TTL

Both raw weather data and processed output are cached for:

```text
300 seconds (5 minutes)
```

### Cache debug endpoint

A protected endpoint is provided to inspect cache status:

```text
/api/cache-debug
```

It reports:

* processed cache status
* raw cache status for each city

### Why this design was chosen

This two-level approach reduces:

* repeated external API calls
* repeated score recalculations
* dashboard response time

It also satisfies the assignment more completely than caching only one layer.

---

## Authentication and Authorization

The assignment requires that only authenticated users can access the dashboard. 

### Implementation

* Auth0 SPA login is used on the frontend
* Auth0-issued JWT access tokens are sent to the backend
* FastAPI validates the token using Auth0’s JWKS endpoint
* Protected endpoints require a valid Bearer token

### Protected routes

* `/api/weather`
* `/api/cache-debug`

### Frontend auth flow

1. User clicks **Sign In**
2. Auth0 Universal Login page is opened
3. After successful login, Auth0 redirects back to the application
4. Frontend gets an access token
5. Frontend calls protected backend endpoints

---

## MFA Implementation

The assignment requires MFA. 

### MFA configuration

* MFA is enabled in Auth0
* OTP factor is enabled
* MFA is enforced during login through Auth0 flow configuration

### Login sequence

1. User enters email and password
2. Auth0 validates credentials
3. Auth0 prompts for MFA verification
4. After successful MFA, the user is redirected back to the app

### Why MFA is handled in Auth0

MFA is managed at the identity provider layer, so the frontend and backend do not need custom MFA verification code. This keeps the application simpler and more secure.

---

## Restricting Signups

The assignment requires:

* public signups disabled
* only whitelisted users can log in
* manual creation of the required test user. 

### Current implementation

* public signups are disabled in the Auth0 database connection
* the login user is created manually in Auth0
* only manually provisioned users can access the dashboard

### Assignment test user

Required test user credentials from the assignment:

```text
Email: careers@fidenz.com
Password: Pass#fidenz
```

---

## Responsive UI

The assignment requires support for both desktop and mobile layouts. 

### Desktop

* table layout
* summary cards
* chart and controls visible

### Mobile

* card-based city layout
* stacked sections
* touch-friendly controls

The UI is built with responsive CSS media queries and adapts based on screen width.

---

## Bonus Features Implemented

### 1. Dark mode / light mode toggle

A theme toggle allows switching between dark and light appearance.

### 2. Sorting and filtering

Users can:

* sort by rank
* sort by comfort score
* sort by temperature
* sort by city name
* search cities by name

### 3. Chart visualization

A bar chart displays comfort scores by city.

---

## Trade-offs Considered

### 1. In-memory cache vs Redis/database cache

**Chosen:** in-memory cache

**Why:**

* simpler to implement within assignment time
* no extra infrastructure required
* enough for a single-instance local project

**Trade-off:**

* cache is lost when the server restarts
* not suitable for multi-server deployment

### 2. Plain HTML/CSS/JS vs React/Vue

**Chosen:** plain HTML/CSS/JavaScript

**Why:**

* simpler and faster to build
* easy to understand and explain
* sufficient for the scope of this dashboard

**Trade-off:**

* less scalable than a component-based frontend framework for large applications

### 3. Simple comfort model vs complex meteorological model

**Chosen:** simple weighted model

**Why:**

* easier to explain during evaluation
* directly aligned with assignment expectations
* fast to compute

**Trade-off:**

* does not model all human comfort factors perfectly
* does not account for regional preferences or seasonal adaptation

### 4. Auth0-managed MFA vs custom MFA implementation

**Chosen:** Auth0-managed MFA

**Why:**

* more secure
* easier to configure
* keeps authentication logic out of the application code

**Trade-off:**

* relies on third-party configuration
* less custom control over MFA UX

---

## Known Limitations

* In-memory cache is cleared when the server restarts
* OpenWeatherMap current data can change frequently, so rankings are time-dependent
* The Comfort Index is a simplified model and may not reflect personal comfort preferences
* The chart currently displays comfort score by city, not a full temperature trend over time
* The frontend is intentionally lightweight and not componentized into a larger frontend framework
* Access control is managed through Auth0 configuration, so correct tenant setup is required

---

## API Endpoints

### `GET /`

Serves the frontend application

### `GET /api/health`

Health check endpoint

### `GET /api/weather`

Protected route returning ranked weather data

### `GET /api/cache-debug`

Protected route returning cache HIT/MISS information

---

## Example Response from `/api/weather`

```json
{
  "cities": [
    {
      "city_code": 1248991,
      "city_name": "Colombo",
      "weather_description": "clear sky",
      "temperature_c": 26.13,
      "humidity": 78,
      "wind_speed": 3.5,
      "cloudiness": 5,
      "pressure": 1011,
      "visibility": 10000,
      "comfort_score": 79.57,
      "rank": 1
    }
  ],
  "cache_status": "MISS"
}
```

---

## Security Notes

* Secrets are stored in `.env`
* `.env` must never be committed to version control
* `.env.example` should be used for sharing configuration structure
* JWT verification is performed on the backend
* Only authenticated users can access protected API routes

---

## Final Notes

This implementation focuses on:

* correctness
* clarity
* security
* explainability

The solution is intentionally designed so that all key decisions, calculations, and architectural choices can be clearly explained during technical evaluation and live modification sessions, which the assignment explicitly expects. 

## 👩‍💻 Author

S.D.Weerathunga
>**Computer Engineering Undergraduate**,
>University of Sri Jayewardenepura,
>Sri Lanka 🇱🇰.

* GitHub: https://github.com/SawaniD-Weerathunga
* LinkedIn: https://www.linkedin.com/in/sawani-weerathunga-507a55348/

---

