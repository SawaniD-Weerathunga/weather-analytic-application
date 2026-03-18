import time

class SimpleCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        entry = self.store.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del self.store[key]
            return None
        return entry["value"]

    def set(self, key, value, ttl_seconds):
        self.store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds
        }

    def status(self, key):
        entry = self.store.get(key)
        if not entry:
            return "MISS"
        if time.time() > entry["expires_at"]:
            del self.store[key]
            return "MISS"
        return "HIT"

cache = SimpleCache()

