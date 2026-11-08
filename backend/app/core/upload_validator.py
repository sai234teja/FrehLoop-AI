import io
import os
import uuid
from PIL import Image
from fastapi import UploadFile, HTTPException, status

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}

async def validate_and_save_image(file: UploadFile, upload_dir: str) -> str:
    """
    Validates uploaded file against:
    1. Maximum file size (5 MB limit).
    2. File extension.
    3. Content inspection via Pillow to reject corrupted files, scripts, or non-images.

    Saves sanitized file to disk and returns absolute destination path.
    """
    # 1. Extension check
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only .jpg, .jpeg, .png, and .webp are supported."
        )

    # 2. Content-Type header check
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}'. Must be a valid JPEG, PNG, or WEBP image."
        )

    # 3. Read content and verify size
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of 5 MB ({round(len(content) / (1024 * 1024), 2)} MB provided)."
        )

    # 4. Deep Inspection with Pillow (magic bytes & structure)
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()  # verify integrity
        if img.format not in ALLOWED_PIL_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format '{img.format}'. Only genuine JPEG, PNG, and WEBP images are accepted."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or malformed image file. File could not be parsed as an authentic image."
        )

    # 5. Save with a collision-free UUID
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(upload_dir, filename)
    with open(dest_path, "wb") as buffer:
        buffer.write(content)

    return filename
