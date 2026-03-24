"""
Unallocated Manpower Report PDF Export
Generates a report of projects with required manpower not yet allocated.
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import datetime
import io
from database import get_db
from api.auth import get_current_active_user
import models

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import math
import os

from api.pdf_colors import COLORS

router = APIRouter(prefix="/api/export", tags=["export"])


class ManpowerNeedsPDF:
    """Professional Unallocated Manpower Report PDF Generator"""

    def __init__(self, page_size=letter):
        self.page_size = page_size
        self.width, self.height = page_size
        self.margin_left = 0.5 * inch
        self.margin_right = 0.5 * inch
        self.margin_top = 0.6 * inch
        self.margin_bottom = 0.8 * inch

        self.col_widths = {
            'project_name': 2.2 * inch,
            'project_number': 0.85 * inch,
            'customer': 1.5 * inch,
            'start': 0.8 * inch,
            'end': 0.8 * inch,
            'men_required': 0.75 * inch,
            'status': 0.75 * inch,
            'out_of_town': 0.65 * inch,
        }

        self.row_height = 18
        self.buffer = io.BytesIO()
        self.canvas = canvas.Canvas(self.buffer, pagesize=self.page_size)
        self.page_number = 0
        self.total_pages = 1

    def draw_header(self, run_date: str, logo_path: str = None):
        c = self.canvas
        y = self.height - self.margin_top + 20

        logo_width = 0
        if logo_path and os.path.exists(logo_path):
            try:
                logo_height = 30
                img = ImageReader(logo_path)
                img_w, img_h = img.getSize()
                logo_width = logo_height * (img_w / img_h)
                c.drawImage(logo_path, self.margin_left, y - 15,
                            width=logo_width, height=logo_height, preserveAspectRatio=True)
                logo_width += 10
            except Exception:
                logo_width = 0

        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLORS['text_primary'])
        c.drawString(self.margin_left + logo_width, y, "Unallocated Manpower Report")

        c.setFont("Helvetica", 9)
        c.setFillColor(COLORS['text_secondary'])
        c.drawRightString(self.width - self.margin_right, y, f"Page {self.page_number} of {self.total_pages}")
        c.drawRightString(self.width - self.margin_right, y - 12, f"Run Date: {run_date}")
        c.drawString(self.margin_left + logo_width, y - 15,
                     "Projects requiring manpower assignment — active and prospective jobs only")

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
            ('Project Name', self.col_widths['project_name']),
            ('Project #', self.col_widths['project_number']),
            ('Customer', self.col_widths['customer']),
            ('Start', self.col_widths['start']),
            ('End', self.col_widths['end']),
            ('Men Req.', self.col_widths['men_required']),
            ('Status', self.col_widths['status']),
            ('Out of Town', self.col_widths['out_of_town']),
        ]
        for header, width in headers:
            c.drawString(x, text_y, header)
            x += width

        return y_pos - header_height

    def draw_data_row(self, y_pos: float, project, row_index: int):
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

        def truncate(s, col_key):
            s = str(s) if s else '—'
            max_chars = int(self.col_widths[col_key] / 4.5)
            return s[:max_chars - 2] + '..' if len(s) > max_chars else s

        c.drawString(x, text_y, truncate(project.name, 'project_name'))
        x += self.col_widths['project_name']

        c.drawString(x, text_y, truncate(project.project_number or '—', 'project_number'))
        x += self.col_widths['project_number']

        c.drawString(x, text_y, truncate(project.customer_name or '—', 'customer'))
        x += self.col_widths['customer']

        c.drawString(x, text_y, project.start_date.strftime('%d-%b-%y') if project.start_date else '—')
        x += self.col_widths['start']

        c.drawString(x, text_y, project.end_date.strftime('%d-%b-%y') if project.end_date else '—')
        x += self.col_widths['end']

        c.drawRightString(x + self.col_widths['men_required'] - 4, text_y,
                          str(project.required_manpower or 0))
        x += self.col_widths['men_required']

        c.drawString(x, text_y, project.status.capitalize())
        x += self.col_widths['status']

        c.drawString(x, text_y, 'Yes' if project.is_out_of_town else '')

        return y_pos - self.row_height

    def draw_summary_row(self, y_pos: float, total_men: int):
        c = self.canvas
        c.setFillColor(COLORS['subheader_bg'])
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 9)
        text_y = y_pos - self.row_height + 5

        c.drawString(self.margin_left + 4, text_y,
                     f"TOTAL — {total_men} men required across {self._project_count} projects")

        return y_pos - self.row_height

    def draw_footer(self):
        c = self.canvas
        y = self.margin_bottom - 20
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.5)
        c.line(self.margin_left, y + 15, self.width - self.margin_right, y + 15)
        c.setFont("Helvetica", 8)
        c.setFillColor(COLORS['text_secondary'])
        c.drawCentredString(self.width / 2, y, "BFPE International — Unallocated Manpower Report")

    def generate(self, projects: list):
        run_date = datetime.now().strftime('%B %d, %Y')
        logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                 'frontend', 'bfpe_logo.png')

        self._project_count = len(projects)
        total_men = sum(p.required_manpower or 0 for p in projects)

        rows_per_page = int((self.height - self.margin_top - self.margin_bottom - 80) / self.row_height)
        self.total_pages = max(1, math.ceil((len(projects) + 1) / rows_per_page))

        self.page_number = 1
        self.canvas.setTitle("Unallocated Manpower Report")
        self.draw_header(run_date, logo_path)

        content_top = self.height - self.margin_top - 30
        y = self.draw_table_header(content_top)

        for i, project in enumerate(projects):
            if y - self.row_height < self.margin_bottom + 40:
                self.draw_footer()
                self.canvas.showPage()
                self.page_number += 1
                self.draw_header(run_date, logo_path)
                y = self.draw_table_header(content_top)

            y = self.draw_data_row(y, project, i)

        y = self.draw_summary_row(y, total_men)
        self.draw_footer()
        self.canvas.save()
        self.buffer.seek(0)
        return self.buffer


@router.get("/pdf/manpower-needs")
def export_manpower_needs_pdf(
    project_ids: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Export unallocated manpower report as a professional PDF."""
    query = db.query(models.Project).filter(
        models.Project.status.in_(['active', 'prospective']),
        models.Project.required_manpower > 0,
        models.Project.manpower_allocated == False
    )
    if project_ids:
        ids = [int(i) for i in project_ids.split(',') if i.strip().isdigit()]
        if ids:
            query = query.filter(models.Project.id.in_(ids))
    projects = query.order_by(models.Project.status, models.Project.name).all()

    pdf_generator = ManpowerNeedsPDF(page_size=letter)
    pdf_buffer = pdf_generator.generate(projects=projects)

    return Response(
        pdf_buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Unallocated_Manpower_Report.pdf"}
    )
