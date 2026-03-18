from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import requests

from app.config import AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_ISSUER

security = HTTPBearer()


def get_jwks():
    if not AUTH0_DOMAIN:
        raise HTTPException(status_code=500, detail="AUTH0_DOMAIN is not configured")

    jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"

    try:
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        raise HTTPException(status_code=500, detail="Unable to fetch Auth0 JWKS")


def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not AUTH0_AUDIENCE or not AUTH0_ISSUER:
        raise HTTPException(status_code=500, detail="Auth0 settings are not configured properly")

    token = credentials.credentials

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token header")

    jwks = get_jwks()

    rsa_key = None
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            rsa_key = {
                "kty": key.get("kty"),
                "kid": key.get("kid"),
                "use": key.get("use"),
                "n": key.get("n"),
                "e": key.get("e")
            }
            break

    if rsa_key is None:
        raise HTTPException(status_code=401, detail="Unable to find matching public key")

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")