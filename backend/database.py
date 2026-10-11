import os

from urllib.parse import quote_plus

from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


DB_USER = os.getenv(
    "DB_USER",
    "root"
)

DB_PASSWORD = os.getenv(
    "DB_PASSWORD",
    ""
)

DB_HOST = os.getenv(
    "DB_HOST",
    "127.0.0.1"
)

DB_PORT = os.getenv(
    "DB_PORT",
    "3306"
)

DB_NAME = os.getenv(
    "DB_NAME",
    "ai_resume_screening"
)


# ==========================================
# PASSWORD ENCODING
# ==========================================

encoded_password = quote_plus(
    DB_PASSWORD
)


# ==========================================
# DATABASE URL
# ==========================================

DATABASE_URL = (
    f"mysql+pymysql://"
    f"{DB_USER}:"
    f"{encoded_password}@"
    f"{DB_HOST}:"
    f"{DB_PORT}/"
    f"{DB_NAME}"
)


# ==========================================
# DATABASE ENGINE
# ==========================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ==========================================
# DATABASE SESSION
# ==========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ==========================================
# BASE MODEL
# ==========================================

Base = declarative_base()


# ==========================================
# DATABASE DEPENDENCY
# ==========================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()