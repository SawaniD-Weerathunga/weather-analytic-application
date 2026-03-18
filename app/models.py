from pydantic import BaseModel
from typing import List

class CityWeather(BaseModel):
    city_code: int
    city_name: str
    weather_description: str
    temperature_c: float
    humidity: int
    wind_speed: float
    cloudiness: int
    pressure: int
    visibility: int
    comfort_score: float
    rank: int

class WeatherResponse(BaseModel):
    cities: List[CityWeather]
    cache_status: str