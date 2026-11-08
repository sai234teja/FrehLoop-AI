import math
from datetime import datetime
from typing import Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    R = 6371.0 # Earth's radius in kilometers

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)

def calculate_match_score(donation, ngo) -> Tuple[float, dict]:
    """
    Calculates a real multi-factor match score (0 - 100) between a donation and an NGO.

    Factors:
    1. Proximity / Distance (Weight: 35%):
       - < 2 km: 35 pts
       - 2 - 5 km: 28 pts
       - 5 - 10 km: 18 pts
       - 10 - 20 km: 8 pts
       - > 20 km: 0 pts

    2. Urgency / Time-to-Expiry (Weight: 25%):
       - < 2 hours remaining: 25 pts (High urgency)
       - 2 - 6 hours: 20 pts
       - 6 - 12 hours: 14 pts
       - > 12 hours: 8 pts

    3. NGO Capacity vs Donation Quantity (Weight: 20%):
       - If donation weight <= NGO capacity:
         Proportionate score based on optimal utilization (e.g., 20% to 80% capacity = 20 pts)
       - If donation exceeds NGO capacity: 0 pts

    4. Food Category Compatibility (Weight: 15%):
       - Matches NGO preference: 15 pts
       - Incompatible: 0 pts

    5. NGO Real-Time Availability (Weight: 5%):
       - Available: 5 pts
       - Unavailable: 0 pts
    """
    # 1. Distance
    d_km = haversine_distance(
        donation.latitude, donation.longitude,
        ngo.latitude, ngo.longitude
    )
    if d_km <= 2.0:
        dist_score = 35.0
    elif d_km <= 5.0:
        dist_score = 28.0
    elif d_km <= 10.0:
        dist_score = 18.0
    elif d_km <= 20.0:
        dist_score = 8.0
    else:
        dist_score = 0.0

    # 2. Urgency
    now = datetime.utcnow()
    hours_left = (donation.pickup_deadline - now).total_seconds() / 3600.0
    if hours_left <= 0:
        urgency_score = 0.0
    elif hours_left <= 2.0:
        urgency_score = 25.0
    elif hours_left <= 6.0:
        urgency_score = 20.0
    elif hours_left <= 12.0:
        urgency_score = 14.0
    else:
        urgency_score = 8.0

    # 3. Capacity
    weight_kg = getattr(donation, 'estimated_kg', 1.0)
    cap_kg = getattr(ngo, 'capacity_kg', 50.0)
    if weight_kg > cap_kg:
        cap_score = 0.0
    else:
        # Well within capacity
        ratio = weight_kg / max(cap_kg, 1.0)
        cap_score = 20.0 if ratio <= 0.85 else 12.0

    # 4. Category Compatibility
    cat = (donation.food_category or "").lower()
    cat_match = True
    if "prepared" in cat and not getattr(ngo, 'accepts_prepared_food', True):
        cat_match = False
    elif "produce" in cat and not getattr(ngo, 'accepts_produce', True):
        cat_match = False
    elif "bakery" in cat and not getattr(ngo, 'accepts_bakery', True):
        cat_match = False
    elif "packaged" in cat and not getattr(ngo, 'accepts_packaged', True):
        cat_match = False

    cat_score = 15.0 if cat_match else 0.0

    # 5. Availability
    avail_score = 5.0 if getattr(ngo, 'is_available', True) else 0.0

    total_score = round(dist_score + urgency_score + cap_score + cat_score + avail_score, 1)

    # Narrative explanation
    reasons = []
    if d_km <= 3.0:
        reasons.append(f"Very close ({d_km} km)")
    elif d_km <= 8.0:
        reasons.append(f"Nearby ({d_km} km)")
    else:
        reasons.append(f"Distance: {d_km} km")

    if hours_left > 0 and hours_left <= 4.0:
        reasons.append(f"Urgent pickup ({round(hours_left, 1)} hrs left)")

    if cat_match:
        reasons.append("Category matches NGO acceptance profile")
    else:
        reasons.append("Category preference mismatch")

    if weight_kg <= cap_kg:
        reasons.append(f"Fits capacity ({weight_kg}kg / {cap_kg}kg)")

    details = {
        "total_score": total_score,
        "distance_km": d_km,
        "distance_score": dist_score,
        "urgency_score": urgency_score,
        "capacity_score": cap_score,
        "category_match": cat_match,
        "category_score": cat_score,
        "availability_score": avail_score,
        "recommendation_reason": " • ".join(reasons)
    }

    return total_score, details
