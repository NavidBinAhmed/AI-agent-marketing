from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Required API keys
    api_key: str
    google_api_key: str 
    serpapi_api_key: str
    
    # Environment - kept development as of now (change to production later)
    environment: str = "production"
    log_level: str = "INFO"
    
    
    cors_origins: List[str] = [
        "https://marketing-mba-frontend.onrender.com",
        "http://localhost:3000"]
    
    # Request limits
    max_prompt_length: int = 10000
    max_results_limit: int = 50
    request_timeout: int = 60
    
    # Google Gemini settings
    gemini_model: str = "gemini-2.5-flash"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()