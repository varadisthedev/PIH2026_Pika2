import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    CheckCircle2, Calendar, IndianRupee, Package, MapPin,
    ArrowLeft, ShoppingBag, ArrowRight, Loader2, Clock, XCircle, RotateCcw,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';
import Container from '../components/layout/Container.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/items/ItemStates.jsx';
import getImageUrl from '../utils/imageUrl.js';

const STATUS_META = {
    approved: { icon: CheckCircle2, color: 'success', label: 'Confirmed' },
    pending: { icon: Clock, color: 'pending', label: 'Pending' },
    completed: { icon: RotateCcw, color: 'info', label: 'Completed' },
    rejected: { icon: XCircle, color: 'error', label: 'Rejected' },
    cancelled: { icon: XCircle, color: 'error', label: 'Cancelled' },
};

function BookingCard({ booking }) {
    const product = booking.product || {};
    const meta = STATUS_META[booking.status] || STATUS_META.pending;
    const StatusIcon = meta.icon;

    const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="glass-card rounded-3xl overflow-hidden card-hover">
            {/* Image / Banner */}
            <div className="relative h-44 bg-brand-teal/10 dark:bg-brand-teal/5 flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                    <img
                        src={getImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={52} className="text-brand-teal/20" />
                )}
                {/* Overlay badge */}
                <div className="absolute top-4 right-4">
                    <Badge variant={meta.color} className="capitalize flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase shadow-lg">
                        <StatusIcon size={14} />
                        {meta.label}
                    </Badge>
                </div>
                {booking.status === 'approved' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent pointer-events-none" />
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <div>
                    <h3 className="text-base font-black text-brand-dark dark:text-white tracking-tighter leading-tight mb-1">
                        {product.title || 'Unknown Item'}
                    </h3>
                    {product.location && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-teal/60 dark:text-brand-frost/50 uppercase tracking-wide">
                            <MapPin size={11} />
                            {typeof product.location === 'string' ? product.location : product.location?.address || 'Local Area'}
                        </div>
                    )}
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-brand-teal/5 dark:bg-brand-teal/10">
                    <Calendar size={14} className="text-brand-green shrink-0" />
                    <span className="text-xs font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight">
                        {startDate}
                    </span>
                    <span className="text-brand-teal/40 dark:text-brand-frost/30">→</span>
                    <span className="text-xs font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight">
                        {endDate}
                    </span>
                </div>

                {/* Amount + Payment Status */}
                <div className="flex items-center justify-between pt-2 border-t border-brand-teal/10">
                    <div className="flex items-center gap-1 text-brand-dark dark:text-white">
                        <IndianRupee size={16} className="text-brand-green" />
                        <span className="text-lg font-black tracking-tight">
                            {booking.totalPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] font-black text-brand-teal/50 dark:text-brand-frost/40 uppercase ml-1 tracking-widest">Total</span>
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${booking.paymentStatus === 'paid'
                        ? 'bg-brand-green/10 text-brand-green dark:text-brand-aqua border border-brand-green/20'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30'
                        }`}>
                        {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Payment Pending'}
                    </div>
                </div>

                <Link to={`/item/${product._id || product.id}`}>
                    <button className="w-full py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-brand-teal/20 dark:border-brand-frost/20 text-brand-dark dark:text-brand-frost hover:bg-brand-teal/5 dark:hover:bg-brand-frost/5 transition mt-1 flex items-center justify-center gap-2">
                        View Item <ArrowRight size={13} />
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default function MyBookings() {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            navigate('/login');
            return;
        }
        const fetchBookings = async () => {
            try {
                const token = await getToken();
                const res = await api.get('/rentals/me', withToken(token));
                setBookings(res.data.rentals || []);
            } catch (err) {
                console.error('❌ [MyBookings] Failed to load:', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [isLoaded, isSignedIn]);

    const filtered = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const FILTERS = [
        { id: 'all', label: 'All' },
        { id: 'approved', label: 'Confirmed' },
        { id: 'pending', label: 'Pending' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-brand-teal dark:text-brand-green" />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-fade-in pt-6 min-h-screen">
            <Container>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                    <div className="animate-fade-up">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal dark:text-brand-aqua mb-2 opacity-80">
                            Your Rental History
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white flex items-center gap-4 tracking-tighter">
                            <div className="w-12 h-12 rounded-2xl bg-brand-green/20 dark:bg-brand-green/10 flex items-center justify-center shrink-0">
                                <ShoppingBag size={26} className="text-brand-green" />
                            </div>
                            My Bookings
                        </h1>
                        <p className="text-sm font-bold text-brand-dark/60 dark:text-brand-frost/60 mt-2">
                            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand-teal dark:text-brand-aqua hover:text-brand-dark dark:hover:text-white transition-colors self-start mt-2"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                </div>

                {/* Filter Tabs */}
                {bookings.length > 0 && (
                    <div className="flex gap-1 glass rounded-2xl p-1 w-fit mb-8 overflow-x-auto">
                        {FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f.id
                                        ? 'bg-brand-dark text-white dark:bg-brand-green dark:text-brand-dark shadow-sm'
                                        : 'text-brand-dark/60 dark:text-brand-frost/60 hover:bg-brand-teal/5 dark:hover:bg-brand-frost/10'
                                    }`}
                            >
                                {f.label}
                                {f.id !== 'all' && (
                                    <span className="ml-1.5 opacity-60">
                                        ({bookings.filter(b => b.status === f.id).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Confirmed Banner (if any approved bookings in view) */}
                {filtered.some(b => b.status === 'approved' && b.paymentStatus === 'paid') && (
                    <div className="mb-8 p-5 rounded-3xl bg-brand-green/10 dark:bg-brand-green/5 border border-brand-green/20 flex items-center gap-4 animate-fade-up">
                        <div className="w-10 h-10 rounded-2xl bg-brand-green/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={22} className="text-brand-green" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-brand-dark dark:text-white tracking-tight">
                                You have confirmed bookings!
                            </p>
                            <p className="text-[11px] font-bold text-brand-dark/60 dark:text-brand-frost/60 uppercase tracking-wide mt-0.5">
                                Items below are paid and confirmed by the owner.
                            </p>
                        </div>
                    </div>
                )}

                {/* Grid / Empty */}
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title="No bookings yet"
                        description={filter === 'all'
                            ? "You haven't rented anything yet. Start browsing!"
                            : `No ${filter} bookings found.`}
                        action={
                            <Button variant="primary" onClick={() => navigate('/browse')}>
                                Browse Items <ArrowRight size={15} />
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
                        {filtered.map(b => (
                            <BookingCard key={b._id} booking={b} />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
