import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ShieldCheck, Zap, Users, Package, Smartphone, HomeIcon, Bike, PartyPopper, Briefcase, Tent, Dumbbell, BookOpen, Camera } from 'lucide-react';
import api from '../api/axios.js';
import ItemCard from '../components/items/ItemCard.jsx';
import { LoadingGrid, ErrorState } from '../components/items/ItemStates.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import { useRental } from '../context/RentalContext.jsx';

const CATEGORIES = [
    { name: 'Everyday Essentials', icon: Package, color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Tech & Gadgets', icon: Smartphone, color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Home & Living', icon: HomeIcon, color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Mobility & Transport', icon: Bike, color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Event & Party Gear', icon: PartyPopper, color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Professional Equipment', icon: Briefcase, color: 'bg-gray-500/10 text-gray-500' },
    { name: 'Outdoor & Adventure', icon: Tent, color: 'bg-green-500/10 text-green-500' },
    { name: 'Fitness & Sports', icon: Dumbbell, color: 'bg-cyan-500/10 text-cyan-500' },
    { name: 'Study & Work Setup', icon: BookOpen, color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Creative & Media Gear', icon: Camera, color: 'bg-indigo-500/10 text-indigo-500' },
];

const HOW_IT_WORKS = [
    { icon: Search, title: 'Find it Nearby', desc: 'Browse thousands of items from verified neighbours in your local community.' },
    { icon: ShieldCheck, title: 'Rent with Trust', desc: 'Secure payments, owner verification, and small security deposits for peace of mind.' },
    { icon: Zap, title: 'Pick up & Enjoy', desc: 'Coordinate a quick hand-off and get to work. No shipping waste, no clutter.' },
];
export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [locationName, setLocationName] = useState('Mumbai, MH');
    const [isLocating, setIsLocating] = useState(false);
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStickyCTA, setShowStickyCTA] = useState(false);
    const navigate = useNavigate();
    const { setUserRole } = useRental();

    useEffect(() => {
        api.get('/products', { params: { limit: 4 } })
            .then(res => {
                setFeatured(res.data.products || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("[Home] Error fetching featured items:", err);
                setError('Could not load featured items.');
                setLoading(false);
            });

        const handleScroll = () => setShowStickyCTA(window.scrollY > 600);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const detectLocation = () => {
        setIsLocating(true);
        setTimeout(() => {
            setLocationName('Bandra, Mumbai');
            setIsLocating(false);
        }, 1200);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        params.set('location', locationName);
        navigate(`/browse?${params.toString()}`);
    };

    return (
        <div className="min-h-screen pb-20">
            {/* HERO SECTION */}
            <section className="relative pt-32 pb-24 overflow-hidden hero-bg">
                {/* Visual Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20 pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-brand-green/30 blur-[120px] rounded-full" />
                    <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-teal/30 blur-[120px] rounded-full" />
                </div>

                <Container>
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-card text-[11px] font-black uppercase tracking-[0.2em] text-brand-teal dark:text-brand-green mb-10 animate-fade-up">
                            <ShieldCheck size={14} className="animate-pulse" />
                            India's Trusted Hyperlocal Rental Network
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] text-brand-dark dark:text-brand-frost mb-8 animate-fade-up delay-75 shadow-sm">
                            Borrow Anything. <br />
                            <span className="text-brand-teal dark:text-brand-green italic opacity-90">Right Next Door.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-brand-teal/70 dark:text-brand-aqua/60 max-w-2xl mx-auto leading-relaxed mb-12 font-bold animate-fade-up delay-150">
                            Stop buying things you only use once. RentiGO connects you with neighbours to share gear, save money, and reduce waste.
                        </p>

                        {/* Centered Search Bar */}
                        <form
                            onSubmit={handleSearch}
                            className="glass-card rounded-[2.5rem] p-3 shadow-2xl flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto animate-fade-up delay-200"
                        >
                            <div className="flex-[1.5] flex items-center gap-4 px-6 border-b sm:border-b-0 sm:border-r border-brand-teal/10">
                                <Search size={20} className="text-brand-teal" />
                                <input
                                    type="text"
                                    placeholder="Search for DSLR, Ladders, Tents..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent py-4 text-sm font-black text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/40 outline-none"
                                />
                            </div>
                            <div className="flex-1 flex items-center gap-3 px-6">
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    className="p-2 rounded-xl hover:bg-brand-teal/10 text-brand-teal transition-colors"
                                    title="Detect my location"
                                >
                                    <MapPin size={20} className={isLocating ? 'animate-bounce' : ''} />
                                </button>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={e => setLocationName(e.target.value)}
                                    className="w-full bg-transparent py-4 text-sm font-black text-brand-dark dark:text-brand-frost outline-none"
                                />
                            </div>
                            <Button variant="primary" size="lg" type="submit" className="!rounded-full px-10 shadow-xl shadow-brand-green/20">
                                Find Gear
                            </Button>
                        </form>
                    </div>
                </Container>
            </section>

            {/* CATEGORIES GRID */}
            <section className="py-24 border-t border-brand-teal/5 bg-brand-frost/20 dark:bg-transparent">
                <Container>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {CATEGORIES.map(({ name, icon: Icon, color }) => (
                            <button
                                key={name}
                                onClick={() => navigate(`/browse?category=${name}`)}
                                className="group flex flex-col items-center gap-4 p-6 rounded-3xl glass-card hover:bg-white dark:hover:bg-white/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-brand-dark dark:text-brand-frost">{name}</span>
                            </button>
                        ))}
                    </div>
                </Container>
            </section>

            {/* FEATURED ITEMS */}
            <section className="py-24 bg-brand-green/5 dark:bg-transparent border-y border-brand-teal/5">
                <Container>
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/60 mb-3">Community Hub</h2>
                            <h3 className="text-4xl font-black text-brand-dark dark:text-brand-frost tracking-tighter">Nearby Favourites</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/browse')} className="!rounded-xl group">
                            Full Catalogue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {loading && <LoadingGrid count={4} />}
                    {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featured.map(item => (
                                <ItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </Container>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24">
                <Container>
                    <div className="max-w-xl mx-auto text-center mb-16">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/60 mb-4">Simple Process</h2>
                        <h3 className="text-4xl font-black text-brand-dark dark:text-brand-frost tracking-tighter">Your local sharing economy.</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
                            <div key={title} className="relative group text-center animate-fade-up" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="absolute -top-6 -left-6 text-7xl font-black text-brand-green/5 dark:text-white/5 select-none pointer-events-none">
                                    0{i + 1}
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-brand-green/10 dark:bg-brand-green/5 flex items-center justify-center mx-auto mb-8 relative z-10 group-hover:rotate-6 transition-transform">
                                    <Icon size={28} className="text-brand-green" />
                                </div>
                                <h4 className="text-xl font-black text-brand-dark dark:text-brand-frost mb-4 tracking-tight">{title}</h4>
                                <p className="text-sm text-brand-teal/70 dark:text-brand-aqua/60 leading-relaxed font-bold">
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* LENDER CTA */}
            <section className="py-24">
                <Container>
                    <div className="glass-card rounded-[3rem] p-12 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-brand-teal/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-4xl font-black text-brand-dark dark:text-brand-frost tracking-tighter mb-6">Have gear sitting idle?</h2>
                            <p className="text-lg text-brand-teal/70 dark:text-brand-aqua/60 leading-relaxed mb-10 font-bold">
                                Turn your tools, cameras, and gear into passive income. Your items are protected and our community is verified.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => {
                                    setUserRole('lender');
                                    navigate('/dashboard');
                                }}
                                className="shadow-2xl shadow-brand-green/20"
                            >
                                <Users size={20} /> Start Hosting Today
                            </Button>
                        </div>
                    </div>
                </Container>
            </section>

            {/* STICKY MOBILE CTA */}
            {showStickyCTA && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:hidden animate-fade-in animate-fade-up">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full shadow-2xl shadow-brand-green/40 !rounded-2xl"
                        onClick={() => navigate('/browse')}
                    >
                        <Search size={20} /> Browse Gear Nearby
                    </Button>
                </div>
            )}
        </div>
    );
}
