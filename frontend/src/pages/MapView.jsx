import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
    Search, ArrowLeft, List, MapPin, Navigation, IndianRupee,
    SlidersHorizontal, X, Package,
} from 'lucide-react';
import api from '../api/axios.js';
import { useLocation } from '../context/LocationContext.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

// Fix Leaflet default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Center map when coords change
function MapCenterer({ coords }) {
    const map = useMapEvents({});
    useEffect(() => {
        if (coords) map.setView([coords.lat, coords.lng], map.getZoom());
    }, [coords, map]);
    return null;
}

export default function MapPage() {
    const navigate = useNavigate();
    const { coords, locationName, status: locStatus, setShowModal } = useLocation();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [radiusKm, setRadiusKm] = useState(6000);
    const [showFilter, setShowFilter] = useState(false);
    const [selected, setSelected] = useState(null);

    // Default center: India
    const defaultCenter = coords
        ? [coords.lat, coords.lng]
        : [20.5937, 78.9629];
    const defaultZoom = coords ? 11 : 5;

    useEffect(() => {
        const params = { limit: 200 };
        if (coords) { params.userLat = coords.lat; params.userLng = coords.lng; }
        api.get('/products', { params })
            .then(res => {
                let prods = res.data.products || [];
                // Only show products with a valid location
                prods = prods.filter(p => p.location?.lat && p.location?.lng);
                setItems(prods);
                console.log(`🗺️ [MapPage] ${prods.length} products with location data`);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [coords]);

    // Filtered by search + radius
    const visible = items.filter(item => {
        const matchSearch = !search ||
            item.title?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.toLowerCase().includes(search.toLowerCase());
        const withinRadius = !coords || radiusKm >= 6000 ||
            (item.distanceKm != null ? item.distanceKm <= radiusKm : true);
        return matchSearch && withinRadius;
    });

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden" style={{ paddingTop: '64px' }}>

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] w-[95%] max-w-2xl">
                <div className="flex items-center gap-3 glass-card rounded-3xl px-4 py-2 shadow-2xl">
                    <button onClick={() => navigate(-1)}
                        className="p-2.5 rounded-2xl bg-brand-dark dark:bg-brand-green text-brand-frost dark:text-brand-dark shadow-lg hover:scale-105 transition-transform shrink-0">
                        <ArrowLeft size={16} />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                        <Search size={14} className="text-[#3C474B] shrink-0" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search items on map..."
                            className="flex-1 bg-transparent text-sm font-semibold text-brand-dark dark:text-brand-frost placeholder:text-[#3C474B]/40 outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-[#3C474B] hover:text-red-400">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button onClick={() => setShowFilter(f => !f)}
                        className={`p-2.5 rounded-2xl transition-colors shrink-0 ${showFilter ? 'bg-brand-green/20 text-brand-teal dark:text-brand-green' : 'text-[#3C474B] hover:bg-[#3C474B]/10'}`}>
                        <SlidersHorizontal size={16} />
                    </button>

                    <Button variant="outline" size="sm" className="!rounded-2xl hidden sm:flex shrink-0" onClick={() => navigate('/browse')}>
                        <List size={14} /> List
                    </Button>
                </div>

                {/* Radius filter panel */}
                {showFilter && (
                    <div className="mt-2 glass-card rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[#3C474B] uppercase tracking-wider">Search Radius</span>
                            <span className="text-sm font-black text-brand-dark dark:text-brand-frost">
                                {radiusKm >= 6000 ? '🇮🇳 All India' : `${radiusKm.toLocaleString()} km`}
                            </span>
                        </div>
                        <input
                            type="range" min="1" max="6000" step="50" value={radiusKm}
                            onChange={e => setRadiusKm(Number(e.target.value))}
                            className="w-full h-1.5 bg-[#4f7CAC]/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-[#3C474B]/50 mt-1 uppercase tracking-widest">
                            <span>1 km</span><span>All India</span>
                        </div>
                        {locStatus !== 'granted' && (
                            <button onClick={() => setShowModal(true)}
                                className="mt-3 w-full text-xs font-bold text-brand-teal dark:text-brand-green flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#4f7CAC]/30 hover:bg-[#3C474B]/10 transition-colors">
                                <Navigation size={12} /> Enable location for accurate radius
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Leaflet Map ──────────────────────────────────────────── */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={defaultZoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    attributionControl={true}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                    />
                    {coords && <MapCenterer coords={coords} />}

                    {/* User location marker */}
                    {coords && (
                        <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
                            <Popup>
                                <strong>📍 Your location</strong>
                                {locationName && <><br /><span style={{ fontSize: '11px', color: '#555' }}>{locationName}</span></>}
                            </Popup>
                        </Marker>
                    )}

                    {/* Radius circle */}
                    {coords && radiusKm < 6000 && (
                        <Circle
                            center={[coords.lat, coords.lng]}
                            radius={radiusKm * 1000}
                            pathOptions={{ color: '#3C474B', fillColor: '#4f7CAC', fillOpacity: 0.1, weight: 2, dashArray: '6 4' }}
                        />
                    )}

                    {/* Item markers */}
                    {visible.map(item => (
                        <Marker
                            key={item._id}
                            position={[item.location.lat, item.location.lng]}
                            icon={greenIcon}
                            eventHandlers={{ click: () => setSelected(item) }}
                        >
                            <Popup>
                                <div style={{ minWidth: '160px' }}>
                                    <strong style={{ fontSize: '13px' }}>{item.title}</strong><br />
                                    <span style={{ fontSize: '11px', color: '#3C474B' }}>₹{item.pricePerDay}/day</span>
                                    {item.distanceKm != null && (
                                        <><br /><span style={{ fontSize: '10px', color: '#999' }}>📍 {item.distanceKm} km away</span></>
                                    )}
                                    <br />
                                    <a
                                        href={`/item/${item._id}`}
                                        style={{ fontSize: '11px', color: '#3d6b50', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' }}
                                    >
                                        View Details →
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
                        <div className="glass-card rounded-2xl px-6 py-4 text-sm font-bold text-brand-dark dark:text-brand-frost flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                            Loading items…
                        </div>
                    </div>
                )}

                {/* No location banner */}
                {!coords && !loading && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[400]">
                        <button onClick={() => setShowModal(true)}
                            className="glass-card rounded-2xl px-5 py-3 shadow-xl text-xs font-bold text-brand-teal dark:text-brand-green flex items-center gap-2 hover:scale-105 transition-transform">
                            <Navigation size={14} /> Enable location to see items near you
                        </button>
                    </div>
                )}

                {/* Counter badge */}
                {!loading && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400]">
                        <div className="glass-card rounded-full px-5 py-2 shadow-xl text-xs font-black text-brand-dark dark:text-brand-frost flex items-center gap-2">
                            <Package size={12} />
                            {visible.length} item{visible.length !== 1 ? 's' : ''} on map
                            {coords && radiusKm < 6000 && <span className="text-brand-teal dark:text-brand-green"> · within {radiusKm} km</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
