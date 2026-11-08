from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from app.core.database import Base

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    food_name = Column(String, nullable=False)
    food_category = Column(String, nullable=False)  # Prepared Food, Produce / Vegetables, Bakery, Packaged Goods, Dairy
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False) # kg, servings, boxes, trays, liters
    estimated_kg = Column(Float, default=1.0) # normalized weight for impact calculation

    # Safety & inspection attributes
    preparation_time = Column(DateTime, nullable=True)
    printed_expiry = Column(String, nullable=True)
    storage_method = Column(String, nullable=False) # Refrigerated, Frozen, Room Temperature, Heated Container
    pickup_deadline = Column(DateTime, nullable=False)

    # Location
    pickup_address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Images & AI metadata
    image_url = Column(String, nullable=True)
    ai_predicted_category = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_ocr_text = Column(Text, nullable=True)
    ai_extracted_expiry = Column(String, nullable=True)

    # Safety Verification
    safety_status = Column(String, default="Verified") # Verified, Needs Review, Flagged
    safety_notes = Column(Text, nullable=True)
    human_reviewed = Column(Boolean, default=False)
    is_spoiled = Column(Boolean, default=False)
    disclaimer = Column(String, default="Visual AI inspection only. Does not guarantee microbiological safety or absence of toxins. Physical inspection by receiver required.")

    # Status tracking: Available -> Accepted -> Picked Up -> Delivered (or Cancelled)
    status = Column(String, default="Available")

    # Assignment
    assigned_ngo_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    picked_up_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
