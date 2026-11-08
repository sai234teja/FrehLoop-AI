import os
import re
import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import models, transforms
from typing import Dict, Any, List

class FoodInspectionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = None
        self._ocr_reader = None
        self._labels = None
        self._init_transforms()

    def _init_transforms(self):
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _load_model(self):
        if self._model is None:
            # We use MobileNetV2 pretrained weights for efficient and robust vision inference
            weights = models.MobileNet_V2_Weights.DEFAULT
            self._model = models.mobilenet_v2(weights=weights)
            self._model.to(self.device)
            self._model.eval()
            self._labels = weights.meta["categories"]
        return self._model

    def _load_ocr(self):
        if self._ocr_reader is None:
            import easyocr
            # Initialize English OCR reader
            self._ocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        return self._ocr_reader

    def map_to_food_category(self, raw_label: str, confidence: float) -> str:
        """
        Maps ImageNet / pretrained labels to our platform's food donation categories.
        If confidence is low (< 0.20) or label cannot be reliably classified into a known
        food group, explicitly returns 'Needs Manual Confirmation'.
        Does NOT silently classify unknown objects as Packaged/Pantry.
        """
        if confidence < 0.20:
            return "Needs Manual Confirmation"

        lbl = raw_label.lower().replace("_", " ")

        produce_keywords = [
            "apple", "banana", "orange", "lemon", "strawberry", "fig", "pineapple",
            "pomegranate", "corn", "cucumber", "artichoke", "bell pepper", "head cabbage",
            "broccoli", "cauliflower", "zucchini", "spaghetti squash", "acorn squash",
            "butternut squash", "mushroom", "potato", "onion", "carrot"
        ]
        bakery_keywords = [
            "bagel", "pretzel", "french loaf", "bakery", "bread", "croissant", "donut", "pastry"
        ]
        prepared_keywords = [
            "pizza", "hotdog", "cheeseburger", "burrito", "taco", "sandwich", "soup bowl",
            "plate", "potpie", "meat loaf", "carbonara", "stew", "wok", "frying pan", "casserole"
        ]
        dairy_keywords = [
            "ice cream", "eggnog", "custard", "milk", "cheese"
        ]

        for word in produce_keywords:
            if word in lbl:
                return "Produce / Vegetables"
        for word in bakery_keywords:
            if word in lbl:
                return "Bakery"
        for word in prepared_keywords:
            if word in lbl:
                return "Prepared Food"
        for word in dairy_keywords:
            if word in lbl:
                return "Dairy"

        # When label does not match known food keywords, require manual confirmation
        return "Needs Manual Confirmation"

    def inspect_food_image(self, image_path: str) -> Dict[str, Any]:
        """
        Runs real vision classification and real OCR text extraction.
        Never hallucinates expiration dates or safety certifications.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")

        # 1. Classification
        model = self._load_model()
        pil_img = Image.open(image_path).convert("RGB")
        tensor = self.transform(pil_img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)
            conf, idx = torch.topk(probs, 1)
            raw_label = self._labels[idx[0].item()]
            confidence = round(float(conf[0].item()), 4)

        predicted_category = self.map_to_food_category(raw_label, confidence)

        # 2. OCR text extraction
        ocr_text = ""
        extracted_expiry = None
        try:
            reader = self._load_ocr()
            ocr_results = reader.readtext(image_path)
            lines = [res[1] for res in ocr_results if res[2] > 0.35]
            ocr_text = " ".join(lines)

            # Search for typical date patterns like YYYY-MM-DD, DD/MM/YYYY, EXP: 12/24, etc.
            date_patterns = [
                r'\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b',
                r'\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b',
                r'(?:EXP|BB|BEST BEFORE|USE BY)[\s:]*([0-9A-Za-z/.-]+)'
            ]
            for pat in date_patterns:
                match = re.search(pat, ocr_text, re.IGNORECASE)
                if match:
                    extracted_expiry = match.group(0).strip()
                    break
        except Exception as e:
            ocr_text = f"OCR engine notice: {str(e)}"

        # 3. Objective visual checks (e.g. brightness / contrast degradation)
        safety_flags = []
        cv_img = cv2.imread(image_path)
        if cv_img is not None:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            mean_brightness = np.mean(gray)
            if mean_brightness < 30:
                safety_flags.append("Image is extremely dark; food condition cannot be clearly assessed.")

        # AI inspection only assists categorizing and parsing visible text.
        # It never marks food as "Verified" or certified safe.
        ai_review_status = "Needs Review" if (len(safety_flags) > 0 or predicted_category == "Needs Manual Confirmation") else "Automated Inspection Completed (Pending Human / Donor Confirmation)"

        return {
            "predicted_category": predicted_category,
            "raw_class_name": raw_label.replace("_", " ").title(),
            "confidence": confidence,
            "ocr_text": ocr_text.strip(),
            "extracted_expiry": extracted_expiry,
            "safety_flags": safety_flags,
            "safety_status": ai_review_status,
            "disclaimer": "AI provides visual categorization and text detection assistance only. A photograph cannot verify chemical freshness, bacterial status, or absence of toxins. Physical inspection by receiver required."
        }

        return {
            "predicted_category": predicted_category,
            "raw_class_name": raw_label.replace("_", " ").title(),
            "confidence": confidence,
            "ocr_text": ocr_text.strip(),
            "extracted_expiry": extracted_expiry,
            "safety_flags": safety_flags,
            "safety_status": safety_status,
            "disclaimer": "AI provides visual categorization and text detection assistance only. A photograph cannot verify chemical freshness, bacterial status, or absence of toxins."
        }

inspection_service = FoodInspectionService()
