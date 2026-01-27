# Manpower Forecast - Startup Guide

## Backend (FastAPI)

```bash
cd manpower-forecast/backend

# Activate virtual environment
.\venv\Scripts\activate

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Frontend (React + Vite)

```bash
cd manpower-forecast/frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`
