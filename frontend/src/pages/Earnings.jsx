import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import {
    IndianRupee, TrendingUp, Calendar, ArrowRight, ArrowLeft,
    Download, Info, ShieldCheck, CheckCircle2, LayoutDashboard,
    PieChart, DollarSign
} from 'lucide-react';
import { useRental } from '../context/RentalContext.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';
import { EmptyState } from '../components/items/ItemStates.jsx';

export default function Earnings() {
    const navigate = useNavigate();
    const { userRole } = useRental();
    const { getToken } = useAuth();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'lender') {
            setLoading(false);
            return;
        }

        const fetchEarnings = async () => {
            try {
                const token = await getToken();
                const res = await api.get('/rentals/seller', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const sellerR = res.data.rentals || [];
                // Only consider approved or completed rentals for earnings
                const confirmed = sellerR.filter(r => r.status === 'approved' || r.status === 'completed');
                setPayouts(confirmed);
            } catch (err) {
                console.error("Failed to fetch earnings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, [userRole, getToken]);

    // Summing up accepted/completed total rent
    const processedEarnings = payouts.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    if (userRole === 'renter') {
        return (
            <div className="pt-28 pb-32 animate-fade-in min-h-screen">
                <Container>
                    <EmptyState
                        icon={DollarSign}
                        title="Earnings is for Lenders"
                        description="Switch to 'Lending' mode in the navigation bar to start earning money by sharing your gear with neighbors."
                        action={
                            <Button variant="primary" onClick={() => navigate('/list-item')}>
                                List your first Item
                            </Button>
                        }
                    />
                </Container>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-32 animate-fade-in min-h-screen bg-white/40 dark:bg-transparent">
            <Container>
                {/* Header */}
                <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-up">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal hover:text-brand-dark dark:text-brand-aqua dark:hover:text-brand-frost transition-all group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            To Dashboard
                        </button>
                        <h1 className="text-4xl sm:text-6xl font-black text-brand-dark dark:text-brand-frost tracking-tighter leading-none">
                            Finances
                        </h1>
                    </div>

                    <Button variant="outline" size="md" className="!rounded-[2rem] shadow-xl">
                        <Download size={18} /> Export Statement
                    </Button>
                </div>

                {/* Growth Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 animate-fade-up" style={{ animationDelay: '100ms' }}>
                    <Card variant="glass" className="!p-8 bg-brand-green/30 border-brand-green/20">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-2xl bg-brand-dark text-white">
                                <IndianRupee size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-brand-dark uppercase tracking-widest bg-white/40 px-3 py-1.5 rounded-full">
                                <TrendingUp size={12} /> +12% this week
                            </div>
                        </div>
                        <div className="text-[11px] font-black text-brand-dark/60 uppercase tracking-widest mb-1">Available for Payout</div>
                        <div className="text-5xl font-black text-brand-dark tracking-tighter">₹{processedEarnings.toLocaleString('en-IN')}</div>
                        <Button variant="primary" className="w-full mt-8 !bg-brand-dark !text-white !rounded-2xl">Transfer to Account</Button>
                    </Card>

                    <Card variant="glass" className="!p-8 bg-brand-teal/5 border-brand-teal/10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-2xl bg-brand-teal text-white">
                                <PieChart size={24} />
                            </div>
                        </div>
                        <div className="text-[11px] font-black text-brand-teal/60 uppercase tracking-widest mb-1">Projected Monthly</div>
                        <div className="text-4xl font-black text-brand-dark dark:text-brand-frost tracking-tighter">₹8,400</div>
                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-brand-teal/40 uppercase">
                                <span>Goal Progress</span>
                                <span>65%</span>
                            </div>
                            <div className="h-2 bg-brand-teal/10 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-teal w-[65%] rounded-full shadow-lg shadow-brand-teal/20" />
                            </div>
                        </div>
                    </Card>

                    <Card variant="glass" className="!p-8 bg-brand-teal/5 border-brand-teal/10 h-full flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-4">
                            <ShieldCheck size={32} className="text-brand-green" />
                            <div className="text-xs font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight leading-tight">
                                Secured by <br /> <span className="text-brand-green">RentiGO Escrow</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-brand-teal/60 uppercase tracking-widest leading-relaxed italic">
                            All payments are verified and held in escrow until 24 hours after return for community safety.
                        </p>
                    </Card>
                </div>

                {/* Transaction History */}
                <section className="space-y-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-1 rounded-full bg-brand-green shadow-xl shadow-brand-green/40" />
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/60">Payout History</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="p-8 text-center text-sm font-bold text-brand-teal/60">Loading earnings...</div>
                        ) : payouts.length === 0 ? (
                            <div className="p-8 text-center text-sm font-bold text-brand-teal/60">No earnings history yet.</div>
                        ) : (
                            payouts.map(req => {
                                const prod = req.product || {};
                                const r = req.renter || {};
                                return (
                                    <Card key={req._id} variant="default" className="!p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:scale-[1.01] transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-teal/5 flex items-center justify-center text-brand-dark dark:text-brand-frost group-hover:bg-brand-green group-hover:text-brand-dark transition-all">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight leading-none mb-1">{prod.title || 'Unknown Item'}</h4>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-brand-teal/40 uppercase tracking-widest mt-2">
                                                    <Calendar size={12} /> {new Date(req.endDate).toLocaleDateString()} · Renter: {r.name || 'User'}
                                                </div>
                                                {prod.securityDeposit > 0 && (
                                                    <div className="text-[10px] font-bold text-brand-teal/60 mt-1 uppercase tracking-widest">
                                                        Includes ₹{prod.securityDeposit.toLocaleString('en-IN')} Refundable Deposit
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12 justify-between md:justify-end">
                                            <div className="flex gap-8 text-right">
                                                {prod.securityDeposit > 0 && (
                                                    <div>
                                                        <div className="text-[9px] font-black text-brand-teal/40 uppercase tracking-widest mb-0.5">Deposit Held</div>
                                                        <div className="text-sm font-black text-[#3C474B]">₹{prod.securityDeposit.toLocaleString('en-IN')}</div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-[9px] font-black text-brand-teal/40 uppercase tracking-widest mb-0.5">Rent Earned</div>
                                                    <div className="text-xl font-black text-brand-dark dark:text-brand-frost">₹{req.totalPrice?.toLocaleString('en-IN') || 0}</div>
                                                </div>
                                            </div>
                                            <Badge variant="approved" className="px-3 py-1 font-black uppercase tracking-widest !text-[9px]">{req.status}</Badge>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </section>
            </Container>
        </div>
    );
}
