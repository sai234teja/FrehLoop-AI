from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.donation import Donation
from app.models.user import User
from app.schemas import DonationMatchResult, DonationResponse, MatchScoreBreakdown
from app.services.matching_service import calculate_match_score

router = APIRouter(prefix="/matching", tags=["Smart Matching"])

from app.api.donations import enrich_donation_response

@router.get("/ngo/{ngo_id}", response_model=List[DonationMatchResult])
def get_ranked_donations_for_ngo(ngo_id: int, db: Session = Depends(get_db)):
    """
    Ranks available donations for a given NGO using the multi-factor scoring formula:
    - Distance (haversine)
    - Pickup urgency
    - NGO capacity
    - Food category match
    - NGO availability
    """
    ngo = db.query(User).filter(User.id == ngo_id, User.role == "ngo").first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found")

    available_donations = db.query(Donation).filter(
        Donation.status == "Available"
    ).all()

    results = []
    for d in available_donations:
        score, breakdown = calculate_match_score(d, ngo)
        results.append({
            "donation": enrich_donation_response(d, db),
            "score_details": breakdown
        })

    # Sort descending by total_score
    results.sort(key=lambda x: x["score_details"]["total_score"], reverse=True)
    return results
