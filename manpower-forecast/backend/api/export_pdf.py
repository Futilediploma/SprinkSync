"""
Professional Construction Schedule PDF Export
Generates GC-style Gantt chart PDFs matching industry standard construction schedules
"""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional, List
import io
from database import get_db
from api.auth import get_current_active_user
import crud
import models

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import math
import os

router = APIRouter(prefix="/api/export", tags=["export"])

# Professional color scheme matching GC schedules
COLORS = {
    'header_bg': HexColor('#1a365d'),          # Dark blue header
    'header_text': white,
    'subheader_bg': HexColor('#2d3748'),       # Darker gray
    'row_alt': HexColor('#f7fafc'),            # Light gray alternating rows
    'row_normal': white,
    'grid_line': HexColor('#e2e8f0'),          # Light grid lines
    'text_primary': HexColor('#1a202c'),       # Dark text
    'text_secondary': HexColor('#718096'),     # Gray text
    'bar_actual': HexColor('#38a169'),         # Green - actual/completed work
    'bar_remaining': HexColor('#3182ce'),      # Blue - remaining work
    'bar_critical': HexColor('#e53e3e'),       # Red - critical path
    'bar_summary': HexColor('#1a202c'),        # Black - summary bars
    'milestone': HexColor('#805ad5'),          # Purple - milestones
    'phase_header': HexColor('#667eea'),       # Purple gradient header
}


class GanttChartPDF:
    """Professional GC-style Gantt Chart PDF Generator"""

    def __init__(self, page_size=landscape(letter)):
        self.page_size = page_size
        self.width, self.height = page_size
        self.margin_left = 0.5 * inch
        self.margin_right = 0.5 * inch
        self.margin_top = 0.6 * inch
        self.margin_bottom = 0.8 * inch

        # Table column configuration (left side) - combined trade columns
        self.col_widths = {
            'activity_name': 1.5 * inch,
            'project_number': 0.6 * inch,
            'sprinkler': 0.85 * inch,  # Combined BFPE + Sub
            'vesda': 0.85 * inch,       # Combined BFPE + Sub
            'electrical': 0.85 * inch,  # Combined BFPE + Sub
            'duration': 0.4 * inch,
            'start': 0.7 * inch,
            'finish': 0.7 * inch,
        }
        self.show_bfpe = False  # Will be set in generate()
        self._update_table_width()

    def _update_table_width(self):
        """Recalculate table width"""
        self.table_width = (self.col_widths['activity_name'] + self.col_widths['project_number'] +
                           self.col_widths['sprinkler'] + self.col_widths['vesda'] +
                           self.col_widths['electrical'] + self.col_widths['duration'] +
                           self.col_widths['start'] + self.col_widths['finish'])
        # Gantt chart area (right side)
        self.gantt_start_x = self.margin_left + self.table_width + 0.1 * inch
        self.gantt_width = self.width - self.gantt_start_x - self.margin_right

        # Row configuration
        self.row_height = 18

        self.buffer = io.BytesIO()
        self.canvas = canvas.Canvas(self.buffer, pagesize=self.page_size)
        self.page_number = 0
        self.total_pages = 1

    def draw_header(self, project_name: str, run_date: str, logo_path: str = None,
                     subcontractor_name: str = None):
        """Draw the page header with project info and logo"""
        c = self.canvas
        y = self.height - self.margin_top + 20

        # Draw logo if available
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
                logo_width += 10  # Add spacing after logo
            except Exception:
                logo_width = 0

        # Project title (after logo)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLORS['text_primary'])
        c.drawString(self.margin_left + logo_width, y, project_name)

        # Subcontractor/Company name box (yellow highlight)
        title_width = c.stringWidth(project_name, "Helvetica-Bold", 14)
        box_x = self.margin_left + logo_width + title_width + 10
        display_name = subcontractor_name if subcontractor_name else "BFPE"
        c.setFillColor(HexColor('#fef08a'))  # Yellow background
        name_width = c.stringWidth(display_name, "Helvetica-Bold", 12) + 16
        c.rect(box_x, y - 5, name_width, 20, fill=1, stroke=0)
        c.setFillColor(COLORS['text_primary'])
        c.setFont("Helvetica-Bold", 12)
        c.drawString(box_x + 8, y, display_name)

        # Page info on the right
        c.setFont("Helvetica", 9)
        c.setFillColor(COLORS['text_secondary'])
        page_info = f"Page {self.page_number} of {self.total_pages}"
        c.drawRightString(self.width - self.margin_right, y, page_info)

        # Run date
        c.drawRightString(self.width - self.margin_right, y - 12, f"Run Date {run_date}")

        # Horizontal line under header
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(1)
        c.line(self.margin_left, y - 20, self.width - self.margin_right, y - 20)

    def draw_column_headers(self, y_pos: float, min_date: date, max_date: date):
        """Draw the unified header row with column headers and timeline"""
        c = self.canvas
        header_height = 40

        # Draw unified header background spanning full width
        c.setFillColor(COLORS['header_bg'])
        c.rect(self.margin_left, y_pos - header_height,
               self.width - self.margin_left - self.margin_right, header_height, fill=1, stroke=0)

        # Column header text
        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 9)

        x = self.margin_left + 8
        text_y = y_pos - header_height / 2 - 3

        # Single-line headers
        single_headers = [
            ('Project Name', self.col_widths['activity_name']),
            ('Job #', self.col_widths['project_number']),
        ]

        for header, width in single_headers:
            c.drawString(x, text_y, header)
            x += width

        # Combined trade columns (BFPE + Sub stacked)
        c.setFont("Helvetica-Bold", 8)
        trade_headers = [
            ('Sprinkler', self.col_widths['sprinkler']),
            ('VESDA', self.col_widths['vesda']),
            ('Electrical', self.col_widths['electrical']),
        ]

        for header, width in trade_headers:
            c.drawString(x, text_y, header)
            x += width

        # Remaining single-line headers
        c.setFont("Helvetica-Bold", 9)
        remaining_headers = [
            ('Days', self.col_widths['duration']),
            ('Start', self.col_widths['start']),
            ('Finish', self.col_widths['finish']),
        ]

        for header, width in remaining_headers:
            c.drawString(x, text_y, header)
            x += width

        # Draw timeline with monthly markers
        total_days = (max_date - min_date).days
        if total_days <= 0:
            total_days = 30

        # Generate list of first-of-month dates within range
        months = []
        current = date(min_date.year, min_date.month, 1)
        while current <= max_date:
            if current >= min_date:
                months.append(current)
            # Move to next month
            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)

        # Draw month labels (rotated vertically)
        c.setFont("Helvetica", 7)
        c.setFillColor(COLORS['header_text'])

        for month_date in months:
            days_from_start = (month_date - min_date).days
            x_pos = self.gantt_start_x + (days_from_start / total_days) * self.gantt_width

            if x_pos >= self.gantt_start_x and x_pos <= self.gantt_start_x + self.gantt_width:
                # Draw rotated month label
                label = month_date.strftime("%b %y")
                c.saveState()
                c.translate(x_pos + 3, y_pos - header_height + 8)
                c.rotate(90)
                c.drawString(0, 0, label)
                c.restoreState()

        # Draw thin line at bottom of header
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(1)
        c.line(self.margin_left, y_pos - header_height,
               self.width - self.margin_right, y_pos - header_height)

        return y_pos - header_height

    def draw_activity_row(self, y_pos: float, activity: dict, row_index: int,
                          min_date: date, max_date: date, is_summary: bool = False):
        """Draw a single activity row with Gantt bar"""
        c = self.canvas

        # Alternating row background
        bg_color = COLORS['row_alt'] if row_index % 2 == 0 else COLORS['row_normal']
        c.setFillColor(bg_color)
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        # Grid lines
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.3)
        c.line(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_right, y_pos - self.row_height)

        # Activity data columns
        c.setFillColor(COLORS['text_primary'])
        c.setFont("Helvetica", 8)

        x = self.margin_left + 4
        text_y = y_pos - self.row_height + 5

        # Project Name - with text wrapping
        name = activity.get('name', '')
        col_width = self.col_widths['activity_name']
        max_chars_per_line = int(col_width / 4.5)

        # Split name into lines if needed
        if len(name) <= max_chars_per_line:
            c.drawString(x, text_y, name)
        else:
            # Wrap text into two lines
            words = name.split()
            line1 = ""
            line2 = ""
            for word in words:
                test_line = line1 + " " + word if line1 else word
                if len(test_line) <= max_chars_per_line:
                    line1 = test_line
                else:
                    line2 = (line2 + " " + word if line2 else word)

            # Truncate line2 if needed
            if len(line2) > max_chars_per_line:
                line2 = line2[:max_chars_per_line-2] + '..'

            c.setFont("Helvetica", 7)  # Smaller font for wrapped text
            c.drawString(x, text_y + 4, line1)
            c.drawString(x, text_y - 4, line2)
            c.setFont("Helvetica", 8)
        x += self.col_widths['activity_name']

        # Project Number (Job #)
        project_number = activity.get('project_number', '') or ''
        c.drawString(x, text_y, str(project_number))
        x += self.col_widths['project_number']

        # Helper function to draw combined BFPE + Sub cell (BFPE on top, Sub below)
        def draw_combined_trade_cell(bfpe_count, sub_text, col_width, bg_color):
            nonlocal x
            has_content = (self.show_bfpe and bfpe_count > 0) or sub_text

            if has_content:
                c.setFillColor(bg_color)
                c.rect(x - 2, y_pos - self.row_height, col_width, self.row_height, fill=1, stroke=0)
                c.setFillColor(COLORS['text_primary'])

            c.setFont("Helvetica", 6)  # Smaller font to fit wrapped text
            max_chars = int(col_width / 3.5)  # Characters per line

            # Draw BFPE count on top line (only on full company report)
            if self.show_bfpe and bfpe_count > 0:
                c.drawString(x, text_y + 5, f"BFPE: {bfpe_count}")

            # Draw Sub info - wrap text if needed
            if sub_text:
                import re
                # Get project status and start date for headcount formatting
                proj_status = activity.get('project_status', 'active')
                proj_start = activity.get('start_date')
                # Use parentheses for prospective OR active projects that haven't started yet
                use_parens = (proj_status == 'prospective' or
                             (proj_status == 'active' and proj_start and proj_start > date.today()))

                # Try parentheses format first: "Name (5)"
                match = re.match(r'^(.+?)\s*\((\d+)\)$', sub_text)
                if match:
                    name_part = match.group(1)
                    hc_part = match.group(2)
                else:
                    # Try plain number format: "Name 5"
                    match = re.match(r'^(.+?)\s+(\d+)$', sub_text)
                    if match:
                        name_part = match.group(1)
                        hc_part = match.group(2)
                    else:
                        name_part = sub_text
                        hc_part = None

                # Calculate base Y position for sub text
                if self.show_bfpe and bfpe_count > 0:
                    sub_y = text_y - 3
                else:
                    sub_y = text_y + 3

                # Format headcount based on project status
                def format_hc(name, hc):
                    if hc:
                        if use_parens:
                            return f"{name} ({hc})"
                        else:
                            return f"{name} {hc}"
                    return name

                # Wrap the name if it's too long
                if len(name_part) <= max_chars:
                    # Single line - add headcount if present
                    c.drawString(x, sub_y, format_hc(name_part, hc_part))
                else:
                    # Wrap text into two lines
                    words = name_part.split()
                    line1 = ""
                    line2 = ""
                    for word in words:
                        test_line = line1 + " " + word if line1 else word
                        if len(test_line) <= max_chars:
                            line1 = test_line
                        else:
                            line2 = (line2 + " " + word if line2 else word)

                    # Draw line 1
                    c.drawString(x, sub_y, line1)
                    # Draw line 2 with headcount
                    if line2:
                        if len(line2) > max_chars - 4:
                            line2 = line2[:max_chars-5] + '..'
                        c.drawString(x, sub_y - 6, format_hc(line2, hc_part))
                    elif hc_part:
                        if use_parens:
                            c.drawString(x, sub_y - 6, f"({hc_part})")
                        else:
                            c.drawString(x, sub_y - 6, hc_part)

            c.setFont("Helvetica", 8)
            x += col_width

        # Sprinkler column (blue background)
        bfpe_sprinkler = activity.get('bfpe_sprinkler_headcount', 0) or 0
        sprinkler_sub = activity.get('sprinkler_sub', '')
        draw_combined_trade_cell(bfpe_sprinkler, sprinkler_sub, self.col_widths['sprinkler'], HexColor('#dbeafe'))

        # VESDA column (purple background)
        bfpe_vesda = activity.get('bfpe_vesda_headcount', 0) or 0
        vesda_sub = activity.get('vesda_sub', '')
        draw_combined_trade_cell(bfpe_vesda, vesda_sub, self.col_widths['vesda'], HexColor('#e9d5ff'))

        # Electrical column (yellow background)
        bfpe_electrical = activity.get('bfpe_electrical_headcount', 0) or 0
        electrical_sub = activity.get('electrical_sub', '')
        draw_combined_trade_cell(bfpe_electrical, electrical_sub, self.col_widths['electrical'], HexColor('#fef08a'))

        # Duration
        duration = activity.get('duration', 0)
        c.drawString(x + 2, text_y, str(duration) if duration else '')
        x += self.col_widths['duration']

        # Start Date
        start_date = activity.get('start_date')
        if start_date:
            c.drawString(x + 2, text_y, start_date.strftime('%d-%b-%y'))
        x += self.col_widths['start']

        # Finish Date
        end_date = activity.get('end_date')
        if end_date:
            c.drawString(x + 2, text_y, end_date.strftime('%d-%b-%y'))

        # Draw Gantt bar
        if start_date and end_date:
            self.draw_gantt_bar(y_pos, start_date, end_date, min_date, max_date,
                               activity.get('bar_type', 'remaining'),
                               activity.get('percent_complete', 0),
                               is_summary)

        return y_pos - self.row_height

    def draw_gantt_bar(self, y_pos: float, start_date: date, end_date: date,
                       min_date: date, max_date: date, bar_type: str,
                       percent_complete: float = 0, is_summary: bool = False):
        """Draw a Gantt bar"""
        c = self.canvas

        total_days = (max_date - min_date).days
        if total_days <= 0:
            return

        # Calculate bar position
        start_offset = (start_date - min_date).days
        bar_duration = (end_date - start_date).days

        if bar_duration <= 0:
            bar_duration = 1  # Minimum 1 day for milestones

        bar_x = self.gantt_start_x + (start_offset / total_days) * self.gantt_width
        bar_width = (bar_duration / total_days) * self.gantt_width

        # Ensure bar stays within bounds
        if bar_x < self.gantt_start_x:
            bar_width -= (self.gantt_start_x - bar_x)
            bar_x = self.gantt_start_x
        if bar_x + bar_width > self.gantt_start_x + self.gantt_width:
            bar_width = self.gantt_start_x + self.gantt_width - bar_x

        bar_height = 8
        bar_y = y_pos - self.row_height + 4

        # Choose color based on type
        if bar_type == 'actual':
            color = COLORS['bar_actual']
        elif bar_type == 'critical':
            color = COLORS['bar_critical']
        elif bar_type == 'summary':
            color = COLORS['bar_summary']
            bar_height = 6
        elif bar_type == 'milestone':
            # Draw diamond for milestone
            c.setFillColor(COLORS['milestone'])
            diamond_size = 6
            c.saveState()
            c.translate(bar_x, bar_y + bar_height/2)
            c.rotate(45)
            c.rect(-diamond_size/2, -diamond_size/2, diamond_size, diamond_size, fill=1, stroke=0)
            c.restoreState()
            return
        else:
            color = COLORS['bar_remaining']

        # Draw the bar
        c.setFillColor(color)

        if is_summary:
            # Summary bar style (bracket-like)
            c.rect(bar_x, bar_y + bar_height - 2, bar_width, 2, fill=1, stroke=0)
            # Left bracket
            c.rect(bar_x, bar_y, 2, bar_height, fill=1, stroke=0)
            # Right bracket
            c.rect(bar_x + bar_width - 2, bar_y, 2, bar_height, fill=1, stroke=0)
        else:
            # Regular bar
            c.roundRect(bar_x, bar_y, bar_width, bar_height, 2, fill=1, stroke=0)

            # Draw actual progress overlay if applicable
            if percent_complete > 0 and bar_type == 'remaining':
                progress_width = bar_width * (percent_complete / 100)
                c.setFillColor(COLORS['bar_actual'])
                c.roundRect(bar_x, bar_y, progress_width, bar_height, 2, fill=1, stroke=0)

    def draw_legend(self, y_pos: float):
        """Draw the legend at the bottom of the page"""
        c = self.canvas

        c.setFont("Helvetica", 8)
        x = self.margin_left
        y = y_pos

        # Single legend item for project duration
        c.setFillColor(COLORS['bar_remaining'])
        c.roundRect(x, y + 1, 20, 8, 2, fill=1, stroke=0)
        c.setFillColor(COLORS['text_secondary'])
        c.drawString(x + 25, y + 2, "Project Duration")

    def draw_footer(self):
        """Draw the page footer"""
        c = self.canvas
        y = self.margin_bottom - 20

        # Horizontal line above footer
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.5)
        c.line(self.margin_left, y + 15, self.width - self.margin_right, y + 15)

        # Company/schedule name centered
        c.setFont("Helvetica", 8)
        c.setFillColor(COLORS['text_secondary'])
        c.drawCentredString(self.width / 2, y, "BFPE International - Project Schedule")

    def generate(self, projects: list, phases: list,
                 project_name: str = "Project Schedule",
                 company_name: str = "",
                 subcontractor_filter: str = None,
                 project_subcontractors: dict = None):
        """Generate the complete PDF

        Args:
            projects: List of project objects
            phases: List of phase objects
            project_name: Title for the PDF
            company_name: Company name
            subcontractor_filter: Name of subcontractor being filtered (for header)
            project_subcontractors: Dict mapping project_id to list of {name, headcount} dicts
        """
        if project_subcontractors is None:
            project_subcontractors = {}

        # Sort projects alphabetically by name
        projects = sorted(projects, key=lambda p: p.name.lower())

        # Show BFPE columns only on full company report (no subcontractor filter)
        self.show_bfpe = (subcontractor_filter is None)
        self._update_table_width()

        # Prepare activity data
        activities = []
        all_dates = []

        for project in projects:
            # Add project as summary
            project_phases = [p for p in phases if p.schedule.project_id == project.id]

            if project_phases:
                project_start = min(p.start_date for p in project_phases if p.start_date)
                project_end = max(p.end_date for p in project_phases if p.end_date)
            else:
                project_start = project.start_date
                project_end = project.end_date

            # Get subcontractor info for this project, separated by labor type
            subs_info = project_subcontractors.get(project.id, [])

            # Build separate sub info for each labor type
            sprinkler_subs = [s for s in subs_info if s.get('labor_type') == 'sprinkler']
            vesda_subs = [s for s in subs_info if s.get('labor_type') == 'vesda']
            electrical_subs = [s for s in subs_info if s.get('labor_type') == 'electrical']

            # Format: "Name (HC)" for prospective or not-yet-started active, "Name HC" for active on-site
            def format_sub(subs, project_status, project_start_date):
                if not subs:
                    return ''
                # Use parentheses for prospective OR active projects that haven't started yet
                use_parens = (project_status == 'prospective' or
                             (project_status == 'active' and project_start_date and project_start_date > date.today()))
                parts = []
                for s in subs:
                    name = s['name']
                    hc = s.get('headcount', 0)
                    if hc:
                        if use_parens:
                            parts.append(f"{name} ({hc})")  # Parentheses for future manpower
                        else:
                            parts.append(f"{name} {hc}")    # Plain number for active on-site
                    else:
                        parts.append(name)
                return ', '.join(parts)

            sprinkler_sub = format_sub(sprinkler_subs, project.status, project_start)
            vesda_sub = format_sub(vesda_subs, project.status, project_start)
            electrical_sub = format_sub(electrical_subs, project.status, project_start)

            # Only add project-level row with single Gantt bar
            if project_start and project_end:
                activities.append({
                    'activity_id': f'PROJ-{project.id}',
                    'name': project.name,
                    'project_number': project.project_number,
                    'project_status': project.status,  # For headcount formatting
                    'bfpe_sprinkler_headcount': getattr(project, 'bfpe_sprinkler_headcount', 0) or 0,
                    'bfpe_vesda_headcount': getattr(project, 'bfpe_vesda_headcount', 0) or 0,
                    'bfpe_electrical_headcount': getattr(project, 'bfpe_electrical_headcount', 0) or 0,
                    'sprinkler_sub': sprinkler_sub,
                    'vesda_sub': vesda_sub,
                    'electrical_sub': electrical_sub,
                    'duration': (project_end - project_start).days,
                    'start_date': project_start,
                    'end_date': project_end,
                    'bar_type': 'remaining',
                    'indent_level': 0,
                    'is_summary': False
                })
                all_dates.extend([project_start, project_end])

        if not all_dates:
            all_dates = [date.today(), date.today() + timedelta(days=30)]

        min_date = min(all_dates)
        max_date = max(all_dates)

        # Add buffer to date range
        date_buffer = timedelta(days=7)
        min_date = min_date - date_buffer
        max_date = max_date + date_buffer

        # Calculate pagination
        usable_height = self.height - self.margin_top - self.margin_bottom - 95  # Header + legend space
        rows_per_page = int(usable_height / self.row_height)
        self.total_pages = max(1, math.ceil(len(activities) / rows_per_page))

        run_date = datetime.now().strftime('%d-%b-%y %H:%M')

        # Generate pages
        activity_index = 0
        for page in range(self.total_pages):
            self.page_number = page + 1

            if page > 0:
                self.canvas.showPage()

            # Get logo path
            logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                    'frontend', 'bfpe_logo.png')

            # Draw header with logo and subcontractor name
            self.draw_header(project_name, run_date, logo_path, subcontractor_filter)

            # Starting Y position
            y_pos = self.height - self.margin_top - 25

            # Draw unified column headers with timeline
            y_pos = self.draw_column_headers(y_pos, min_date, max_date)

            # Count actual rows for this page
            remaining = len(activities) - activity_index
            actual_rows = min(remaining, rows_per_page)

            # Draw vertical grid lines only for actual rows
            self.draw_gantt_grid(y_pos, min_date, max_date, actual_rows)

            # Draw activity rows
            row_count = 0
            while activity_index < len(activities) and row_count < rows_per_page:
                activity = activities[activity_index]
                y_pos = self.draw_activity_row(
                    y_pos, activity, row_count,
                    min_date, max_date,
                    activity.get('is_summary', False)
                )
                activity_index += 1
                row_count += 1

            # Draw legend
            self.draw_legend(self.margin_bottom + 20)

            # Draw footer
            self.draw_footer()

        self.canvas.save()
        self.buffer.seek(0)
        return self.buffer

    def draw_gantt_grid(self, y_start: float, min_date: date, max_date: date, num_rows: int):
        """Draw vertical grid lines in the Gantt chart area at monthly intervals"""
        c = self.canvas

        total_days = (max_date - min_date).days
        if total_days <= 0:
            total_days = 30

        y_end = y_start - (num_rows * self.row_height)

        # Generate list of first-of-month dates within range
        current = date(min_date.year, min_date.month, 1)
        while current <= max_date:
            if current >= min_date:
                days_from_start = (current - min_date).days
                x = self.gantt_start_x + (days_from_start / total_days) * self.gantt_width

                if x >= self.gantt_start_x and x <= self.gantt_start_x + self.gantt_width:
                    c.setStrokeColor(COLORS['grid_line'])
                    c.setLineWidth(0.5)
                    c.line(x, y_start, x, y_end)

            # Move to next month
            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)


@router.get("/pdf")
def export_pdf(
    project_ids: Optional[str] = Query(None, description="Comma-separated project IDs"),
    subcontractor_names: Optional[str] = Query(None, description="Comma-separated subcontractor names"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Export project data, man-hours, and a professional Gantt chart as a PDF.
    Optionally filter by project IDs or subcontractor names.
    """
    # Parse project IDs if provided
    project_id_list = None
    if project_ids:
        try:
            project_id_list = [int(id.strip()) for id in project_ids.split(',')]
        except ValueError:
            pass  # Ignore invalid IDs

    # Parse subcontractor names if provided
    subcontractor_name_list = None
    if subcontractor_names:
        subcontractor_name_list = [name.strip() for name in subcontractor_names.split(',')]

    # Get projects (filtered or all)
    if project_id_list or subcontractor_name_list:
        # Build filtered query
        query = db.query(models.Project).filter(
            models.Project.status.in_(['active', 'prospective'])
        )
        if project_id_list:
            query = query.filter(models.Project.id.in_(project_id_list))
        if subcontractor_name_list:
            subquery = db.query(models.ProjectSubcontractor.project_id).filter(
                models.ProjectSubcontractor.subcontractor_name.in_(subcontractor_name_list)
            ).distinct()
            query = query.filter(models.Project.id.in_(subquery))
        projects = query.all()

        # Get phases only for filtered projects
        project_ids_to_include = [p.id for p in projects]
        phases = db.query(models.SchedulePhase).join(
            models.ProjectSchedule
        ).filter(
            models.ProjectSchedule.project_id.in_(project_ids_to_include)
        ).all()
    else:
        # Get all projects
        projects = crud.get_all_projects(db)
        # Get all phases for Gantt
        phases = crud.get_all_phases(db)

    # Build subcontractor info dict for each project
    project_subcontractors = {}
    for project in projects:
        # Get subcontractors for this project
        subs = db.query(models.ProjectSubcontractor).filter(
            models.ProjectSubcontractor.project_id == project.id
        ).all()

        # If filtering by specific subcontractors, only include those
        if subcontractor_name_list:
            subs = [s for s in subs if s.subcontractor_name in subcontractor_name_list]

        project_subcontractors[project.id] = [
            {'name': s.subcontractor_name, 'headcount': s.headcount or 0, 'labor_type': s.labor_type}
            for s in subs
        ]

    # Determine display name for header
    subcontractor_display = None
    if subcontractor_name_list:
        subcontractor_display = ', '.join(subcontractor_name_list)

    # Generate PDF
    pdf_generator = GanttChartPDF(page_size=landscape(letter))
    pdf_buffer = pdf_generator.generate(
        projects=projects,
        phases=phases,
        project_name="Fire Protection Schedule",
        company_name="BFPE International",
        subcontractor_filter=subcontractor_display,
        project_subcontractors=project_subcontractors
    )

    # Generate filename based on filter
    if subcontractor_display:
        # Replace spaces with underscores for filename
        sub_name = subcontractor_display.replace(' ', '_').replace(',', '')
        filename = f"BFPE_Manpower_Forecast_({sub_name}).pdf"
    else:
        filename = "BFPE_Manpower_Forecast.pdf"

    return Response(
        pdf_buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


class SubcontractorReportPDF:
    """Professional Subcontractor Labor Report PDF Generator"""

    def __init__(self, page_size=letter):
        self.page_size = page_size
        self.width, self.height = page_size
        self.margin_left = 0.5 * inch
        self.margin_right = 0.5 * inch
        self.margin_top = 0.6 * inch
        self.margin_bottom = 0.8 * inch

        # Table column configuration (total ~7.1 inches for 7.5 inch usable width)
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
        from datetime import timedelta
        while current <= end_date:
            if current.weekday() < 5:  # Monday=0, Friday=4
                work_days += 1
            current += timedelta(days=1)
        return max(work_days, 1)  # Minimum 1 to avoid division by zero

    def draw_header(self, subcontractor_name: str, date_range: str, run_date: str, logo_path: str = None):
        """Draw the page header"""
        c = self.canvas
        y = self.height - self.margin_top + 20

        # Draw logo if available
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

        # Title
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLORS['text_primary'])
        c.drawString(self.margin_left + logo_width, y, f"Subcontractor Labor Report: {subcontractor_name}")

        # Page info
        c.setFont("Helvetica", 9)
        c.setFillColor(COLORS['text_secondary'])
        c.drawRightString(self.width - self.margin_right, y, f"Page {self.page_number} of {self.total_pages}")
        c.drawRightString(self.width - self.margin_right, y - 12, f"Run Date: {run_date}")

        # Date range
        if date_range:
            c.drawString(self.margin_left + logo_width, y - 15, f"Period: {date_range}")

        # Line under header
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(1)
        c.line(self.margin_left, y - 25, self.width - self.margin_right, y - 25)

    def draw_table_header(self, y_pos: float):
        """Draw table column headers"""
        c = self.canvas
        header_height = 25

        # Header background
        c.setFillColor(COLORS['header_bg'])
        c.rect(self.margin_left, y_pos - header_height,
               self.width - self.margin_left - self.margin_right, header_height, fill=1, stroke=0)

        # Header text
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
        """Draw a data row"""
        c = self.canvas

        # Alternating row background
        bg_color = COLORS['row_alt'] if row_index % 2 == 0 else COLORS['row_normal']
        c.setFillColor(bg_color)
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        # Grid line
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.3)
        c.line(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_right, y_pos - self.row_height)

        # Data
        c.setFillColor(COLORS['text_primary'])
        c.setFont("Helvetica", 8)

        x = self.margin_left + 4
        text_y = y_pos - self.row_height + 5

        # Project name (truncate if needed)
        name = row_data.get('project_name', '')
        max_chars = int(self.col_widths['project_name'] / 4.5)
        if len(name) > max_chars:
            name = name[:max_chars-2] + '..'
        c.drawString(x, text_y, name)
        x += self.col_widths['project_name']

        # Project number
        c.drawString(x, text_y, row_data.get('project_number', '') or '')
        x += self.col_widths['project_number']

        # Labor type
        c.drawString(x, text_y, row_data.get('labor_type', '').capitalize())
        x += self.col_widths['labor_type']

        # Start date
        start_date = row_data.get('start_date')
        if start_date:
            c.drawString(x, text_y, start_date.strftime('%d-%b-%y'))
        x += self.col_widths['start']

        # End date
        end_date = row_data.get('end_date')
        if end_date:
            c.drawString(x, text_y, end_date.strftime('%d-%b-%y'))
        x += self.col_widths['end']

        # Man-hours
        hours = row_data.get('man_hours', 0)
        c.drawRightString(x + self.col_widths['hours'] - 4, text_y, f"{float(hours):,.1f}")
        x += self.col_widths['hours']

        # Men required
        men_required = row_data.get('men_required', 0)
        c.drawRightString(x + self.col_widths['men_required'] - 4, text_y, f"{float(men_required):,.1f}")

        return y_pos - self.row_height

    def draw_summary_row(self, y_pos: float, total_hours: float):
        """Draw summary total row"""
        c = self.canvas

        # Summary background
        c.setFillColor(COLORS['subheader_bg'])
        c.rect(self.margin_left, y_pos - self.row_height,
               self.width - self.margin_left - self.margin_right,
               self.row_height, fill=1, stroke=0)

        # Summary text
        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 9)

        x = self.margin_left + 4
        text_y = y_pos - self.row_height + 5

        c.drawString(x, text_y, "TOTAL")

        # Total hours (right-aligned in hours column)
        total_x = (self.margin_left + self.col_widths['project_name'] +
                   self.col_widths['project_number'] + self.col_widths['labor_type'] +
                   self.col_widths['start'] + self.col_widths['end'] +
                   self.col_widths['hours'] - 4)
        c.drawRightString(total_x, text_y, f"{total_hours:,.1f}")

        return y_pos - self.row_height

    def draw_footer(self):
        """Draw page footer"""
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

        # Aggregate data at project level (not phase level)
        rows = []
        for project in projects_data:
            phases = project.get('phases', [])
            project_hours = float(project.get('total_project_hours', 0))

            # Get earliest start and latest end from phases
            proj_start = None
            proj_end = None
            if phases:
                start_dates = [p['start_date'] for p in phases if p.get('start_date')]
                end_dates = [p['end_date'] for p in phases if p.get('end_date')]
                if start_dates:
                    proj_start = min(start_dates)
                if end_dates:
                    proj_end = max(end_dates)

            # Calculate men required = hours / (work_days * 8 hours per day)
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

        # Calculate pagination
        usable_height = self.height - self.margin_top - self.margin_bottom - 100
        rows_per_page = int(usable_height / self.row_height)
        self.total_pages = max(1, math.ceil((len(rows) + 1) / rows_per_page))  # +1 for summary

        run_date = datetime.now().strftime('%d-%b-%y %H:%M')
        date_range = ""
        if start_date and end_date:
            date_range = f"{start_date.strftime('%d-%b-%y')} to {end_date.strftime('%d-%b-%y')}"

        # Generate pages
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

            # Draw summary on last page
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

    # Get subcontractor data
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

    # Generate PDF
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
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/pdf/project/{project_id}")
def export_project_pdf(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Export a single project's schedule as a professional PDF.
    """
    project = crud.get_project(db, project_id)
    if not project:
        return Response(status_code=404, content="Project not found")

    phases = crud.get_all_phases(db)
    project_phases = [p for p in phases if p.schedule.project_id == project_id]

    # Get subcontractors for this project
    subs = db.query(models.ProjectSubcontractor).filter(
        models.ProjectSubcontractor.project_id == project_id
    ).all()

    project_subcontractors = {
        project_id: [
            {'name': s.subcontractor_name, 'headcount': s.headcount or 0, 'labor_type': s.labor_type}
            for s in subs
        ]
    }

    # Generate PDF
    pdf_generator = GanttChartPDF(page_size=landscape(letter))
    pdf_buffer = pdf_generator.generate(
        projects=[project],
        phases=project_phases,
        project_name=project.name,
        company_name="BFPE International",
        project_subcontractors=project_subcontractors
    )

    filename = f"{project.name.replace(' ', '_')}_schedule.pdf"

    return Response(
        pdf_buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
