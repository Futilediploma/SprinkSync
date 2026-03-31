"""
Gantt Chart PDF Export
Generates GC-style Gantt chart PDFs matching industry standard construction schedules.
"""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
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

from api.pdf_colors import COLORS

router = APIRouter(prefix="/api/export", tags=["export"])


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
        """Draw two-tier header: column labels + year/month timeline"""
        c = self.canvas
        year_row_height = 18
        month_row_height = 14
        header_height = year_row_height + month_row_height

        # Draw unified header background for left-side columns
        c.setFillColor(COLORS['header_bg'])
        c.rect(self.margin_left, y_pos - header_height,
               self.table_width, header_height, fill=1, stroke=0)

        # Column header text (vertically centered)
        c.setFillColor(COLORS['header_text'])
        c.setFont("Helvetica-Bold", 9)

        x = self.margin_left + 8
        text_y = y_pos - header_height / 2 - 3

        single_headers = [
            ('Project Name', self.col_widths['activity_name']),
            ('Job #', self.col_widths['project_number']),
        ]
        for header, width in single_headers:
            c.drawString(x, text_y, header)
            x += width

        c.setFont("Helvetica-Bold", 8)
        for header, width in [('Sprinkler', self.col_widths['sprinkler']),
                               ('VESDA', self.col_widths['vesda']),
                               ('Electrical', self.col_widths['electrical'])]:
            c.drawString(x, text_y, header)
            x += width

        c.setFont("Helvetica-Bold", 9)
        for header, width in [('Days', self.col_widths['duration']),
                               ('Start', self.col_widths['start']),
                               ('Finish', self.col_widths['finish'])]:
            c.drawString(x, text_y, header)
            x += width

        # === Two-tier Gantt timeline ===
        total_days = (max_date - min_date).days
        if total_days <= 0:
            total_days = 30

        gantt_right = self.gantt_start_x + self.gantt_width
        year_top = y_pos
        year_bottom = y_pos - year_row_height
        month_bottom = year_bottom - month_row_height

        # --- Top tier: Year labels (dark background, white text) ---
        years = []
        yr = min_date.year
        while yr <= max_date.year:
            display_start = max(date(yr, 1, 1), min_date)
            display_end = min(date(yr, 12, 31), max_date)
            years.append((yr, display_start, display_end))
            yr += 1

        for year_val, y_start_date, y_end_date in years:
            x_start = self.gantt_start_x + ((y_start_date - min_date).days / total_days) * self.gantt_width
            x_end = self.gantt_start_x + ((y_end_date - min_date).days / total_days) * self.gantt_width
            x_start = max(x_start, self.gantt_start_x)
            x_end = min(x_end, gantt_right)

            # Alternating year backgrounds
            c.setFillColor(COLORS['header_bg'] if year_val % 2 == 0 else HexColor('#1e3a5f'))
            c.rect(x_start, year_bottom, x_end - x_start, year_row_height, fill=1, stroke=0)

            # Year label
            c.setFillColor(COLORS['header_text'])
            c.setFont("Helvetica-Bold", 10)
            label_w = c.stringWidth(str(year_val), "Helvetica-Bold", 10)
            if x_end - x_start > label_w + 4:
                c.drawString((x_start + x_end) / 2 - label_w / 2, year_bottom + 5, str(year_val))

            # Year divider line
            if x_start > self.gantt_start_x:
                c.setStrokeColor(HexColor('#4a6fa5'))
                c.setLineWidth(1)
                c.line(x_start, year_top, x_start, year_bottom)

        # --- Bottom tier: Month labels (light background, dark text) ---
        c.setFillColor(HexColor('#edf2f7'))  # Light gray background
        c.rect(self.gantt_start_x, month_bottom, self.gantt_width, month_row_height, fill=1, stroke=0)

        # Generate months
        months = []
        current = date(min_date.year, min_date.month, 1)
        while current <= max_date:
            next_month = date(current.year + 1, 1, 1) if current.month == 12 else date(current.year, current.month + 1, 1)
            if current >= min_date or (current.month == min_date.month and current.year == min_date.year):
                months.append((current, next_month))
            current = next_month

        month_labels_short = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
        month_labels_long = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        for month_start, month_end in months:
            x_start = self.gantt_start_x + ((month_start - min_date).days / total_days) * self.gantt_width
            x_end = self.gantt_start_x + ((min(month_end, max_date) - min_date).days / total_days) * self.gantt_width
            x_start = max(x_start, self.gantt_start_x)
            x_end = min(x_end, gantt_right)
            cell_width = x_end - x_start

            # Draw month cell divider
            if x_start > self.gantt_start_x:
                if month_start.month in (1, 4, 7, 10):
                    # Quarter boundary - darker line
                    c.setStrokeColor(HexColor('#94a3b8'))
                    c.setLineWidth(0.8)
                else:
                    c.setStrokeColor(HexColor('#cbd5e1'))
                    c.setLineWidth(0.3)
                c.line(x_start, year_bottom, x_start, month_bottom)

            # Choose label based on available space
            c.setFillColor(COLORS['text_primary'])
            if cell_width > 18:
                c.setFont("Helvetica", 7)
                label = month_labels_long[month_start.month - 1]
            elif cell_width > 6:
                c.setFont("Helvetica-Bold", 7)
                label = month_labels_short[month_start.month - 1]
            else:
                continue
            label_w = c.stringWidth(label, c._fontname, 7)
            c.drawString(x_start + (cell_width - label_w) / 2, month_bottom + 3, label)

        # Horizontal line between year and month tiers
        c.setStrokeColor(HexColor('#94a3b8'))
        c.setLineWidth(0.5)
        c.line(self.gantt_start_x, year_bottom, gantt_right, year_bottom)

        # Bottom border
        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(1)
        c.line(self.margin_left, y_pos - header_height,
               self.width - self.margin_right, y_pos - header_height)

        return y_pos - header_height

    def draw_activity_row(self, y_pos: float, activity: dict, row_index: int,
                          min_date: date, max_date: date, is_summary: bool = False):
        """Draw a single activity row with Gantt bar"""
        c = self.canvas

        # Row background (prospective projects always get orange tint)
        is_prospective = activity.get('project_status') == 'prospective'
        if is_prospective:
            bg_color = COLORS['row_prospective_alt']
        else:
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

        # Project Name - with text wrapping, bold for out-of-town, and trade tags
        name = activity.get('name', '')
        is_out_of_town = activity.get('is_out_of_town', False)
        col_width = self.col_widths['activity_name']
        name_font = "Helvetica-Bold" if is_out_of_town else "Helvetica"
        available_width = col_width - 8  # Usable width after padding

        # Build list of tags for this project
        tags = []
        if activity.get('is_aws'):
            tags.append(('AWS', '#7c3aed'))   # Purple
        if activity.get('is_mechanical'):
            tags.append(('M', '#2563eb'))      # Blue
        if activity.get('is_electrical'):
            tags.append(('E', '#d97706'))      # Amber
        if activity.get('is_vesda'):
            tags.append(('V', '#db2777'))      # Pink

        # Calculate total pixel width needed for all tags
        tag_total_width = 0
        if tags:
            for tag_text, _ in tags:
                tag_total_width += c.stringWidth(tag_text, "Helvetica-Bold", 5) + 6
            tag_total_width += 1  # Initial gap before first tag

        def draw_tags(tag_x, tag_y):
            """Draw small colored tag badges"""
            for tag_text, tag_color in tags:
                tag_w = c.stringWidth(tag_text, "Helvetica-Bold", 5) + 4
                c.setFillColor(HexColor(tag_color))
                c.roundRect(tag_x, tag_y - 1, tag_w, 8, 2, fill=1, stroke=0)
                c.setFillColor(white)
                c.setFont("Helvetica-Bold", 5)
                c.drawString(tag_x + 2, tag_y + 0.5, tag_text)
                tag_x += tag_w + 2

        def truncate_to_fit(text, font, size, max_w):
            """Truncate text with '..' to fit within max_w pixels"""
            if c.stringWidth(text, font, size) <= max_w:
                return text
            while len(text) > 1 and c.stringWidth(text + '..', font, size) > max_w:
                text = text[:-1]
            return text + '..'

        name_w = c.stringWidth(name, name_font, 8)

        if name_w + tag_total_width <= available_width:
            # Case 1: Name + tags fit on a single line
            c.setFont(name_font, 8)
            c.drawString(x, text_y, name)
            if tags:
                draw_tags(x + name_w + 3, text_y)
        elif name_w <= available_width and tags:
            # Case 2: Name fits on line 1, tags wrap to line 2 below
            c.setFont(name_font, 8)
            c.drawString(x, text_y + 4, name)
            draw_tags(x, text_y - 4)
        else:
            # Case 3: Name needs wrapping to two lines, tags after line 2
            font_size = 7
            words = name.split()
            line1 = ""
            line2_words = []
            for word in words:
                test = (line1 + " " + word) if line1 else word
                if c.stringWidth(test, name_font, font_size) <= available_width:
                    line1 = test
                else:
                    line2_words.append(word)
            line2 = " ".join(line2_words)

            # Truncate line2 to leave room for tags
            if tags and line2:
                max_line2_w = available_width - tag_total_width - 3
                line2 = truncate_to_fit(line2, name_font, font_size, max(max_line2_w, 20))
            elif line2:
                line2 = truncate_to_fit(line2, name_font, font_size, available_width)

            c.setFont(name_font, font_size)
            c.drawString(x, text_y + 4, line1)
            if line2:
                c.drawString(x, text_y - 4, line2)
            if tags:
                if line2:
                    tag_start_x = x + c.stringWidth(line2, name_font, font_size) + 3
                    draw_tags(tag_start_x, text_y - 4)
                else:
                    tag_start_x = x + c.stringWidth(line1, name_font, font_size) + 3
                    draw_tags(tag_start_x, text_y + 4)

        c.setFont("Helvetica", 8)  # Reset font
        c.setFillColor(COLORS['text_primary'])  # Reset color
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

                    c.drawString(x, sub_y, line1)
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

    def draw_detail_row(self, y_pos: float, activity: dict, row_index: int):
        """Draw a subtle sub-row showing foreman, PO number, and budgeted hours."""
        c = self.canvas
        detail_height = 13

        is_prospective = activity.get('project_status') == 'prospective'
        if is_prospective:
            bg_color = HexColor('#fef3cd')
        else:
            bg_color = HexColor('#f0f4f8') if row_index % 2 == 0 else HexColor('#f8fafc')

        c.setFillColor(bg_color)
        c.rect(self.margin_left, y_pos - detail_height,
               self.width - self.margin_left - self.margin_right,
               detail_height, fill=1, stroke=0)

        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.3)
        c.line(self.margin_left, y_pos - detail_height,
               self.width - self.margin_right, y_pos - detail_height)

        c.setFont("Helvetica-Oblique", 7)
        c.setFillColor(COLORS['text_secondary'])

        parts = []
        foreman = activity.get('foreman')
        po_number = activity.get('po_number')
        budgeted_hours = activity.get('budgeted_hours')
        if foreman:
            parts.append(f"Foreman: {foreman}")
        if po_number:
            parts.append(f"PO #: {po_number}")
        if budgeted_hours:
            parts.append(f"Budgeted: {int(float(budgeted_hours))} hrs")

        text = "    " + "     |     ".join(parts) if parts else "    No additional details"
        c.drawString(self.margin_left + 8, y_pos - detail_height + 3, text)

        return y_pos - detail_height

    def draw_gantt_bar(self, y_pos: float, start_date: date, end_date: date,
                       min_date: date, max_date: date, bar_type: str,
                       percent_complete: float = 0, is_summary: bool = False):
        """Draw a Gantt bar"""
        c = self.canvas

        total_days = (max_date - min_date).days
        if total_days <= 0:
            return

        start_offset = (start_date - min_date).days
        bar_duration = (end_date - start_date).days

        if bar_duration <= 0:
            bar_duration = 1

        bar_x = self.gantt_start_x + (start_offset / total_days) * self.gantt_width
        bar_width = (bar_duration / total_days) * self.gantt_width

        if bar_x < self.gantt_start_x:
            bar_width -= (self.gantt_start_x - bar_x)
            bar_x = self.gantt_start_x
        if bar_x + bar_width > self.gantt_start_x + self.gantt_width:
            bar_width = self.gantt_start_x + self.gantt_width - bar_x

        bar_height = 8
        bar_y = y_pos - self.row_height + 4

        if bar_type == 'actual':
            color = COLORS['bar_actual']
        elif bar_type == 'critical':
            color = COLORS['bar_critical']
        elif bar_type == 'summary':
            color = COLORS['bar_summary']
            bar_height = 6
        elif bar_type == 'milestone':
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

        c.setFillColor(color)

        if is_summary:
            c.rect(bar_x, bar_y + bar_height - 2, bar_width, 2, fill=1, stroke=0)
            c.rect(bar_x, bar_y, 2, bar_height, fill=1, stroke=0)
            c.rect(bar_x + bar_width - 2, bar_y, 2, bar_height, fill=1, stroke=0)
        else:
            c.roundRect(bar_x, bar_y, bar_width, bar_height, 2, fill=1, stroke=0)
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

        c.setFillColor(COLORS['bar_remaining'])
        c.roundRect(x, y + 1, 20, 8, 2, fill=1, stroke=0)
        c.setFillColor(COLORS['text_secondary'])
        c.drawString(x + 25, y + 2, "Project Duration")

        x += 120
        c.setFillColor(COLORS['row_prospective_alt'])
        c.rect(x, y + 1, 20, 8, fill=1, stroke=0)
        c.setFillColor(COLORS['text_secondary'])
        c.drawString(x + 25, y + 2, "Prospective")

        x += 100
        c.setStrokeColor(COLORS['bar_critical'])
        c.setLineWidth(1)
        c.setDash(3, 2)
        c.line(x, y + 1, x + 20, y + 1)
        c.line(x, y + 9, x + 20, y + 9)
        c.setDash()
        c.setFillColor(COLORS['text_secondary'])
        c.drawString(x + 25, y + 2, "Today")

        x += 80
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(COLORS['text_primary'])
        c.drawString(x, y + 2, "Bold")
        c.setFont("Helvetica", 8)
        c.setFillColor(COLORS['text_secondary'])
        c.drawString(x + 24, y + 2, "= Out of Town")

        x += 110
        tag_legends = [('AWS', '#7c3aed'), ('M', '#2563eb'), ('E', '#d97706'), ('V', '#db2777')]
        for tag_text, tag_color in tag_legends:
            tag_w = c.stringWidth(tag_text, "Helvetica-Bold", 6) + 4
            c.setFillColor(HexColor(tag_color))
            c.roundRect(x, y + 1, tag_w, 8, 2, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 6)
            c.drawString(x + 2, y + 2.5, tag_text)
            x += tag_w + 3

    def draw_footer(self):
        """Draw the page footer"""
        c = self.canvas
        y = self.margin_bottom - 20

        c.setStrokeColor(COLORS['grid_line'])
        c.setLineWidth(0.5)
        c.line(self.margin_left, y + 15, self.width - self.margin_right, y + 15)

        c.setFont("Helvetica", 8)
        c.setFillColor(COLORS['text_secondary'])
        c.drawCentredString(self.width / 2, y, "BFPE International - Project Schedule")

    def draw_gantt_grid(self, y_start: float, min_date: date, max_date: date, num_rows: int):
        """Draw vertical grid lines with quarter and year emphasis"""
        c = self.canvas

        total_days = (max_date - min_date).days
        if total_days <= 0:
            total_days = 30

        y_end = y_start - (num_rows * self.row_height)

        current = date(min_date.year, min_date.month, 1)
        while current <= max_date:
            if current >= min_date:
                days_from_start = (current - min_date).days
                x = self.gantt_start_x + (days_from_start / total_days) * self.gantt_width

                if x >= self.gantt_start_x and x <= self.gantt_start_x + self.gantt_width:
                    if current.month == 1:
                        c.setStrokeColor(HexColor('#94a3b8'))
                        c.setLineWidth(1.2)
                    elif current.month in (4, 7, 10):
                        c.setStrokeColor(HexColor('#cbd5e1'))
                        c.setLineWidth(0.8)
                    else:
                        c.setStrokeColor(COLORS['grid_line'])
                        c.setLineWidth(0.3)
                    c.line(x, y_start, x, y_end)

            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)

        # Today line
        today = date.today()
        if min_date <= today <= max_date:
            today_offset = (today - min_date).days
            today_x = self.gantt_start_x + (today_offset / total_days) * self.gantt_width
            c.setStrokeColor(COLORS['bar_critical'])
            c.setLineWidth(1)
            c.setDash(3, 2)
            c.line(today_x, y_start, today_x, y_end)
            c.setDash()

    def generate(self, projects: list, phases: list,
                 project_name: str = "Project Schedule",
                 company_name: str = "",
                 subcontractor_filter: str = None,
                 project_subcontractors: dict = None):
        """Generate the complete PDF"""
        if project_subcontractors is None:
            project_subcontractors = {}

        projects = sorted(projects, key=lambda p: p.name.lower())

        self.show_bfpe = (subcontractor_filter is None)
        self._update_table_width()

        activities = []
        all_dates = []

        for project in projects:
            project_phases = [p for p in phases if p.schedule.project_id == project.id]

            if project_phases:
                project_start = min(p.start_date for p in project_phases if p.start_date)
                project_end = max(p.end_date for p in project_phases if p.end_date)
            else:
                project_start = project.start_date
                project_end = project.end_date

            subs_info = project_subcontractors.get(project.id, [])

            sprinkler_subs = [s for s in subs_info if s.get('labor_type') == 'sprinkler']
            vesda_subs = [s for s in subs_info if s.get('labor_type') == 'vesda']
            electrical_subs = [s for s in subs_info if s.get('labor_type') == 'electrical']

            def format_sub(subs, project_status, project_start_date):
                if not subs:
                    return ''
                use_parens = (project_status == 'prospective' or
                             (project_status == 'active' and project_start_date and project_start_date > date.today()))
                parts = []
                for s in subs:
                    name = s['name']
                    hc = s.get('headcount', 0)
                    if hc:
                        if use_parens:
                            parts.append(f"{name} ({hc})")
                        else:
                            parts.append(f"{name} {hc}")
                    else:
                        parts.append(name)
                return ', '.join(parts)

            sprinkler_sub = format_sub(sprinkler_subs, project.status, project_start)
            vesda_sub = format_sub(vesda_subs, project.status, project_start)
            electrical_sub = format_sub(electrical_subs, project.status, project_start)

            if project_start and project_end:
                display_name = project.name
                req_manpower = getattr(project, 'required_manpower', 0) or 0
                if project.status == 'prospective' and req_manpower > 0:
                    display_name = f"{project.name} ({req_manpower})"

                activities.append({
                    'activity_id': f'PROJ-{project.id}',
                    'name': display_name,
                    'project_number': project.project_number,
                    'project_status': project.status,
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
                    'is_summary': False,
                    'is_aws': getattr(project, 'is_aws', False) or False,
                    'is_mechanical': getattr(project, 'is_mechanical', False) or False,
                    'is_electrical': getattr(project, 'is_electrical', False) or False,
                    'is_vesda': getattr(project, 'is_vesda', False) or False,
                    'is_out_of_town': getattr(project, 'is_out_of_town', False) or False,
                    'foreman': getattr(project, 'foreman', None),
                    'po_number': getattr(project, 'po_number', None),
                    'budgeted_hours': getattr(project, 'budgeted_hours', None),
                })
                all_dates.extend([project_start, project_end])

        if not all_dates:
            all_dates = [date.today(), date.today() + timedelta(days=30)]

        min_date = min(all_dates)
        max_date = max(all_dates)

        date_buffer = timedelta(days=7)
        min_date = min_date - date_buffer
        max_date = max_date + date_buffer

        usable_height = self.height - self.margin_top - self.margin_bottom - 115
        # Each activity may have a detail sub-row (13px) below it
        activities_with_details = sum(1 for a in activities if any([a.get('foreman'), a.get('po_number'), a.get('budgeted_hours')]))
        total_height_needed = (len(activities) * self.row_height) + (activities_with_details * 13)
        rows_per_page = max(1, int(usable_height / self.row_height))
        self.total_pages = max(1, math.ceil(total_height_needed / usable_height))

        run_date = datetime.now().strftime('%d-%b-%y %H:%M')

        activity_index = 0
        for page in range(self.total_pages):
            self.page_number = page + 1

            if page > 0:
                self.canvas.showPage()

            logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                    'frontend', 'bfpe_logo.png')

            self.draw_header(project_name, run_date, logo_path, subcontractor_filter)

            y_pos = self.height - self.margin_top - 25
            y_pos = self.draw_column_headers(y_pos, min_date, max_date)

            remaining = len(activities) - activity_index
            actual_rows = min(remaining, rows_per_page)
            self.draw_gantt_grid(y_pos, min_date, max_date, actual_rows)

            min_y = self.margin_bottom + 55  # Reserve space for legend + footer
            row_count = 0
            while activity_index < len(activities):
                activity = activities[activity_index]
                has_details = any([activity.get('foreman'), activity.get('po_number'), activity.get('budgeted_hours')])
                needed = self.row_height + (13 if has_details else 0)
                if y_pos - needed < min_y:
                    break
                y_pos = self.draw_activity_row(
                    y_pos, activity, row_count,
                    min_date, max_date,
                    activity.get('is_summary', False)
                )
                if has_details and y_pos - 13 >= min_y:
                    y_pos = self.draw_detail_row(y_pos, activity, row_count)
                activity_index += 1
                row_count += 1

            self.draw_legend(self.margin_bottom + 20)
            self.draw_footer()

        self.canvas.save()
        self.buffer.seek(0)
        return self.buffer


@router.get("/pdf")
def export_pdf(
    project_ids: Optional[str] = Query(None, description="Comma-separated project IDs"),
    subcontractor_names: Optional[str] = Query(None, description="Comma-separated subcontractor names"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Export project data and a professional Gantt chart as a PDF."""
    project_id_list = None
    if project_ids:
        try:
            project_id_list = [int(id.strip()) for id in project_ids.split(',')]
        except ValueError:
            pass

    subcontractor_name_list = None
    if subcontractor_names:
        subcontractor_name_list = [name.strip() for name in subcontractor_names.split(',')]

    if project_id_list or subcontractor_name_list:
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

        project_ids_to_include = [p.id for p in projects]
        phases = db.query(models.SchedulePhase).join(
            models.ProjectSchedule
        ).filter(
            models.ProjectSchedule.project_id.in_(project_ids_to_include)
        ).all()
    else:
        projects = db.query(models.Project).filter(
            models.Project.status.in_(['active', 'prospective'])
        ).all()
        project_ids_to_include = [p.id for p in projects]
        phases = db.query(models.SchedulePhase).join(
            models.ProjectSchedule
        ).filter(
            models.ProjectSchedule.project_id.in_(project_ids_to_include)
        ).all() if project_ids_to_include else []

    project_subcontractors = {}
    for project in projects:
        subs = db.query(models.ProjectSubcontractor).filter(
            models.ProjectSubcontractor.project_id == project.id
        ).all()
        if subcontractor_name_list:
            subs = [s for s in subs if s.subcontractor_name in subcontractor_name_list]
        project_subcontractors[project.id] = [
            {'name': s.subcontractor_name, 'headcount': s.headcount or 0, 'labor_type': s.labor_type}
            for s in subs
        ]

    subcontractor_display = None
    if subcontractor_name_list:
        subcontractor_display = ', '.join(subcontractor_name_list)

    pdf_generator = GanttChartPDF(page_size=landscape(letter))
    pdf_buffer = pdf_generator.generate(
        projects=projects,
        phases=phases,
        project_name="Fire Protection Schedule",
        company_name="BFPE International",
        subcontractor_filter=subcontractor_display,
        project_subcontractors=project_subcontractors
    )

    if subcontractor_display:
        sub_name = subcontractor_display.replace(' ', '_').replace(',', '')
        filename = f"BFPE_Manpower_Forecast_({sub_name}).pdf"
    else:
        filename = "BFPE_Manpower_Forecast.pdf"

    return Response(
        pdf_buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/pdf/project/{project_id}")
def export_project_pdf(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Export a single project's schedule as a professional PDF."""
    project = crud.get_project(db, project_id)
    if not project:
        return Response(status_code=404, content="Project not found")

    phases = crud.get_all_phases(db)
    project_phases = [p for p in phases if p.schedule.project_id == project_id]

    subs = db.query(models.ProjectSubcontractor).filter(
        models.ProjectSubcontractor.project_id == project_id
    ).all()

    project_subcontractors = {
        project_id: [
            {'name': s.subcontractor_name, 'headcount': s.headcount or 0, 'labor_type': s.labor_type}
            for s in subs
        ]
    }

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
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
