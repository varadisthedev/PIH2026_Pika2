import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Star, IndianRupee, Calendar, User, ArrowLeft, CheckCircle2, XCircle, ImageOff,
    ShieldCheck, Info, MessageSquare, Clock, Share2, Heart, ChevronRight, AlertCircle,
    Package, CreditCard, Lock, Flag, ExternalLink
} from 'lucide-react';
import api from '../api/axios.js';
import { useRental } from '../context/RentalContext.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/layout/Container.jsx';
import Card from '../components/ui/Card.jsx';
import ItemCard from '../components/items/ItemCard.jsx';
import { useAuth } from '@clerk/clerk-react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { LoadingGrid, EmptyState, ErrorState } from '../components/items/ItemStates.jsx';

const MapView = lazy(() => import('../components/MapView.jsx'));

// Fix Leaflet paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});


function DetailSkeleton() {
    return (
        <div className="animate-pulse pt-24 pb-16 min-h-screen">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="h-96 rounded-3xl bg-brand-green/20 dark:bg-brand-teal/10" />
                    <div className="space-y-5">
                        <div className="h-8 bg-brand-green/25 rounded-xl w-3/4" />
                        <div className="h-4 bg-brand-green/20 rounded-lg w-1/2" />
                        <div className="h-24 bg-brand-green/15 rounded-2xl mt-4" />
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default function ItemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addBooking, wishlist, toggleWishlist, addToRecentlyViewed, addNotification } = useRental();
    const { getToken, isSignedIn } = useAuth();
    const [item, setItem] = useState(null);
    const [similarItems, setSimilarItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [rentalError, setRentalError] = useState('');

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(tomorrow);
    const [imgError, setImgError] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        setLoading(true);
        setSelectedImage(0); // reset selection when item changes
        setError(null);

        api.get(`/products/${id}`)
            .then(res => {
                const product = res.data.product;
                if (!product) throw new Error('Product not found');
                setItem(product);
                addToRecentlyViewed(product);

                // Fetch similar items in the same category
                return api.get('/products', { params: { category: product.category, limit: 5 } });
            })
            .then(res => {
                const similar = res.data.products || [];
                setSimilarItems(similar.filter(i => (i._id || i.id) !== id).slice(0, 4));
                setLoading(false);
            })
            .catch((e) => {
                console.error('❌ [ItemDetails] Error:', e);
                setError(e.response?.data?.error || 'Item not found or unavailable.');
                setLoading(false);
            });
    }, [id]);

    if (loading) return <DetailSkeleton />;
    if (error || !item) return <div className="pt-28"><ErrorState message={error} onRetry={() => navigate('/browse')} /></div>;

    // Data normalization
    const itemId = item._id || item.id;
    const productImages = (item.images && item.images.length > 0) ? item.images : (item.image ? [item.image] : []);
    const imgSrc = productImages[selectedImage] || productImages[0];
    const isAvailable = item.availability ?? item.available ?? true;
    const ownerName = item.owner?.name || 'Local Neighbor';
    const displayLocation = typeof item.location === 'string' ? item.location : (item.location?.address || 'Local Neighborhood');
    const displayDistance = item.distanceKm || item.distance || null;

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
    const securityDeposit = Math.round(item.pricePerDay * 2);
    const serviceFee = Math.round(item.pricePerDay * 0.1 * days);
    const totalCost = (item.pricePerDay * days) + securityDeposit + serviceFee;


    const handleBooking = async () => {
        if (!isSignedIn) {
            setRentalError('Please sign in to rent items.');
            return;
        }

        setConfirming(true);
        try {
            const token = await getToken();
            const res = await api.post('/rentals', {
                productId: itemId,
                startDate,
                endDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Keep the context update to sync the UI locally, or rely on Dashboard fetching
            addBooking(item, {
                startDate,
                endDate,
                totalCost,
                securityDeposit,
                status: 'pending' // Actual backed status is usually 'pending' at first
            });

            setConfirming(false);
            setConfirmed(true);
            setTimeout(() => {
                setBookingModalOpen(false);
                navigate('/dashboard');
            }, 1200);
        } catch (e) {
            console.error('Rental error:', e.response?.data || e.message);
            setRentalError(e.response?.data?.error || 'Failed to process booking. Try again.');
            setConfirming(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Rent ${item.title} on RentiGO`,
                text: `Check out this ${item.title} for rent in ${displayLocation}!`,
                url: window.location.href,
            }).catch(() => setShareModalOpen(true));
        } else {
            setShareModalOpen(true);
        }
    };

    return (
        <div className="pb-32 animate-fade-in bg-white/50 dark:bg-transparent min-h-screen">
            <Container>
                {/* Navigation Breadcrumb */}
                <div className="pt-28 pb-10 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-brand-teal hover:text-brand-dark dark:text-brand-aqua dark:hover:text-brand-frost transition-all group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-brand-teal/5 dark:bg-brand-aqua/10 flex items-center justify-center group-hover:bg-brand-teal/10">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Back to Search
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="p-3 rounded-2xl glass-card hover:bg-brand-teal/5 text-brand-teal transition-all"
                        >
                            <Share2 size={18} />
                        </button>
                        <button
                            onClick={() => toggleWishlist(itemId)}
                            className={`p-3 rounded-2xl glass-card transition-all ${wishlist.includes(itemId) ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-brand-teal/5 text-brand-teal'}`}
                        >
                            <Heart size={18} className={wishlist.includes(itemId) ? 'fill-white' : ''} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
                    {/* Left Column: Media & Info */}
                    <div className="space-y-12">
                        <div className="space-y-8">
                            <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-[2.5rem] overflow-hidden glass-card shadow-2xl group border-none">
                                {imgError || !imgSrc ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-brand-teal/5">
                                        <ImageOff size={64} className="text-brand-teal/20" />
                                        <span className="font-black uppercase tracking-widest text-brand-teal/40">{item.category}</span>
                                    </div>
                                ) : (
                                    <img
                                        src={imgSrc}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                        onError={() => setImgError(true)}
                                    />
                                )}
                                <div className="absolute top-6 left-6 flex gap-2">
                                    <Badge variant="info" className="!bg-white/90 !text-brand-dark px-4 py-2 text-xs font-black uppercase shadow-lg border-none">
                                        {item.category}
                                    </Badge>
                                    {item.isVerified && (
                                        <Badge variant="approved" className="px-4 py-2 text-xs font-black uppercase shadow-lg border-none">
                                            Verified Item
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {productImages.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                                    {productImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setSelectedImage(idx); setImgError(false); }}
                                            className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 ${selectedImage === idx ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-brand-dark scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                                        >
                                            <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-brand-dark dark:text-brand-frost leading-none">
                                    {item.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-brand-teal/70 dark:text-brand-aqua/60">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="fill-brand-green text-brand-green" />
                                        <span className="text-brand-dark dark:text-brand-frost">{item.rating || '5.0'}</span>
                                        <span className="opacity-50 text-[10px] uppercase font-black tracking-widest">({item.reviewCount || 0} Reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-brand-teal" />
                                        <span className="text-brand-dark dark:text-brand-frost">{displayLocation}</span>
                                        {displayDistance && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-brand-teal/30" />
                                                <span>{displayDistance}km away</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description & Specs */}
                        <Card variant="glass" className="!p-8 space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/40 mb-4">Description</h3>
                                <p className="text-lg text-brand-dark/80 dark:text-brand-frost/80 leading-relaxed font-medium">
                                    {item.description || "A high-quality item perfect for your needs. Professional grade and well-maintained by the owner. Available for immediate pickup in the local community."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-brand-teal/10">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Response Time</div>
                                    <div className="flex items-center gap-2 text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">
                                        <Clock size={14} className="text-brand-green" /> &lt; 2 Hours
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Condition</div>
                                    <div className="flex items-center gap-2 text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">
                                        <Badge variant="info" className="px-2 py-0.5 !text-[10px]">Like New</Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Pickup Type</div>
                                    <div className="flex items-center gap-2 text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">
                                        <Package size={14} className="text-brand-teal" /> Self-Pickup
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Location Preview */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/40 px-2">Location Information</h3>
                            <div className="w-full relative h-64 rounded-[2rem] overflow-hidden glass-card border-brand-teal/5">
                                {(item.location?.lat && item.location?.lng) ? (
                                    <MapContainer
                                        center={[item.location.lat, item.location.lng]}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                        zoomControl={false}
                                        dragging={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                                        />
                                        <Circle
                                            center={[item.location.lat, item.location.lng]}
                                            radius={800} // Approximate neighborhood
                                            pathOptions={{ color: '#3C474B', fillColor: '#4f7CAC', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
                                        />
                                        <Marker position={[item.location.lat, item.location.lng]} icon={greenIcon} />
                                    </MapContainer>
                                ) : (
                                    <div className="absolute inset-0 bg-brand-green/5 dark:bg-brand-teal/5 flex items-center justify-center">
                                        <div className="text-center font-bold text-brand-teal/40 uppercase tracking-widest text-[10px]">
                                            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                            Map Location Unavailable
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-6 left-6 right-6 p-4 z-[400] glass-card shadow-xl flex items-center justify-between pointer-events-none">
                                    <div className="text-[10px] font-black text-brand-dark dark:text-brand-frost uppercase tracking-widest">
                                        Approximate location near {displayLocation}
                                    </div>
                                    <button onClick={() => navigate('/map')} className="pointer-events-auto flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest hover:text-brand-teal transition-colors">
                                        Expand Map <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout Sidebar */}
                    <aside className="sticky top-32 space-y-6">
                        <Card variant="glass" className="!p-8 shadow-2xl !rounded-[2.5rem] border-brand-green/20">
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-4xl font-black text-brand-dark dark:text-brand-frost">₹{item.pricePerDay?.toLocaleString('en-IN')}</span>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">/ day</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="grid grid-cols-2 gap-2 p-2 rounded-2xl bg-brand-teal/5 dark:bg-brand-teal/10">
                                    <div className="flex flex-col gap-1 px-4 py-2 border-r border-brand-teal/10">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/60">Start Date</label>
                                        <input
                                            type="date"
                                            min={today}
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent text-sm font-black text-brand-dark dark:text-brand-frost outline-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 px-4 py-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/60">End Date</label>
                                        <input
                                            type="date"
                                            min={startDate}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-sm font-black text-brand-dark dark:text-brand-frost outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 pb-6 border-b border-brand-teal/10 text-[11px] font-black text-brand-teal/60 tracking-tight">
                                <div className="flex justify-between uppercase">
                                    <span>Rent (₹{item.pricePerDay} × {days} days)</span>
                                    <span className="text-brand-dark dark:text-brand-frost font-black">₹{(item.pricePerDay * days).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between uppercase">
                                    <span className="flex items-center gap-1.5">Security Deposit <Info size={12} /></span>
                                    <span className="text-brand-dark dark:text-brand-frost font-black">₹{securityDeposit.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between uppercase">
                                    <span>Service Fee</span>
                                    <span className="text-brand-dark dark:text-brand-frost font-black">₹{serviceFee.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between pt-4 text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-widest">
                                    <span>Total Price</span>
                                    <span className="text-brand-green text-lg">₹{totalCost.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full !rounded-2xl shadow-xl shadow-brand-green/20"
                                onClick={() => setBookingModalOpen(true)}
                                disabled={!isAvailable}
                            >
                                {isAvailable ? <><Lock size={18} /> Request to Book</> : <><XCircle size={18} /> Rented Out</>}
                            </Button>
                        </Card>

                        {/* Owner Card */}
                        <Card variant="default" className="!p-6 !rounded-[2rem]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden glass-card bg-brand-teal/5">
                                    <img src={item.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ownerName}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">{ownerName}</h4>
                                        <Badge variant="approved" className="!text-[9px] px-2 py-0.5 border-none">Top Host</Badge>
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-teal/60 uppercase mt-0.5">Verified Member</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !text-[11px] !py-3"
                                onClick={() => navigate('/messages')}
                            >
                                <MessageSquare size={14} /> Message Neighbor
                            </Button>
                        </Card>
                    </aside>
                </div>

                {/* Similar Items */}
                {similarItems.length > 0 && (
                    <section className="mt-32">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase leading-none">Nearby Favourites</h3>
                            <button onClick={() => navigate('/browse')} className="text-xs font-black uppercase tracking-widest text-brand-teal flex items-center gap-2 group">
                                View More <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {similarItems.map(sItem => (
                                <ItemCard key={sItem._id || sItem.id} item={sItem} />
                            ))}
                        </div>
                    </section>
                )}
            </Container>

            {/* SHARED MODALS */}
            <Modal isOpen={bookingModalOpen} onClose={() => !confirming && setBookingModalOpen(false)} title="Rental Confirmation">
                {confirmed ? (
                    <div className="text-center py-10 space-y-6 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-brand-green/20 flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 size={40} className="text-brand-green" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost tracking-tighter mb-2">Request Sent!</h3>
                            <p className="text-sm font-bold text-brand-teal/60 uppercase tracking-tight max-w-[280px] mx-auto">
                                The owner has been notified. We will alert you once they accept.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 pb-4">
                        <div className="flex gap-4 p-4 rounded-3xl glass-card bg-brand-teal/5">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden glass-card">
                                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter leading-tight mb-1">{item.title}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-teal/60 uppercase">
                                    <MapPin size={10} /> {displayLocation}
                                </div>
                            </div>
                        </div>
                        {rentalError && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest">{rentalError}</div>}
                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" size="lg" className="flex-1 !rounded-2xl" onClick={() => setBookingModalOpen(false)}>Back</Button>
                            <Button variant="primary" size="lg" className="flex-1 !rounded-2xl" onClick={handleBooking} loading={confirming}>Confirm Request</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Mobile Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-4 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-xl border-t border-brand-teal/10">
                <div className="flex items-center justify-between gap-6 max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-teal/40 uppercase tracking-widest">Total Price</span>
                        <span className="text-xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">₹{totalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 !rounded-2xl shadow-xl shadow-brand-green/20"
                        onClick={() => setBookingModalOpen(true)}
                        disabled={!isAvailable}
                    >
                        {isAvailable ? 'Request to Book' : 'Rented'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
