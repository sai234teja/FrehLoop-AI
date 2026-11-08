from datetime import datetime, timedelta
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.donation import Donation

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("Database already has data. Skipping seed.")
        db.close()
        return

    # Seed Users
    # Consistent fictional demonstration records for Hyderabad, Telangana demo
    donor1 = User(
        name="Fresh Harvest Demo Kitchen",
        email="donor1@freshharvest.demo",
        role="donor",
        organization="Fresh Harvest Demo Kitchen",
        phone="+91-40-5550-0101",
        latitude=17.4401,
        longitude=78.3489,
        address="Demo Location, Gachibowli, Hyderabad, Telangana"
    )
    donor2 = User(
        name="City Bites Demo Restaurant",
        email="donor2@citybites.demo",
        role="donor",
        organization="City Bites Demo Restaurant",
        phone="+91-40-5550-0102",
        latitude=17.4483,
        longitude=78.3915,
        address="Demo Location, Madhapur, Hyderabad, Telangana"
    )

    ngo1 = User(
        name="Hope Community Demo Kitchen",
        email="ngo1@hopekitchen.demo",
        role="ngo",
        organization="Hope Community Demo Kitchen",
        phone="+91-40-5550-0201",
        latitude=17.4697,
        longitude=78.3657,
        address="Demo Location, Kondapur, Hyderabad, Telangana",
        capacity_kg=120.0,
        accepts_prepared_food=True,
        accepts_produce=True,
        accepts_bakery=True,
        accepts_packaged=True,
        is_available=True
    )
    ngo2 = User(
        name="Helping Hands Demo Food Centre",
        email="ngo2@helpinghands.demo",
        role="ngo",
        organization="Helping Hands Demo Food Centre",
        phone="+91-40-5550-0202",
        latitude=17.4435,
        longitude=78.3772,
        address="Demo Location, HITEC City, Hyderabad, Telangana",
        capacity_kg=60.0,
        accepts_prepared_food=False,
        accepts_produce=True,
        accepts_bakery=True,
        accepts_packaged=True,
        is_available=True
    )

    vol1 = User(
        name="Alex Rivera",
        email="volunteer1@freshloop.demo",
        role="volunteer",
        organization="Volunteer Courier Corps (Hyderabad Base)",
        phone="+91-40-5550-0301",
        latitude=17.4401,
        longitude=78.3489,
        address="Demo Location, Gachibowli, Hyderabad, Telangana"
    )

    db.add_all([donor1, donor2, ngo1, ngo2, vol1])
    db.commit()

    # Seed Sample Donations
    now = datetime.utcnow()

    d1 = Donation(
        donor_id=donor1.id,
        food_name="Trays of Vegetable Biryani & Paneer Curry",
        food_category="Prepared Food",
        quantity=15.0,
        unit="servings",
        estimated_kg=12.0,
        preparation_time=now - timedelta(hours=2),
        printed_expiry=None,
        storage_method="Heated Container",
        pickup_deadline=now + timedelta(hours=3),
        pickup_address="Demo Location, Gachibowli, Hyderabad, Telangana",
        latitude=17.4401,
        longitude=78.3489,
        image_url=None,
        ai_predicted_category="Prepared Food",
        ai_confidence=0.92,
        ai_ocr_text="",
        safety_status="Needs Review",
        safety_notes="Heated container storage declared. Receiver must verify hot-holding temperature exceeds 60°C (140°F) upon handover.",
        status="Available"
    )

    d2 = Donation(
        donor_id=donor2.id,
        food_name="Assorted Roti & Irani Chai Bakery Breads",
        food_category="Bakery",
        quantity=30.0,
        unit="items",
        estimated_kg=8.5,
        preparation_time=now - timedelta(hours=4),
        printed_expiry="Best by end of day",
        storage_method="Room Temperature",
        pickup_deadline=now + timedelta(hours=8),
        pickup_address="Demo Location, Madhapur, Hyderabad, Telangana",
        latitude=17.4483,
        longitude=78.3915,
        image_url=None,
        ai_predicted_category="Bakery",
        ai_confidence=0.96,
        ai_ocr_text="BEST BY TODAY",
        ai_extracted_expiry="BEST BY TODAY",
        safety_status="Self-Reported Safe Guidelines Met",
        safety_notes="Baked fresh today in demo facility.",
        status="Available"
    )

    d3 = Donation(
        donor_id=donor1.id,
        food_name="Steamed Rice & Lentil Dal",
        food_category="Prepared Food",
        quantity=8.0,
        unit="kg",
        estimated_kg=8.0,
        preparation_time=now - timedelta(hours=14),
        printed_expiry=None,
        storage_method="Refrigerated",
        pickup_deadline=now - timedelta(hours=1),
        pickup_address="Demo Location, Gachibowli, Hyderabad, Telangana",
        latitude=17.4401,
        longitude=78.3489,
        image_url=None,
        ai_predicted_category="Prepared Food",
        ai_confidence=0.88,
        ai_ocr_text="",
        safety_status="Delivered",
        safety_notes="Successfully delivered to community pantry.",
        status="Delivered",
        assigned_ngo_id=ngo1.id,
        assigned_volunteer_id=vol1.id,
        delivered_at=now - timedelta(hours=1)
    )

    db.add_all([d1, d2, d3])
    db.commit()
    db.close()
    print("Database successfully seeded with realistic sample data!")

if __name__ == "__main__":
    seed_database()
