import os


class Config:
    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/ai_running_coach")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
