from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # donor, ngo, volunteer
    organization = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)

    # Specific fields for NGOs
    capacity_kg = Column(Float, default=100.0) # max kg capacity
    accepts_prepared_food = Column(Boolean, default=True)
    accepts_produce = Column(Boolean, default=True)
    accepts_bakery = Column(Boolean, default=True)
    accepts_packaged = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
