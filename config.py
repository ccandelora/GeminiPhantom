import os

class Config:
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY is not set. The application may not function correctly.")
        GEMINI_API_KEY = "DUMMY_KEY"  # Use a dummy key to allow the app to start

    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Add other configuration settings here if needed
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback_secret_key')
