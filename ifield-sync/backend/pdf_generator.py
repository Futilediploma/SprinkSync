from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from PIL import Image
import io
import base64
from typing import List, Optional
from schemas import MaterialItem
import os


class ServiceOrderPDF:
    """Generate PDF matching the BFPE International Service Order form"""

    def __init__(self, filename: str):
        self.filename = filename
        self.c = canvas.Canvas(filename, pagesize=letter)
        self.width, self.height = letter

    def decode_signature(self, signature_data: str) -> Optional[ImageReader]:
        """Decode base64 signature data URL to ImageReader"""
        if not signature_data or not signature_data.startswith('data:image'):
            return None
        try:
            # Remove data URL prefix
            image_data = signature_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            return ImageReader(image)
        except Exception as e:
            print(f"Error decoding signature: {e}")
            return None

    def draw_header(self):
        """Draw the BFPE International header"""
        # Left side - Company name and logo area
        self.c.setFont("Helvetica-Bold", 24)
        self.c.drawString(0.5 * inch, 10.5 * inch, "BFPE")

        self.c.setFont("Helvetica-Bold", 16)
        self.c.drawString(0.5 * inch, 10.25 * inch, "INTERNATIONAL")

        self.c.setFont("Helvetica", 7)
        self.c.drawString(0.5 * inch, 10.05 * inch, "FIRE, SAFETY & SECURITY")

        # Right side - SERVICE ORDER title (large and gray)
        self.c.setFillColorRGB(0.6, 0.6, 0.6)
        self.c.setFont("Helvetica-Bold", 28)
        self.c.drawRightString(7.5 * inch, 10.45 * inch, "SERVICE ORDER")
        self.c.setFillColorRGB(0, 0, 0)

        # Contact information columns
        self.c.setFont("Helvetica", 6)

        # Left column of locations
        y_pos = 10.0 * inch
        left_locations = [
            ("□ York, PA", "717-792-0260/800-692-0373"),
            ("    FAX 717-741-5981", ""),
            ("□ Richmond, VA", "804-447-3000"),
            ("    FAX 804-447-3699", ""),
            ("□ Chesapeake, VA", "757-420-7255 594-0373"),
            ("    FAX 757-420-7688", "")
        ]
        for loc, phone in left_locations:
            self.c.drawString(0.5 * inch, y_pos, loc)
            if phone:
                self.c.drawString(1.3 * inch, y_pos, phone)
            y_pos -= 0.1 * inch

        # Right column of locations
        y_pos = 10.0 * inch
        right_locations = [
            ("□ Dover, DE", "302-736-6288 653-2173"),
            ("    FAX 302-736-9368", ""),
            ("□ Clayton, NC", "919-772-5000/877-842-9996"),
            ("    FAX 919-550-0710", ""),
            ("□ Wilmington, NC", "910-762-1311/877-846-5489"),
            ("    FAX 910-762-7273", "")
        ]
        for loc, phone in right_locations:
            self.c.drawString(4.2 * inch, y_pos, loc)
            if phone:
                self.c.drawString(5.0 * inch, y_pos, phone)
            y_pos -= 0.1 * inch

        # Draw "NO." label on far right
        self.c.setFont("Helvetica-Bold", 8)
        self.c.drawString(7.0 * inch, 10.1 * inch, "NO.")

    def draw_form_fields(self, data: dict):
        """Draw the form fields with data"""
        # Main customer info box with border
        box_top = 9.2 * inch

        # Draw outer border for customer section
        self.c.setLineWidth(1.5)
        self.c.rect(0.5 * inch, box_top - 0.6 * inch, 4 * inch, 0.6 * inch)
        self.c.setLineWidth(1)

        # Header bar for customer name/address (dark background)
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, box_top - 0.15 * inch, 4 * inch, 0.15 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)  # White text
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(0.6 * inch, box_top - 0.12 * inch, "CUSTOMER'S NAME/ADDRESS")
        self.c.setFillColorRGB(0, 0, 0)  # Back to black

        # Customer name and address data
        self.c.setFont("Helvetica", 10)
        self.c.drawString(0.6 * inch, box_top - 0.35 * inch, data.get('customer_name', ''))
        self.c.setFont("Helvetica", 8)
        self.c.drawString(0.6 * inch, box_top - 0.52 * inch, data.get('customer_address', ''))

        # Right side boxes - Account number and Purchase order
        right_start = 4.6 * inch

        # Account number box
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(right_start, box_top - 0.15 * inch, 1.3 * inch, 0.15 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(right_start + 0.05 * inch, box_top - 0.12 * inch, "CUST. ACC. NO.")
        self.c.setFillColorRGB(0, 0, 0)

        self.c.rect(right_start, box_top - 0.3 * inch, 1.3 * inch, 0.15 * inch)
        self.c.setFont("Helvetica", 10)
        self.c.drawString(right_start + 0.05 * inch, box_top - 0.26 * inch, data.get('account_number', ''))

        # Purchase order box
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(right_start + 1.35 * inch, box_top - 0.15 * inch, 1.55 * inch, 0.15 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(right_start + 1.4 * inch, box_top - 0.12 * inch, "CUST/PURCHASE ORDER #")
        self.c.setFillColorRGB(0, 0, 0)

        self.c.rect(right_start + 1.35 * inch, box_top - 0.3 * inch, 1.55 * inch, 0.15 * inch)

        # Date of call box
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(right_start, box_top - 0.45 * inch, 2.9 * inch, 0.15 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(right_start + 0.05 * inch, box_top - 0.42 * inch, "DATE OF CALL")
        self.c.setFillColorRGB(0, 0, 0)

        self.c.rect(right_start, box_top - 0.6 * inch, 2.9 * inch, 0.15 * inch)
        self.c.setFont("Helvetica", 10)
        self.c.drawString(right_start + 0.05 * inch, box_top - 0.56 * inch, data.get('date_of_call', ''))

        # Person to see, Terms row
        row_y = box_top - 0.92 * inch
        self.c.setLineWidth(1)

        # Person to see box
        self.c.rect(0.5 * inch, row_y, 2.5 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(0.6 * inch, row_y + 0.17 * inch, "PERSON TO SEE")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(0.6 * inch, row_y + 0.05 * inch, data.get('person_to_see', ''))

        # Terms box
        self.c.rect(3.05 * inch, row_y, 1.2 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(3.15 * inch, row_y + 0.17 * inch, "TERMS")
        self.c.setFont("Helvetica", 9)
        self.c.drawString(3.15 * inch, row_y + 0.05 * inch, data.get('terms', ''))

        # Contract checkbox
        self.c.rect(4.3 * inch, row_y, 0.5 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(4.35 * inch, row_y + 0.17 * inch, "CONTRACT")
        self.c.rect(4.4 * inch, row_y + 0.03 * inch, 0.12 * inch, 0.12 * inch)

        # COD checkbox
        self.c.rect(4.85 * inch, row_y, 0.5 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(4.9 * inch, row_y + 0.17 * inch, "COD")
        self.c.rect(4.95 * inch, row_y + 0.03 * inch, 0.12 * inch, 0.12 * inch)

        # Auto checkbox
        self.c.rect(5.4 * inch, row_y, 0.5 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(5.45 * inch, row_y + 0.17 * inch, "AUTO")
        self.c.rect(5.5 * inch, row_y + 0.03 * inch, 0.12 * inch, 0.12 * inch)

        # Telephone number section
        self.c.rect(5.95 * inch, row_y, 1.55 * inch, 0.2 * inch)
        self.c.setFont("Helvetica-Bold", 6)
        self.c.drawString(6.0 * inch, row_y + 0.17 * inch, "TELE NO.")

        # Special instructions section - larger box with header
        instr_top = row_y - 0.1 * inch
        instr_height = 1.5 * inch

        # Draw outer border
        self.c.setLineWidth(1.5)
        self.c.rect(0.5 * inch, instr_top - instr_height, 7 * inch, instr_height)
        self.c.setLineWidth(1)

        # Header bar
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, instr_top - 0.15 * inch, 7 * inch, 0.15 * inch, fill=1)
        self.c.setFillColorRGB(1, 1, 1)
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(0.6 * inch, instr_top - 0.12 * inch, "SPECIAL")
        self.c.drawString(1.0 * inch, instr_top - 0.12 * inch, "INSTRUCTIONS")
        self.c.setFillColorRGB(0, 0, 0)

        # Draw special instructions text
        self.c.setFont("Helvetica", 9)
        instructions = data.get('special_instructions', '')
        self._draw_wrapped_text(instructions, 0.6 * inch, instr_top - 0.3 * inch, 6.8 * inch, 1.15 * inch)

        # Time in/out at bottom of instructions
        time_in = data.get('time_in', '')
        time_out = data.get('time_out', '')
        if time_in or time_out:
            self.c.setFont("Helvetica", 7)
            self.c.drawString(0.6 * inch, instr_top - instr_height + 0.08 * inch,
                            f"Time In: {time_in}    Time Out: {time_out}")

    def _draw_wrapped_text(self, text: str, x: float, y: float, max_width: float, max_height: float):
        """Draw text with word wrapping"""
        if not text:
            return

        words = text.split()
        lines = []
        current_line = []

        self.c.setFont("Helvetica", 9)

        for word in words:
            test_line = ' '.join(current_line + [word])
            if self.c.stringWidth(test_line, "Helvetica", 9) <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]

        if current_line:
            lines.append(' '.join(current_line))

        # Draw lines
        line_height = 12
        for i, line in enumerate(lines):
            if y - (i * line_height) > y - max_height:
                self.c.drawString(x, y - (i * line_height), line)

    def draw_materials_table(self, materials: List[MaterialItem]):
        """Draw the materials/services table"""
        # Table header with dark gray background
        table_top = 6.9 * inch
        self.c.setFillColorRGB(0.4, 0.4, 0.4)
        self.c.rect(0.5 * inch, table_top, 7 * inch, 0.2 * inch, fill=1)

        self.c.setFillColorRGB(1, 1, 1)  # White text
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(0.6 * inch, table_top + 0.06 * inch, "QUANTITY")
        self.c.drawString(1.2 * inch, table_top + 0.06 * inch, "WEIGHT")
        self.c.drawCentredString(4.0 * inch, table_top + 0.06 * inch, "TYPE OF SERVICE/SALES")
        self.c.drawString(5.9 * inch, table_top + 0.06 * inch, "UNIT PRICE")
        self.c.drawString(6.9 * inch, table_top + 0.06 * inch, "TOTAL")
        self.c.setFillColorRGB(0, 0, 0)  # Back to black

        # Table rows
        row_height = 0.25 * inch
        y_pos = table_top

        self.c.setFont("Helvetica", 8)
        for i, item in enumerate(materials[:15]):  # Limit to 15 rows
            y_pos -= row_height

            # Draw row lines
            self.c.setStrokeColorRGB(0.8, 0.8, 0.8)
            self.c.line(0.5 * inch, y_pos, 7.5 * inch, y_pos)

            # Draw data
            self.c.setFillColorRGB(0, 0, 0)
            self.c.drawString(0.6 * inch, y_pos + 0.08 * inch, str(item.quantity))
            self.c.drawString(1.2 * inch, y_pos + 0.08 * inch, str(item.weight))

            # Wrap description if too long
            desc = str(item.description)
            if self.c.stringWidth(desc, "Helvetica", 8) > 3.8 * inch:
                desc = desc[:60] + "..."
            self.c.drawString(1.8 * inch, y_pos + 0.08 * inch, desc)

            self.c.drawString(5.8 * inch, y_pos + 0.08 * inch, str(item.unit_price))
            self.c.drawString(6.8 * inch, y_pos + 0.08 * inch, str(item.total))

        # Draw remaining empty rows
        for i in range(len(materials), 15):
            y_pos -= row_height
            self.c.setStrokeColorRGB(0.8, 0.8, 0.8)
            self.c.line(0.5 * inch, y_pos, 7.5 * inch, y_pos)

        # Vertical lines
        self.c.line(0.5 * inch, table_top + 0.25 * inch, 0.5 * inch, y_pos)
        self.c.line(1.15 * inch, table_top + 0.25 * inch, 1.15 * inch, y_pos)
        self.c.line(1.75 * inch, table_top + 0.25 * inch, 1.75 * inch, y_pos)
        self.c.line(5.7 * inch, table_top + 0.25 * inch, 5.7 * inch, y_pos)
        self.c.line(6.7 * inch, table_top + 0.25 * inch, 6.7 * inch, y_pos)
        self.c.line(7.5 * inch, table_top + 0.25 * inch, 7.5 * inch, y_pos)

        return y_pos

    def draw_totals(self, subtotal: float, tax: float, total: float, y_pos: float):
        """Draw the totals section"""
        # Draw boxes for completed date, subtotal, tax, total
        box_y = y_pos - 0.8 * inch

        self.c.rect(5.5 * inch, box_y + 0.5 * inch, 2 * inch, 0.25 * inch)
        self.c.setFont("Helvetica-Bold", 8)
        self.c.drawString(5.6 * inch, box_y + 0.57 * inch, "COMPLETED DATE:")
        self.c.drawString(6.5 * inch, box_y + 0.57 * inch, "SYMB.")

        self.c.rect(5.5 * inch, box_y + 0.25 * inch, 2 * inch, 0.25 * inch)
        self.c.drawString(5.6 * inch, box_y + 0.32 * inch, "SUB-TOTAL")
        self.c.setFont("Helvetica", 9)
        self.c.drawRightString(7.3 * inch, box_y + 0.32 * inch, f"${subtotal:.2f}")

        self.c.setFont("Helvetica-Bold", 8)
        self.c.rect(5.5 * inch, box_y, 2 * inch, 0.25 * inch)
        self.c.drawString(5.6 * inch, box_y + 0.07 * inch, "TAX")
        self.c.setFont("Helvetica", 9)
        self.c.drawRightString(7.3 * inch, box_y + 0.07 * inch, f"${tax:.2f}")

        self.c.setFont("Helvetica-Bold", 8)
        self.c.rect(5.5 * inch, box_y - 0.25 * inch, 2 * inch, 0.25 * inch)
        self.c.drawString(5.6 * inch, box_y - 0.18 * inch, "TOTAL")
        self.c.setFont("Helvetica", 10)
        self.c.drawRightString(7.3 * inch, box_y - 0.18 * inch, f"${total:.2f}")

    def draw_signature_section(self, gc_signature: Optional[str], tech_signature: Optional[str], y_pos: float):
        """Draw signature section"""
        sig_y = y_pos - 1.5 * inch

        # Payment info
        self.c.setFont("Helvetica", 7)
        self.c.drawString(0.6 * inch, sig_y + 0.5 * inch,
                         "WE ACCEPT AMERICAN EXPRESS, MASTERCARD AND VISA")
        self.c.setFont("Helvetica-Bold", 7)
        self.c.drawString(0.6 * inch, sig_y + 0.35 * inch,
                         "REMIT TO: BFPE INTERNATIONAL, P.O. BOX 791045, BALTIMORE, MARYLAND 21279-1045")

        # Signature boxes
        self.c.rect(0.5 * inch, sig_y, 3.5 * inch, 0.8 * inch)
        self.c.rect(4 * inch, sig_y, 3.5 * inch, 0.8 * inch)

        # Draw "BILL TO" label
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(0.15 * inch, sig_y + 0.3 * inch, "B")
        self.c.drawString(0.15 * inch, sig_y + 0.15 * inch, "I")
        self.c.drawString(0.15 * inch, sig_y, "L")
        self.c.drawString(0.15 * inch, sig_y - 0.15 * inch, "L")
        self.c.drawString(0.10 * inch, sig_y - 0.35 * inch, "T")
        self.c.drawString(0.15 * inch, sig_y - 0.5 * inch, "O")

        # Draw signatures
        if gc_signature:
            gc_img = self.decode_signature(gc_signature)
            if gc_img:
                self.c.drawImage(gc_img, 0.6 * inch, sig_y + 0.1 * inch,
                               width=3 * inch, height=0.5 * inch,
                               preserveAspectRatio=True, mask='auto')

        if tech_signature:
            tech_img = self.decode_signature(tech_signature)
            if tech_img:
                self.c.drawImage(tech_img, 4.1 * inch, sig_y + 0.1 * inch,
                               width=3 * inch, height=0.5 * inch,
                               preserveAspectRatio=True, mask='auto')

        # Signature labels
        self.c.setFont("Helvetica", 7)
        self.c.drawString(0.6 * inch, sig_y + 0.05 * inch, "PRINT SIGNATURE")
        self.c.drawString(4.1 * inch, sig_y + 0.05 * inch, "SIGN SIGNATURE")

        # Bottom text
        self.c.setFont("Helvetica-Bold", 8)
        self.c.drawCentredString(4.25 * inch, sig_y - 0.3 * inch, "ORIGINAL")

    def generate(self, data: dict, materials: List[MaterialItem],
                gc_signature: Optional[str], tech_signature: Optional[str],
                subtotal: float, tax: float, total: float):
        """Generate the complete PDF"""
        self.draw_header()
        self.draw_form_fields(data)
        y_pos = self.draw_materials_table(materials)
        self.draw_totals(subtotal, tax, total, y_pos)
        self.draw_signature_section(gc_signature, tech_signature, y_pos)

        self.c.showPage()

    def add_photo_pages(self, photo_paths: List[str]):
        """Add photos as additional pages"""
        for photo_path in photo_paths:
            if os.path.exists(photo_path):
                try:
                    img = Image.open(photo_path)
                    img_width, img_height = img.size

                    # Calculate scaling to fit page
                    max_width = 7.5 * inch
                    max_height = 10 * inch

                    scale = min(max_width / img_width, max_height / img_height)
                    new_width = img_width * scale
                    new_height = img_height * scale

                    # Center on page
                    x = (self.width - new_width) / 2
                    y = (self.height - new_height) / 2

                    self.c.drawImage(photo_path, x, y, width=new_width, height=new_height)
                    self.c.showPage()
                except Exception as e:
                    print(f"Error adding photo {photo_path}: {e}")

    def save(self):
        """Save the PDF"""
        self.c.save()
