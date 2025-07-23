import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost/netflix_movies")
    
    # CORS settings
    ALLOW_ORIGINS: list = ["*"]
    ALLOW_CREDENTIALS: bool = True
    ALLOW_METHODS: list = ["*"]
    ALLOW_HEADERS: list = ["*"]
    
    # App settings
    TITLE: str = "Netflix Movie Tool API"
    VERSION: str = "1.0.0"


settings = Settings()