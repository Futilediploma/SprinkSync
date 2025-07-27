from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_financials():
    """Get financial overview"""
    return {
        "message": "Financials endpoint",
        "budget_summary": {
            "total_budget": 1500000,
            "spent_to_date": 800000,
            "remaining": 700000,
            "variance": -50000
        },
        "cost_breakdown": [
            {"category": "Materials", "budgeted": 600000, "actual": 620000},
            {"category": "Labor", "budgeted": 500000, "actual": 480000},
            {"category": "Equipment", "budgeted": 200000, "actual": 150000},
            {"category": "Permits", "budgeted": 50000, "actual": 55000}
        ]
    }

@router.get("/sov")
def get_schedule_of_values():
    """Get Schedule of Values (SOV)"""
    return {
        "message": "Schedule of Values",
        "total_contract_value": 1500000,
        "line_items": [
            {"item": "Site Preparation", "original_value": 100000, "current_value": 105000, "percent_complete": 100},
            {"item": "Foundation", "original_value": 300000, "current_value": 300000, "percent_complete": 90},
            {"item": "Framing", "original_value": 400000, "current_value": 420000, "percent_complete": 60},
            {"item": "Electrical", "original_value": 200000, "current_value": 200000, "percent_complete": 30},
            {"item": "Plumbing", "original_value": 150000, "current_value": 150000, "percent_complete": 25},
            {"item": "Finishes", "original_value": 350000, "current_value": 350000, "percent_complete": 10}
        ]
    }
