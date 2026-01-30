
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from contextlib import asynccontextmanager
import secrets
import json
from datetime import datetime
import os


from database import get_db, init_db, Job, Submission, CertificateSubmission, Project, ManpowerForecast, MonthlyForecastAllocation
from schemas import (
    JobCreate, JobResponse, SubmissionCreate, SubmissionResponse,
    MaterialItem, UploadConfig, CertificateSubmissionCreate, CertificateSubmissionResponse,
    ProjectCreate, ProjectResponse, ProjectUpdate, ForecastCreate, ForecastResponse, ManpowerSummary, MonthlyAllocationResponse
)

from pdf_generator import ServiceOrderPDF
from certificate_pdf_generator import CertificatePDF
from services import EmailService, ProjectSightService, FileStorageService
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    init_db()
    # Create necessary directories
    FileStorageService.get_upload_dir()
    FileStorageService.get_pdf_dir()
    yield

app = FastAPI(title="iField Sync API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ============================================================================
# JOB MANAGEMENT ENDPOINTS (Office Admin)
# ============================================================================

@app.post("/api/jobs", response_model=JobResponse)
async def create_job(job: JobCreate, db: Session = Depends(get_db)):
    """Create a new job and generate share link"""
    share_token = secrets.token_urlsafe(16)

    db_job = Job(
        share_token=share_token,
        form_type=job.form_type,
        customer_name=job.customer_name,
        customer_address=job.customer_address,
        account_number=job.account_number,
        person_to_see=job.person_to_see,
        terms=job.terms
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Construct response with share link
    return JobResponse(
        id=db_job.id,
        share_token=db_job.share_token,
        form_type=db_job.form_type,
        customer_name=db_job.customer_name,
        customer_address=db_job.customer_address,
        account_number=db_job.account_number,
        person_to_see=db_job.person_to_see,
        terms=db_job.terms,
        created_at=db_job.created_at,
        is_active=db_job.is_active,
        share_link=f"/form/{share_token}"
    )


@app.get("/api/jobs", response_model=List[JobResponse])
async def list_jobs(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all jobs"""
    query = db.query(Job)
    if active_only:
        query = query.filter(Job.is_active == True)

    jobs = query.order_by(Job.created_at.desc()).all()

    # Add share links
    response_jobs = []
    for job in jobs:
        response_jobs.append(JobResponse(
            id=job.id,
            share_token=job.share_token,
            form_type=job.form_type,
            customer_name=job.customer_name,
            customer_address=job.customer_address,
            account_number=job.account_number,
            person_to_see=job.person_to_see,
            terms=job.terms,
            created_at=job.created_at,
            is_active=job.is_active,
            share_link=f"/form/{job.share_token}"
        ))

    return response_jobs


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        id=job.id,
        share_token=job.share_token,
        form_type=job.form_type,
        customer_name=job.customer_name,
        customer_address=job.customer_address,
        account_number=job.account_number,
        person_to_see=job.person_to_see,
        terms=job.terms,
        created_at=job.created_at,
        is_active=job.is_active,
        share_link=f"/form/{job.share_token}"
    )


@app.patch("/api/jobs/{job_id}/deactivate")
async def deactivate_job(job_id: int, db: Session = Depends(get_db)):
    """Deactivate a job (disable share link)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.is_active = False
    db.commit()

    return {"message": "Job deactivated successfully"}


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}


@app.delete("/api/submissions/{submission_id}")
async def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    """Delete a submission"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Delete associated PDF file
    if submission.pdf_filename:
        pdf_path = os.path.join(FileStorageService.get_pdf_dir(), submission.pdf_filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

    # Delete associated photos
    if submission.photos:
        photo_list = submission.photos.split(',')
        for photo in photo_list:
            photo_path = os.path.join(FileStorageService.get_upload_dir(), photo)
            if os.path.exists(photo_path):
                os.remove(photo_path)

    db.delete(submission)
    db.commit()

    return {"message": "Submission deleted successfully"}


# ============================================================================
# FORM ENDPOINTS (Field Technicians)
# ============================================================================

@app.get("/api/form/{share_token}")
async def get_form_data(share_token: str, db: Session = Depends(get_db)):
    """Get job data for filling out form"""
    job = db.query(Job).filter(
        Job.share_token == share_token,
        Job.is_active == True
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Form not found or link expired"
        )

    return {
        "customer_name": job.customer_name,
        "customer_address": job.customer_address,
        "account_number": job.account_number,
        "person_to_see": job.person_to_see,
        "terms": job.terms
    }


@app.post("/api/submit")
async def submit_form(
    submission_data: str = Form(...),
    upload_config: str = Form(...),
    photos: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    """Submit completed form with photos"""

    # Parse JSON data
    data = json.loads(submission_data)
    config = json.loads(upload_config)

    submission = SubmissionCreate(**data)
    upload_cfg = UploadConfig(**config)

    # Verify job exists and is active
    job = db.query(Job).filter(
        Job.share_token == submission.share_token,
        Job.is_active == True
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired form link"
        )

    # Save photos
    photo_filenames = []
    photo_paths = []

    for photo in photos:
        if photo.filename:
            # Generate unique filename
            ext = photo.filename.split('.')[-1]
            unique_filename = f"{secrets.token_urlsafe(8)}.{ext}"
            file_path = await FileStorageService.save_uploaded_file(
                photo,
                unique_filename
            )
            photo_filenames.append(unique_filename)
            photo_paths.append(file_path)

    # Generate PDF
    pdf_filename = f"service_order_{job.account_number or job.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = os.path.join(FileStorageService.get_pdf_dir(), pdf_filename)

    pdf = ServiceOrderPDF(pdf_path)

    form_data = {
        'customer_name': submission.customer_name,
        'customer_address': submission.customer_address,
        'account_number': submission.account_number,
        'date_of_call': submission.date_of_call,
        'person_to_see': submission.person_to_see,
        'terms': submission.terms,
        'special_instructions': submission.special_instructions,
        'time_in': submission.time_in,
        'time_out': submission.time_out
    }

    pdf.generate(
        data=form_data,
        materials=submission.materials,
        gc_signature=submission.gc_signature,
        tech_signature=submission.tech_signature,
        subtotal=submission.subtotal,
        tax=submission.tax,
        total=submission.total
    )

    # Add photo pages
    if photo_paths:
        pdf.add_photo_pages(photo_paths)

    pdf.save()

    # Create submission record
    db_submission = Submission(
        job_id=job.id,
        share_token=submission.share_token,
        customer_name=submission.customer_name,
        customer_address=submission.customer_address,
        account_number=submission.account_number,
        date_of_call=submission.date_of_call,
        person_to_see=submission.person_to_see,
        terms=submission.terms,
        special_instructions=submission.special_instructions,
        time_in=submission.time_in,
        time_out=submission.time_out,
        materials=json.dumps([m.dict() for m in submission.materials]),
        gc_signature=submission.gc_signature[:100] if submission.gc_signature else None,  # Store truncated
        tech_signature=submission.tech_signature[:100] if submission.tech_signature else None,
        photos=','.join(photo_filenames),
        pdf_filename=pdf_filename,
        subtotal=submission.subtotal,
        tax=submission.tax,
        total=submission.total
    )

    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Handle uploads
    upload_notes = []

    if upload_cfg.upload_to_projectsight:
        success, message = await ProjectSightService.upload_document(
            pdf_path,
            submission.customer_name,
            submission.date_of_call,
            submission.account_number
        )
        db_submission.uploaded_to_projectsight = success
        upload_notes.append(f"ProjectSight: {message}")

    if upload_cfg.send_email:
        email_to = upload_cfg.email_to or settings.default_email_to
        if email_to:
            success = await EmailService.send_pdf_email(
                pdf_path,
                email_to,
                f"Service Order - {submission.customer_name}",
                f"Service order for {submission.customer_name} on {submission.date_of_call}\n\n"
                f"Account: {submission.account_number}\n"
                f"Total: ${submission.total:.2f}",
                submission.customer_name
            )
            db_submission.emailed = success
            upload_notes.append(f"Email: {'Sent' if success else 'Failed'}")

    db_submission.upload_notes = '; '.join(upload_notes)
    db.commit()

    return {
        "success": True,
        "submission_id": db_submission.id,
        "pdf_filename": pdf_filename,
        "message": "Form submitted successfully"
    }


# ============================================================================
# SUBMISSION MANAGEMENT ENDPOINTS (Office Admin)
# ============================================================================

@app.get("/api/submissions", response_model=List[SubmissionResponse])
async def list_submissions(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all submissions"""
    submissions = db.query(Submission)\
        .order_by(Submission.submitted_at.desc())\
        .limit(limit)\
        .all()

    return submissions


@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: int, db: Session = Depends(get_db)):
    """Get detailed submission data"""
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Parse materials JSON
    materials = json.loads(submission.materials) if submission.materials else []

    return {
        "id": submission.id,
        "job_id": submission.job_id,
        "customer_name": submission.customer_name,
        "customer_address": submission.customer_address,
        "account_number": submission.account_number,
        "date_of_call": submission.date_of_call,
        "person_to_see": submission.person_to_see,
        "terms": submission.terms,
        "special_instructions": submission.special_instructions,
        "time_in": submission.time_in,
        "time_out": submission.time_out,
        "materials": materials,
        "photos": submission.photos.split(',') if submission.photos else [],
        "pdf_filename": submission.pdf_filename,
        "uploaded_to_projectsight": submission.uploaded_to_projectsight,
        "emailed": submission.emailed,
        "upload_notes": submission.upload_notes,
        "submitted_at": submission.submitted_at,
        "subtotal": submission.subtotal,
        "tax": submission.tax,
        "total": submission.total
    }


@app.get("/api/submissions/{submission_id}/pdf")
async def download_pdf(submission_id: int, db: Session = Depends(get_db)):
    """Download PDF for a submission"""
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission or not submission.pdf_filename:
        raise HTTPException(status_code=404, detail="PDF not found")

    pdf_path = os.path.join(FileStorageService.get_pdf_dir(), submission.pdf_filename)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")

    return FileResponse(
        pdf_path,
        media_type='application/pdf',
        filename=submission.pdf_filename
    )


@app.get("/api/submissions/{submission_id}/photos/{photo_filename}")
async def download_photo(
    submission_id: int,
    photo_filename: str,
    db: Session = Depends(get_db)
):
    """Download a photo from a submission"""
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Verify photo belongs to this submission
    photos = submission.photos.split(',') if submission.photos else []
    if photo_filename not in photos:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo_path = os.path.join(FileStorageService.get_upload_dir(), photo_filename)

    if not os.path.exists(photo_path):
        raise HTTPException(status_code=404, detail="Photo file not found")

    return FileResponse(photo_path)


# ============================================================================
# CERTIFICATE SUBMISSION ENDPOINTS
# ============================================================================

@app.post("/api/certificate-submissions")
async def submit_certificate(
    submission_data: str = Form(...),
    upload_config: str = Form(...),
    photos: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    """Submit a completed certificate form"""
    # Parse JSON data
    submission_dict = json.loads(submission_data)
    upload_dict = json.loads(upload_config)

    # Get job by share token
    job = db.query(Job).filter(Job.share_token == submission_dict['share_token']).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.is_active:
        raise HTTPException(status_code=400, detail="This job link is no longer active")

    # Save photos
    photo_filenames = []
    for photo in photos:
        filename = FileStorageService.save_upload(photo)
        photo_filenames.append(filename)

    # Create certificate submission record
    certificate = CertificateSubmission(
        job_id=job.id,
        share_token=submission_dict['share_token'],
        job_name=submission_dict['job_name'],
        job_location=submission_dict.get('job_location', ''),
        permit_number=submission_dict.get('permit_number', ''),
        ahj=submission_dict.get('ahj', ''),
        contractor_name=submission_dict['contractor_name'],
        contractor_address=submission_dict.get('contractor_address', ''),
        contractor_license=submission_dict.get('contractor_license', ''),
        contractor_phone=submission_dict.get('contractor_phone', ''),
        installer_name=submission_dict['installer_name'],
        installer_license=submission_dict.get('installer_license', ''),
        installer_phone=submission_dict.get('installer_phone', ''),
        system_type=submission_dict.get('system_type', ''),
        occupancy_classification=submission_dict.get('occupancy_classification', ''),
        piping_data=json.dumps(submission_dict.get('piping_data', [])),
        test_type=submission_dict.get('test_type', ''),
        test_pressure=submission_dict.get('test_pressure', ''),
        test_medium=submission_dict.get('test_medium', ''),
        test_duration=submission_dict.get('test_duration', ''),
        test_results=submission_dict.get('test_results', ''),
        test_date=submission_dict.get('test_date', ''),
        test_notes=submission_dict.get('test_notes', ''),
        materials=json.dumps(submission_dict.get('materials', [])),
        installer_signature=submission_dict.get('installer_signature', ''),
        contractor_signature=submission_dict.get('contractor_signature', ''),
        inspector_signature=submission_dict.get('inspector_signature', ''),
        photos=','.join(photo_filenames) if photo_filenames else None
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    # Generate PDF
    pdf_filename = f"certificate_{certificate.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = os.path.join(FileStorageService.get_pdf_dir(), pdf_filename)

    pdf_gen = CertificatePDF(pdf_path)
    photo_paths = [os.path.join(FileStorageService.get_upload_dir(), p) for p in photo_filenames]
    pdf_gen.generate(submission_dict, photo_paths)

    certificate.pdf_filename = pdf_filename

    # Handle upload/email based on config
    if upload_dict.get('upload_to_projectsight'):
        try:
            ProjectSightService.upload_document(pdf_path, f"Certificate - {certificate.job_name}")
            certificate.uploaded_to_projectsight = True
        except Exception as e:
            print(f"ProjectSight upload failed: {e}")

    if upload_dict.get('send_email'):
        try:
            email_to = upload_dict.get('email_to') or settings.default_email_to
            EmailService.send_certificate_email(
                to_email=email_to,
                certificate_data=submission_dict,
                pdf_path=pdf_path
            )
            certificate.emailed = True
        except Exception as e:
            print(f"Email send failed: {e}")

    db.commit()

    return CertificateSubmissionResponse(
        id=certificate.id,
        job_id=certificate.job_id,
        share_token=certificate.share_token,
        job_name=certificate.job_name,
        submitted_at=certificate.submitted_at,
        pdf_filename=certificate.pdf_filename,
        uploaded_to_projectsight=certificate.uploaded_to_projectsight,
        emailed=certificate.emailed
    )


@app.get("/api/certificate-submissions", response_model=List[CertificateSubmissionResponse])
async def list_certificate_submissions(db: Session = Depends(get_db)):
    """List all certificate submissions"""
    certificates = db.query(CertificateSubmission).order_by(CertificateSubmission.submitted_at.desc()).all()

    return [CertificateSubmissionResponse(
        id=cert.id,
        job_id=cert.job_id,
        share_token=cert.share_token,
        job_name=cert.job_name,
        submitted_at=cert.submitted_at,
        pdf_filename=cert.pdf_filename,
        uploaded_to_projectsight=cert.uploaded_to_projectsight,
        emailed=cert.emailed
    ) for cert in certificates]


@app.get("/api/certificate-submissions/{certificate_id}")
async def get_certificate_submission(certificate_id: int, db: Session = Depends(get_db)):
    """Get a specific certificate submission with full details"""
    certificate = db.query(CertificateSubmission).filter(
        CertificateSubmission.id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Parse JSON fields
    piping_data = json.loads(certificate.piping_data) if certificate.piping_data else []
    materials = json.loads(certificate.materials) if certificate.materials else []

    return {
        "id": certificate.id,
        "job_id": certificate.job_id,
        "share_token": certificate.share_token,
        "job_name": certificate.job_name,
        "job_location": certificate.job_location,
        "permit_number": certificate.permit_number,
        "ahj": certificate.ahj,
        "contractor_name": certificate.contractor_name,
        "contractor_address": certificate.contractor_address,
        "contractor_license": certificate.contractor_license,
        "contractor_phone": certificate.contractor_phone,
        "installer_name": certificate.installer_name,
        "installer_license": certificate.installer_license,
        "installer_phone": certificate.installer_phone,
        "system_type": certificate.system_type,
        "occupancy_classification": certificate.occupancy_classification,
        "piping_data": piping_data,
        "test_type": certificate.test_type,
        "test_pressure": certificate.test_pressure,
        "test_medium": certificate.test_medium,
        "test_duration": certificate.test_duration,
        "test_results": certificate.test_results,
        "test_date": certificate.test_date,
        "test_notes": certificate.test_notes,
        "materials": materials,
        "photos": certificate.photos.split(',') if certificate.photos else [],
        "pdf_filename": certificate.pdf_filename,
        "submitted_at": certificate.submitted_at,
        "uploaded_to_projectsight": certificate.uploaded_to_projectsight,
        "emailed": certificate.emailed
    }


@app.get("/api/certificate-submissions/{certificate_id}/pdf")
async def download_certificate_pdf(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """Download certificate PDF"""
    certificate = db.query(CertificateSubmission).filter(
        CertificateSubmission.id == certificate_id
    ).first()

    if not certificate or not certificate.pdf_filename:
        raise HTTPException(status_code=404, detail="PDF not found")

    pdf_path = os.path.join(FileStorageService.get_pdf_dir(), certificate.pdf_filename)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"certificate_{certificate.job_name}_{certificate.id}.pdf"
    )


@app.delete("/api/certificate-submissions/{certificate_id}")
async def delete_certificate_submission(certificate_id: int, db: Session = Depends(get_db)):
    """Delete a certificate submission"""
    certificate = db.query(CertificateSubmission).filter(
        CertificateSubmission.id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Delete associated PDF file
    if certificate.pdf_filename:
        pdf_path = os.path.join(FileStorageService.get_pdf_dir(), certificate.pdf_filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

    # Delete associated photos
    if certificate.photos:
        photo_list = certificate.photos.split(',')
        for photo in photo_list:
            photo_path = os.path.join(FileStorageService.get_upload_dir(), photo)
            if os.path.exists(photo_path):
                os.remove(photo_path)

    db.delete(certificate)
    db.commit()

    return {"message": "Certificate deleted successfully"}


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# MANPOWER FORECAST ENDPOINTS
# ============================================================================

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    db_project = Project(
        job_number=project.job_number,
        job_name=project.job_name,
        designer=project.designer,
        superintendent=project.superintendent,
        total_labor_hours=project.total_labor_hours,
        labor_budget=project.labor_budget
    )
    db.add(db_project)
    try:
        db.commit()
        db.refresh(db_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Project with this job number may already exist")
    
    return db_project


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """List all projects"""
    return db.query(Project).all()


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project details"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    
    # Recalculate forecast if total hours changed
    if 'total_labor_hours' in update_data:
        # Trigger forecast update logic if a forecast exists
        forecast = db.query(ManpowerForecast).filter(ManpowerForecast.project_id == project_id).first()
        if forecast:
            await recalculate_forecast(db, forecast, db_project)

    return db_project


@app.post("/api/forecast", response_model=ForecastResponse)
async def create_or_update_forecast(forecast_data: ForecastCreate, db: Session = Depends(get_db)):
    """Create or update a manpower forecast"""
    project = db.query(Project).filter(Project.id == forecast_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if forecast exists
    db_forecast = db.query(ManpowerForecast).filter(ManpowerForecast.project_id == forecast_data.project_id).first()
    
    if db_forecast:
        db_forecast.hours_completed = forecast_data.hours_completed
        db_forecast.start_month = forecast_data.start_month
        db_forecast.end_month = forecast_data.end_month
    else:
        db_forecast = ManpowerForecast(
            project_id=forecast_data.project_id,
            hours_completed=forecast_data.hours_completed,
            start_month=forecast_data.start_month,
            end_month=forecast_data.end_month
        )
        db.add(db_forecast)
    
    db.commit()
    db.refresh(db_forecast)
    
    # Calculate Allocations
    allocations = await recalculate_forecast(db, db_forecast, project)

    remaining = max(0, project.total_labor_hours - db_forecast.hours_completed)
    
    return ForecastResponse(
        id=db_forecast.id,
        project_id=db_forecast.project_id,
        hours_completed=db_forecast.hours_completed,
        start_month=db_forecast.start_month,
        end_month=db_forecast.end_month,
        remaining_hours=remaining,
        allocations=[MonthlyAllocationResponse(month=a.month, forecast_hours=a.forecast_hours) for a in allocations]
    )

@app.get("/api/forecast/summary", response_model=List[ManpowerSummary])
async def get_forecast_summary(db: Session = Depends(get_db)):
    """Get monthly summary of manpower across all projects"""
    allocations = db.query(MonthlyForecastAllocation).all()
    
    summary_map = {}
    for alloc in allocations:
        if alloc.month not in summary_map:
            summary_map[alloc.month] = 0.0
        summary_map[alloc.month] += alloc.forecast_hours
    
    # Sort by month
    sorted_months = sorted(summary_map.keys())
    return [
        ManpowerSummary(month=month, total_hours=summary_map[month])
        for month in sorted_months
    ]

@app.get("/api/forecast", response_model=List[ForecastResponse])
async def list_forecasts(db: Session = Depends(get_db)):
    """List all forecasts with allocations"""
    forecasts = db.query(ManpowerForecast).all()
    results = []
    
    for f in forecasts:
        project = db.query(Project).filter(Project.id == f.project_id).first()
        if not project:
            continue
            
        allocations = db.query(MonthlyForecastAllocation).filter(
            MonthlyForecastAllocation.project_id == f.project_id
        ).order_by(MonthlyForecastAllocation.month).all()
        
        remaining = max(0, project.total_labor_hours - f.hours_completed)
        
        results.append(ForecastResponse(
            id=f.id,
            project_id=f.project_id,
            hours_completed=f.hours_completed,
            start_month=f.start_month,
            end_month=f.end_month,
            remaining_hours=remaining,
            allocations=[MonthlyAllocationResponse(month=a.month, forecast_hours=a.forecast_hours) for a in allocations]
        ))
    
    return results

async def recalculate_forecast(db: Session, forecast: ManpowerForecast, project: Project):
    """Helper to recalculate and save allocations"""
    # 1. Clear existing allocations
    db.query(MonthlyForecastAllocation).filter(
        MonthlyForecastAllocation.project_id == forecast.project_id
    ).delete()
    
    # 2. Calculate details
    start = datetime.strptime(forecast.start_month, "%Y-%m")
    end = datetime.strptime(forecast.end_month, "%Y-%m")
    
    months_count = (end.year - start.year) * 12 + (end.month - start.month) + 1
    if months_count < 1:
        months_count = 1  # Divide by zero protection, though validation should catch this
        
    remaining_hours = max(0, project.total_labor_hours - forecast.hours_completed)
    monthly_hours = remaining_hours / months_count
    
    new_allocations = []
    for i in range(months_count):
        year = start.year + (start.month - 1 + i) // 12
        month_val = (start.month - 1 + i) % 12 + 1
        month_str = f"{year}-{month_val:02d}"
        
        alloc = MonthlyForecastAllocation(
            project_id=forecast.project_id,
            month=month_str,
            forecast_hours=monthly_hours
        )
        new_allocations.append(alloc)
        db.add(alloc)
    
    db.commit()
    return new_allocations


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
