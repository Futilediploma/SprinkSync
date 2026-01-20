from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import date
import io
from database import get_db
from api.auth import get_current_active_user
import crud
import models
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Export all project data, man-hours, and a Gantt chart as a PDF.
    """
    # Get all projects
    projects = crud.get_all_projects(db)
    # Get all phases for Gantt
    phases = crud.get_all_phases(db)

    # Prepare Gantt chart data
    fig, ax = plt.subplots(figsize=(10, 6))
    yticks = []
    ylabels = []
    for i, project in enumerate(projects):
        project_phases = [p for p in phases if p.schedule.project_id == project.id]
        for phase in project_phases:
            ax.barh(i, (phase.end_date - phase.start_date).days, left=(phase.start_date - project.start_date).days, height=0.4)
        yticks.append(i)
        ylabels.append(project.name)
    ax.set_yticks(yticks)
    ax.set_yticklabels(ylabels)
    ax.set_xlabel('Days from project start')
    ax.set_title('Project Gantt Chart')
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)

    # Create PDF
    pdf_buf = io.BytesIO()
    c = canvas.Canvas(pdf_buf, pagesize=landscape(letter))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(30, 550, "All Projects - Manpower & Gantt Chart")
    c.setFont("Helvetica", 10)
    y = 520
    for project in projects:
        project_phases = [p for p in phases if p.schedule.project_id == project.id]
        total_man_hours = sum(getattr(phase, 'man_hours', 0) for phase in project_phases)
        c.drawString(30, y, f"Project: {project.name} | Start: {project.start_date} | End: {project.end_date} | Man Hours: {total_man_hours}")
        y -= 15
        if y < 100:
            c.showPage()
            y = 550
    # Insert Gantt chart
    c.drawImage(ImageReader(buf), 350, 100, width=400, height=400)
    c.save()
    pdf_buf.seek(0)
    return Response(pdf_buf.read(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=all_projects_gantt.pdf"})
