from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_documents():
    """Get document overview"""
    return {
        "message": "Documents endpoint",
        "document_categories": [
            {"category": "Plans", "count": 45, "last_updated": "2024-01-15"},
            {"category": "Specifications", "count": 23, "last_updated": "2024-01-10"},
            {"category": "RFIs", "count": 8, "last_updated": "2024-01-18"},
            {"category": "Submittals", "count": 12, "last_updated": "2024-01-16"},
            {"category": "Change Orders", "count": 3, "last_updated": "2024-01-17"},
            {"category": "Photos", "count": 156, "last_updated": "2024-01-18"}
        ]
    }

@router.get("/drawings")
def get_drawings():
    """Get construction drawings"""
    return {
        "message": "Construction Drawings",
        "drawings": [
            {"id": "A-001", "title": "Site Plan", "revision": "3", "date": "2024-01-15"},
            {"id": "A-101", "title": "Foundation Plan", "revision": "2", "date": "2024-01-12"},
            {"id": "A-201", "title": "Floor Plan - Level 1", "revision": "4", "date": "2024-01-16"},
            {"id": "A-301", "title": "Exterior Elevations", "revision": "1", "date": "2024-01-10"},
            {"id": "S-101", "title": "Structural Foundation", "revision": "2", "date": "2024-01-14"},
            {"id": "M-101", "title": "Mechanical Plan", "revision": "1", "date": "2024-01-11"}
        ]
    }
