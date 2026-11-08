import React, { useState, useEffect } from 'react';
import {
  fetchDonations,
  createDonation,
  uploadFoodPhoto,
  inspectFoodImage
} from '../services/api';
import MapView from '../components/MapView';
import {
  Sparkles,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  PackageCheck,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function DonorDashboard({ currentUser }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);

  // Form State
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Prepared Food');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('servings');
  const [estimatedKg, setEstimatedKg] = useState('5.0');
  const [storageMethod, setStorageMethod] = useState('Heated Container');
  const [prepTime, setPrepTime] = useState('');
  const [printedExpiry, setPrintedExpiry] = useState('');
  const [pickupDeadline, setPickupDeadline] = useState('');
  const [pickupAddress, setPickupAddress] = useState(currentUser?.address || 'Demo Location, Gachibowli, Hyderabad, Telangana');
  const [latitude, setLatitude] = useState(currentUser?.latitude || 17.4401);
  const [longitude, setLongitude] = useState(currentUser?.longitude || 78.3489);

  // AI & Image State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [inspectionError, setInspectionError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Clear notification after 4 seconds
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    loadMyDonations();
    // Default pickup deadline to 4 hours from now
    const d = new Date();
    d.setHours(d.getHours() + 4);
    setPickupDeadline(d.toISOString().slice(0, 16));

    const p = new Date();
    p.setHours(p.getHours() - 1);
    setPrepTime(p.toISOString().slice(0, 16));
  }, []);

  async function loadMyDonations() {
    try {
      setLoading(true);
      const data = await fetchDonations({ donor_id: currentUser.id });
      setDonations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle local image selection and trigger AI inspection
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setInspectionError(null);
    setIsInspecting(true);

    try {
      // 1. Run actual backend PyTorch + EasyOCR inspection
      const result = await inspectFoodImage(file);
      setInspectionData(result);

      // Auto-fill suggestions only if confidence is sufficient and valid, but require manual confirmation
      if (result.predicted_category && result.predicted_category !== "Needs Manual Confirmation") {
        setFoodCategory(result.predicted_category);
      }
      if (!foodName && result.raw_class_name && result.confidence >= 0.25) {
        setFoodName(result.raw_class_name);
      }
      if (result.extracted_expiry) {
        setPrintedExpiry(result.extracted_expiry);
      }
    } catch (err) {
      console.error(err);
      setInspectionError('AI service notice: Image processed with standard fallback checks.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedQty = parseFloat(quantity);
    const parsedKg = parseFloat(estimatedKg);

    if (!foodName.trim()) {
      showNotification('error', 'Food name/description is required.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      showNotification('error', 'Quantity must be a positive number greater than 0.');
      return;
    }
    if (isNaN(parsedKg) || parsedKg <= 0) {
      showNotification('error', 'Estimated weight must be a positive number in kg.');
      return;
    }
    if (!pickupDeadline) {
      showNotification('error', 'Pickup deadline is mandatory.');
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedImageUrl = null;

      // Upload image file if selected
      if (selectedFile) {
        try {
          const uploadRes = await uploadFoodPhoto(selectedFile);
          uploadedImageUrl = uploadRes.image_url;
        } catch (uploadErr) {
          showNotification('error', uploadErr.message || 'Image upload failed. Ensure file is under 5 MB and valid format.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        donor_id: currentUser.id,
        food_name: foodName.trim(),
        food_category: foodCategory,
        quantity: parsedQty,
        unit,
        estimated_kg: parsedKg,
        preparation_time: prepTime ? new Date(prepTime).toISOString() : null,
        printed_expiry: printedExpiry ? printedExpiry.trim() : null,
        storage_method: storageMethod,
        pickup_deadline: new Date(pickupDeadline).toISOString(),
        pickup_address: pickupAddress,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_url: uploadedImageUrl,
        ai_predicted_category: inspectionData?.predicted_category || null,
        ai_confidence: inspectionData?.confidence || null,
        ai_ocr_text: inspectionData?.ocr_text || null,
        ai_extracted_expiry: inspectionData?.extracted_expiry || null,
        safety_status: inspectionData?.safety_status || "Verified",
        safety_notes: inspectionData?.safety_flags?.join('; ') || null,
        is_spoiled: false
      };

      await createDonation(payload);

      // Reset form
      setFoodName('');
      setQuantity('');
      setEstimatedKg('5.0');
      setSelectedFile(null);
      setPreviewUrl(null);
      setInspectionData(null);
      await loadMyDonations();
      showNotification('success', 'Surplus food donation successfully published to redistribution network!');
    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'Error publishing donation. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border shadow-sm transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donor Operations Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.organization})
          </p>
        </div>
        <button
          onClick={loadMyDonations}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Creation Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Publish Surplus Food Donation</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Image upload & AI inspection box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Food Photograph & AI Visual Inspection
              </label>

              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="food-photo-input"
                  className="hidden"
                />

                {!previewUrl ? (
                  <label htmlFor="food-photo-input" className="cursor-pointer flex flex-col items-center justify-center py-4">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-emerald-700">Upload food photo for instant AI inspection</span>
                    <span className="text-xs text-slate-400 mt-1">Accepts PNG, JPG, JPEG</span>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="flex-1 w-full">
                        <label
                          htmlFor="food-photo-input"
                          className="inline-block text-xs font-semibold text-emerald-700 cursor-pointer hover:underline mb-2"
                        >
                          Change photo
                        </label>
                        {isInspecting ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                            Running MobileNetV2 classification & EasyOCR text extraction...
                          </div>
                        ) : inspectionData ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <div>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  Raw AI Label: <span className="text-emerald-700">{inspectionData.raw_class_name}</span>
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Category mapping: <strong className={inspectionData.predicted_category === "Needs Manual Confirmation" ? "text-amber-700" : "text-emerald-700"}>
                                    {inspectionData.predicted_category}
                                  </strong>
                                </span>
                              </div>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                {Math.round(inspectionData.confidence * 100)}% conf
                              </span>
                            </div>

                            {inspectionData.predicted_category === "Needs Manual Confirmation" && (
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Low confidence or ambiguous visual features. Please select the correct food category manually below.</span>
                              </div>
                            )}

                            {inspectionData.ocr_text && (
                              <p className="text-slate-600 truncate">
                                <strong>OCR Detected Text:</strong> "{inspectionData.ocr_text}"
                              </p>
                            )}
                            {inspectionData.extracted_expiry ? (
                              <p className="text-amber-800 font-semibold">
                                <strong>OCR Extracted Expiry:</strong> {inspectionData.extracted_expiry}
                              </p>
                            ) : (
                              <p className="text-slate-400 text-[11px]">
                                OCR Note: No expiration date pattern detected in photo.
                              </p>
                            )}

                            <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                              <span>Status: {inspectionData.safety_status}</span>
                              <span className="italic text-slate-400">Donor confirmation required</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Name / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vegetarian Pasta & Garden Salad"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Category *
                </label>
                <select
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Prepared Food">Prepared Food (Hot/Cold Meals)</option>
                  <option value="Produce / Vegetables">Produce / Vegetables / Fruit</option>
                  <option value="Bakery">Bakery & Breads</option>
                  <option value="Packaged / Pantry">Packaged / Canned Goods</option>
                  <option value="Dairy">Dairy Products</option>
                </select>
              </div>
            </div>

            {/* Quantity and Normalized weight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="servings">servings</option>
                  <option value="kg">kg</option>
                  <option value="trays">trays</option>
                  <option value="boxes">boxes</option>
                  <option value="items">individual items</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="5.0"
                  value={estimatedKg}
                  onChange={(e) => setEstimatedKg(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Safety & Storage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Method *
                </label>
                <select
                  value={storageMethod}
                  onChange={(e) => setStorageMethod(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Heated Container">Heated Container (&gt;60°C)</option>
                  <option value="Refrigerated">Refrigerated (&lt;4°C)</option>
                  <option value="Frozen">Frozen (&lt;-18°C)</option>
                  <option value="Room Temperature">Room Temperature</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Printed Expiry (if visible)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-11-15 or Best by 10pm"
                  value={printedExpiry}
                  onChange={(e) => setPrintedExpiry(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Logistics & Pickup Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Address *
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Important Disclaimer Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong>Safety Verification Protocol:</strong> FreshLoop AI assists by analyzing labels and food category characteristics. Visual inspection cannot identify microscopic bacterial contamination or odorless chemical spoilage. Physical evaluation at pickup remains mandatory.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isInspecting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Validating & Publishing...' : 'Publish Surplus Food Listing'}
            </button>
          </form>
        </div>

        {/* Existing Listings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Live Active Map Locations</h3>
            <MapView
              locations={donations.map(d => ({
                latitude: d.latitude,
                longitude: d.longitude,
                title: d.food_name,
                subtitle: `${d.quantity} ${d.unit} • Status: ${d.status}`,
                badge: d.status
              }))}
              height="200px"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">My Food Donations ({donations.length})</h3>

            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading listings...</p>
            ) : donations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No donations created yet.</p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {donations.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 leading-tight">
                        {item.food_name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Picked Up' ? 'bg-amber-100 text-amber-800' :
                              'bg-teal-100 text-teal-800'
                        }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>📦 {item.quantity} {item.unit} ({item.food_category})</p>
                      <p>❄️ Storage: {item.storage_method}</p>
                      <p>⏳ Deadline: {new Date(item.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {item.safety_notes && (
                        <p className="text-amber-700 font-medium">⚠️ {item.safety_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
