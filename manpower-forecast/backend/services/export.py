"""Export service for generating CSV files."""
import pandas as pd
from typing import List, Dict
from io import StringIO


def generate_forecast_csv(forecast_data: Dict, granularity: str = 'weekly') -> str:
    """
    Generate CSV from forecast data.
    
    Args:
        forecast_data: Forecast dictionary
        granularity: 'weekly' or 'monthly'
    
    Returns:
        CSV string
    """
    if granularity == 'weekly':
        data = forecast_data.get('weekly_forecast', [])
        df = pd.DataFrame(data)
        if not df.empty:
            df = df[['week', 'week_start', 'man_hours']]
            df.columns = ['Week', 'Week Start', 'Man Hours']
    else:
        data = forecast_data.get('monthly_forecast', [])
        df = pd.DataFrame(data)
        if not df.empty:
            df = df[['month', 'month_name', 'man_hours']]
            df.columns = ['Month', 'Month Name', 'Man Hours']
    
    # Convert to CSV
    output = StringIO()
    df.to_csv(output, index=False)
    return output.getvalue()


def generate_project_breakdown_csv(projects: List[Dict]) -> str:
    """
    Generate CSV of project contributions.
    
    Args:
        projects: List of project contribution dicts
    
    Returns:
        CSV string
    """
    df = pd.DataFrame(projects)
    if not df.empty:
        df = df[['name', 'man_hours']]
        df.columns = ['Project Name', 'Man Hours']
    
    output = StringIO()
    df.to_csv(output, index=False)
    return output.getvalue()
