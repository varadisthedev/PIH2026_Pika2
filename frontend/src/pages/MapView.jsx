import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, List, Filter, SlidersHorizontal, ArrowLeft, Star, IndianRupee, ShieldCheck } from 'lucide-react';
import { useRental } from '../context/RentalContext.jsx';
import api from '../api/axios.js';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';

export default function MapView() {
    const navigate = useNavigate();
    const { toggleWishlist, wishlist } = useRental();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        api.get('/products', { params: { limit: 100 } })
            .then(res => { setItems(res.data.products || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="h-screen w-full flex flex-col pt-16 bg-brand-frost dark:bg-brand-dark overflow-hidden animate-fade-in">
            {/* Map Interaction Toolbar */}
            <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-2xl px-4 py-2 rounded-[2.5rem] glass-card shadow-2xl transition-all duration-700 ${selectedItem ? 'translate-y-[-120px] opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-brand-dark dark:bg-brand-green text-brand-frost dark:text-brand-dark shadow-xl hover:scale-110 transition-transform">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 flex items-center gap-3 px-6 py-2 rounded-2xl bg-brand-teal/5 dark:bg-brand-teal/10">
                        <Search size={16} className="text-brand-teal/40" />
                        <input
                            type="text"
                            placeholder="Find gear nearby..."
                            className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 w-full"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="!rounded-2xl !hidden sm:flex" onClick={() => navigate('/browse')}>
                        <List size={16} /> List View
                    </Button>
                </div>
            </div>

            {/* Map Mock Background */}
            <div className="flex-1 relative bg-[#edf2f7] dark:bg-brand-dark/20 flex items-center justify-center p-4">
                {/* Simulated Map Grid */}
                <div className="absolute inset-0 opacity-20 dark:opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #73ab84 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />

                {/* Floating Map Pins */}
                {!loading && items.map((item, i) => (
                    <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`absolute p-1.5 rounded-full shadow-2xl border-4 border-white dark:border-brand-dark transition-all duration-500 hover:scale-125 z-10 ${selectedItem?.id === item.id ? 'bg-brand-green scale-150 z-20 shadow-brand-green/40' : 'bg-brand-dark dark:bg-brand-green/20'}`}
                        style={{
                            left: `${20 + (i * 15) % 65}%`,
                            top: `${25 + (i * 20) % 55}%`,
                            animation: `float ${3 + i}s ease-in-out infinite`
                        }}
                    >
                        <MapPin size={24} className={selectedItem?.id === item.id ? 'text-brand-dark' : 'text-brand-green'} />
                        {selectedItem?.id === item.id && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-brand-dark text-white text-[8px] font-black uppercase rounded-full shadow-xl">
                                ₹{item.pricePerDay}
                            </div>
                        )}
                    </button>
                ))}

                {/* Map Interface Controls */}
                <div className="absolute right-8 bottom-32 flex flex-col gap-3">
                    <button className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-brand-teal shadow-xl hover:bg-brand-teal/5"><MapPin size={20} /></button>
                    <button className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-brand-teal shadow-xl hover:bg-brand-teal/5"><SlidersHorizontal size={20} /></button>
                </div>
            </div>

            {/* Selected Listing Card (Slides in from bottom) */}
            <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl transition-all duration-700 ease-out ${selectedItem ? 'translate-y-0' : 'translate-y-[200%] opacity-0'}`}>
                {selectedItem && (
                    <Card variant="glass" className="!p-8 !rounded-[3rem] shadow-[0_32px_80px_rgba(0,0,0,0.3)] border-brand-green/20">
                        <div className="flex flex-col sm:flex-row gap-8 items-start relative">
                            <button onClick={() => setSelectedItem(null)} className="absolute -top-4 -right-4 p-2.5 rounded-2xl glass-card bg-white shadow-xl text-brand-teal hover:scale-110 transition-transform">
                                <ArrowLeft className="rotate-90 sm:rotate-0" size={16} />
                            </button>

                            <div className="w-full sm:w-44 aspect-square rounded-[2rem] overflow-hidden glass-card shadow-2xl shrink-0 group">
                                <img src={selectedItem.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="info" className="!text-[9px] px-2 py-0.5 uppercase tracking-widest font-black">{selectedItem.category}</Badge>
                                        <Badge variant="approved" className="!text-[9px] px-2 py-1 font-black uppercase tracking-widest leading-none">Verified</Badge>
                                    </div>
                                    <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter leading-none mb-1">{selectedItem.title}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-teal/40 uppercase tracking-widest">
                                        <MapPin size={12} className="text-brand-green" /> {selectedItem.location} · {selectedItem.distance}km
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-brand-teal/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-brand-teal/40 uppercase tracking-widest mb-1">Daily Rate</span>
                                        <span className="text-2xl font-black text-brand-dark dark:text-brand-frost">₹{selectedItem.pricePerDay}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="fill-brand-green text-brand-green" />
                                        <span className="text-lg font-black text-brand-dark dark:text-brand-frost">{selectedItem.rating}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button variant="primary" size="lg" className="flex-1 !rounded-[2rem] shadow-xl shadow-brand-green/20" onClick={() => navigate(`/item/${selectedItem.id}`)}>
                                        View Details <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Mobile View Toggle */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden px-8">
                <Button variant="outline" size="lg" className="!rounded-full px-12 shadow-2xl backdrop-blur-3xl bg-white/80 dark:bg-brand-dark/80" onClick={() => navigate('/browse')}>
                    <List size={20} /> Show List View
                </Button>
            </div>
        </div>
    );
}
