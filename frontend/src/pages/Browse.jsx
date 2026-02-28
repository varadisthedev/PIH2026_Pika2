import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, SlidersHorizontal, X, ChevronDown, MapPin, Star, ShieldCheck,
    ArrowUpDown, Filter, Map as MapIcon, Grid, LayoutGrid, List, Sliders, Settings2, ChevronRight
} from 'lucide-react';
import api from '../api/axios.js';
import { CATEGORIES } from '../api/placeholder.js';
import ItemCard from '../components/items/ItemCard.jsx';
import { LoadingGrid, EmptyState, ErrorState } from '../components/items/ItemStates.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [userCoords, setUserCoords] = useState(null); // { lat, lng }

    // Filter States
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'All');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [maxDistance, setMaxDistance] = useState(searchParams.get('distance') || 25);
    const [minRating, setMinRating] = useState(0);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [sortBy, setSortBy] = useState('nearest');

    // Auto-detect user location once
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserCoords(coords);
                console.log('📍 [Browse] User location detected:', coords);
            },
            err => console.warn('⚠️ [Browse] Location denied:', err.message),
            { timeout: 8000 }
        );
    }, []);

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            if (maxPrice) params.maxPrice = Number(maxPrice);
            if (userCoords) {
                params.userLat = userCoords.lat;
                params.userLng = userCoords.lng;
            }

            console.log('🔍 [Browse] Fetching products with filters:', params);
            const res = await api.get('/products', { params });
            const fetchedItems = res.data.products || [];
            console.log(`✅ [Browse] Loaded ${fetchedItems.length} products from backend`);

            // Client-side simulated filters for those not handled by backend yet
            let results = [...fetchedItems];
            if (minRating > 0) results = results.filter(i => i.rating >= minRating);
            if (verifiedOnly) results = results.filter(i => i.isVerified !== false); // Backend uses isVerified or similar?

            // Sorting (if not already handled by backend proximity)
            if (sortBy === 'price_low') results.sort((a, b) => a.pricePerDay - b.pricePerDay);
            if (sortBy === 'rating_high') results.sort((a, b) => b.rating - a.rating);

            setItems(results);
        } catch (e) {
            console.error('❌ [Browse] Failed to fetch products:', e);
            setError('Could not load items. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, category, maxPrice, userCoords, minRating, verifiedOnly, sortBy]);

    useEffect(() => {
        const handler = setTimeout(() => {
            loadItems();
            const params = {};
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            if (maxPrice) params.maxPrice = maxPrice;
            if (maxDistance !== 25) params.distance = maxDistance;
            setSearchParams(params, { replace: true });
        }, 350);
        return () => clearTimeout(handler);
    }, [loadItems, search, category, maxPrice, maxDistance, setSearchParams]);

    const clearFilters = () => {
        setSearch('');
        setCategory('All');
        setMaxPrice('');
        setMaxDistance(25);
        setMinRating(0);
        setVerifiedOnly(false);
    };

    const countActiveFilters = () => {
        let count = 0;
        if (category !== 'All') count++;
        if (maxPrice) count++;
        if (maxDistance !== 25) count++;
        if (minRating > 0) count++;
        if (verifiedOnly) count++;
        return count;
    };

    return (
        <div className="pb-24 animate-fade-in relative min-h-screen bg-white/40 dark:bg-transparent">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/5 blur-[120px] pointer-events-none rounded-full" />

            <Container>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 pt-10 animate-fade-up">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-teal/40">
                            <MapPin size={14} className="text-brand-green" /> Local Neighborhood Explorer
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-brand-dark dark:text-brand-frost leading-none">
                            Discover <span className="text-brand-green italic opacity-90">Gear.</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <Badge variant="info" className="!bg-brand-dark !text-brand-frost dark:!bg-brand-green dark:!text-brand-dark px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                                {loading ? '...' : items.length} Neighbourhood Results
                            </Badge>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-brand-teal/5 p-1 rounded-2xl border border-brand-teal/5">
                            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark shadow-xl text-[10px] font-black uppercase tracking-widest">
                                <LayoutGrid size={16} /> Grid
                            </button>
                            <button
                                onClick={() => navigate('/map')}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-brand-teal/40 hover:text-brand-dark dark:hover:text-brand-frost text-[10px] font-black uppercase tracking-widest"
                            >
                                <MapIcon size={16} /> Map
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center gap-3 glass-card p-1 rounded-2xl border border-brand-teal/10">
                            <Sliders size={16} className="ml-4 text-brand-teal/40" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-brand-frost outline-none cursor-pointer px-4 py-3 min-w-[160px]"
                            >
                                <option value="nearest">Distance: Nearest</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="rating_high">Rating: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
                    {/* Desktop Sidebar Filters */}
                    <aside className="hidden lg:flex flex-col gap-10 sticky top-32">
                        {/* Search Input */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Search Neighbourhood</label>
                            <div className="relative group">
                                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal group-focus-within:text-brand-dark transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search gear..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-16 pr-6 py-5 rounded-3xl glass-card bg-white/60 dark:bg-brand-dark/20 border-none outline-none text-xs font-black text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 transition-all focus:ring-4 focus:ring-brand-green/10 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Category Catalog</label>
                            <div className="flex flex-col gap-2">
                                {['All', ...CATEGORIES].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all group ${category === cat
                                            ? 'bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark shadow-2xl scale-[1.02]'
                                            : 'text-brand-teal/60 hover:bg-brand-teal/5'
                                            }`}
                                    >
                                        {cat}
                                        <ChevronRight size={14} className={`group-hover:translate-x-1 transition-transform ${category === cat ? 'opacity-100' : 'opacity-0'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Distance Slider */}
                        <div className="space-y-8 glass-card !p-8 !rounded-[2.5rem] bg-brand-teal/[0.02] border-brand-teal/5">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Proximity</label>
                                <span className="text-xs font-black text-brand-dark dark:text-brand-frost uppercase">{maxDistance}km</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={maxDistance}
                                onChange={e => setMaxDistance(Number(e.target.value))}
                                className="w-full h-1.5 bg-brand-teal/10 rounded-lg appearance-none cursor-pointer accent-brand-green"
                            />
                            <div className="flex justify-between text-[8px] font-black text-brand-teal/30 uppercase tracking-widest">
                                <span>1km Radius</span>
                                <span>50km Radius</span>
                            </div>
                        </div>

                        {/* Verified Toggle */}
                        <button
                            onClick={() => setVerifiedOnly(!verifiedOnly)}
                            className={`flex items-center justify-between p-6 rounded-[2rem] glass-card transition-all group ${verifiedOnly ? 'bg-brand-green/10 border-brand-green/40 shadow-inner' : 'hover:bg-brand-teal/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-xl transition-all ${verifiedOnly ? 'bg-brand-green text-brand-dark rotate-12' : 'bg-brand-teal/10 text-brand-teal'}`}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-[11px] font-black text-brand-dark dark:text-brand-frost leading-none mb-1 uppercase tracking-tight">Verified Only</div>
                                    <div className="text-[9px] font-bold text-brand-teal/40 uppercase tracking-widest">Trusted Hosts</div>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-1 ${verifiedOnly ? 'bg-brand-green' : 'bg-brand-teal/20'}`}>
                                <div className={`w-3 h-3 rounded-sm bg-white shadow-md transition-all ${verifiedOnly ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex flex-col gap-10">
                        {/* Mobile Filter Trigger */}
                        <div className="lg:hidden flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 !rounded-[1.5rem] !py-5 bg-white/60 dark:bg-brand-dark/20 shadow-xl"
                                onClick={() => setIsFilterDrawerOpen(true)}
                            >
                                <Filter size={18} /> Filters {countActiveFilters() > 0 && `(${countActiveFilters()})`}
                            </Button>
                            <Button variant="primary" className="!rounded-[1.5rem] px-8" onClick={() => navigate('/map')}>
                                <MapIcon size={18} />
                            </Button>
                        </div>

                        {/* Grid */}
                        {loading && <LoadingGrid count={8} />}
                        {error && <ErrorState message={error} onRetry={loadItems} />}
                        {!loading && !error && items.length === 0 && (
                            <EmptyState
                                icon={Search}
                                title="No items found"
                                description="Try adjusting your search or clearing filters to see more results."
                                action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
                            />
                        )}
                        {!loading && !error && items.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.map(item => (
                                    <div key={item._id || item.id} className="animate-fade-up">
                                        <ItemCard item={item} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </Container>

            {/* Mobile Filter Drawer Overlay */}
            {isFilterDrawerOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
                    <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xl" onClick={() => setIsFilterDrawerOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[90%] bg-white dark:bg-brand-dark p-10 overflow-y-auto animate-slide-in-right rounded-l-[3rem] shadow-[-20px_0_80px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase leading-none">Filters</h2>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="p-3 rounded-2xl glass-card text-brand-teal active:scale-95 transition-all">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="space-y-12">
                            {/* Category */}
                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-teal/40">Neighborhood Catalog</label>
                                <div className="flex flex-wrap gap-2">
                                    {['All', ...CATEGORIES].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat
                                                ? 'bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark shadow-xl scale-[1.05]'
                                                : 'bg-brand-teal/5 text-brand-teal/60'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Distance */}
                            <div className="space-y-8 p-8 rounded-[2.5rem] bg-brand-teal/[0.02] border border-brand-teal/5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Max Distance</label>
                                    <span className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase">{maxDistance}km</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={maxDistance}
                                    onChange={e => setMaxDistance(Number(e.target.value))}
                                    className="w-full h-2 bg-brand-teal/10 rounded-lg appearance-none cursor-pointer accent-brand-green"
                                />
                            </div>

                            {/* Price */}
                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Budget (₹ / Day)</label>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40 px-4">Maximum</label>
                                        <input
                                            type="number"
                                            placeholder="Set max"
                                            value={maxPrice}
                                            onChange={e => setMaxPrice(e.target.value)}
                                            className="w-full bg-brand-teal/5 p-6 rounded-3xl text-sm font-black border-none outline-none dark:text-white dark:bg-white/5 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div className="sticky bottom-0 left-0 right-0 pt-16 pb-2 bg-gradient-to-t from-white dark:from-brand-dark via-white dark:via-brand-dark to-transparent">
                            <Button variant="primary" size="lg" className="w-full !rounded-[2rem] shadow-2xl shadow-brand-green/20" onClick={() => setIsFilterDrawerOpen(false)}>
                                Update Results
                            </Button>
                            <Button variant="ghost" size="sm" className="w-full mt-4 !text-[10px] font-black uppercase tracking-widest" onClick={clearFilters}>
                                Reset Neighbourhood view
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
