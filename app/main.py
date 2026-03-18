from fastapi import FastAPI, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.weather_service import build_ranked_weather_data, extract_city_codes
from app.cache import cache
from app.auth import verify_jwt
from app.models import WeatherResponse

app = FastAPI(title="Weather Analytics Application")

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_home():
    return FileResponse("static/index.html")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/weather", response_model=WeatherResponse)
def get_weather_dashboard(user=Depends(verify_jwt)):
    data, cache_status = build_ranked_weather_data()
    return {
        "cities": data,
        "cache_status": cache_status
    }


@app.get("/api/cache-debug")
def cache_debug(user=Depends(verify_jwt)):
    city_codes = extract_city_codes()

    raw_cache_status = {}
    for city_code in city_codes:
        raw_cache_status[f"weather_raw_{city_code}"] = cache.status(f"weather_raw_{city_code}")

    return {
        "processed_weather_data": cache.status("processed_weather_data"),
        "raw_weather_cache": raw_cache_status
    }