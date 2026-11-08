from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import os
import shutil
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.donation import Donation
from app.models.user import User
from app.schemas import DonationResponse, DonationCreate, DonationUpdateStatus
from app.services.safety_service import verify_donation_safety

router = APIRouter(prefix="/donations", tags=["Donations"])

ALLOWED_TRANSITIONS = {
    "Available": ["Accepted"],
    "Accepted": ["Picked Up"],
    "Picked Up": ["Delivered"],
    "Delivered": []
}

def enrich_donation_response(donation: Donation, db: Session) -> dict:
    """Enriches donation record with joined donor and destination NGO details."""
    data = {c.name: getattr(donation, c.name) for c in donation.__table__.columns}

    # Get donor details
    donor = db.query(User).filter(User.id == donation.donor_id).first()
    data["donor_name"] = donor.organization or donor.name if donor else None

    # Get assigned NGO details (destination)
    if donation.assigned_ngo_id:
        ngo = db.query(User).filter(User.id == donation.assigned_ngo_id).first()
        if ngo:
            data["ngo_name"] = ngo.organization or ngo.name
            data["ngo_address"] = ngo.address
            data["ngo_latitude"] = ngo.latitude
            data["ngo_longitude"] = ngo.longitude
    return data

@router.get("", response_model=List[DonationResponse])
def get_donations(
    status: Optional[str] = None,
    donor_id: Optional[int] = None,
    ngo_id: Optional[int] = None,
    volunteer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Donation)
    if status:
        query = query.filter(Donation.status == status)
    if donor_id:
        query = query.filter(Donation.donor_id == donor_id)
    if ngo_id:
        query = query.filter(Donation.assigned_ngo_id == ngo_id)
    if volunteer_id:
        query = query.filter(Donation.assigned_volunteer_id == volunteer_id)

    records = query.order_by(Donation.created_at.desc()).all()
    return [enrich_donation_response(d, db) for d in records]

@router.post("", response_model=DonationResponse)
def create_donation(payload: DonationCreate, db: Session = Depends(get_db)):
    """
    Creates a new donation listing with verified safety and audit fields.
    """
    donor = db.query(User).filter(User.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor user not found")

    # Run safety checks
    safety_status, flags = verify_donation_safety(
        food_category=payload.food_category,
        storage_method=payload.storage_method,
        preparation_time=payload.preparation_time,
        pickup_deadline=payload.pickup_deadline,
        printed_expiry=payload.printed_expiry
    )

    notes = "; ".join(flags) if flags else payload.safety_notes

    donation = Donation(
        donor_id=payload.donor_id,
        food_name=payload.food_name,
        food_category=payload.food_category,
        quantity=payload.quantity,
        unit=payload.unit,
        estimated_kg=payload.estimated_kg,
        preparation_time=payload.preparation_time,
        printed_expiry=payload.printed_expiry,
        storage_method=payload.storage_method,
        pickup_deadline=payload.pickup_deadline,
        pickup_address=payload.pickup_address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        ai_predicted_category=payload.ai_predicted_category,
        ai_confidence=payload.ai_confidence,
        ai_ocr_text=payload.ai_ocr_text,
        ai_extracted_expiry=payload.ai_extracted_expiry,
        safety_status=safety_status,
        safety_notes=notes,
        is_spoiled=payload.is_spoiled or False,
        status="Available"
    )

    db.add(donation)
    db.commit()
    db.refresh(donation)
    return enrich_donation_response(donation, db)

from app.core.upload_validator import validate_and_save_image

@router.post("/upload-photo")
async def upload_donation_photo(file: UploadFile = File(...)):
    """
    Securely uploads food photo (enforcing 5 MB limit, Pillow integrity check),
    saves to local upload directory, and returns URL for donation creation.
    """
    filename = await validate_and_save_image(file, settings.UPLOAD_DIR)
    return {"image_url": f"/uploads/{filename}"}

@router.get("/{donation_id}", response_model=DonationResponse)
def get_donation_detail(donation_id: int, db: Session = Depends(get_db)):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return enrich_donation_response(donation, db)

@router.patch("/{donation_id}/status", response_model=DonationResponse)
def update_donation_status(
    donation_id: int,
    payload: DonationUpdateStatus,
    db: Session = Depends(get_db)
):
    """
    Strict lifecycle state machine:
    Available -> Accepted -> Picked Up -> Delivered

    Enforces:
    1. Atomic claim check (prevent duplicate claims; HTTP 409 Conflict).
    2. Safety eligibility check (flagged or unverified human-review items cannot be claimed; HTTP 422).
    3. Strict transition verification (no skipping steps, arbitrary strings, or backwards moves; HTTP 400).
    """
    target_status = payload.status
    if target_status not in ["Available", "Accepted", "Picked Up", "Delivered"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{target_status}'. Allowed: Available, Accepted, Picked Up, Delivered."
        )

    # Use database transaction
    donation = db.query(Donation).filter(Donation.id == donation_id).with_for_update().first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    current_status = donation.status

    # Validate lifecycle transition: prevent duplicate or illegal claims
    if target_status == "Accepted" and current_status == "Accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This donation has already been claimed by another organization."
        )

    allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal transition from '{current_status}' to '{target_status}'. Valid next step: {allowed_next}"
        )

    now = datetime.now(timezone.utc)

    # FIX 1 & 2: NGO Claim transition (Available -> Accepted)
    if target_status == "Accepted":
        if not payload.assigned_ngo_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assigned_ngo_id is required to claim a donation."
            )

        # Check safety eligibility
        if donation.safety_status == "Flagged":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This donation is FLAGGED due to critical safety risks (e.g. bacterial danger zone) and cannot be claimed."
            )

        if donation.safety_status == "Needs Review" and not donation.human_reviewed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This donation is pending human safety verification and cannot be claimed until reviewed."
            )

        # Concurrency safety: check if already claimed
        if donation.status != "Available" or donation.assigned_ngo_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This donation has already been claimed by another organization."
            )

        donation.status = "Accepted"
        donation.accepted_at = now
        donation.assigned_ngo_id = payload.assigned_ngo_id

    # Pickup transition (Accepted -> Picked Up)
    elif target_status == "Picked Up":
        if not payload.assigned_volunteer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assigned_volunteer_id is required to mark a donation as Picked Up."
            )
        donation.status = "Picked Up"
        donation.picked_up_at = now
        donation.assigned_volunteer_id = payload.assigned_volunteer_id

    # Delivery transition (Picked Up -> Delivered)
    elif target_status == "Delivered":
        donation.status = "Delivered"
        donation.delivered_at = now

    db.commit()
    db.refresh(donation)
    return enrich_donation_response(donation, db)
