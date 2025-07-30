@echo off
echo 🚀 Starting SprinkSync Construction Management Platform Backend

:: Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating from .env.example...
    copy .env.example .env
    echo ✅ .env file created. Please update the values before running in production.
)

:: Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

:: Initialize database
echo 🗄️  Initializing database...
python init_database.py

:: Start the server
echo 🌟 Starting FastAPI server...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
