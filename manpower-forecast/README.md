# SprinkSync Manpower Forecast

## Overview

A production-ready manpower forecasting system for fire sprinkler contractors. This application allows contractors to:

- Create project schedules with phase-based planning
- Assign labor quantities (man-hours or crew sizes) to schedule phases
- Automatically roll up schedules into company-wide manpower forecasts
- View manpower demand by week and month across all projects
- Export forecasts to CSV for further analysis

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL ORM
- **SQLite/PostgreSQL** - Database (SQLite for dev, PostgreSQL for production)
- **Pydantic** - Data validation
- **Pandas** - CSV export functionality

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start server**:
   ```bash
   python main.py
   ```

   Backend runs at: `http://localhost:8001`

### Frontend Setup

1. **Navigate to frontend directory** (in new terminal):
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   Frontend runs at: `http://localhost:3000`

## Usage

### 1. Create a Project
- Navigate to the Projects page
- Click "New Project"
- Enter project details (name, customer, project number)
- Click "Create Project"

### 2. Build a Schedule
- Click "Schedule" next to your project
- Create a schedule with start and end dates
- Add phases (e.g., Underground, Rough-In, Trim)
- For each phase, specify:
  - Phase name
  - Start and end dates
  - Either total man-hours OR average crew size
  - Optional crew type (Fitters, Apprentices, etc.)

### 3. View Project Forecast
- From the schedule editor, click "View Forecast"
- Toggle between weekly and monthly views
- See manpower demand distributed evenly across phase durations

### 4. View Company-Wide Forecast
- Navigate to "Company Forecast" in the top menu
- Set date range filters
- Filter by specific projects or crew types
- Toggle between weekly and monthly aggregation
- Export to CSV for external analysis

## Features

### V1 (Current)
✅ Project and schedule management  
✅ Phase-based scheduling with man-hours or crew size  
✅ Even distribution of labor across phase duration  
✅ Company-wide manpower aggregation  
✅ Weekly and monthly forecast views  
✅ Filter by project and crew type  
✅ CSV export  
✅ Interactive charts  

### V2 (Future)
🔲 Multiple schedules per project (what-if scenarios)  
🔲 Weighted distribution (front-load/back-load phases)  
🔲 Phase dependencies (critical path)  
🔲 Custom work calendars (holidays, shutdowns)  
🔲 Capacity planning (set team size limits)  
🔲 Actual vs. planned tracking  
🔲 Excel import/export  
🔲 Gantt chart visualization  

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Key Endpoints

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

#### Schedules
- `GET /api/projects/{id}/schedule` - Get project schedule
- `POST /api/projects/{id}/schedule` - Create schedule
- `POST /api/schedules/{id}/phases` - Add phase to schedule
- `PUT /api/phases/{id}` - Update phase
- `DELETE /api/phases/{id}` - Delete phase

#### Forecasts
- `GET /api/forecasts/company-wide` - Company-wide forecast
- `GET /api/forecasts/project/{id}` - Project-specific forecast
- `GET /api/forecasts/company-wide/export` - Export forecast CSV

#### Crew Types
- `GET /api/crew-types` - List crew types
- `POST /api/crew-types` - Create crew type

## Database Schema

### Projects
- Project details (name, customer, status)
- One-to-many with schedules

### Project Schedules
- Schedule metadata (start/end dates, name)
- Belongs to project
- One-to-many with phases

### Schedule Phases
- Phase details (name, dates, labor)
- Labor input: man-hours OR crew size
- Optional crew type assignment
- Belongs to schedule

### Crew Types
- Predefined labor categories
- Examples: Fitters, Apprentices, Foremen, Welders, Laborers

## Calculation Logic

### Daily Manpower Distribution
1. Get total man-hours (or convert crew size to hours)
2. Calculate working days (Monday-Friday) in phase duration
3. Distribute hours evenly across working days
4. `hours_per_day = total_hours / working_days`

### Weekly Aggregation
- Group daily hours by ISO week (Monday start)
- Sum hours for each week
- Track crew type breakdown

### Monthly Aggregation
- Group daily hours by calendar month
- Sum hours for each month
- Track crew type breakdown

### Company-Wide Rollup
- Combine all active project phases
- Filter by date range, projects, crew types
- Aggregate to weekly or monthly totals

## Project Structure

```
manpower-forecast/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── config.py            # Configuration
│   ├── requirements.txt     # Python dependencies
│   ├── api/
│   │   ├── projects.py      # Project endpoints
│   │   ├── schedules.py     # Schedule endpoints
│   │   ├── crew_types.py    # Crew type endpoints
│   │   └── forecasts.py     # Forecast endpoints
│   └── services/
│       ├── manpower.py      # Manpower calculation logic
│       └── export.py        # CSV export
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   ├── api.ts           # API client
│   │   ├── types.ts         # TypeScript types
│   │   ├── pages/
│   │   │   ├── ProjectsList.tsx       # Projects list
│   │   │   ├── ScheduleEditor.tsx     # Schedule editor
│   │   │   ├── ProjectForecast.tsx    # Project forecast
│   │   │   └── CompanyForecast.tsx    # Company forecast
│   │   └── index.css        # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Configuration

### Backend (.env)
```env
DATABASE_URL=sqlite:///./manpower_forecast.db
HOST=0.0.0.0
PORT=8001
FRONTEND_URL=http://localhost:3000
```

For PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/manpower_forecast
```

### Frontend
API URL is configured in `vite.config.ts` proxy settings.

## Deployment

### Backend
1. Set `DATABASE_URL` to PostgreSQL connection string
2. Install dependencies: `pip install -r requirements.txt`
3. Run with production server: `uvicorn main:app --host 0.0.0.0 --port 8001`

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)
3. Set `VITE_API_URL` environment variable to backend URL

## Troubleshooting

### Backend won't start
- Ensure Python 3.9+ is installed
- Activate virtual environment
- Check port 8001 is not in use

### Frontend won't start
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check port 3000 is not in use

### API calls failing
- Check backend is running on port 8001
- Verify CORS settings in `backend/config.py`
- Check browser console for errors

### Phases not showing in forecast
- Ensure phase has either `estimated_man_hours` or `crew_size`
- Check phase dates overlap with forecast date range
- Verify project status is "active"

## Contributing

This is a production system for SprinkSync. For feature requests or bug reports, contact the development team.

## License

Proprietary - SprinkSync © 2026
