from fastapi import APIRouter, UploadFile, File, HTTPException
import os
from app.core.config import settings
from app.core.upload_validator import validate_and_save_image
from app.schemas import InspectionResult
from app.services.inspection_service import inspection_service

router = APIRouter(prefix="/inspection", tags=["AI Food Inspection"])

@router.post("/inspect", response_model=InspectionResult)
async def inspect_food(file: UploadFile = File(...)):
    """
    Accepts an actual food photograph upload, runs secure validation (5 MB limit,
    magic byte inspection, Pillow format validation), runs pretrained vision classification,
    and processes text using EasyOCR to extract expiration or label notes.
    """
    filename = await validate_and_save_image(file, settings.UPLOAD_DIR)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    try:
        # Run real AI inspection
        result = inspection_service.inspect_food_image(file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")
