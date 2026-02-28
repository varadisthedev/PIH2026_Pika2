import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Star, IndianRupee, Calendar, User, ArrowLeft, CheckCircle2, XCircle, ImageOff, Package,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';
import Modal from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Container from '../components/layout/Container.jsx';
import { ErrorState } from '../components/items/ItemStates.jsx';

const MapView = lazy(() => import('../components/MapView.jsx'));

function DetailSkeleton() {
    return (
        <div className="animate-pulse pt-24 pb-16 min-h-screen">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="h-96 rounded-3xl bg-[#99d19c]/20 dark:bg-[#73ab84]/10" />
                    <div className="space-y-5">
                        <div className="h-8 bg-[#99d19c]/25 dark:bg-[#73ab84]/15 rounded-xl w-3/4" />
                        <div className="h-4 bg-[#99d19c]/20 rounded-lg w-1/2" />
                        <div className="h-6 bg-[#99d19c]/25 rounded-xl w-1/3 mt-4" />
                        <div className="h-24 bg-[#99d19c]/15 rounded-2xl mt-4" />
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default function ItemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken, isSignedIn } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [rentalError, setRentalError] = useState('');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(tomorrow);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        console.log(`🔍 [ItemDetails] Fetching product: ${id}`);
        api.get(`/products/${id}`)
            .then(res => {
                console.log('✅ [ItemDetails] Product loaded:', res.data.product?.title);
                setItem(res.data.product);
                setLoading(false);
            })
            .catch(err => {
                console.error('❌ [ItemDetails] Failed to load product:', err.message);
                setError('Item not found or unavailable.');
                setLoading(false);
            });
    }, [id]);

    // Derive fields from MongoDB product
    const imgSrc = item?.images?.[0] || null;
    const isAvailable = item?.availability ?? true;
    const ownerName = item?.owner?.name || 'RentiGO Seller';
    const ownerEmail = item?.owner?.email || '';

    if (loading) return <DetailSkeleton />;
    if (error || !item) return (
        <div className="pt-28">
            <ErrorState message={error} onRetry={() => navigate('/browse')} />
        </div>
    );

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
    const totalPrice = days * (item?.pricePerDay || 0);

    const handleConfirm = async () => {
        setConfirming(true);
        setRentalError('');
        console.log(`🛒 [ItemDetails] Submitting rental for product: ${item._id}`);
        try {
            const token = await getToken();
            const res = await api.post('/rentals', {
                productId: item._id,
                startDate,
                endDate,
            }, withToken(token));
            console.log('✅ [ItemDetails] Rental created:', res.data.rental?._id);
            setConfirmed(true);
            setTimeout(() => {
                setModalOpen(false);
                navigate('/dashboard');
            }, 1400);
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            console.error('❌ [ItemDetails] Rental failed:', msg);
            if (err.response?.status === 401) {
                setRentalError('Please sign in to rent this item.');
            } else {
                setRentalError(msg);
            }
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="pb-24 animate-fade-in">
            <Container>
                {/* Back */}
                <div className="mb-10 animate-fade-up">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2.5 text-sm font-black uppercase tracking-widest text-brand-teal dark:text-brand-aqua hover:text-brand-dark dark:hover:text-brand-frost transition-all duration-300 group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-brand-teal/10 dark:bg-brand-aqua/10 flex items-center justify-center group-hover:bg-brand-teal/20 transition-colors">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Back to results
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

                    {/* Image */}
                    <div className="relative">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden glass-card shadow-2xl bg-gradient-to-br from-[#99d19c]/30 to-[#79c7c5]/20 dark:from-[#99d19c]/10 dark:to-[#79c7c5]/8">
                            {imgError || !imgSrc ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#73ab84] dark:text-[#79c7c5]">
                                    <Package size={64} className="opacity-20" />
                                    <span className="text-sm font-semibold opacity-50">{item.category}</span>
                                </div>
                            ) : (
                                <img
                                    src={imgSrc}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            )}
                        </div>
                        {/* Floating badge */}
                        <div className="absolute top-4 left-4">
                            <Badge variant="info" className="shadow-md backdrop-blur-sm text-sm px-3 py-1">
                                {item.category}
                            </Badge>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col">
                        {/* Title + availability */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h1 className="text-3xl font-black text-[#000501] dark:text-[#ade1e5] leading-tight">
                                {item.title}
                            </h1>
                            <Badge variant={isAvailable ? 'approved' : 'error'} className="shrink-0 mt-1">
                                {isAvailable ? (
                                    <><CheckCircle2 size={12} /> Available</>
                                ) : (
                                    <><XCircle size={12} /> Unavailable</>
                                )}
                            </Badge>
                        </div>

                        {/* Location + rating */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[#73ab84] dark:text-[#79c7c5]">
                            {item.location?.address && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <MapPin size={15} /> {item.location.address}
                            </div>
                            )}
                            {item.rating && (
                            <div className="flex items-center gap-1.5 font-semibold">
                                <Star size={15} className="fill-[#73ab84] dark:fill-[#79c7c5]" />
                                {item.rating}
                            </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="glass-card rounded-2xl p-5 mb-6">
                            <div className="flex items-baseline gap-1 mb-1">
                                <IndianRupee size={22} className="text-[#000501] dark:text-[#ade1e5]" />
                                <span className="text-5xl font-black text-[#000501] dark:text-[#ade1e5]">
                                    {item.pricePerDay.toLocaleString('en-IN')}
                                </span>
                                <span className="text-lg text-[#73ab84] dark:text-[#79c7c5] font-semibold">/ day</span>
                            </div>
                            {item.securityDeposit > 0 && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                                🛡️ Security deposit: ₹{item.securityDeposit.toLocaleString('en-IN')} (refundable)
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-[#73ab84] dark:text-[#79c7c5] mt-1">
                                <Calendar size={13} />
                                Listed {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-[#3d6b50] dark:text-[#79c7c5] text-sm leading-relaxed mb-6 font-medium">
                            {item.description}
                        </p>

                        {/* Owner card */}
                        <div className="flex items-center gap-3 glass-card rounded-2xl p-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-[#99d19c]/20 dark:bg-[#79c7c5]/10 flex items-center justify-center border-2 border-[#99d19c]/40 dark:border-[#79c7c5]/20">
                                <User size={20} className="text-[#73ab84] dark:text-[#79c7c5]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#000501] dark:text-[#ade1e5]">
                                    <User size={13} /> {ownerName}
                                </div>
                                <div className="text-xs text-[#73ab84] dark:text-[#79c7c5] mt-0.5">Verified owner · {ownerEmail || 'RentiGO member'}</div>
                            </div>
                        </div>

                        {/* CTA */}
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => {
                                if (!isSignedIn) { navigate('/login'); return; }
                                setModalOpen(true);
                            }}
                            disabled={!isAvailable}
                            className="w-full"
                        >
                            {isAvailable
                                ? isSignedIn ? 'Request to Borrow' : 'Sign In to Rent'
                                : 'Currently Unavailable'}
                        </Button>
                    </div>
                </div>

                {/* Map — full width below two-column grid */}
                {item.location?.lat && item.location?.lng && (
                    <div className="mt-10">
                        <h2 className="text-lg font-black text-brand-dark dark:text-brand-frost mb-3 flex items-center gap-2">
                            <MapPin size={18} className="text-brand-teal dark:text-brand-green" /> Item Location
                        </h2>
                        <Suspense fallback={<div className="h-72 rounded-2xl bg-[#99d19c]/10 animate-pulse" />}>
                            <MapView lat={item.location.lat} lng={item.location.lng} title={item.title} height="320px" />
                        </Suspense>
                        {item.location.address && (
                            <p className="text-xs text-[#73ab84] dark:text-[#79c7c5] mt-2 flex items-center gap-1">
                                <MapPin size={11} /> {item.location.address}
                            </p>
                        )}
                    </div>
                )}

            </Container>

            {/* Request Modal */}
            <Modal isOpen={modalOpen} onClose={() => { if (!confirming) setModalOpen(false); }} title="Confirm Rental Request">
                {confirmed ? (
                    <div className="flex flex-col items-center py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#99d19c]/25 flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} className="text-[#73ab84] dark:text-[#99d19c]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#000501] dark:text-[#ade1e5] mb-2">Request Sent!</h3>
                        <p className="text-sm text-[#73ab84] dark:text-[#79c7c5]">Redirecting you to your dashboard…</p>
                    </div>
                ) : (
                    <>
                        {/* Item summary */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#99d19c]/12 dark:bg-[#73ab84]/8 mb-5">
                            {imgSrc
                                ? <img src={imgSrc} alt={item.title} className="w-14 h-14 rounded-xl object-cover" />
                                : <div className="w-14 h-14 rounded-xl bg-[#99d19c]/20 flex items-center justify-center"><Package size={24} className="text-[#73ab84] opacity-50" /></div>
                            }
                            <div>
                                <div className="font-bold text-[#000501] dark:text-[#ade1e5] text-sm">{item.title}</div>
                                <div className="text-xs text-[#73ab84] dark:text-[#79c7c5]">by {ownerName}</div>
                            </div>
                        </div>

                        {/* Date pickers */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#73ab84] dark:text-[#79c7c5] uppercase tracking-wide">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    min={today}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/70 dark:bg-[#000501]/60 border border-[#99d19c]/50 dark:border-[#79c7c5]/25 text-[#000501] dark:text-[#ade1e5] outline-none focus:ring-2 focus:ring-[#79c7c5]/50"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#73ab84] dark:text-[#79c7c5] uppercase tracking-wide">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/70 dark:bg-[#000501]/60 border border-[#99d19c]/50 dark:border-[#79c7c5]/25 text-[#000501] dark:text-[#ade1e5] outline-none focus:ring-2 focus:ring-[#79c7c5]/50"
                                />
                            </div>
                        </div>

                        {/* Price summary */}
                        <div className="glass-card rounded-xl p-4 mb-6">
                            <div className="flex justify-between text-sm font-medium text-[#73ab84] dark:text-[#79c7c5] mb-2">
                                <span>₹{item.pricePerDay.toLocaleString('en-IN')} × {days} day{days > 1 ? 's' : ''}</span>
                                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-px bg-[#99d19c]/25 dark:bg-[#79c7c5]/10 mb-2" />
                            <div className="flex justify-between font-black text-[#000501] dark:text-[#ade1e5]">
                                <span>Total</span>
                                <span className="text-xl">₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        {rentalError && (
                            <p className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl mb-4">{rentalError}</p>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" size="md" className="flex-1" onClick={() => setModalOpen(false)} disabled={confirming}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="md" className="flex-1" onClick={handleConfirm} loading={confirming}>
                                {confirming ? 'Sending…' : 'Confirm Request'}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
