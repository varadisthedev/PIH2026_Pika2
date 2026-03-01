import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, Clock, CheckCircle2, RotateCcw, IndianRupee, Plus,
    Calendar, ArrowRight, Loader2, Store, Trash2, Pencil, User, XCircle, Mail, X, Save, ImagePlus, Image, CreditCard, Lock,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';
import Container from '../components/layout/Container.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/items/ItemStates.jsx';
import ListItemModal from '../components/ListItemModal.jsx';
import { useRental } from '../context/RentalContext.jsx';
import getImageUrl from '../utils/imageUrl.js';

const STATUS_ICON = {
    pending:   <Clock size={14} />,
    approved:  <CheckCircle2 size={14} />,
    completed: <RotateCcw size={14} />,
    rejected:  <XCircle size={14} />,
    cancelled: <XCircle size={14} />,
};
const STATUS_COLOR = {
    pending: 'pending', approved: 'success', completed: 'info', rejected: 'error', cancelled: 'error',
};

/* ── Renter's incoming rental card ── */
function RequestCard({ req, onCancel, onPay, confirmId, setConfirmId, payingId }) {
    const product = req.product || {};
    const needsPayment = req.status === 'pending' && req.paymentStatus !== 'paid';
    const isPaying = payingId === req._id;
    return (
        <div className="glass-card rounded-2xl p-4 flex gap-4 items-start card-hover">
            <div className="w-16 h-16 rounded-xl bg-[#4f7CAC]/20 dark:bg-[#9EEFE5]/10 flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.[0]
                    ? <img src={getImageUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover" />
                    : <Package size={24} className="text-[#3C474B] opacity-40" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-[#162521] dark:text-[#C0E0D2] text-sm line-clamp-1">{product.title || 'Unknown'}</h3>
                    <Badge variant={STATUS_COLOR[req.status] || 'pending'} className="shrink-0 capitalize flex items-center gap-1">
                        {STATUS_ICON[req.status]}{req.status}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#3C474B] dark:text-[#9EEFE5]">
                    <span className="flex items-center gap-1">
                        <Calendar size={11} /> {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#162521] dark:text-[#C0E0D2]">
                        <IndianRupee size={11} /> {req.totalPrice?.toLocaleString('en-IN')}
                    </span>
                    {req.paymentStatus === 'paid' && (
                        <span className="flex items-center gap-1 text-brand-green font-black text-[10px] uppercase tracking-wider">
                            <CheckCircle2 size={10} /> Paid
                        </span>
                    )}
                </div>

                {/* Pay Now — prominent CTA for unpaid pending bookings */}
                {needsPayment && (
                    <button
                        onClick={() => onPay(req._id)}
                        disabled={isPaying}
                        className="mt-3 w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-brand-green text-brand-dark hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-green/20"
                    >
                        {isPaying
                            ? <><Loader2 size={13} className="animate-spin" /> Opening Payment…</>
                            : <><Lock size={13} /> Pay Now — ₹{req.totalPrice?.toLocaleString('en-IN')}</>}
                    </button>
                )}

                {(req.status === 'pending' || req.status === 'approved') && (
                    <div className="mt-2 flex justify-end gap-2">
                        {confirmId === `cancel-${req._id}` ? (
                            <>
                                <span className="text-[10px] font-bold text-red-500 self-center">Cancel this request?</span>
                                <button onClick={() => onCancel(req._id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">
                                    Yes
                                </button>
                                <button onClick={() => setConfirmId(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-teal/20 text-brand-teal dark:text-brand-aqua hover:bg-brand-teal/5 transition-colors">
                                    No
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setConfirmId(`cancel-${req._id}`)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-300 dark:border-red-400/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                Cancel Request
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Seller's incoming request card (shows renter info + approve/reject) ── */
function SellerRequestCard({ req, onStatusUpdate }) {
    const [updating, setUpdating] = useState(false);
    const product = req.product || {};
    const renter = req.renter || {};

    const update = async (status) => {
        setUpdating(true);
        try {
            await onStatusUpdate(req._id, status);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl p-4 space-y-3">
            {/* Product + status */}
            <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#4f7CAC]/20 shrink-0">
                    {product.images?.[0]
                        ? <img src={getImageUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover" />
                        : <Package size={20} className="text-[#3C474B] opacity-40 m-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-brand-dark dark:text-brand-frost text-sm line-clamp-1">{product.title}</p>
                        <Badge variant={STATUS_COLOR[req.status] || 'pending'} className="shrink-0 capitalize text-xs flex items-center gap-1">
                            {STATUS_ICON[req.status]}{req.status}
                        </Badge>
                    </div>
                    <p className="text-xs text-[#3C474B] mt-0.5">
                        ₹{req.totalPrice?.toLocaleString('en-IN')} · {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Renter info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#4f7CAC]/10 dark:bg-[#9EEFE5]/5">
                <User size={14} className="text-brand-teal dark:text-brand-green shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-dark dark:text-brand-frost">{renter.name || 'Unknown User'}</p>
                    {renter.email && (
                        <p className="text-[10px] text-[#3C474B] dark:text-[#9EEFE5] flex items-center gap-1 truncate">
                            <Mail size={9} /> {renter.email}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions (only if pending) */}
            {req.status === 'pending' && (
                <div className="flex gap-2">
                    <button onClick={() => update('rejected')} disabled={updating}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-300 dark:border-red-400/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                        Reject
                    </button>
                    <button onClick={() => update('approved')} disabled={updating}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark hover:scale-[1.02] transition-transform disabled:opacity-50">
                        {updating ? '…' : 'Approve'}
                    </button>
                </div>
            )}
            {req.status === 'approved' && (
                <button onClick={() => update('completed')} disabled={updating}
                    className="w-full py-2 rounded-xl text-xs font-bold border border-[#4f7CAC]/50 text-brand-teal dark:text-brand-green hover:bg-brand-teal/10 transition-colors disabled:opacity-50">
                    {updating ? '…' : 'Mark as Completed'}
                </button>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Borrowing History — replaces the old "My Rentals" simple grid
   ───────────────────────────────────────────────────────────────────────── */
const BORROW_FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'unpaid',    label: 'Unpaid' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

function BorrowingHistory({ rentals, onCancel, onPay, confirmId, setConfirmId, payingId, onBrowse }) {
    const [filter, setFilter] = useState('all');

    const filtered = rentals.filter(r => {
        if (filter === 'all')       return true;
        if (filter === 'unpaid')    return r.status === 'pending' && r.paymentStatus !== 'paid';
        if (filter === 'active')    return r.status === 'approved';
        if (filter === 'completed') return r.status === 'completed';
        if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'rejected';
        return true;
    });

    const counts = {
        all:       rentals.length,
        unpaid:    rentals.filter(r => r.status === 'pending' && r.paymentStatus !== 'paid').length,
        active:    rentals.filter(r => r.status === 'approved').length,
        completed: rentals.filter(r => r.status === 'completed').length,
        cancelled: rentals.filter(r => r.status === 'cancelled' || r.status === 'rejected').length,
    };

    const STATUS_META = {
        pending:   { label: 'Pending',   color: 'text-amber-500',       bg: 'bg-amber-500/10',   dot: 'bg-amber-400' },
        approved:  { label: 'Active',    color: 'text-brand-green',     bg: 'bg-brand-green/10', dot: 'bg-brand-green' },
        completed: { label: 'Completed', color: 'text-brand-teal',      bg: 'bg-brand-teal/10',  dot: 'bg-brand-teal' },
        rejected:  { label: 'Rejected',  color: 'text-red-500',         bg: 'bg-red-500/10',     dot: 'bg-red-500' },
        cancelled: { label: 'Cancelled', color: 'text-[#3C474B]/60',    bg: 'bg-[#3C474B]/5',    dot: 'bg-[#3C474B]/40' },
    };

    if (rentals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-28 text-center space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-brand-teal/5 dark:bg-brand-aqua/10 flex items-center justify-center">
                    <Clock size={40} className="text-brand-teal/30 dark:text-brand-aqua/40" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost tracking-tighter mb-2">No borrowing history yet</h3>
                    <p className="text-sm font-bold text-[#3C474B] dark:text-[#9EEFE5] max-w-xs">
                        You haven't rented anything yet. Browse local gear and make your first booking.
                    </p>
                </div>
                <button
                    onClick={onBrowse}
                    className="px-8 py-3 rounded-2xl bg-brand-green text-brand-dark font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-brand-green/20 flex items-center gap-2"
                >
                    <ArrowRight size={15} /> Explore Gear
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {BORROW_FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                            filter === f.key
                                ? 'bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark shadow-md'
                                : 'glass-card text-[#3C474B] dark:text-[#9EEFE5] hover:scale-[1.02]'
                        }`}
                    >
                        {f.label}
                        {counts[f.key] > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                filter === f.key
                                    ? 'bg-white/20 text-white dark:bg-brand-dark/30 dark:text-brand-dark'
                                    : 'bg-[#4f7CAC]/20 text-[#3d6b50] dark:bg-[#9EEFE5]/15 dark:text-[#9EEFE5]'
                            }`}>
                                {counts[f.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Empty per filter */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 text-center space-y-3">
                    <CheckCircle2 size={36} className="text-brand-teal/20" />
                    <p className="text-sm font-black text-[#3C474B] dark:text-[#9EEFE5] uppercase tracking-tight">
                        No {filter === 'unpaid' ? 'unpaid' : filter} bookings
                    </p>
                </div>
            )}

            {/* Cards */}
            <div className="space-y-4">
                {filtered.map((r, i) => {
                    const product  = r.product || {};
                    const meta     = STATUS_META[r.status] || STATUS_META.pending;
                    const needsPay = r.status === 'pending' && r.paymentStatus !== 'paid';
                    const isPaying = payingId === r._id;
                    const days     = Math.max(1, Math.ceil(
                        (new Date(r.endDate) - new Date(r.startDate)) / 86400000
                    ));

                    return (
                        <div
                            key={r._id}
                            className="glass-card rounded-[1.75rem] overflow-hidden animate-fade-up"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="flex gap-0">
                                {/* Left accent stripe */}
                                <div className={`w-1 shrink-0 ${meta.dot}`} />

                                <div className="flex-1 p-5">
                                    {/* Top row: image + info + status */}
                                    <div className="flex gap-4 items-start mb-4">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#4f7CAC]/10 dark:bg-[#9EEFE5]/5 shrink-0 flex items-center justify-center">
                                            {product.images?.[0]
                                                ? <img src={getImageUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover" />
                                                : <Package size={30} className="text-[#3C474B]/30 dark:text-[#9EEFE5]/20" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-black text-[#162521] dark:text-[#C0E0D2] text-sm leading-tight line-clamp-2">
                                                    {product.title || 'Unknown Item'}
                                                </h3>
                                                {/* Status pill */}
                                                <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.bg} ${meta.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${r.status === 'approved' ? 'animate-pulse' : ''}`} />
                                                    {meta.label}
                                                </span>
                                            </div>

                                            {/* Category */}
                                            <p className="text-[10px] font-black text-[#3C474B]/50 dark:text-[#9EEFE5]/40 uppercase tracking-widest mb-2">
                                                {product.category || '—'}
                                            </p>

                                            {/* Payment badge */}
                                            {r.paymentStatus === 'paid' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={10} /> Paid
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-[#4f7CAC]/5 dark:bg-[#9EEFE5]/5 rounded-xl p-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-[#3C474B]/50 dark:text-[#9EEFE5]/40 mb-1">From</div>
                                            <div className="text-xs font-black text-[#162521] dark:text-[#C0E0D2]">
                                                {new Date(r.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                        <div className="bg-[#4f7CAC]/5 dark:bg-[#9EEFE5]/5 rounded-xl p-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-[#3C474B]/50 dark:text-[#9EEFE5]/40 mb-1">To</div>
                                            <div className="text-xs font-black text-[#162521] dark:text-[#C0E0D2]">
                                                {new Date(r.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                        <div className="bg-[#4f7CAC]/5 dark:bg-[#9EEFE5]/5 rounded-xl p-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-[#3C474B]/50 dark:text-[#9EEFE5]/40 mb-1">Duration</div>
                                            <div className="text-xs font-black text-[#162521] dark:text-[#C0E0D2]">{days}d</div>
                                        </div>
                                    </div>

                                    {/* Price row */}
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3C474B]/50 dark:text-[#9EEFE5]/40">
                                            Total Paid
                                        </span>
                                        <span className="text-lg font-black text-[#162521] dark:text-[#C0E0D2]">
                                            ₹{r.totalPrice?.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {/* Pay Now CTA — only for unpaid pending bookings */}
                                    {needsPay && (
                                        <button
                                            onClick={() => onPay(r._id)}
                                            disabled={isPaying}
                                            className="w-full py-3 rounded-2xl mb-3 font-black text-xs uppercase tracking-widest bg-brand-green text-brand-dark hover:bg-brand-green/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-green/25 disabled:opacity-60"
                                        >
                                            {isPaying
                                                ? <><Loader2 size={14} className="animate-spin" /> Opening Payment…</>
                                                : <><Lock size={14} /> Pay Now — ₹{r.totalPrice?.toLocaleString('en-IN')}</>}
                                        </button>
                                    )}

                                    {/* Cancel / confirm row */}
                                    {(r.status === 'pending' || r.status === 'approved') && (
                                        <div className="flex items-center justify-end gap-2">
                                            {confirmId === `cancel-${r._id}` ? (
                                                <>
                                                    <span className="text-[10px] font-bold text-red-500">Cancel this?</span>
                                                    <button onClick={() => onCancel(r._id)}
                                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition">
                                                        Yes
                                                    </button>
                                                    <button onClick={() => setConfirmId(null)}
                                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#4f7CAC]/30 text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#4f7CAC]/5 transition">
                                                        No
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setConfirmId(`cancel-${r._id}`)}
                                                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-300/50 dark:border-red-400/20 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                                                    Cancel Request
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { getToken, isSignedIn, isLoaded } = useAuth();

    const [myRentals, setMyRentals] = useState([]);         // rentals I made as buyer
    const [myListings, setMyListings] = useState([]);        // products I listed
    const [sellerRentals, setSellerRentals] = useState([]); // requests on my listings
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const [showListModal, setShowListModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [imageUploading, setImageUploading] = useState(false);
    const [updateSaving, setUpdateSaving] = useState(false);
    const [confirmId, setConfirmId] = useState(null);
    const [payingId, setPayingId] = useState(null);

    const loadData = useCallback(async () => {
        if (!isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            console.log('📊 [Dashboard] Loading all data...');

            const [rentalsRes, sellerRes, productsRes] = await Promise.all([
                api.get('/rentals/me', withToken(token)),
                api.get('/rentals/seller', withToken(token)),
                api.get('/products/mine', withToken(token)),
            ]);

            const myR = rentalsRes.data.rentals || [];
            const sellerR = sellerRes.data.rentals || [];
            const myP = productsRes.data.products || [];

            console.log(`✅ [Dashboard] ${myR.length} my rentals | ${sellerR.length} seller requests | ${myP.length} my products`);

            setMyRentals(myR);
            setSellerRentals(sellerR);
            setMyListings(myP);
        } catch (err) {
            console.error('❌ [Dashboard] Load failed:', err.message);
        } finally {
            setLoading(false);
        }
    }, [getToken, isSignedIn]);

    const location = useLocation();

    useEffect(() => {
        if (location.state?.editItem) {
            handleEditOpen(location.state.editItem);
            setActiveTab('listings');
            // Clear location state so modal doesn't re-open on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => { if (isLoaded) loadData(); }, [isLoaded, loadData]);

    const handleStatusUpdate = async (rentalId, status) => {
        try {
            const token = await getToken();
            await api.patch(`/rentals/${rentalId}/status`, { status }, withToken(token));
            console.log(`✅ [Dashboard] Rental ${rentalId} → ${status}`);
            setSellerRentals(prev => prev.map(r => r._id === rentalId ? { ...r, status } : r));
        } catch (err) {
            console.error('❌ [Dashboard] Status update failed:', err.message);
        }
    };

    const handleCancelRequest = async (rentalId) => {
        if (confirmId !== `cancel-${rentalId}`) {
            setConfirmId(`cancel-${rentalId}`);
            return;
        }
        setConfirmId(null);
        try {
            const token = await getToken();
            await api.patch(`/rentals/${rentalId}/cancel`, {}, withToken(token));
            console.log(`✅ [Dashboard] Rental ${rentalId} cancelled`);
            setMyRentals(prev => prev.map(r => r._id === rentalId ? { ...r, status: 'cancelled' } : r));
            showToast('Request cancelled', 'success');
        } catch (err) {
            console.error('❌ [Dashboard] Cancel failed:', err.message);
            showToast(err.response?.data?.error || 'Failed to cancel request', 'error');
        }
    };

    const handlePayNow = async (rentalId) => {
        setPayingId(rentalId);
        try {
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.body.appendChild(s);
                });
            }
            const token = await getToken();
            const rental = myRentals.find(r => r._id === rentalId);
            const orderRes = await api.post('/payments/create-order', { rentalId }, withToken(token));
            const { orderId, amount, keyId } = orderRes.data;
            const options = {
                key: keyId,
                amount: amount * 100,
                currency: 'INR',
                name: 'RentiGO',
                description: `Rental: ${rental?.product?.title || 'Item'}`,
                order_id: orderId,
                theme: { color: '#007EA7' },
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }, withToken(token));
                        setMyRentals(prev => prev.map(r =>
                            r._id === rentalId ? { ...r, status: 'approved', paymentStatus: 'paid' } : r
                        ));
                        showToast('Payment verified! Booking approved. 🎉', 'success');
                    } catch {
                        showToast('Payment verification failed. Contact support.', 'error');
                    } finally {
                        setPayingId(null);
                    }
                },
                modal: { ondismiss: () => setPayingId(null) },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                showToast('Payment failed. Please try again.', 'error');
                setPayingId(null);
            });
            rzp.open();
        } catch (err) {
            console.error('❌ [Dashboard] PayNow error:', err.message);
            showToast(err.response?.data?.error || 'Failed to open payment. Try again.', 'error');
            setPayingId(null);
        }
    };

    const handleDeleteListing = async (productId) => {
        if (confirmId !== `delete-${productId}`) {
            setConfirmId(`delete-${productId}`);
            return;
        }
        setConfirmId(null);
        const removed = myListings.find(p => p._id === productId);
        // Optimistic
        setMyListings(prev => prev.filter(p => p._id !== productId));
        setDeletingId(productId);
        try {
            const token = await getToken();
            await api.delete(`/products/${productId}`, withToken(token));
            showToast('Item deleted successfully', 'success');
        } catch (err) {
            console.error('❌ [Dashboard] Delete failed:', err.message);
            setMyListings(prev => [...prev, removed]);
            showToast('Failed to delete item', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditOpen = (item) => {
        setEditItem(item);
        setEditForm({
            title: item.title || '',
            description: item.description || '',
            pricePerDay: item.pricePerDay || '',
            category: item.category || '',
            availability: item.availability !== false,
            images: item.images || [],
        });
    };

    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;
        setImageUploading(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            Array.from(files).forEach(f => formData.append('images', f));
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.urls) {
                setEditForm(f => ({ ...f, images: [...(f.images || []), ...data.urls] }));
            }
        } catch (err) {
            showToast('Image upload failed', 'error');
        } finally {
            setImageUploading(false);
        }
    };

    const handleEditSave = async () => {
        if (!editItem) return;
        if (!editForm.title || !editForm.pricePerDay) {
            showToast('Title and price are required', 'error');
            return;
        }
        setUpdateSaving(true);
        try {
            const token = await getToken();
            const res = await api.put(`/products/${editItem._id}`, editForm, withToken(token));
            const updated = res.data.product;
            setMyListings(prev => prev.map(p => p._id === editItem._id ? { ...p, ...updated } : p));
            setEditItem(null);
            showToast('Item updated successfully', 'success');
        } catch (err) {
            console.error('❌ [Dashboard] Edit failed:', err.message);
            showToast('Failed to update item', 'error');
        } finally {
            setUpdateSaving(false);
        }
    };

    const { userRole } = useRental(); // 'renter' or 'lender'

    const RENTER_TABS = [
        { id: 'requests', label: 'Borrowing History', icon: Clock, count: myRentals.length },
    ];

    const LENDER_TABS = [
        { id: 'seller', label: 'Incoming Requests', icon: Store, count: sellerRentals.filter(r => r.status === 'pending').length },
        { id: 'listings', label: 'All Products', icon: Package, count: myListings.length },
    ];

    const TABS = userRole === 'renter' ? RENTER_TABS : LENDER_TABS;

    // Force active tab to match role if it's pointing to a tab that doesn't exist in current role
    useEffect(() => {
        if (userRole === 'renter' && activeTab !== 'requests') setActiveTab('requests');
        if (userRole === 'lender' && activeTab === 'requests') setActiveTab('seller');
    }, [userRole]);

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-brand-teal dark:text-brand-green" />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-fade-in pt-6">
            <Container>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <div className="animate-fade-up">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal dark:text-brand-aqua mb-2 opacity-80">
                            {userRole === 'renter' ? 'Your Borrowing Workspace' : 'Your Lending Workspace'}
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-brand-frost flex items-center gap-4 tracking-tighter">
                            <div className="w-12 h-12 rounded-2xl bg-brand-green/20 dark:bg-brand-green/10 flex items-center justify-center">
                                <LayoutDashboard size={28} className="text-brand-teal dark:text-brand-green" />
                            </div>
                            {userRole === 'renter' ? 'Renter Dashboard' : 'Lender Dashboard'}
                        </h1>
                    </div>
                    {userRole === 'lender' && (
                        <Button variant="primary" size="md" onClick={() => setShowListModal(true)}>
                            <Plus size={18} /> List an Item
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {userRole === 'renter' ? (
                        <>
                            <div className="glass-card rounded-2xl p-5">
                                <Clock size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myRentals.length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Total Borrowed</div>
                            </div>
                            <div className="glass-card rounded-2xl p-5">
                                <CheckCircle2 size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myRentals.filter(r => r.status === 'approved').length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Active</div>
                            </div>
                            <div className="glass-card rounded-2xl p-5">
                                <RotateCcw size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myRentals.filter(r => r.status === 'completed').length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Completed</div>
                            </div>
                            <div className="glass-card rounded-2xl p-5">
                                <IndianRupee size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myRentals.filter(r => r.status === 'pending' && r.paymentStatus !== 'paid').length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Unpaid</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="glass-card rounded-2xl p-5">
                                <Store size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{sellerRentals.filter(r => r.status === 'pending').length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Pending Asks</div>
                            </div>
                            <div className="glass-card rounded-2xl p-5">
                                <Package size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myListings.length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">All Products</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 glass rounded-2xl p-1 w-fit mb-8 overflow-x-auto">
                    {TABS.map(({ id, label, icon: Icon, count }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === id
                                ? 'bg-[#162521] text-[#C0E0D2] dark:bg-[#4f7CAC] dark:text-[#162521] shadow-sm'
                                : 'text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#3C474B]/10 dark:hover:bg-[#9EEFE5]/10'
                                }`}>
                            <Icon size={15} />
                            {label}
                            {count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === id
                                    ? 'bg-white/20'
                                    : 'bg-[#4f7CAC]/25 text-[#3d6b50] dark:bg-[#9EEFE5]/15 dark:text-[#9EEFE5]'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Borrowing History tab ── */}
                {activeTab === 'requests' && (
                    <BorrowingHistory
                        rentals={myRentals}
                        onCancel={handleCancelRequest}
                        onPay={handlePayNow}
                        confirmId={confirmId}
                        setConfirmId={setConfirmId}
                        payingId={payingId}
                        onBrowse={() => navigate('/browse')}
                    />
                )}

                {/* ── Seller Incoming Requests tab ── */}
                {activeTab === 'seller' && (
                    <div>
                        {sellerRentals.length === 0 ? (
                            <EmptyState icon={Store} title="No incoming requests"
                                description="When someone requests to rent one of your items, you'll see it here."
                                action={<Button variant="primary" onClick={() => setShowListModal(true)}><Plus size={15} /> List an Item</Button>} />
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#3C474B] dark:text-[#9EEFE5]">
                                    {sellerRentals.filter(r => r.status === 'pending').length} pending · {sellerRentals.length} total
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sellerRentals.map(req => (
                                        <SellerRequestCard key={req._id} req={req} onStatusUpdate={handleStatusUpdate} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── All Products tab ── */}
                {activeTab === 'listings' && (
                    <div>
                        {myListings.length === 0 ? (
                            <EmptyState icon={Package} title="No listings yet"
                                description="List items you own to earn money when your neighbours need them."
                                action={<Button variant="primary" onClick={() => setShowListModal(true)}><Plus size={15} /> List an Item</Button>} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {myListings.map(item => (
                                    <div key={item._id} className="glass-card rounded-2xl overflow-hidden card-hover relative group">
                                        <Link to={`/item/${item._id}`}>
                                            <div className="h-36 overflow-hidden bg-[#4f7CAC]/20 dark:bg-[#9EEFE5]/10 flex items-center justify-center">
                                                {item.images?.[0]
                                                    ? <img src={getImageUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover" />
                                                    : <Package size={40} className="text-[#3C474B] dark:text-[#9EEFE5] opacity-40" />}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-[#162521] dark:text-[#C0E0D2] text-sm line-clamp-1 mb-1">{item.title}</h3>
                                                {/* Owner info */}
                                                {item.owner && (
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="w-5 h-5 rounded-full bg-[#4f7CAC]/30 flex items-center justify-center">
                                                            <User size={11} className="text-[#3C474B]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-[#3d6b50] dark:text-[#9EEFE5] truncate">{item.owner.name || 'You'}</p>
                                                            {item.owner.email && (
                                                                <p className="text-[10px] text-[#3C474B]/70 dark:text-[#9EEFE5]/50 truncate flex items-center gap-0.5">
                                                                    <Mail size={9} /> {item.owner.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-[#3C474B] dark:text-[#9EEFE5]">₹{item.pricePerDay?.toLocaleString('en-IN')}/day</span>
                                                    <Badge variant={item.availability ? 'success' : 'pending'}>
                                                        {item.availability ? 'Active' : 'Unavailable'}
                                                    </Badge>
                                                </div>
                                                {item.aiInsights?.rentalValueScore && (
                                                    <p className="text-xs text-brand-teal dark:text-brand-aqua mt-1 font-semibold">
                                                        🤖 AI Score: {item.aiInsights.rentalValueScore}/10
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                        {/* Action buttons */}
                                        <div className="px-4 pb-4 flex gap-2 items-center">
                                            <button
                                                onClick={() => handleEditOpen(item)}
                                                className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-teal/20 text-brand-teal dark:text-brand-aqua hover:bg-brand-teal/5 transition flex items-center justify-center gap-1"
                                            >
                                                <Pencil size={11} /> Edit
                                            </button>
                                            {confirmId === `delete-${item._id}` ? (
                                                <div className="flex gap-1 flex-1">
                                                    <button
                                                        onClick={() => handleDeleteListing(item._id)}
                                                        className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition"
                                                    >
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmId(null)}
                                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-teal/20 text-brand-teal dark:text-brand-aqua hover:bg-brand-teal/5 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleDeleteListing(item._id)}
                                                    disabled={deletingId === item._id}
                                                    className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-300/50 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-1 disabled:opacity-40"
                                                >
                                                    {deletingId === item._id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </Container>

            {showListModal && (
                <ListItemModal
                    onClose={() => setShowListModal(false)}
                    onSuccess={() => { console.log('🆕 [Dashboard] New listing — refreshing'); loadData(); }}
                />
            )}

            {/* ── Edit Product Modal ── */}
            {editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#00171F] rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-up border border-brand-teal/10">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-brand-teal/10">
                            <div>
                                <h2 className="text-xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase">Edit Listing</h2>
                                <p className="text-[10px] text-brand-teal/50 dark:text-brand-aqua/60 font-bold uppercase tracking-widest mt-0.5">{editItem.title}</p>
                            </div>
                            <button onClick={() => setEditItem(null)} className="p-2.5 rounded-2xl hover:bg-brand-teal/10 text-brand-teal transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - scrollable */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                            {/* Images section */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 dark:text-brand-aqua/70">Photos</label>

                                {/* Existing images grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    {(editForm.images || []).map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-brand-teal/5 border border-brand-teal/10">
                                            <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setEditForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Upload new image button */}
                                    <label className={`aspect-square rounded-2xl border-2 border-dashed border-brand-teal/20 dark:border-brand-aqua/20 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-brand-green/50 hover:bg-brand-green/5 transition-all ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {imageUploading ? (
                                            <Loader2 size={22} className="animate-spin text-brand-teal/40" />
                                        ) : (
                                            <>
                                                <ImagePlus size={22} className="text-brand-teal/40" />
                                                <span className="text-[9px] font-black text-brand-teal/40 uppercase tracking-widest">Add</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={e => handleImageUpload(e.target.files)}
                                        />
                                    </label>
                                </div>
                                <p className="text-[9px] font-bold text-brand-teal/40 dark:text-brand-aqua/40 uppercase tracking-widest">Click × on a photo to remove it. Max 5 photos.</p>
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 dark:text-brand-aqua/70">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Canon DSLR 1500D"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 dark:border-white/10 text-sm font-bold text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 dark:text-brand-aqua/70">Description</label>
                                <textarea
                                    rows={4}
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Describe condition, accessories included, pickup info..."
                                    className="w-full px-5 py-3.5 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 dark:border-white/10 text-sm font-bold text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 outline-none focus:ring-2 focus:ring-brand-green/30 resize-none transition"
                                />
                            </div>

                            {/* Price + Availability row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 dark:text-brand-aqua/70">Price / Day (₹)</label>
                                    <input
                                        type="number"
                                        value={editForm.pricePerDay}
                                        onChange={e => setEditForm(f => ({ ...f, pricePerDay: e.target.value }))}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 dark:border-white/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 dark:text-brand-aqua/70">Availability</label>
                                    <select
                                        value={editForm.availability ? 'true' : 'false'}
                                        onChange={e => setEditForm(f => ({ ...f, availability: e.target.value === 'true' }))}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 dark:border-white/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                                    >
                                        <option value="true">✅ Available</option>
                                        <option value="false">⛔ Unavailable</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-brand-teal/10 flex gap-3">
                            <Button variant="outline" className="flex-1 !rounded-2xl" onClick={() => setEditItem(null)} disabled={updateSaving}>
                                Cancel
                            </Button>
                            <Button variant="primary" className="flex-1 !rounded-2xl shadow-xl shadow-brand-green/20" onClick={handleEditSave} disabled={updateSaving || imageUploading}>
                                {updateSaving ? <><Loader2 size={15} className="animate-spin mr-2" /> Saving...</> : <><Save size={15} className="mr-1.5" /> Save Changes</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl ${type === 'success' ? 'bg-brand-green text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-brand-dark text-brand-frost'}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
