#!/bin/bash

# SprinkSync Backend Startup Script
echo "🚀 Starting SprinkSync Construction Management Platform Backend"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update the values before running in production."
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python init_database.py

# Start the server
echo "🌟 Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
