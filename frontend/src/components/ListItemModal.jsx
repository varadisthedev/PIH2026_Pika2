import React, { useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  X, Package, Tag, IndianRupee, FileText, Loader2, Sparkles,
  Image, Plus, Trash2, ShieldCheck, AlertTriangle, MapPin, Navigation, Upload,
} from 'lucide-react';
import api, { withToken } from '../api/axios.js';

const CATEGORIES = [
  'Everyday Essentials', 'Tech & Gadgets', 'Home & Living', 'Mobility & Transport',
  'Event & Party Gear', 'Professional Equipment', 'Outdoor & Adventure',
  'Fitness & Sports', 'Study & Work Setup', 'Creative & Media Gear',
];

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const PRACTICAL_MAX = 1_00_00_000; // ₹1 crore warning

function NumberWarning({ value }) {
  const num = Number(value);
  if (!value || isNaN(num)) return null;
  if (num > MAX_SAFE) return (
    <p className="flex items-center gap-1 text-xs text-red-500 font-semibold mt-1">
      <AlertTriangle size={12} /> Exceeds JS safe integer — value will be inaccurate!
    </p>
  );
  if (num > PRACTICAL_MAX) return (
    <p className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-1">
      <AlertTriangle size={12} /> Very high value (₹{num.toLocaleString('en-IN')}) — double-check!
    </p>
  );
  return null;
}

export default function ListItemModal({ onClose, onSuccess }) {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', category: 'Everyday Essentials',
    pricePerDay: '', securityDeposit: '',
  });
  const [location, setLocation] = useState({ address: '', lat: null, lng: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Image handling — files take priority, URLs as fallback
  const [imageFiles, setImageFiles] = useState([]);    // File objects from <input type=file>
  const [imagePreviews, setImagePreviews] = useState([]); // object URLs for preview
  const [uploadedUrls, setUploadedUrls] = useState([]); // returned from /api/upload

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [createdProduct, setCreatedProduct] = useState(null);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const hasNumberError =
    (form.pricePerDay && Number(form.pricePerDay) > MAX_SAFE) ||
    (form.securityDeposit && Number(form.securityDeposit) > MAX_SAFE);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        console.log(`📍 [ListItemModal] Got coords: ${lat}, ${lng}`);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await r.json();
          const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          console.log('📍 [ListItemModal] Reverse geocoded:', address);
          setLocation({ address, lat, lng });
        } catch {
          setLocation({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError('Could not get location. Please allow location access or type it manually.');
        console.warn('⚠️ [ListItemModal] Geolocation error:', err.message);
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // ── Image file picker ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ── Upload files to backend, get URLs ─────────────────────────────────────
  const uploadImages = async (token) => {
    if (imageFiles.length === 0) return [];
    const formData = new FormData();
    imageFiles.forEach(f => formData.append('images', f));
    console.log(`📤 [ListItemModal] Uploading ${imageFiles.length} image(s)...`);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    console.log('✅ [ListItemModal] Images uploaded:', data.urls);
    return data.urls;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim() || !form.pricePerDay) {
      setError('Please fill in all required fields.');
      return;
    }
    if (Number(form.pricePerDay) <= 0) {
      setError('Price per day must be greater than 0.');
      return;
    }
    if (hasNumberError) {
      setError('A price value exceeds the safe integer limit.');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();

      // 1. Upload images first (if any)
      const imageUrls = imageFiles.length > 0 ? await uploadImages(token) : [];

      // 2. Create product
      console.log('📦 [ListItemModal] Creating product with', imageUrls.length, 'images');
      const res = await api.post('/products', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        pricePerDay: Number(form.pricePerDay),
        securityDeposit: Number(form.securityDeposit) || 0,
        images: imageUrls,
        location: location.lat ? location : undefined,
      }, withToken(token));

      const product = res.data.product;
      console.log('✅ [ListItemModal] Product created:', product._id);
      setCreatedProduct(product);

      if (product.aiInsights?.rentalValueScore) {
        setAiInsights(product.aiInsights);
      } else {
        onSuccess(product);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.error('❌ [ListItemModal] Error:', msg);
      setError(err.response?.status === 401 ? 'You must be signed in to list items.' : `Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onSuccess(createdProduct || {});
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-3xl shadow-2xl overflow-hidden animate-fade-up max-h-[78vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#4f7CAC]/20 dark:border-[#9EEFE5]/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-green/20 flex items-center justify-center">
              <Package size={17} className="text-brand-teal dark:text-brand-green" />
            </div>
            <div>
              <h2 className="text-sm font-black text-brand-dark dark:text-brand-frost">List an Item</h2>
              <p className="text-[10px] text-brand-teal dark:text-brand-aqua/70 font-semibold">Earn by renting to neighbours</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#3C474B] hover:bg-[#3C474B]/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* AI Insights Screen */}
        {aiInsights ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-brand-teal dark:text-brand-green" />
              <h3 className="font-black text-brand-dark dark:text-brand-frost">AI Insights</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-brand-teal dark:text-brand-green">{aiInsights.rentalValueScore}/10</div>
                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-1">Rental Value Score</div>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-brand-teal dark:text-brand-green">{aiInsights.demandEstimate}</div>
                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-1">Demand</div>
              </div>
            </div>
            {aiInsights.pricingSuggestion && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-bold text-brand-teal dark:text-brand-aqua uppercase tracking-wider mb-1">Pricing</p>
                <p className="text-sm text-brand-dark dark:text-brand-frost">{aiInsights.pricingSuggestion}</p>
              </div>
            )}
            {aiInsights.buyerSummary && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-bold text-brand-teal dark:text-brand-aqua uppercase tracking-wider mb-1">For Buyers</p>
                <p className="text-sm text-brand-dark dark:text-brand-frost">{aiInsights.buyerSummary}</p>
              </div>
            )}
            <button onClick={handleContinue} className="w-full py-3 rounded-2xl font-black text-sm bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark hover:scale-[1.02] transition-transform">
              Continue to Dashboard →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto">

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5]">Item Title *</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 bg-white/60 dark:bg-[#162521]/60 focus-within:ring-2 focus-within:ring-[#9EEFE5]/40 transition-all">
                <Tag size={15} className="text-[#3C474B] shrink-0" />
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Canon DSLR Camera"
                  className="flex-1 bg-transparent text-sm font-semibold text-brand-dark dark:text-brand-frost placeholder:text-[#3C474B]/50 outline-none" required maxLength={100} />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5]">Category *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${form.category === cat
                      ? 'bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark'
                      : 'bg-[#4f7CAC]/20 text-[#3d6b50] hover:bg-[#4f7CAC]/35 dark:bg-[#3C474B]/15 dark:text-[#9EEFE5]'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price + Deposit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5]">Price / Day (₹) *</label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 bg-white/60 dark:bg-[#162521]/60 focus-within:ring-2 focus-within:ring-[#9EEFE5]/40 transition-all">
                  <IndianRupee size={14} className="text-[#3C474B] shrink-0" />
                  <input name="pricePerDay" type="number" min="1" value={form.pricePerDay} onChange={handleChange}
                    placeholder="500" className="flex-1 bg-transparent text-sm font-semibold text-brand-dark dark:text-brand-frost outline-none" required />
                </div>
                <NumberWarning value={form.pricePerDay} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5] flex items-center gap-1">
                  <ShieldCheck size={11} /> Deposit (₹)
                </label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 bg-white/60 dark:bg-[#162521]/60 focus-within:ring-2 focus-within:ring-[#9EEFE5]/40 transition-all">
                  <IndianRupee size={14} className="text-[#3C474B] shrink-0" />
                  <input name="securityDeposit" type="number" min="0" value={form.securityDeposit} onChange={handleChange}
                    placeholder="0" className="flex-1 bg-transparent text-sm font-semibold text-brand-dark dark:text-brand-frost outline-none" />
                </div>
                <NumberWarning value={form.securityDeposit} />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5]">Description *</label>
              <div className="flex gap-3 px-4 py-3 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 bg-white/60 dark:bg-[#162521]/60 focus-within:ring-2 focus-within:ring-[#9EEFE5]/40 transition-all">
                <FileText size={15} className="text-[#3C474B] shrink-0 mt-0.5" />
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Condition, what's included, usage notes..." rows={2}
                  className="flex-1 bg-transparent text-sm font-medium text-brand-dark dark:text-brand-frost placeholder:text-[#3C474B]/50 outline-none resize-none" required maxLength={500} />
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5] flex items-center gap-1">
                <MapPin size={11} /> Location
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-3 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 bg-white/60 dark:bg-[#162521]/60 focus-within:ring-2 focus-within:ring-[#9EEFE5]/40 transition-all">
                  <MapPin size={14} className="text-[#3C474B] shrink-0" />
                  <input type="text" value={location.address}
                    onChange={e => setLocation(prev => ({ ...prev, address: e.target.value, lat: null, lng: null }))}
                    placeholder="Type address or detect automatically"
                    className="flex-1 bg-transparent text-sm font-medium text-brand-dark dark:text-brand-frost placeholder:text-[#3C474B]/40 outline-none" />
                </div>
                <button type="button" onClick={detectLocation} disabled={geoLoading}
                  title="Detect my location"
                  className="px-3 py-2 rounded-xl border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 text-brand-teal dark:text-brand-green hover:bg-brand-teal/10 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 text-xs font-bold">
                  {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  {geoLoading ? 'Detecting…' : 'Detect'}
                </button>
              </div>
              {geoError && <p className="text-xs text-red-500 font-semibold">{geoError}</p>}
              {location.lat && (
                <p className="text-xs text-brand-teal dark:text-brand-green font-semibold">
                  📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5] flex items-center gap-1">
                  <Image size={11} /> Photos (up to 5)
                </label>
                {imageFiles.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-brand-teal dark:text-brand-green flex items-center gap-1 hover:opacity-70">
                    <Plus size={12} /> Add Photos
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={handleFileChange} />

              {imagePreviews.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20">
                      <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 flex flex-col items-center justify-center gap-1 text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#3C474B]/10 transition-colors">
                      <Plus size={18} />
                      <span className="text-[9px] font-bold">Add</span>
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 border-dashed border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#3C474B]/10 transition-colors">
                  <Upload size={20} className="opacity-50" />
                  <span className="text-xs font-bold">Click to browse photos from your device</span>
                  <span className="text-[10px] opacity-60">JPEG, PNG, WebP, GIF — max 5MB each</span>
                </button>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <AlertTriangle size={13} /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-2xl font-bold text-sm border border-[#4f7CAC]/40 dark:border-[#9EEFE5]/20 text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#3C474B]/10 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || hasNumberError}
                className="flex-1 py-3 rounded-2xl font-black text-sm bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> {imageFiles.length > 0 ? 'Uploading + AI…' : 'Creating + AI…'}</>
                  : <><Sparkles size={15} /> List with AI Insights</>}
              </button>
            </div>

            <p className="text-center text-xs text-[#3C474B]/70 dark:text-[#9EEFE5]/50">
              🤖 Gemini AI will analyze your listing for free
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
