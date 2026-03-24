"""
Subcontractor Labor Report PDF Export
Generates per-subcontractor labor detail reports.
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
import io
from database import get_db
from api.auth import get_current_active_user
import crud
import models

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import math
import os

from api.pdf_colors import COLORS

router = APIRouter(prefix="/api/export", tags=["export"])


class SubcontractorReportPDF:
    """Professional Subcontractor Labor Report PDF Generator"""

    def __init__(self, page_size=letter):
        self.page_size = page_size
        self.width, self.height = page_size
        self.margin_left = 0.5 * inch
        self.margin_right = 0.5 * inch
        self.margin_top = 0.6 * inch
        self.margin_bottom = 0.8 * inch

        self.col_widths = {
            'project_name': 2.0 * inch,
            'project_number': 0.9 * inch,
            'labor_type': 0.9 * inch,
            'start': 0.85 * inch,
            'end': 0.85 * inch,
            'hours': 0.9 * inch,
            'men_required': 0.7 * inch,
        }

        self.row_height = 18
        self.buffer = io.BytesIO()
        self.canvas = canvas.Canvas(self.buffer, pagesize=self.page_size)
        self.page_number = 0
        self.total_pages = 1

    def calculate_work_days(self, start_date: date, end_date: date) -> int:
        """Calculate number of business days (Mon-Fri) between two dates."""
        if not start_date or not end_date:
            return 0
        work_days = 0
        current = start_date
        while current <= end_date:
            if current.weekday() < 5:
                work_days += 1
            current += timedelta(days=1)
        return max(work_days, 1)

    def draw_header(self, subcontractor_name: str, date_range: str, run_date: str, logo_path: str = None):
        c = self.canvas
        y = self.height - self.margin_top + 20

        logo_width = 0
        if logo_path and os.path.exists(logo_path):
            try:
                logo_height = 30
                img = ImageReader(logo_path)
                img_width, img_height = img.getSize()
                aspect = img_width / img_height
                logo_width = logo_height * aspect
                c.drawImage(logo_path, self.margin_left, y - 15,
                           width=logo_width, height=logo_height, preserveAspectRatio=True)
                logo_width += 10
            except Exception:
                logo_width = 0

        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLORS['text_primary'])
        c.drawString(self.margin_left + logo_width, y, f"Subcontractor Labor Report: {subcontractor_name}")

        c.setFont("Helvetica", 9)
        c.setFillColor(COLORS['text_secondary'])
        c.drawRightString(self.width - self.margin_right, y, f"Page {self.page_number} of {self.total_pages}")
        c.drawRightString(self.width - self.margin_right, y - 12, f"Run Date: {run_date}")

        if date_range:
            c.drawString(self.margin_left + logo_width, y - 15, f"Period: {date_range}")

        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(1)
        c.line(self.margin_left, y - 25, self.width - self.margin_right, y - 25)

    def draw_table_header(self, y_pos: float):
        c = self.canvas
        header_height = 25

        c.setFillColor(COLORS['header_bg'])
        c.rect(self.margin_left, y_pos - header_height,
               self.width - self.margin_left - self.margin_right, header_height, fill=1, stroke=0)

        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 8)

        x = self.margin_left + 4
        text_y = y_pos - header_height / 2 - 3

        headers = [
            ('Project', self.col_widths['project_name']),
            ('Project #', self.col_widths['project_number']),
            ('Labor Type', self.col_widths['labor_type']),
            ('Start', self.col_widths['start']),
            ('End', self.col_widths['end']),
            ('Man-Hours', self.col_widths['hours']),
            ('Men Req.', self.col_widths['men_required']),
        ]

        for header, width in headers:
            c.drawString(x, text_y, header)
            x += width

        return y_pos - header_height

    def draw_data_row(self, y_pos: float, row_data: dict, row_index: int):
        c = self.canvas

        bg_color = COLORS['row_alt'] if row_index % 2 == 0 else COLORS['row_normal']
        c.setFillColor(bg_color)
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.3)
        c.line(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_right, y_pos - self.row_height)

        c.setFillColor(COLORS['text_primary'])
        c.setFont("Helvetica", 8)

        x = self.margin_left + 4
        text_y = y_pos - self.row_height + 5

        name = row_data.get('project_name', '')
        max_chars = int(self.col_widths['project_name'] / 4.5)
        if len(name) > max_chars:
            name = name[:max_chars-2] + '..'
        c.drawString(x, text_y, name)
        x += self.col_widths['project_name']

        c.drawString(x, text_y, row_data.get('project_number', '') or '')
        x += self.col_widths['project_number']

        c.drawString(x, text_y, row_data.get('labor_type', '').capitalize())
        x += self.col_widths['labor_type']

        start_date = row_data.get('start_date')
        if start_date:
            c.drawString(x, text_y, start_date.strftime('%d-%b-%y'))
        x += self.col_widths['start']

        end_date = row_data.get('end_date')
        if end_date:
            c.drawString(x, text_y, end_date.strftime('%d-%b-%y'))
        x += self.col_widths['end']

        hours = row_data.get('man_hours', 0)
        c.drawRightString(x + self.col_widths['hours'] - 4, text_y, f"{float(hours):,.1f}")
        x += self.col_widths['hours']

        men_required = row_data.get('men_required', 0)
        c.drawRightString(x + self.col_widths['men_required'] - 4, text_y, f"{float(men_required):,.1f}")

        return y_pos - self.row_height

    def draw_summary_row(self, y_pos: float, total_hours: float):
        c = self.canvas

        c.setFillColor(COLORS['subheader_bg'])
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 9)

        x = self.margin_left + 4
        text_y = y_pos - self.row_height + 5

        c.drawString(x, text_y, "TOTAL")

        total_x = (self.margin_left + self.col_widths['project_name'] +
                   self.col_widths['project_number'] + self.col_widths['labor_type'] +
                   self.col_widths['start'] + self.col_widths['end'] +
                   self.col_widths['hours'] - 4)
        c.drawRightString(total_x, text_y, f"{total_hours:,.1f}")

        return y_pos - self.row_height

    def draw_footer(self):
        c = self.canvas
        y = self.margin_bottom - 20

        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.5)
        c.line(self.margin_left, y + 15, self.width - self.margin_right, y + 15)

        c.setFont("Helvetica", 8)
        c.setFillColor(COLORS['text_secondary'])
        c.drawCentredString(self.width / 2, y, "BFPE International - Subcontractor Labor Report")

    def generate(self, subcontractor_name: str, projects_data: list, total_hours: float,
                 start_date: date = None, end_date: date = None):
        """Generate the complete PDF"""
        rows = []
        for project in projects_data:
            phases = project.get('phases', [])
            project_hours = float(project.get('total_project_hours', 0))

            proj_start = None
            proj_end = None
            if phases:
                start_dates = [p['start_date'] for p in phases if p.get('start_date')]
                end_dates = [p['end_date'] for p in phases if p.get('end_date')]
                if start_dates:
                    proj_start = min(start_dates)
                if end_dates:
                    proj_end = max(end_dates)

            work_days = self.calculate_work_days(proj_start, proj_end)
            men_required = project_hours / (work_days * 8) if work_days > 0 else 0

            rows.append({
                'project_name': project['project_name'],
                'project_number': project.get('project_number'),
                'labor_type': project['labor_type'],
                'start_date': proj_start,
                'end_date': proj_end,
                'man_hours': project_hours,
                'men_required': men_required
            })

        usable_height = self.height - self.margin_top - self.margin_bottom - 100
        rows_per_page = int(usable_height / self.row_height)
        self.total_pages = max(1, math.ceil((len(rows) + 1) / rows_per_page))

        run_date = datetime.now().strftime('%d-%b-%y %H:%M')
        date_range = ""
        if start_date and end_date:
            date_range = f"{start_date.strftime('%d-%b-%y')} to {end_date.strftime('%d-%b-%y')}"

        row_index = 0
        for page in range(self.total_pages):
            self.page_number = page + 1

            if page > 0:
                self.canvas.showPage()

            logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                    'frontend', 'bfpe_logo.png')

            self.draw_header(subcontractor_name, date_range, run_date, logo_path)

            y_pos = self.height - self.margin_top - 30
            y_pos = self.draw_table_header(y_pos)

            row_count = 0
            while row_index < len(rows) and row_count < rows_per_page - 1:
                y_pos = self.draw_data_row(y_pos, rows[row_index], row_count)
                row_index += 1
                row_count += 1

            if row_index >= len(rows):
                y_pos = self.draw_summary_row(y_pos, float(total_hours))

            self.draw_footer()

        self.canvas.save()
        self.buffer.seek(0)
        return self.buffer


@router.get("/pdf/subcontractor/{subcontractor_name}")
def export_subcontractor_pdf(
    subcontractor_name: str,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Export subcontractor labor report as PDF."""
    from api.subcontractor_reports import VALID_SUBCONTRACTORS
    from decimal import Decimal

    if subcontractor_name not in VALID_SUBCONTRACTORS:
        return Response(status_code=400, content="Invalid subcontractor name")

    project_assignments = crud.get_projects_by_subcontractor(
        db, subcontractor_name, start_date, end_date
    )

    total_hours = Decimal('0')
    projects_data = []

    for project, labor_type in project_assignments:
        phases = crud.get_project_phases_for_labor_type(
            db, project.id, labor_type, start_date, end_date
        )

        phases_info = []
        project_hours = Decimal('0')

        for phase in phases:
            if phase.estimated_man_hours:
                phase_hours = Decimal(str(phase.estimated_man_hours))
            elif phase.crew_size:
                duration_days = (phase.end_date - phase.start_date).days + 1
                phase_hours = Decimal(str(phase.crew_size)) * Decimal('8') * Decimal(str(duration_days))
            else:
                phase_hours = Decimal('0')

            project_hours += phase_hours
            phases_info.append({
                "phase_name": phase.phase_name,
                "start_date": phase.start_date,
                "end_date": phase.end_date,
                "man_hours": phase_hours
            })

        total_hours += project_hours

        projects_data.append({
            "project_name": project.name,
            "project_number": project.project_number,
            "labor_type": labor_type,
            "phases": phases_info,
            "total_project_hours": project_hours
        })

    pdf_generator = SubcontractorReportPDF(page_size=letter)
    pdf_buffer = pdf_generator.generate(
        subcontractor_name=subcontractor_name,
        projects_data=projects_data,
        total_hours=float(total_hours),
        start_date=start_date,
        end_date=end_date
    )

    filename = f"{subcontractor_name.replace(' ', '_')}_labor_report.pdf"

    return Response(
        pdf_buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
