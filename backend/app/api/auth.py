from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas import UserResponse, DemoLoginRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/users", response_model=List[UserResponse])
def get_demo_users(db: Session = Depends(get_db)):
    """
    Returns pre-configured demo users across all 3 roles:
    - Food Donor / Restaurant
    - NGO / Community Kitchen
    - Volunteer
    """
    return db.query(User).all()

@router.post("/demo-login", response_model=UserResponse)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    Simulates role-based login by user_id for demonstration purposes.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
    return user
