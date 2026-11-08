# FreshLoop AI 🥗🔄

**AI-Assisted Food Inspection & Intelligent Surplus Food Redistribution Platform**

FreshLoop AI connects restaurants and food donors with NGOs, soup kitchens, and volunteer couriers to streamline real-time surplus food recovery, automated visual AI inspection, and urgency-weighted redistribution.

---

## 🌟 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Mapping**: Leaflet & OpenStreetMap (`react-leaflet`)
- **Backend**: Python 3.14, FastAPI, Pydantic v2
- **Database**: SQLite with SQLAlchemy ORM (local persistent file)
- **Computer Vision**: PyTorch (MobileNetV2 image classification), OpenCV
- **OCR Engine**: EasyOCR (optical character recognition for expiry dates & labels)

---

## 👥 User Roles (Demo Authentication – Hyderabad Scenario)

FreshLoop AI includes built-in demo authentication with fictional Hyderabad demo locations for swift hackathon review:

1. **Food Donor 1**: *Fresh Harvest Demo Kitchen* (Chef Aarav Patel)
   - Location: Demo Location, Gachibowli, Hyderabad, Telangana (`17.4401, 78.3489`)
   - Capabilities: Upload food photograph for automated computer vision category prediction (MobileNetV2), EasyOCR label date extraction, portion count & kilogram weight inputs, storage method flags, manual review confirmation.

2. **Food Donor 2**: *City Bites Demo Restaurant* (Priya Sharma)
   - Location: Demo Location, Madhapur, Hyderabad, Telangana (`17.4483, 78.3915`)

3. **NGO 1**: *Hope Community Demo Kitchen* (Director Rajesh Varma)
   - Location: Demo Location, Kondapur, Hyderabad, Telangana (`17.4697, 78.3657`)
   - Capabilities: Urgent redistribution matching engine, distance scoring, capacity-checked claims with 409 conflict protection and 422 safety gating.

4. **NGO 2**: *Helping Hands Demo Food Centre* (Sunita Rao)
   - Location: Demo Location, HITEC City, Hyderabad, Telangana (`17.4474, 78.3762`)

5. **Volunteer Courier**: *Hyderabad Green Courier Hub* (Vikram Reddy)
   - Location: Central Gachibowli (`17.4435, 78.3600`)
   - Capabilities: Visual route connection between pickup origin and destination hub, OpenStreetMap turn-by-turn directions links, status advancement (`Accepted` ➔ `Picked Up` ➔ `Delivered`).

6. **Public / Stakeholder Impact Analytics**:
   - Zero hardcoded numbers.
   - Dynamically calculates real database aggregates strictly for delivered donations: kg rescued, meal equivalents (0.42 kg/meal FAO model), CO2e emissions avoided (2.5 kg CO2e/kg), and embedded water saved (250 L/kg). Impact stats do not increment prior to completed delivery.

---

## 🧠 Smart Matching Algorithm Logic

The redistribution ranking algorithm computes a real composite score (0 to 100 points) based on five multi-factor criteria:

$$\text{Total Score} = S_{\text{dist}} + S_{\text{urg}} + S_{\text{cap}} + S_{\text{cat}} + S_{\text{avail}}$$

| Factor | Weight | Scoring Logic |
| :--- | :--- | :--- |
| **1. Proximity / Distance** | **35 pts** | Haversine formula calculation: $\le 2\text{ km} \to 35\text{ pts}$; $\le 5\text{ km} \to 28\text{ pts}$; $\le 10\text{ km} \to 18\text{ pts}$; $\le 20\text{ km} \to 8\text{ pts}$; $>20\text{ km} \to 0\text{ pts}$. |
| **2. Pickup Urgency** | **25 pts** | Time delta to deadline: $<2\text{ hours} \to 25\text{ pts}$ (urgent rescue); $2-6\text{ hours} \to 20\text{ pts}$; $6-12\text{ hours} \to 14\text{ pts}$; $>12\text{ hours} \to 8\text{ pts}$. |
| **3. Capacity Utilization** | **20 pts** | Matches listing weight against NGO capacity. If weight $\le$ capacity: $20\text{ pts}$ (if $\le 85\%$ capacity) or $12\text{ pts}$; exceeds capacity: $0\text{ pts}$. |
| **4. Food Category Compatibility** | **15 pts** | Verifies specific NGO acceptance rules (e.g., hot prepared foods, raw produce, bakery, dairy). Compatible: $15\text{ pts}$; Incompatible: $0\text{ pts}$. |
| **5. Availability** | **5 pts** | Current real-time operating availability of the receiving NGO kitchen ($5\text{ pts}$). |

---

## 🛡️ AI Food Safety Disclaimer

> **Responsible AI Standard:**
> FreshLoop AI assists human operators by categorizing items and parsing visible text on labels. A visual camera photograph **cannot** detect invisible bacterial pathogens (e.g., *Salmonella*, *Listeria*, *E. coli*), chemical toxins, or microbiological deterioration. Physical inspection by the receiving organization at pickup is mandatory.

---

## 🚀 Quickstart & Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional for local dev; copy template)
# Linux/macOS: cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
# Generate a secure random SECRET_KEY:
# python -c "import secrets; print(secrets.token_hex(32))"

# Seed sample database
$env:PYTHONPATH="backend"  # Windows PowerShell
python -m app.seed_data

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API docs are interactively available at:* `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Frontend runs at:* `http://127.0.0.1:5173/`

---

## 🧪 Testing Verification Completed

- [x] **Backend API & SQLite DB**: Tables initialized and seeded with 5 test personas and 3 listings.
- [x] **PyTorch & EasyOCR**: Verified image classification and optical character recognition pipelines.
- [x] **Interactive Maps**: OpenStreetMap Leaflet layers rendering GPS coordinates and location markers.
- [x] **Lifecycle Transitions**: `Available` ➔ `Accepted` ➔ `Picked Up` ➔ `Delivered` state machine tested and persistent.
- [x] **Dynamic Impact Analytics**: Dynamic mathematical calculation of food saved, meals, CO2e, and water.
