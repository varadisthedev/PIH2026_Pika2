import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
    const [coords, setCoords] = useState(null);       // { lat, lng }
    const [locationName, setLocationName] = useState('');
    const [status, setStatus] = useState('idle');     // 'idle' | 'requesting' | 'granted' | 'denied'
    const [showModal, setShowModal] = useState(false);

    // On mount, check if user already gave permission
    useEffect(() => {
        const stored = localStorage.getItem('rentigo_location_status');
        if (stored === 'granted') {
            // Re-request silently
            requestLocation(true);
        } else if (!stored) {
            // First visit — show modal after a short delay
            const t = setTimeout(() => setShowModal(true), 800);
            return () => clearTimeout(t);
        } else {
            setStatus('denied');
        }
    }, []);

    const requestLocation = useCallback(async (silent = false) => {
        if (!navigator.geolocation) {
            setStatus('denied');
            return;
        }
        setStatus('requesting');
        if (!silent) setShowModal(false);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCoords({ lat, lng });
                setStatus('granted');
                localStorage.setItem('rentigo_location_status', 'granted');
                console.log(`📍 [LocationContext] Granted: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);

                // Reverse geocode for display name
                try {
                    const r = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                    );
                    const d = await r.json();
                    const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
                    const state = d.address?.state || '';
                    setLocationName([city, state].filter(Boolean).join(', '));
                } catch {
                    setLocationName(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
                }
            },
            (err) => {
                console.warn('⚠️ [LocationContext] Denied:', err.message);
                setStatus('denied');
                localStorage.setItem('rentigo_location_status', 'denied');
            },
            { timeout: 15000, enableHighAccuracy: true }
        );
    }, []);

    const dismissModal = () => {
        setShowModal(false);
        setStatus('denied');
        localStorage.setItem('rentigo_location_status', 'denied');
    };

    return (
        <LocationContext.Provider value={{ coords, locationName, status, showModal, setShowModal, requestLocation, dismissModal }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error('useLocation must be used within LocationProvider');
    return ctx;
}
