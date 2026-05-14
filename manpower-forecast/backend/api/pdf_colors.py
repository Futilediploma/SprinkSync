"""Shared color scheme for all PDF exports."""
from reportlab.lib.colors import HexColor, white

COLORS = {
    'header_bg': HexColor('#1a365d'),           # Dark blue header
    'header_text': white,
    'subheader_bg': HexColor('#2d3748'),        # Darker gray
    'row_alt': HexColor('#f7fafc'),             # Light gray alternating rows
    'row_normal': white,
    'grid_line': HexColor('#e2e8f0'),           # Light grid lines
    'text_primary': HexColor('#1a202c'),        # Dark text
    'text_secondary': HexColor('#718096'),      # Gray text
    'bar_actual': HexColor('#38a169'),          # Green - actual/completed work
    'bar_remaining': HexColor('#3182ce'),       # Blue - remaining work
    'bar_critical': HexColor('#e53e3e'),        # Red - critical path
    'bar_summary': HexColor('#1a202c'),         # Black - summary bars
    'milestone': HexColor('#805ad5'),           # Purple - milestones
    'phase_header': HexColor('#667eea'),        # Purple gradient header
    'row_prospective': HexColor('#fff7ed'),     # Light orange - prospective projects
    'row_prospective_alt': HexColor('#ffedd5'), # Slightly darker orange alt row
}
