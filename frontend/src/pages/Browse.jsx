import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, SlidersHorizontal, X, MapPin, Navigation, Filter,
    ArrowUpDown, LayoutGrid, List, Map as MapIcon,
} from 'lucide-react';
import api from '../api/axios.js';
import { CATEGORIES } from '../api/placeholder.js';
import { useLocation } from '../context/LocationContext.jsx';
import ItemCard from '../components/items/ItemCard.jsx';
import { LoadingGrid, EmptyState, ErrorState } from '../components/items/ItemStates.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

const MapView = lazy(() => import('../components/MapView.jsx'));


export default function Browse() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    // Use global location context instead of local geolocation call
    const { coords, locationName, status: locStatus, setShowModal } = useLocation();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Filter States
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'All');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [radiusKm, setRadiusKm] = useState(6000); // 6000km default = entire subcontinent
    const [sortBy, setSortBy] = useState('nearest');


    const loadItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            if (maxPrice) params.maxPrice = Number(maxPrice);
            if (coords) {
                params.userLat = coords.lat;
                params.userLng = coords.lng;
            }

            console.log('🔍 [Browse] Fetching products with filters:', params);
            const res = await api.get('/products', { params });
            let fetchedItems = res.data.products || [];
            console.log(`✅ [Browse] Loaded ${fetchedItems.length} products`);

            // Client-side radius filter (only when user has location + radius < 6000)
            if (coords && radiusKm < 6000) {
                fetchedItems = fetchedItems.filter(i =>
                    i.distanceKm == null || i.distanceKm <= radiusKm
                );
                console.log(`📍 [Browse] After ${radiusKm}km radius filter: ${fetchedItems.length} items`);
            }

            if (sortBy === 'price_low') fetchedItems.sort((a, b) => a.pricePerDay - b.pricePerDay);
            if (sortBy === 'price_high') fetchedItems.sort((a, b) => b.pricePerDay - a.pricePerDay);

            setItems(fetchedItems);
        } catch (e) {
            console.error('❌ [Browse] Failed to fetch products:', e);
            setError('Could not load items. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [search, category, maxPrice, coords, radiusKm, sortBy]);


    useEffect(() => {
        const handler = setTimeout(() => {
            loadItems();
            const params = {};
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            if (maxPrice) params.maxPrice = maxPrice;
            setSearchParams(params, { replace: true });
        }, 350);
        return () => clearTimeout(handler);
    }, [loadItems, search, category, maxPrice, setSearchParams]);


    const clearFilters = () => {
        setSearch('');
        setCategory('All');
        setMaxPrice('');
        setRadiusKm(6000);
    };

    const countActiveFilters = () => {
        let count = 0;
        if (category !== 'All') count++;
        if (maxPrice) count++;
        if (radiusKm < 6000) count++;
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
                            <SlidersHorizontal size={16} className="ml-4 text-brand-teal/40" />
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
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Radius Slider */}
                        <div className="space-y-4 glass-card !p-6 !rounded-3xl">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/60">Search Radius</label>
                                <span className="text-xs font-black text-brand-dark dark:text-brand-frost">
                                    {radiusKm >= 6000 ? 'All India' : `${radiusKm.toLocaleString()} km`}
                                </span>
                            </div>
                            <input
                                type="range" min="1" max="6000" step="50"
                                value={radiusKm}
                                onChange={e => setRadiusKm(Number(e.target.value))}
                                className="w-full h-1.5 bg-brand-teal/10 rounded-lg appearance-none cursor-pointer accent-brand-green"
                            />
                            <div className="flex justify-between text-[8px] font-black text-brand-teal/30 uppercase tracking-widest">
                                <span>1 km</span>
                                <span>All India (6000 km)</span>
                            </div>
                        </div>

                        {/* Location status */}
                        {locStatus === 'granted' && coords ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-green">
                                <MapPin size={13} /> {locationName || `${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E`}
                            </div>
                        ) : (
                            <button onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 text-xs font-bold text-[#3C474B] hover:text-brand-teal dark:text-[#9EEFE5] transition-colors">
                                <Navigation size={13} /> Enable location for nearby results
                            </button>
                        )}

                        {/* Mini map preview */}
                        {coords && (
                            <Suspense fallback={<div className="h-40 rounded-2xl bg-[#4f7CAC]/10 animate-pulse" />}>
                                <MapView
                                    lat={coords.lat} lng={coords.lng}
                                    title="Your location"
                                    height="180px"
                                    zoom={radiusKm < 50 ? 12 : radiusKm < 500 ? 9 : radiusKm < 2000 ? 6 : 4}
                                    radiusKm={radiusKm < 6000 ? radiusKm : null}
                                />
                            </Suspense>
                        )}
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

                            {/* Radius */}
                            <div className="space-y-4 p-6 rounded-3xl bg-brand-teal/[0.03] border border-brand-teal/5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Search Radius</label>
                                    <span className="text-sm font-black text-brand-dark dark:text-brand-frost">
                                        {radiusKm >= 6000 ? 'All India' : `${radiusKm.toLocaleString()} km`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="6000"
                                    step="50"
                                    value={radiusKm}
                                    onChange={e => setRadiusKm(Number(e.target.value))}
                                    className="w-full h-2 bg-brand-teal/10 rounded-lg appearance-none cursor-pointer accent-brand-green"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-brand-teal/30 uppercase tracking-widest">
                                    <span>1 km</span><span>All India</span>
                                </div>
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
