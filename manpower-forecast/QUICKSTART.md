# Quick Start Guide

Get the Manpower Forecast system running in 5 minutes!

## Step 1: Start Backend

```powershell
cd backend

# Create and activate virtual environment (first time only)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python main.py
```

✅ Backend should be running at http://localhost:8001

## Step 2: Start Frontend

Open a **new terminal**:

```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

✅ Frontend should be running at http://localhost:3000

## Step 3: Create Your First Project

1. Open http://localhost:3000 in your browser
2. Click **"+ New Project"**
3. Enter:
   - Project Name: "Test Warehouse"
   - Customer Name: "ABC Development"
4. Click **"Create Project"**

## Step 4: Build a Schedule

1. Click **"Schedule"** next to your project
2. When prompted, enter:
   - Start Date: 2026-02-01
   - End Date: 2026-05-31
3. Click **"+ Add Phase"**
4. Enter first phase:
   - Phase Name: "Underground"
   - Start Date: 2026-02-01
   - End Date: 2026-03-15
   - Total Man-Hours: 640
   - Crew Type: Fitters
5. Click **"Add Phase"**
6. Repeat for more phases:
   - **Rough-In**: 2026-03-16 to 2026-05-10, 1200 hours
   - **Trim & Test**: 2026-05-11 to 2026-05-31, 400 hours

## Step 5: View Forecast

1. Click **"View Forecast →"** in the schedule editor
2. Toggle between **Weekly** and **Monthly** views
3. See your manpower distributed across time

## Step 6: View Company Forecast

1. Click **"Company Forecast"** in the top navigation
2. Set date range: 2026-02-01 to 2026-06-30
3. See aggregated manpower across all projects
4. Try filtering by project or crew type
5. Click **"Export Forecast CSV"** to download data

## Next Steps

- Create more projects
- Add different crew types to phases
- Compare multiple projects in the company forecast
- Export data for analysis in Excel

## Troubleshooting

**Backend error**: Make sure virtual environment is activated
**Frontend error**: Delete `node_modules` and run `npm install` again
**Can't connect**: Check both servers are running on correct ports

## Need Help?

- API Documentation: http://localhost:8001/docs
- Full README: See README.md in the project root
