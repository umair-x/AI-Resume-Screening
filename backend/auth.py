import os

from datetime import (
    datetime,
    timedelta,
    timezone
)

import jwt

from jwt.exceptions import (
    InvalidTokenError
)

from pwdlib import PasswordHash

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from dotenv import load_dotenv

from database import get_db
from models import User


# ==========================================
# ENVIRONMENT
# ==========================================

load_dotenv()


JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "resume-ai-development-secret"
)

JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_HOURS = 24


# ==========================================
# PASSWORD HASHER
# ==========================================

password_hash = (
    PasswordHash.recommended()
)


# ==========================================
# BEARER TOKEN SECURITY
# ==========================================

security = HTTPBearer()


# ==========================================
# HASH PASSWORD
# ==========================================

def hash_password(
    password: str
):

    return password_hash.hash(
        password
    )


# ==========================================
# VERIFY PASSWORD
# ==========================================

def verify_password(
    plain_password: str,
    hashed_password: str
):

    try:

        return password_hash.verify(
            plain_password,
            hashed_password
        )

    except Exception:

        return False


# ==========================================
# CREATE JWT TOKEN
# ==========================================

def create_access_token(
    user_id: int,
    email: str
):

    expire = (
        datetime.now(
            timezone.utc
        )
        +
        timedelta(
            hours=
            ACCESS_TOKEN_EXPIRE_HOURS
        )
    )


    payload = {

        "sub":
            str(user_id),

        "email":
            email,

        "exp":
            expire

    }


    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=
            JWT_ALGORITHM
    )


    return token


# ==========================================
# DECODE JWT TOKEN
# ==========================================

def decode_access_token(
    token: str
):

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[
                JWT_ALGORITHM
            ]
        )

        return payload

    except InvalidTokenError:

        return None


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(

    credentials:
        HTTPAuthorizationCredentials =
        Depends(security),

    db: Session = Depends(
        get_db
    )

):

    credentials_exception = HTTPException(

        status_code=
            status.HTTP_401_UNAUTHORIZED,

        detail=
            "Invalid or expired authentication token"

    )


    token = credentials.credentials


    payload = decode_access_token(
        token
    )


    if payload is None:

        raise credentials_exception


    user_id = payload.get(
        "sub"
    )


    if user_id is None:

        raise credentials_exception


    try:

        user_id = int(
            user_id
        )

    except ValueError:

        raise credentials_exception


    user = (

        db.query(
            User
        )

        .filter(
            User.id == user_id
        )

        .first()

    )


    if user is None:

        raise credentials_exception


    return user