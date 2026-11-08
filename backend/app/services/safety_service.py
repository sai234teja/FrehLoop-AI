from datetime import datetime, timezone, timedelta
from typing import List, Tuple

def verify_donation_safety(
    food_category: str,
    storage_method: str,
    preparation_time: datetime = None,
    pickup_deadline: datetime = None,
    printed_expiry: str = None
) -> Tuple[str, List[str]]:
    """
    Validates required preparation, storage and pickup information.
    Flags missing or concerning safety parameters without inventing facts
    or pretending a picture can detect chemical/bacterial toxins.

    CRITICAL RULE:
    - Heated containers and automated checks NEVER automatically grant a 'Verified' status.
    - Missing prep time, expired dates, room-temp cooked items, and missing cold chain all trigger 'Needs Review' or 'Flagged'.
    - Clean submissions without red flags receive 'Standard Protocol (Self-Reported)' - never certified safe.

    Returns: (safety_status, list_of_flags)
    """
    flags = []

    # Use timezone-aware UTC datetime comparison
    now = datetime.now(timezone.utc)
    if pickup_deadline and pickup_deadline.tzinfo is None:
        pickup_deadline = pickup_deadline.replace(tzinfo=timezone.utc)
    if preparation_time and preparation_time.tzinfo is None:
        preparation_time = preparation_time.replace(tzinfo=timezone.utc)

    # 1. Pickup Deadline Check
    if pickup_deadline:
        if pickup_deadline <= now:
            flags.append("Pickup deadline is already in the past.")
        elif (pickup_deadline - now).total_seconds() > 72 * 3600:
            flags.append("Pickup deadline is more than 3 days ahead; requires verification of shelf-life.")
    else:
        flags.append("Missing pickup deadline. Logistics deadline is mandatory.")

    # 2. Storage & Category Specific Verification
    cat = (food_category or "").lower()
    storage = (storage_method or "").lower()

    # Heated container check: requires verified temperature maintenance declaration
    if "heated" in storage:
        flags.append("Heated container storage declared. Receiver must verify hot-holding temperature exceeds 60°C (140°F) upon handover.")

    if "prepared" in cat or "cooked" in cat:
        if "room" in storage:
            flags.append("Cooked/prepared meals kept at room temperature enter the bacterial danger zone (max 2-4 hours). Immediate review required.")
        if preparation_time:
            hours_since_prep = (now - preparation_time).total_seconds() / 3600.0
            if hours_since_prep > 24:
                flags.append(f"Prepared meal was cooked {round(hours_since_prep, 1)} hours ago; physical evaluation needed before consumption.")
        else:
            flags.append("Prepared food missing exact cooking/preparation time. Mandatory for perishable meals.")

    if "dairy" in cat:
        if "refrigerated" not in storage and "frozen" not in storage:
            flags.append("Dairy products require unbroken cold chain storage (refrigerated <4°C or frozen <-18°C).")

    if ("packaged" in cat or "pantry" in cat) and not printed_expiry:
        flags.append("Packaged item listed without printed expiration/best-by date.")

    # 3. Status assignment
    if any("danger zone" in f or "past" in f for f in flags):
        status = "Flagged"
    elif len(flags) > 0:
        # Any flags (including heated container verification or missing prep time) trigger human review
        status = "Needs Review"
    else:
        status = "Self-Reported Safe Guidelines Met"

    return status, flags
