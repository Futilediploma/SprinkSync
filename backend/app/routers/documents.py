"""
API routes for document upload and project data extraction
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any
import os
from app.services.document_processor import DocumentProcessor

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/extract-project-data")
async def extract_project_data(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload a document and extract project data using AI
    """
    # Validate file type
    allowed_types = ['.pdf', '.docx', '.doc']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (limit to 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 10MB."
        )
    
    # Reset file pointer
    await file.seek(0)
    
    try:
        # Initialize document processor
        processor = DocumentProcessor()
        
        # Process the document
        result = await processor.process_document(file_content, file.filename)
        
        # Check if processing was successful
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "filename": file.filename,
            "extracted_data": result,
            "message": "Document processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )

@router.post("/validate-extraction")
async def validate_extraction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean extracted project data before saving
    """
    try:
        processor = DocumentProcessor()
        
        # Post-process the data
        cleaned_data = processor._post_process_extracted_data(data, "general")
        
        # Calculate confidence score
        confidence = processor._calculate_confidence(cleaned_data)
        
        return {
            "success": True,
            "validated_data": cleaned_data,
            "confidence_score": confidence,
            "message": "Data validated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating data: {str(e)}"
        )

@router.get("/supported-formats")
async def get_supported_formats() -> Dict[str, Any]:
    """
    Get list of supported document formats
    """
    return {
        "supported_formats": [
            {
                "extension": ".pdf",
                "description": "PDF documents (contracts, permits, proposals)",
                "max_size": "10MB"
            },
            {
                "extension": ".docx",
                "description": "Microsoft Word documents",
                "max_size": "10MB"
            },
            {
                "extension": ".doc",
                "description": "Microsoft Word legacy documents",
                "max_size": "10MB"
            }
        ],
        "recommended_documents": [
            "Construction contracts",
            "Project proposals",
            "Building permits",
            "Insurance documents",
            "Scope of work documents"
        ]
    }
