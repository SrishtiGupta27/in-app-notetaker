import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    pyannote_api_key: str = os.getenv("PYANNOTE_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    pyannote_api_url: str = "https://api.pyannote.ai/v1/diarize"
    public_url: str = os.getenv("PUBLIC_URL", "http://127.0.0.1:8000")
    
    class Config:
        env_file = ".env"

settings = Settings()
