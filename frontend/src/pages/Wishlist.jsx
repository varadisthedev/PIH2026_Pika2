import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, ArrowRight, Trash2 } from 'lucide-react';
import { useRental } from '../context/RentalContext.jsx';
import api from '../api/axios.js';
import Container from '../components/layout/Container.jsx';
import ItemCard from '../components/items/ItemCard.jsx';
import { EmptyState, LoadingGrid } from '../components/items/ItemStates.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function Wishlist() {
    const navigate = useNavigate();
    const { wishlist, toggleWishlist } = useRental();
    const [savedItems, setSavedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/products', { params: { limit: 100 } })
            .then(res => {
                const results = res.data.products || [];
                setSavedItems(results.filter(item => wishlist.includes(item._id) || wishlist.includes(item.id)));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [wishlist]);

    return (
        <div className="pt-28 pb-32 animate-fade-in min-h-screen bg-white/40 dark:bg-transparent">
            <Container>
                {/* Header */}
                <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-up">
                    <div className="space-y-3">
                        <h1 className="text-4xl sm:text-6xl font-black text-brand-dark dark:text-brand-frost tracking-tighter leading-none">
                            My Wishlist
                        </h1>
                        <div className="flex items-center gap-3">
                            <Badge variant="info" className="!bg-red-500 !text-white px-3 py-1 text-xs font-black">
                                {wishlist.length} Items Saved
                            </Badge>
                            <span className="text-brand-teal/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                Gear you're tracking
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => navigate('/browse')}
                        className="group"
                    >
                        Explore More <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingGrid count={4} />
                ) : wishlist.length === 0 ? (
                    <EmptyState
                        icon={Heart}
                        title="Your wishlist is empty"
                        description="Found something you like? Click the heart icon to save it for later. Your neighbors are listing new gear every day!"
                        action={
                            <Button variant="primary" size="lg" onClick={() => navigate('/browse')} className="!rounded-3xl shadow-xl shadow-brand-green/20">
                                Start Borrowing
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {savedItems.map(item => (
                            <div key={item.id} className="relative group/card animate-fade-up">
                                <ItemCard item={item} />
                                {/* Quick Remove Overlay */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleWishlist(item.id);
                                    }}
                                    className="absolute top-4 right-16 p-2.5 rounded-2xl bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md shadow-xl text-red-500 opacity-0 group-hover/card:opacity-100 transition-all hover:scale-110"
                                    title="Remove from wishlist"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
