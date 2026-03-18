def clamp(value, min_value=0, max_value=100):
    return max(min_value, min(max_value, value))

def score_temperature(temp_c):
    ideal = 26  #best around 24C to 28C
    diff = abs(temp_c - ideal)
    return clamp(100 - diff * 5)

def score_humidity(humidity):
    ideal = 50   #best around 40% to 60%
    diff = abs(humidity - ideal)
    return clamp(100 - diff * 1.5)

def score_wind(wind_speed):
    #moderate light wind is comfortable, treat 3-7 m/s as good zone
    if 3 <= wind_speed <= 7:
        return 100
    if wind_speed < 3:
        return clamp(70 + wind_speed * 10)
    else:
        return clamp(100 - (wind_speed - 7) * 7)

def score_cloudiness(cloudiness):
    #moderate cloudiness can feel better than extreme sun
    ideal = 30
    diff = abs(cloudiness - ideal)
    return clamp(100 - diff * 1.0)

def compute_comfort_index(temp_c, humidity, wind_speed, cloudiness):
    """
    Weighted score from 0 to 100.
    Temperature: 40%
    Humidity: 25%
    Wind Speed: 20%
    Cloudiness: 15%
    """
    t = score_temperature(temp_c)
    h = score_humidity(humidity)
    w = score_wind(wind_speed)
    c = score_cloudiness(cloudiness)

    score = (t * 0.40) + (h * 0.25) + (w * 0.20) + (c * 0.15)
    return round(clamp(score), 2)