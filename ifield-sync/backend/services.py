import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import httpx
from typing import Optional
from config import settings


class EmailService:
    """Service for sending emails with PDF attachments"""

    @staticmethod
    async def send_pdf_email(
        pdf_path: str,
        to_email: str,
        subject: str,
        body: str,
        customer_name: str
    ) -> bool:
        """Send PDF via email"""
        if not settings.smtp_user or not settings.smtp_password:
            print("Email not configured")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = settings.smtp_from
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add body
            msg.attach(MIMEText(body, 'plain'))

            # Attach PDF
            with open(pdf_path, 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {pdf_path.split("/")[-1]}'
                )
                msg.attach(part)

            # Send email
            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True
            )

            print(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    @staticmethod
    async def send_certificate_email(
        to_email: str,
        certificate_data: dict,
        pdf_path: str
    ) -> bool:
        """Send certificate PDF via email"""
        if not settings.smtp_user or not settings.smtp_password:
            print("Email not configured")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = settings.smtp_from
            msg['To'] = to_email
            msg['Subject'] = f"Aboveground Piping Certificate - {certificate_data.get('job_name', 'Job')}"

            # Create email body
            body = f"""
Aboveground Piping Certificate Submission

Job Name: {certificate_data.get('job_name', 'N/A')}
Job Location: {certificate_data.get('job_location', 'N/A')}
Contractor: {certificate_data.get('contractor_name', 'N/A')}
Installer: {certificate_data.get('installer_name', 'N/A')}
Test Date: {certificate_data.get('test_date', 'N/A')}
Test Results: {certificate_data.get('test_results', 'N/A')}

Please see the attached PDF for complete details.

This email was sent automatically from iField Sync.
"""

            # Add body
            msg.attach(MIMEText(body, 'plain'))

            # Attach PDF
            with open(pdf_path, 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {pdf_path.split("/")[-1]}'
                )
                msg.attach(part)

            # Send email
            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True
            )

            print(f"Certificate email sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"Error sending certificate email: {e}")
            return False


class ProjectSightService:
    """Service for uploading to ProjectSight API"""

    @staticmethod
    async def upload_document(
        pdf_path: str,
        customer_name: str,
        date_of_call: str,
        account_number: Optional[str] = None
    ) -> tuple[bool, str]:
        """Upload document to ProjectSight"""
        if not settings.projectsight_api_key:
            return False, "ProjectSight API not configured"

        try:
            headers = {
                'Authorization': f'Bearer {settings.projectsight_api_key}',
                'Content-Type': 'multipart/form-data'
            }

            # Prepare file and metadata
            with open(pdf_path, 'rb') as f:
                files = {'file': (pdf_path.split('/')[-1], f, 'application/pdf')}

                data = {
                    'project_id': settings.projectsight_project_id,
                    'document_type': 'Service Order',
                    'customer_name': customer_name,
                    'date': date_of_call,
                    'account_number': account_number or ''
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f'{settings.projectsight_api_url}/documents/upload',
                        files=files,
                        data=data,
                        headers={'Authorization': f'Bearer {settings.projectsight_api_key}'}
                    )

                    if response.status_code == 200:
                        return True, "Successfully uploaded to ProjectSight"
                    else:
                        return False, f"ProjectSight API error: {response.status_code} - {response.text}"

        except Exception as e:
            return False, f"Error uploading to ProjectSight: {str(e)}"


class FileStorageService:
    """Service for managing uploaded files"""

    @staticmethod
    def get_upload_dir() -> str:
        """Get or create upload directory"""
        import os
        upload_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @staticmethod
    def get_pdf_dir() -> str:
        """Get or create PDF directory"""
        import os
        pdf_dir = os.path.join(os.getcwd(), "pdfs")
        os.makedirs(pdf_dir, exist_ok=True)
        return pdf_dir

    @staticmethod
    async def save_uploaded_file(file, filename: str) -> str:
        """Save uploaded file and return path"""
        import os
        upload_dir = FileStorageService.get_upload_dir()
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return file_path
