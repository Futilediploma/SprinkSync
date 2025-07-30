@echo off
echo Starting SprinkSync Development Environment...
echo.

echo Starting Backend (FastAPI)...
cd backend
start cmd /k "python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend (React + Vite)...
cd ..\frontend
start cmd /k "npm install && npm run dev"

echo.
echo Development servers starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
