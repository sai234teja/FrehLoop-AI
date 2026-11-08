# FreshLoop AI – Complete Full-Stack Audit & Assessment Report

**Audit Date:** 2026-11-08
**Audit Scope:** Frontend (React + Vite + Leaflet), Backend (FastAPI + SQLAlchemy + SQLite), AI/ML Services (MobileNetV2 + EasyOCR), Business Rules, Maps/Navigation, Security, and Hackathon Readiness.
**Auditor Roles:** Senior Full-Stack Engineer, QA Automation Engineer, AI/ML Engineer, Application Security Reviewer, and Hackathon Technical Evaluator.

---

## 1. Executive Summary

FreshLoop AI has successfully implemented a functional, demonstrable prototype featuring real MobileNetV2 food classification, EasyOCR expiration parsing, SQLite persistence, and a multi-factor smart matching scoring algorithm.

However, a strict full-stack audit across codebase execution and functional workflows revealed **critical business logic gaps, navigation limitations, and authorization bypasses** that must be prioritized before final technical evaluation:

1. **Missing Volunteer Navigation & Routing Engine:** The volunteer dashboard renders only static markers for pickup locations. It does **not** fetch or display the destination drop-off coordinates (NGO location), does **not** draw a route line/polyline, and provides no navigation links or directions.
2. **Missing Concurrency & Duplicate Claim Prevention:** Multiple NGOs can concurrently claim the same donation. The backend does not check whether a listing is already in `Accepted` status before re-assigning it.
3. **Unsafe / Flagged Donation Claiming Loophole:** Listings flagged as `Flagged` (e.g. cooked items left in the room-temperature bacterial danger zone) can still be claimed by an NGO and delivered without blocking or mandatory safety resolution.
4. **Arbitrary Status Transitions (State Machine Bypass):** The status endpoint accepts arbitrary strings (e.g. `ArbitraryFakeStatus`) and allows jumping straight from `Available` to `Delivered`, skipping pickup verification.
5. **Lack of Backend Authentication & IDOR:** Endpoints rely on unverified client-provided IDs without session tokens or role validation, allowing any caller to transition any donation status.

---

## 2. Feature-by-Feature Evaluation Matrix

| Domain | Feature / Flow | Audit Status | Evaluation Mode | Verified Finding / Evidence |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | Role Selection & Login | **PASS** | Automated API + Code Inspection | Demo authentication loads 3 categorized personas and persists SQLite session state. |
| **Donor** | Photo Upload & AI Category | **PASS** | Automated API + Code Inspection | MobileNetV2 runs inference; low-confidence labels return `"Needs Manual Confirmation"`. |
| **Donor** | OCR Expiration Parsing | **PASS** | Automated API + Image Fixtures | EasyOCR regex extracts date text (`USE BY YYYY-MM-DD`) without hallucinating dates. |
| **Donor** | Listing Creation & Persistence | **PASS** | Automated API + SQLite | Creates records with coordinates, quantity, and safety notes in `donations` table. |
| **NGO** | Smart Matching Scoring | **PASS** | Automated API + Code Inspection | 5-factor scoring (distance, urgency, capacity, category, availability) accurately ranks listings. |
| **NGO** | Category & Capacity Filter | **PASS** | Automated API + Math Verification | Incompatible food types score 0 for category fit; excess weight scores 0 for capacity fit. |
| **NGO** | Duplicate Claim Prevention | **FAIL** | Automated API Test (`task-328`) | Second NGO can re-claim an already `Accepted` donation; backend lacks conditional checks. |
| **Safety** | Bacterial Danger Zone Flagging | **PASS** | Automated Service Test | Cooked food at room temperature triggers `Flagged` status with explicit warning flags. |
| **Safety** | Unsafe Listing Block on Claim | **FAIL** | Automated API Test (`task-328`) | Flagged/unsafe donations can be claimed by NGOs without human review or block. |
| **Volunteer** | Active Task Visibility | **PASS** | Automated API + Code Inspection | Retrieves `Accepted` and `Picked Up` tasks assigned to courier. |
| **Volunteer** | Pickup & Delivery Milestones | **PASS** | Automated API + State Machine | Valid sequential progression updates database timestamps. |
| **Volunteer** | Route Navigation to Drop-off | **FAIL** | Code & Map Inspection | Map only shows static pickup pins. Destination NGO pin and route directions are missing. |
| **Impact** | Delivery Gated Calculations | **PASS** | Automated API + Math Verification | Rescued kg, meals, CO2e, and water only increment upon `Delivered` status. |
| **Security** | State Machine Validation | **FAIL** | Automated API Test (`task-336`) | `PATCH /donations/{id}/status` allows arbitrary strings without schema validation. |
| **Security** | Role-Based Access Control | **PARTIAL** | Code Inspection | Acceptable for local hackathon demo; unhardened for multi-tenant production. |

---

## 3. Top 10 Prioritized Issues & Vulnerabilities

| # | Priority | Issue Description | Severity | Impact Area |
| :---: | :---: | :--- | :---: | :--- |
| **1** | **P0** | **Volunteer Navigation Absence:** No route, no drop-off marker, and no external directions link. | **HIGH** | Logistics & UX |
| **2** | **P0** | **Duplicate Claim Race Condition:** Multiple NGOs can claim the same donation. | **HIGH** | Data Integrity |
| **3** | **P0** | **Flagged / Unsafe Donations Claimable:** Unsafe listings can proceed through delivery. | **CRITICAL** | Food Safety |
| **4** | **P0** | **Arbitrary Status Transitions:** No state machine validation on status updates. | **HIGH** | Workflow Integrity |
| **5** | **P1** | **Missing Drop-Off Location in Task Cards:** Courier only sees pickup address. | **MEDIUM** | Volunteer UX |
| **6** | **P1** | **Missing File Size & MIME Validation:** Upload endpoint does not cap file payload size. | **MEDIUM** | Security / DoS |
| **7** | **P1** | **Python 3.14 Timezone Deprecation:** `datetime.utcnow()` prints deprecation warnings in logs. | **LOW** | Code Quality |
| **8** | **P2** | **Static Map Centering:** Map center is hardcoded to San Francisco coordinates. | **MEDIUM** | Map Usability |
| **9** | **P2** | **MobileNetV2 General-Domain Fallback:** ImageNet classes are not dedicated food taxonomies. | **MEDIUM** | AI Precision |
| **10** | **P3** | **Unauthenticated Endpoints:** No JWT or bearer token validation (demo mode limitation). | **LOW** | Security (Production) |

---

## 4. Root Cause Analysis: Volunteer Navigation Investigation (Phase 3)

### Findings:
1. **Database Schema:**
   - The `donations` table stores `pickup_address`, `latitude`, and `longitude` of the donor.
   - When an NGO claims a donation, `assigned_ngo_id` is recorded, but the NGO's destination address, destination latitude, and longitude are **not** joined or returned in the volunteer task card.
2. **Component Implementation:**
   - In [`VolunteerDashboard.jsx`](file:///c:/Users/ramug/OneDrive/Desktop/FreshLoop%20AI/frontend/src/pages/VolunteerDashboard.jsx#L173-L179), `MapView` receives:
     ```javascript
     locations={activeDeliveries.map(d => ({
       latitude: d.latitude,
       longitude: d.longitude,
       title: d.food_name,
       subtitle: `Status: ${d.status} • ${d.pickup_address}`
     }))}
     ```
   - This passes **only the donor pickup coordinate**. The drop-off kitchen is completely omitted.
3. **No Polyline or Routing Engine:**
   - There is no Leaflet polyline connecting pickup to drop-off.
   - There is no one-click "Navigate via OpenStreetMap / Google Maps" link.
4. **Hackathon Recommendation:**
   - Join NGO location details in the donation response (`ngo_address`, `ngo_lat`, `ngo_lng`).
   - Render a dual-marker view (🟢 Pickup Origin ➔ 🔴 NGO Kitchen Destination) connected by a dashed Polyline in Leaflet.
   - Add an external directions link button: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route={lat1},{lon1}%3B{lat2},{lon2}`.

---

## 5. Food Safety & Business Rules Audit (Phase 5)

### Dangerous Workflow Paths Discovered:
1. **Flagged Donations Remain in Available Pool:**
   - When a donor posts cooked food kept at room temperature, `verify_donation_safety()` flags it with `Flagged` and notes bacterial danger zone risks.
   - However, `donations.status` is still set to `Available`.
   - NGOs can call `PATCH /donations/{id}/status` and claim it, allowing potentially hazardous food into distribution.
2. **Expired Pickup Deadlines:**
   - If a listing passes its deadline without being claimed, it remains in the active database query unless filtered out.

---

## 6. Application Security Review (Phase 6)

1. **IDOR & Unrestricted Status Mutation:**
   - `PATCH /api/donations/{id}/status` takes `payload: DonationUpdateStatus`. Any caller can change status or assign any user ID without permission checks.
2. **File Upload Restrictions:**
   - [`donations.py`](file:///c:/Users/ramug/OneDrive/Desktop/FreshLoop%20AI/backend/app/api/donations.py#L90) only validates filename extensions (`.jpg`, `.png`). It does not validate magic bytes or limit maximum file size, posing a potential denial-of-service vulnerability if large files are uploaded.
3. **CORS:**
   - Configured with `allow_origins=["*"]`, appropriate for hackathon local dev but requires origin restriction in production.

---

## 7. Prioritized Improvement Roadmap & Estimated Effort

| Phase | Task Description | Estimated Effort |
| :---: | :--- | :---: |
| **P0** | **Fix Volunteer Navigation:** Join NGO coordinates, render origin/destination markers, Leaflet polyline route, and external navigation link. | 45 mins |
| **P0** | **Prevent Duplicate NGO Claims:** Return `409 Conflict` if donation status is not `Available`. | 20 mins |
| **P0** | **Block Claiming of Flagged Listings:** Disallow claiming if `safety_status == 'Flagged'` unless explicitly reviewed. | 25 mins |
| **P0** | **Enforce Strict State Machine:** Validate status transitions: `Available` ➔ `Accepted` ➔ `Picked Up` ➔ `Delivered`. | 25 mins |
| **P1** | **Upload Payload & File Size Validation:** Enforce 5MB limit and Pillow image verification. | 20 mins |
| **P1** | **Replace `datetime.utcnow()`:** Migrate all backend datetime references to `datetime.now(timezone.utc)`. | 15 mins |
| **P2** | **Dynamic Map Bounds:** Auto-fit Leaflet map bounds to encompass all active coordinates. | 25 mins |
| **P3** | **JWT Authentication & RBAC:** Production-grade OAuth2 / JWT security layer. | Post-Hackathon |

---

## 8. Hackathon Evaluation Verdict

- **Core Innovation & Feasibility:** 9/10
- **AI / Computer Vision Honesty:** 10/10 (Clear disclaimers, no hallucinated dates or poison detection claims)
- **Architecture & Modularity:** 9/10
- **Workflow & Business Integrity:** 6.5/10 (Requires P0 business logic and navigation fixes)
- **Overall Readiness:** High Prototype Potential; with the 4 P0 fixes implemented, FreshLoop AI is in top demonstration shape.
