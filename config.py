# config.py
import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Secret key for Flask sessions — override with env var in production
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'family-calendar-secret-key-2024'

    # SQLite database stored next to app.py
    # Set DATABASE_URL env var to use Postgres/MySQL in production
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL') or
        'sqlite:///' + os.path.join(basedir, 'family_calendar.db')
    )

    # Disable modification tracking — saves memory, not needed
    SQLALCHEMY_TRACK_MODIFICATIONS = False
