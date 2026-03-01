import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const RentalContext = createContext(null);

export function RentalProvider({ children }) {
    // UI role switch: 'renter' | 'lender' — purely frontend display toggle
    const [userRole, setUserRole] = useState('renter');

    // Wishlist (product IDs) — stored in localStorage for persistence
    const [wishlist, setWishlist] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('rentigo_wishlist') || '[]');
        } catch { return []; }
    });

    const [recentlyViewed, setRecentlyViewed] = useState([]);

    // Switch between Renter and Lender mode
    const toggleRole = useCallback(() => {
        setUserRole(prev => (prev === 'renter' ? 'lender' : 'renter'));
    }, []);

    // Wishlist management — persisted to localStorage
    const toggleWishlist = useCallback((itemId) => {
        setWishlist(prev => {
            const next = prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId];
            try { localStorage.setItem('rentigo_wishlist', JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    // Recently viewed management
    const addToRecentlyViewed = useCallback((item) => {
        setRecentlyViewed(prev => {
            const filtered = prev.filter(i => i._id !== item._id && i.id !== item.id);
            return [item, ...filtered].slice(0, 5);
        });
    }, []);

    return (
        <RentalContext.Provider value={{
            userRole,
            setUserRole,
            toggleRole,
            wishlist,
            recentlyViewed,
            toggleWishlist,
            addToRecentlyViewed,
        }}>
            {children}
        </RentalContext.Provider>
    );
}

export function useRental() {
    const ctx = useContext(RentalContext);
    if (!ctx) throw new Error('useRental must be used within RentalProvider');
    return ctx;
}
