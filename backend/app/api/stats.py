from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.donation import Donation
from app.models.user import User
from app.schemas import ImpactStats

router = APIRouter(prefix="/stats", tags=["Impact Statistics"])

@router.get("/impact", response_model=ImpactStats)
def get_impact_statistics(db: Session = Depends(get_db)):
    """
    Computes dynamic metrics strictly calculated from actual database records of DELIVERED donations.
    Food saved must NOT be calculated from merely listed or in-transit donations.

    Illustrative estimated conversion assumptions used for prototype impact calculations:
    - Rescued kg: Sum of donor-entered estimated weight for Delivered donations.
    - Meals Provided: Illustrative estimated conversion assumption of 0.42 kg of food per nutritional meal equivalent.
    - CO2e Avoided: Illustrative estimated conversion assumption of 2.5 kg CO2e per kg food diverted from anaerobic landfill decomposition.
    - Water Conserved: Illustrative estimated conversion assumption of 250 liters of embedded water per kg food production.
    These values are model-derived estimates, not direct measurements or independently verified environmental outcomes.
    """
    total_donations = db.query(Donation).count()
    active_donations = db.query(Donation).filter(Donation.status.in_(["Available", "Accepted", "Picked Up"])).count()
    completed_rescues = db.query(Donation).filter(Donation.status == "Delivered").count()

    # Sum estimated_kg strictly for DELIVERED (actual rescued) donations
    rescued_kg = db.query(func.sum(Donation.estimated_kg)).filter(Donation.status == "Delivered").scalar() or 0.0
    actual_saved_kg = round(float(rescued_kg), 1)

    # Meal calculation: ~0.42 kg / meal (USDA / UN FAO standard model estimate)
    meals = int(actual_saved_kg / 0.42) if actual_saved_kg > 0 else 0

    # CO2e: ~2.5 kg CO2e per kg food diverted from landfill (UNEP food waste index model estimate)
    co2 = round(actual_saved_kg * 2.5, 1)

    # Water saved: ~250 liters per kg food (water footprint network average estimate)
    water = round(actual_saved_kg * 250.0, 1)

    active_donors = db.query(User).filter(User.role == "donor").count()
    active_ngos = db.query(User).filter(User.role == "ngo").count()
    active_volunteers = db.query(User).filter(User.role == "volunteer").count()

    return {
        "total_donations": total_donations,
        "active_donations": active_donations,
        "completed_rescues": completed_rescues,
        "food_saved_kg": actual_saved_kg,
        "meals_provided": meals,
        "co2_emissions_saved_kg": co2,
        "water_saved_liters": water,
        "active_donors": active_donors,
        "active_ngos": active_ngos,
        "active_volunteers": active_volunteers
    }
