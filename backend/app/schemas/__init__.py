from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    organization: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    capacity_kg: Optional[float] = 100.0
    accepts_prepared_food: Optional[bool] = True
    accepts_produce: Optional[bool] = True
    accepts_bakery: Optional[bool] = True
    accepts_packaged: Optional[bool] = True
    is_available: Optional[bool] = True

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Demo Login
class DemoLoginRequest(BaseModel):
    user_id: int

# Donation Schemas
class DonationCreate(BaseModel):
    donor_id: int
    food_name: str
    food_category: str
    quantity: float = Field(..., gt=0, description="Actual physical count or measure of food (must be > 0)")
    unit: str = Field(..., min_length=1, description="Unit of measurement (e.g. servings, kg, boxes, items, trays)")
    estimated_kg: float = Field(..., gt=0, description="Estimated total weight in kilograms for impact calculation (must be > 0)")
    preparation_time: Optional[datetime] = None
    printed_expiry: Optional[str] = None
    storage_method: str
    pickup_deadline: datetime
    pickup_address: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    ai_predicted_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_ocr_text: Optional[str] = None
    ai_extracted_expiry: Optional[str] = None
    safety_status: Optional[str] = "Verified"
    safety_notes: Optional[str] = None
    is_spoiled: Optional[bool] = False

class DonationUpdateStatus(BaseModel):
    status: str # Available, Accepted, Picked Up, Delivered
    assigned_ngo_id: Optional[int] = None
    assigned_volunteer_id: Optional[int] = None

class DonationResponse(BaseModel):
    id: int
    donor_id: int
    food_name: str
    food_category: str
    quantity: float
    unit: str
    estimated_kg: float
    preparation_time: Optional[datetime] = None
    printed_expiry: Optional[str] = None
    storage_method: str
    pickup_deadline: datetime
    pickup_address: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    ai_predicted_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_ocr_text: Optional[str] = None
    ai_extracted_expiry: Optional[str] = None
    safety_status: str
    safety_notes: Optional[str] = None
    human_reviewed: bool
    is_spoiled: bool
    disclaimer: str
    status: str
    assigned_ngo_id: Optional[int] = None
    assigned_volunteer_id: Optional[int] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    # Navigation & Destination attributes (Joined for Courier routing)
    donor_name: Optional[str] = None
    ngo_name: Optional[str] = None
    ngo_address: Optional[str] = None
    ngo_latitude: Optional[float] = None
    ngo_longitude: Optional[float] = None

    class Config:
        from_attributes = True

# Inspection Schemas
class InspectionResult(BaseModel):
    predicted_category: str
    raw_class_name: str
    confidence: float
    ocr_text: str
    extracted_expiry: Optional[str] = None
    safety_flags: List[str] = []
    safety_status: str # Verified, Needs Review, Flagged
    disclaimer: str

# Matching Score Schemas
class MatchScoreBreakdown(BaseModel):
    total_score: float
    distance_km: float
    distance_score: float # 0 - 35
    urgency_score: float  # 0 - 25
    capacity_score: float # 0 - 20
    category_match: bool
    category_score: float # 0 - 15
    availability_score: float # 0 - 5
    recommendation_reason: str

class DonationMatchResult(BaseModel):
    donation: DonationResponse
    score_details: MatchScoreBreakdown

# Impact Stats Schema
class ImpactStats(BaseModel):
    total_donations: int
    active_donations: int
    completed_rescues: int
    food_saved_kg: float
    meals_provided: int
    co2_emissions_saved_kg: float
    water_saved_liters: float
    active_donors: int
    active_ngos: int
    active_volunteers: int
