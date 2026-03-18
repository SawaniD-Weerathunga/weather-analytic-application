import json
import requests

from app.config import OPENWEATHER_API_KEY, CITIES_FILE, CACHE_TTL_SECONDS
from app.cache import cache
from app.comfort import compute_comfort_index


def load_city_codes():
    with open(CITIES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data["List"]

def extract_city_codes():
    cities = load_city_codes()
    city_codes = []

    for item in cities:
        city_codes.append(int(item["CityCode"]))

    return city_codes

def kelvin_to_celsius(kelvin):
    return round(kelvin - 273.15, 2)


def fetch_weather_for_city(city_code):
    cache_key = f"weather_raw_{city_code}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached, "HIT"

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "id": city_code,
        "appid": OPENWEATHER_API_KEY
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    data = response.json()

    cache.set(cache_key, data, CACHE_TTL_SECONDS)
    return data, "MISS"


def build_ranked_weather_data():
    processed_key = "processed_weather_data"
    processed_cached = cache.get(processed_key)

    if processed_cached is not None:
        return processed_cached, "HIT"

    cities = load_city_codes()
    city_codes = extract_city_codes()

    results = []

    for index, city_code in enumerate(city_codes):
        fallback_name = cities[index].get("CityName", "Unknown")

        raw_data, _ = fetch_weather_for_city(city_code)

        main_data = raw_data.get("main", {})
        weather_list = raw_data.get("weather", [])
        wind_data = raw_data.get("wind", {})
        clouds_data = raw_data.get("clouds", {})

        temp_c = kelvin_to_celsius(main_data.get("temp", 273.15))
        humidity = main_data.get("humidity", 0)
        wind_speed = wind_data.get("speed", 0.0)
        cloudiness = clouds_data.get("all", 0)
        pressure = main_data.get("pressure", 0)
        visibility = raw_data.get("visibility", 0)

        if weather_list:
            weather_description = weather_list[0].get("description", "No description")
        else:
            weather_description = "No description"

        score = compute_comfort_index(
            temp_c=temp_c,
            humidity=humidity,
            wind_speed=wind_speed,
            cloudiness=cloudiness
        )

        results.append({
            "city_code": city_code,
            "city_name": raw_data.get("name", fallback_name),
            "weather_description": weather_description,
            "temperature_c": temp_c,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "cloudiness": cloudiness,
            "pressure": pressure,
            "visibility": visibility,
            "comfort_score": score
        })

    results.sort(key=lambda x: x["comfort_score"], reverse=True)

    for i, city in enumerate(results, start=1):
        city["rank"] = i

    cache.set(processed_key, results, CACHE_TTL_SECONDS)

    return results, "MISS"