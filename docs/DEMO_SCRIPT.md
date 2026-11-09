# FreshLoop AI – 2-Minute Prototype Video Demonstration Script

This document provides a precise, timestamped script for demonstrating the **FreshLoop AI** surplus food redistribution platform during hackathon presentations or recorded submissions.

---

## Overview & Demo Setup
- **Target Duration:** 2 Minutes (120 seconds)
- **Local Prototype URL:** `http://127.0.0.1:5173/`
- **Location Setting:** Hyderabad Cyberabad corridor (Gachibowli, Madhapur, Kondapur, HITEC City)
- **Personas Used:**
  1. **Donor:** Fresh Harvest Demo Kitchen (Gachibowli)
  2. **NGO:** Hope Community Demo Kitchen (Kondapur)
  3. **Volunteer:** Alex Rivera (Hyderabad Base)

---

## Timestamped Demonstration Timeline

| Timestamp | Segment | On-Screen Action | Spoken Narration |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:15** | **Problem & Value Proposition** | Display Login screen showing the 3 verified personas and Hyderabad Cyberabad coverage. | *"Urban food waste and community hunger often coexist just kilometers apart. FreshLoop AI bridges this gap with an automated, role-based surplus food redistribution engine connecting commercial kitchens, local NGOs, and volunteer couriers in real time across Hyderabad."* |
| **0:15 – 0:35** | **Donor Surplus Listing & Presets** | Click **Enter Dashboard** for **Fresh Harvest Demo Kitchen**. On the Donor Console, click the **Biryani Boxes (5kg)** Quick-Fill preset button. Show fields populated automatically with 8 boxes, 5.0 kg, and heated container storage. | *"A donor logs into their console. During a busy dinner shift, speed matters: using our Quick-Fill demo presets, the kitchen instantly populates an 8-portion biryani surplus listing with standard weights and hot-holding parameters, saving valuable prep time without skipping structured records."* |
| **0:35 – 0:60** | **AI Inspection & Safety Protocols** | Upload a genuine food photograph. Show MobileNetV2 category prediction, confidence score, and EasyOCR date extraction. Check required food safety attestations. Click **Publish Surplus Food Listing**. | *"To maintain data consistency, Image classification using pretrained PyTorch MobileNetV2 and visible-text extraction using EasyOCR are performed by the FastAPI backend to predict food categories and extract printed labels. We emphasize safety transparency: our AI performs visual category verification, but never claims microbiological certification—physical inspection remains mandatory. The donor verifies hygiene checklists and publishes the listing."* |
| **0:60 – 0:85** | **Smart NGO Discovery & Claiming** | Log out, click **Enter Dashboard** for **Hope Community Demo Kitchen** (NGO). View available donations ranked by priority score. Inspect the matching breakdown (distance, shelf life, capacity fit). Click **Claim & Accept Donation**. | *"Next, Hope Community Kitchen in Kondapur checks incoming surplus. FreshLoop’s multi-factor matching ranks donations using distance, shelf-life urgency, and dietary fit. The NGO reviews pickup deadlines and claims the donation. Concurrency locks prevent duplicate claims across organizations with HTTP 409 protection."* |
| **0:85 – 1:05** | **Volunteer Dispatch & Route Map** | Log out, log in as **Alex Rivera** (Volunteer). Show the Leaflet map with green pickup marker (Gachibowli) and red delivery marker (Kondapur). Advance status from **Mark Picked Up →** to **Confirm Delivery Completed**. | *"Once claimed, Volunteers can see their assigned pickups on the dashboard. An interactive Leaflet map displays the exact origin and destination coordinates in Cyberabad, complete with one-click OpenStreetMap directions. With two simple taps, the volunteer marks the batch 'Picked Up' from the kitchen and 'Delivered' at the community center."* |
| **1:05 – 1:20** | **Live Impact Metrics & Wrap-up** | Click **Impact Analytics** in the top navigation. Show rescued food weight (gated strictly to delivered batches), meal equivalents, estimated CO₂e prevented, and water conservation. | *"Finally, our live impact engine tracks collective progress. Environmental savings are strictly gated to completed deliveries—never optimistic pledges. Rescued kg is based on donor-entered estimated weight for Delivered donations, while meal equivalents, CO2e, and water savings are model-derived estimates. In minutes, FreshLoop AI has transformed potential waste into hot meals, verified transparency, and measurable community impact."* |

---

## Demo Tips for Presenters
- **Pre-check:** Ensure both Uvicorn (`http://127.0.0.1:8000`) and Vite dev server (`http://127.0.0.1:5173`) are running.
- **Visuals:** Keep browser zoomed to 100% at 1366×768 desktop resolution.
- **Safety Transparency:** Always mention that AI classifies categories and extracts dates, but does not certify microbiological purity or detect pathogens.

