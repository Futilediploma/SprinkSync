from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from PIL import Image
import io
import base64
from typing import Optional
import json


class CertificatePDF:
    """Generate PDF for Contractor's Material & Test Certificate for Aboveground Piping"""

    def __init__(self, filename: str):
        self.filename = filename
        self.c = canvas.Canvas(filename, pagesize=letter)
        self.width, self.height = letter

    def decode_signature(self, signature_data: str) -> Optional[ImageReader]:
        """Decode base64 signature data URL to ImageReader"""
        if not signature_data or not signature_data.startswith('data:image'):
            return None
        try:
            image_data = signature_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            return ImageReader(image)
        except Exception as e:
            print(f"Error decoding signature: {e}")
            return None

    def draw_page1_header(self):
        """Draw the header for page 1"""
        # Title
        self.c.setFont("Helvetica-Bold", 16)
        self.c.drawCentredString(4.25 * inch, 10.5 * inch, "CONTRACTOR'S MATERIAL & TEST CERTIFICATE")
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawCentredString(4.25 * inch, 10.2 * inch, "FOR ABOVEGROUND PIPING")

        # Subtitle
        self.c.setFont("Helvetica", 9)
        self.c.drawCentredString(4.25 * inch, 9.9 * inch,
                                "(To be completed by the installing contractor and submitted to the Authority Having Jurisdiction)")

    def draw_page1_project_info(self, data: dict):
        """Draw project information section on page 1"""
        y_pos = 9.5 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "PROJECT INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # Job Name
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Job Name:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.3 * inch, y_pos, data.get('job_name', ''))

        y_pos -= 0.25 * inch

        # Job Location
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Job Location:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.3 * inch, y_pos, data.get('job_location', ''))

        y_pos -= 0.25 * inch

        # Permit Number and AHJ on same line
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Permit Number:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.5 * inch, y_pos, data.get('permit_number', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.0 * inch, y_pos, "AHJ:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(4.5 * inch, y_pos, data.get('ahj', ''))

        # Draw box around project info
        self.c.rect(0.5 * inch, y_pos - 0.15 * inch, 7.5 * inch, 1.0 * inch, fill=0)

    def draw_page1_contractor_info(self, data: dict):
        """Draw contractor information section on page 1"""
        y_pos = 8.3 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "CONTRACTOR INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # Contractor Name
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Contractor Name:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.7 * inch, y_pos, data.get('contractor_name', ''))

        y_pos -= 0.25 * inch

        # Address
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Address:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.7 * inch, y_pos, data.get('contractor_address', ''))

        y_pos -= 0.25 * inch

        # License and Phone
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "License Number:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.7 * inch, y_pos, data.get('contractor_license', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.5 * inch, y_pos, "Phone:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(5.1 * inch, y_pos, data.get('contractor_phone', ''))

        # Draw box
        self.c.rect(0.5 * inch, y_pos - 0.15 * inch, 7.5 * inch, 0.95 * inch, fill=0)

    def draw_page1_installer_info(self, data: dict):
        """Draw installer information section on page 1"""
        y_pos = 7.0 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "INSTALLER INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # Installer Name
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Installer Name:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.6 * inch, y_pos, data.get('installer_name', ''))

        y_pos -= 0.25 * inch

        # License and Phone
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "License Number:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.6 * inch, y_pos, data.get('installer_license', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.5 * inch, y_pos, "Phone:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(5.1 * inch, y_pos, data.get('installer_phone', ''))

        # Draw box
        self.c.rect(0.5 * inch, y_pos - 0.15 * inch, 7.5 * inch, 0.7 * inch, fill=0)

    def draw_page1_system_info(self, data: dict):
        """Draw system information section on page 1"""
        y_pos = 6.0 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "SYSTEM INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # System Type
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "System Type:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.5 * inch, y_pos, data.get('system_type', ''))

        # Occupancy Classification
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.0 * inch, y_pos, "Occupancy Classification:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(6.0 * inch, y_pos, data.get('occupancy_classification', ''))

        # Draw box
        self.c.rect(0.5 * inch, y_pos - 0.15 * inch, 7.5 * inch, 0.5 * inch, fill=0)

    def draw_page1_piping_table(self, data: dict):
        """Draw piping information table on page 1"""
        y_pos = 5.2 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "PIPING INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # Table headers
        self.c.setFillColorRGB(0.8, 0.8, 0.8)
        self.c.rect(0.5 * inch, y_pos - 0.05 * inch, 7.5 * inch, 0.2 * inch, fill=1)
        self.c.setFillColorRGB(0, 0, 0)

        self.c.setFont("Helvetica-Bold", 8)
        self.c.drawString(0.6 * inch, y_pos, "Location")
        self.c.drawString(2.2 * inch, y_pos, "Pipe Type")
        self.c.drawString(3.5 * inch, y_pos, "Material")
        self.c.drawString(5.0 * inch, y_pos, "Size")
        self.c.drawString(6.5 * inch, y_pos, "Length (ft)")

        y_pos -= 0.25 * inch

        # Parse piping data
        piping_data = []
        if data.get('piping_data'):
            try:
                piping_data = json.loads(data['piping_data'])
            except:
                pass

        # Draw piping rows (up to 10 rows)
        self.c.setFont("Helvetica", 8)
        for i in range(10):
            if i < len(piping_data):
                pipe = piping_data[i]
                self.c.drawString(0.6 * inch, y_pos, pipe.get('location', ''))
                self.c.drawString(2.2 * inch, y_pos, pipe.get('pipe_type', ''))
                self.c.drawString(3.5 * inch, y_pos, pipe.get('material', ''))
                self.c.drawString(5.0 * inch, y_pos, pipe.get('size', ''))
                self.c.drawString(6.5 * inch, y_pos, str(pipe.get('length', '')))

            # Draw horizontal line
            self.c.line(0.5 * inch, y_pos - 0.05 * inch, 8.0 * inch, y_pos - 0.05 * inch)
            y_pos -= 0.2 * inch

        # Draw vertical lines for table
        table_top = 4.55 * inch
        table_bottom = y_pos + 0.2 * inch
        self.c.line(0.5 * inch, table_top, 0.5 * inch, table_bottom)
        self.c.line(2.1 * inch, table_top, 2.1 * inch, table_bottom)
        self.c.line(3.4 * inch, table_top, 3.4 * inch, table_bottom)
        self.c.line(4.9 * inch, table_top, 4.9 * inch, table_bottom)
        self.c.line(6.4 * inch, table_top, 6.4 * inch, table_bottom)
        self.c.line(8.0 * inch, table_top, 8.0 * inch, table_bottom)

    def draw_page1_footer(self):
        """Draw footer for page 1"""
        self.c.setFont("Helvetica-Italic", 8)
        self.c.drawCentredString(4.25 * inch, 0.5 * inch, "Page 1 of 2")

    def draw_page2_header(self):
        """Draw header for page 2"""
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawCentredString(4.25 * inch, 10.5 * inch, "ABOVEGROUND PIPING CERTIFICATE - Continued")

    def draw_page2_test_info(self, data: dict):
        """Draw test information section on page 2"""
        y_pos = 10.0 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "TEST INFORMATION")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.4 * inch

        # Test Type and Date
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Test Type:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.3 * inch, y_pos, data.get('test_type', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.0 * inch, y_pos, "Test Date:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(5.0 * inch, y_pos, data.get('test_date', ''))

        y_pos -= 0.25 * inch

        # Test Pressure and Medium
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Test Pressure:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.5 * inch, y_pos, data.get('test_pressure', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.0 * inch, y_pos, "Test Medium:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(5.0 * inch, y_pos, data.get('test_medium', ''))

        y_pos -= 0.25 * inch

        # Duration and Results
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Duration:")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(1.3 * inch, y_pos, data.get('test_duration', ''))

        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(4.0 * inch, y_pos, "Results:")
        self.c.setFont("Helvetica", 9)
        result = data.get('test_results', '')
        if result.lower() == 'pass':
            self.c.setFillColorRGB(0, 0.6, 0)
        elif result.lower() == 'fail':
            self.c.setFillColorRGB(0.8, 0, 0)
        self.c.drawString(5.0 * inch, y_pos, result)
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.25 * inch

        # Test Notes
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.5 * inch, y_pos, "Notes:")
        self.c.setFont("Helvetica", 8)
        notes = data.get('test_notes', '')
        if notes:
            # Wrap text if needed
            max_width = 6.5 * inch
            words = notes.split()
            line = ""
            note_y = y_pos
            for word in words:
                test_line = line + word + " "
                if self.c.stringWidth(test_line, "Helvetica", 8) < max_width:
                    line = test_line
                else:
                    self.c.drawString(1.0 * inch, note_y, line)
                    note_y -= 0.15 * inch
                    line = word + " "
            if line:
                self.c.drawString(1.0 * inch, note_y, line)

        # Draw box
        self.c.rect(0.5 * inch, 8.6 * inch, 7.5 * inch, 1.15 * inch, fill=0)

    def draw_page2_materials(self, data: dict):
        """Draw materials used section on page 2"""
        y_pos = 8.3 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "MATERIALS USED")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.35 * inch

        # Parse materials
        materials = []
        if data.get('materials'):
            try:
                materials = json.loads(data['materials'])
            except:
                pass

        # Draw materials list
        self.c.setFont("Helvetica", 8)
        for material in materials[:15]:  # Limit to 15 items
            desc = material.get('description', '')
            qty = material.get('quantity', '')
            self.c.drawString(0.6 * inch, y_pos, f"• {desc} - Qty: {qty}")
            y_pos -= 0.15 * inch

        # Draw box
        min_y = 5.5 * inch
        self.c.rect(0.5 * inch, min_y, 7.5 * inch, 8.05 * inch - min_y, fill=0)

    def draw_page2_signatures(self, data: dict):
        """Draw signatures section on page 2"""
        y_pos = 5.2 * inch

        # Section header
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, y_pos - 0.2 * inch, 7.5 * inch, 0.25 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.6 * inch, y_pos - 0.15 * inch, "CERTIFICATIONS AND SIGNATURES")
        self.c.setFillColorRGB(0, 0, 0)

        y_pos -= 0.5 * inch

        # Installer Signature
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(0.6 * inch, y_pos, "Installer Signature:")
        self.c.rect(0.5 * inch, y_pos - 1.0 * inch, 2.4 * inch, 0.9 * inch, fill=0)

        installer_sig = self.decode_signature(data.get('installer_signature', ''))
        if installer_sig:
            self.c.drawImage(installer_sig, 0.6 * inch, y_pos - 0.9 * inch,
                           width=2.2 * inch, height=0.7 * inch, preserveAspectRatio=True)

        # Contractor Signature
        self.c.drawString(3.2 * inch, y_pos, "Contractor Signature:")
        self.c.rect(3.1 * inch, y_pos - 1.0 * inch, 2.4 * inch, 0.9 * inch, fill=0)

        contractor_sig = self.decode_signature(data.get('contractor_signature', ''))
        if contractor_sig:
            self.c.drawImage(contractor_sig, 3.2 * inch, y_pos - 0.9 * inch,
                           width=2.2 * inch, height=0.7 * inch, preserveAspectRatio=True)

        # Inspector Signature
        self.c.drawString(5.8 * inch, y_pos, "Inspector/AHJ Signature:")
        self.c.rect(5.7 * inch, y_pos - 1.0 * inch, 2.3 * inch, 0.9 * inch, fill=0)

        inspector_sig = self.decode_signature(data.get('inspector_signature', ''))
        if inspector_sig:
            self.c.drawImage(inspector_sig, 5.8 * inch, y_pos - 0.9 * inch,
                           width=2.1 * inch, height=0.7 * inch, preserveAspectRatio=True)

        y_pos -= 1.1 * inch

        # Signature dates
        self.c.setFont("Helvetica", 8)
        self.c.drawString(0.6 * inch, y_pos, f"Date: {data.get('test_date', '')}")
        self.c.drawString(3.2 * inch, y_pos, f"Date: {data.get('test_date', '')}")
        self.c.drawString(5.8 * inch, y_pos, "Date: _____________")

    def draw_page2_footer(self):
        """Draw footer for page 2"""
        self.c.setFont("Helvetica-Italic", 8)
        self.c.drawCentredString(4.25 * inch, 0.5 * inch, "Page 2 of 2")

    def generate(self, data: dict, photos: list = None) -> str:
        """Generate the complete certificate PDF"""
        # Page 1
        self.draw_page1_header()
        self.draw_page1_project_info(data)
        self.draw_page1_contractor_info(data)
        self.draw_page1_installer_info(data)
        self.draw_page1_system_info(data)
        self.draw_page1_piping_table(data)
        self.draw_page1_footer()

        # Page 2
        self.c.showPage()
        self.draw_page2_header()
        self.draw_page2_test_info(data)
        self.draw_page2_materials(data)
        self.draw_page2_signatures(data)
        self.draw_page2_footer()

        # Add photo pages if provided
        if photos:
            for photo_path in photos:
                try:
                    self.c.showPage()
                    img = Image.open(photo_path)
                    img_width, img_height = img.size
                    aspect = img_height / img_width

                    display_width = 6.5 * inch
                    display_height = display_width * aspect

                    if display_height > 9 * inch:
                        display_height = 9 * inch
                        display_width = display_height / aspect

                    x = (self.width - display_width) / 2
                    y = (self.height - display_height) / 2

                    self.c.drawImage(photo_path, x, y, width=display_width, height=display_height)
                except Exception as e:
                    print(f"Error adding photo {photo_path}: {e}")

        self.c.save()
        return self.filename
