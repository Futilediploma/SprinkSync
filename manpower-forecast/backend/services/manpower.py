"""Manpower calculation and forecasting service."""
from typing import List, Dict, Tuple
from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
import calendar
import models


def get_working_days(start_date: date, end_date: date) -> List[date]:
    """
    Returns list of weekdays (Mon-Fri) between start and end (inclusive).
    
    v1: Simple weekday filter
    v2: Honor company holidays, custom work calendars
    """
    days = []
    current = start_date
    
    while current <= end_date:
        # 0 = Monday, 6 = Sunday
        if current.weekday() < 5:  # Monday to Friday
            days.append(current)
        current += timedelta(days=1)
    
    return days


def calculate_phase_daily_manpower(phase: models.SchedulePhase) -> List[Dict]:
    """
    Distribute a phase's man-hours evenly across its duration.
    
    Returns: List of daily manpower records
    """
    # Step 1: Determine total man-hours
    if phase.estimated_man_hours:
        total_hours = float(phase.estimated_man_hours)
    elif phase.crew_size:
        # Convert crew size to total hours
        duration_days = (phase.end_date - phase.start_date).days + 1
        total_hours = float(phase.crew_size) * 8 * duration_days  # 8 hrs/day
    else:
        raise ValueError("Phase must have man-hours or crew size")
    
    # Step 2: Calculate working days (exclude weekends)
    working_days = get_working_days(phase.start_date, phase.end_date)
    num_working_days = len(working_days)
    
    if num_working_days == 0:
        return []
    
    # Step 3: Evenly distribute hours across working days
    hours_per_day = total_hours / num_working_days
    
    # Step 4: Build daily records
    daily_records = []
    for day in working_days:
        daily_records.append({
            'date': day,
            'man_hours': Decimal(str(round(hours_per_day, 2))),
            'phase_id': phase.id,
            'project_id': phase.schedule.project_id,
            'crew_type_id': phase.crew_type_id
        })
    
    return daily_records


def aggregate_manpower_by_week(daily_records: List[Dict]) -> List[Dict]:
    """
    Roll up daily hours into weekly totals.
    Week starts on Monday (ISO week).
    """
    weekly = defaultdict(lambda: {
        'man_hours': Decimal('0'), 
        'crew_types': defaultdict(lambda: Decimal('0')),
        'week_start': None
    })
    
    for record in daily_records:
        # Get ISO week: (year, week_number)
        year, week_num, _ = record['date'].isocalendar()
        week_key = f"{year}-W{week_num:02d}"
        
        # Calculate week start (Monday)
        if weekly[week_key]['week_start'] is None:
            # Get the Monday of this ISO week
            jan_4 = date(year, 1, 4)
            week_1_monday = jan_4 - timedelta(days=jan_4.weekday())
            week_start = week_1_monday + timedelta(weeks=week_num - 1)
            weekly[week_key]['week_start'] = week_start
        
        weekly[week_key]['man_hours'] += record['man_hours']
        
        if record.get('crew_type_id'):
            weekly[week_key]['crew_types'][record['crew_type_id']] += record['man_hours']
    
    # Convert to list, sorted by week
    result = []
    for week, data in sorted(weekly.items()):
        result.append({
            'week': week,
            'week_start': data['week_start'],
            'man_hours': round(data['man_hours'], 2),
            'crew_breakdown': {k: round(v, 2) for k, v in data['crew_types'].items()}
        })
    
    return result


def aggregate_manpower_by_month(daily_records: List[Dict]) -> List[Dict]:
    """
    Roll up daily hours into monthly totals.
    """
    monthly = defaultdict(lambda: {
        'man_hours': Decimal('0'), 
        'crew_types': defaultdict(lambda: Decimal('0'))
    })
    
    for record in daily_records:
        month_key = record['date'].strftime('%Y-%m')  # "2026-03"
        
        monthly[month_key]['man_hours'] += record['man_hours']
        
        if record.get('crew_type_id'):
            monthly[month_key]['crew_types'][record['crew_type_id']] += record['man_hours']
    
    # Convert to list, sorted by month
    result = []
    for month, data in sorted(monthly.items()):
        # Parse month for display name
        year, month_num = map(int, month.split('-'))
        month_name = f"{calendar.month_name[month_num]} {year}"
        
        result.append({
            'month': month,
            'month_name': month_name,
            'man_hours': round(data['man_hours'], 2),
            'crew_breakdown': {k: round(v, 2) for k, v in data['crew_types'].items()}
        })
    
    return result


def calculate_project_contributions(daily_records: List[Dict]) -> List[Dict]:
    """
    Calculate total man-hours per project.
    """
    project_totals = defaultdict(lambda: Decimal('0'))
    
    for record in daily_records:
        project_totals[record['project_id']] += record['man_hours']
    
    return project_totals


def generate_forecast(
    phases: List[models.SchedulePhase],
    start_date: date,
    end_date: date,
    granularity: str = 'weekly'
) -> Dict:
    """
    Generate manpower forecast from list of phases.
    
    Args:
        phases: List of schedule phases
        start_date: Forecast start date
        end_date: Forecast end date
        granularity: 'daily', 'weekly', or 'monthly'
    
    Returns:
        Forecast data dictionary
    """
    # Step 1: Calculate daily manpower for each phase
    all_daily_records = []
    project_names = {}
    
    for phase in phases:
        try:
            daily_records = calculate_phase_daily_manpower(phase)
            all_daily_records.extend(daily_records)
            # Store project name for later
            if phase.schedule.project_id not in project_names:
                project_names[phase.schedule.project_id] = phase.schedule.project.name
        except ValueError:
            # Skip phases with invalid data
            continue
    
    # Step 2: Filter to requested date range
    all_daily_records = [
        r for r in all_daily_records
        if start_date <= r['date'] <= end_date
    ]
    
    # Step 3: Aggregate based on granularity
    weekly_forecast = []
    monthly_forecast = []
    
    if granularity in ['weekly', 'monthly']:
        weekly_forecast = aggregate_manpower_by_week(all_daily_records)
    
    if granularity == 'monthly':
        monthly_forecast = aggregate_manpower_by_month(all_daily_records)
    
    # Step 4: Calculate project contributions
    project_totals = calculate_project_contributions(all_daily_records)
    projects_included = [
        {
            'id': project_id,
            'name': project_names.get(project_id, 'Unknown'),
            'man_hours': float(round(hours, 2))
        }
        for project_id, hours in sorted(project_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Step 5: Build response
    total_hours = sum(r['man_hours'] for r in all_daily_records)
    
    return {
        'start_date': start_date,
        'end_date': end_date,
        'total_man_hours': float(round(total_hours, 2)),
        'project_count': len(project_totals),
        'weekly_forecast': weekly_forecast if granularity in ['weekly', 'monthly'] else [],
        'monthly_forecast': monthly_forecast if granularity == 'monthly' else [],
        'projects_included': projects_included
    }
