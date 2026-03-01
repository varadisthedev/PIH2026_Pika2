import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, Clock, CheckCircle2, RotateCcw, IndianRupee, Plus,
    Calendar, ArrowRight, Loader2, Store, Trash2, Pencil, User, XCircle, Mail, X, Save,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';
import Container from '../components/layout/Container.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/items/ItemStates.jsx';
import ListItemModal from '../components/ListItemModal.jsx';
import { useRental } from '../context/RentalContext.jsx';

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
function RequestCard({ req, onCancel }) {
    const product = req.product || {};
    return (
        <div className="glass-card rounded-2xl p-4 flex gap-4 items-start card-hover">
            <div className="w-16 h-16 rounded-xl bg-[#4f7CAC]/20 dark:bg-[#9EEFE5]/10 flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
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
                </div>
                {(req.status === 'pending' || req.status === 'approved') && (
                    <div className="mt-3 flex justify-end">
                        <button onClick={() => onCancel(req._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-300 dark:border-red-400/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Cancel Request
                        </button>
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
                        ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
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
    const [updateSaving, setUpdateSaving] = useState(false);

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
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        try {
            const token = await getToken();
            await api.patch(`/rentals/${rentalId}/cancel`, {}, withToken(token));
            console.log(`✅ [Dashboard] Rental ${rentalId} cancelled`);
            setMyRentals(prev => prev.map(r => r._id === rentalId ? { ...r, status: 'cancelled' } : r));
        } catch (err) {
            console.error('❌ [Dashboard] Cancel failed:', err.message);
            alert(err.response?.data?.error || 'Failed to cancel request');
        }
    };

    const handleDeleteListing = async (productId) => {
        if (!window.confirm('Delete this listing? This cannot be undone.')) return;
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
        });
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
        { id: 'requests', label: 'My Rentals', icon: Clock, count: myRentals.length },
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
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">My Rentals</div>
                            </div>
                            <div className="glass-card rounded-2xl p-5">
                                <CheckCircle2 size={20} className="text-[#3C474B] dark:text-[#9EEFE5] mb-3" />
                                <div className="text-3xl font-black text-[#162521] dark:text-[#C0E0D2]">{myRentals.filter(r => r.status === 'approved').length}</div>
                                <div className="text-xs font-semibold text-[#3C474B] dark:text-[#9EEFE5] mt-0.5">Approved</div>
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

                {/* ── My Rentals tab ── */}
                {activeTab === 'requests' && (
                    <div>
                        {myRentals.length === 0 ? (
                            <EmptyState icon={Clock} title="No rentals yet"
                                description="You haven't rented anything yet. Start browsing!"
                                action={<Button variant="primary" onClick={() => window.location.href = '/browse'}>Browse Items <ArrowRight size={15} /></Button>} />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myRentals.map(req => <RequestCard key={req._id} req={req} onCancel={handleCancelRequest} />)}
                            </div>
                        )}
                    </div>
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
                                                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
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
                                        {/* Edit / Delete buttons */}
                                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditOpen(item)}
                                                className="p-1.5 rounded-lg bg-white/80 dark:bg-[#162521]/80 text-[#3C474B] hover:text-brand-teal dark:text-[#9EEFE5] dark:hover:text-brand-green shadow-sm backdrop-blur-sm"
                                                title="Edit listing">
                                                <Pencil size={13} />
                                            </button>
                                            <button onClick={() => handleDeleteListing(item._id)} disabled={deletingId === item._id}
                                                className="p-1.5 rounded-lg bg-white/80 dark:bg-[#162521]/80 text-red-400 hover:text-red-600 shadow-sm backdrop-blur-sm disabled:opacity-50"
                                                title="Delete listing">
                                                {deletingId === item._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                            </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#003459] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-6 animate-fade-up">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase">Edit Listing</h2>
                            <button onClick={() => setEditItem(null)} className="p-2 rounded-xl hover:bg-brand-teal/10 text-brand-teal"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 mb-1">Title</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 mb-1">Description</label>
                                <textarea rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 mb-1">Price / Day (₹)</label>
                                    <input type="number" value={editForm.pricePerDay} onChange={e => setEditForm(f => ({ ...f, pricePerDay: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-teal/60 mb-1">Availability</label>
                                    <select value={editForm.availability ? 'true' : 'false'} onChange={e => setEditForm(f => ({ ...f, availability: e.target.value === 'true' }))}
                                        className="w-full px-4 py-3 rounded-2xl bg-brand-teal/5 dark:bg-white/5 border border-brand-teal/10 text-sm font-bold text-brand-dark dark:text-brand-frost outline-none focus:ring-2 focus:ring-brand-green/30">
                                        <option value="true">Available</option>
                                        <option value="false">Unavailable</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 !rounded-2xl" onClick={() => setEditItem(null)} disabled={updateSaving}>Cancel</Button>
                            <Button variant="primary" className="flex-1 !rounded-2xl" onClick={handleEditSave} disabled={updateSaving}>
                                {updateSaving ? <><Loader2 size={15} className="animate-spin mr-2" /> Saving...</> : <><Save size={15} className="mr-1" /> Save Changes</>}
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
