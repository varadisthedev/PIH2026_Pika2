import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const RentalContext = createContext(null);

export function RentalProvider({ children }) {
    // Role management: 'renter' or 'lender'
    const [userRole, setUserRole] = useState('renter');

    // Items the logged-in user has requested to borrow
    const [myBookings, setMyBookings] = useState([]);

    // Items the user has listed as a lender
    const [myListings, setMyListings] = useState([]);

    // Requests received by the user for their items (from other renters)
    const [incomingRequests, setIncomingRequests] = useState([]);

    // Micro UX features
    const [wishlist, setWishlist] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState([]);

    // User Profile Data
    const [userProfile, setUserProfile] = useState({
        name: 'Varad Paranjape',
        email: 'varad@borrownear.com',
        phone: '+91 98765 43210',
        location: 'Bandra, Mumbai',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Varad',
        joinDate: 'Jan 2024',
        rating: 4.9,
        reviewCount: 28,
        isVerified: true,
        bio: 'Tech enthusiast and occasional photographer. Happy to share my gear with the community!'
    });

    // Switch between Renter and Lender mode
    const toggleRole = useCallback(() => {
        setUserRole(prev => (prev === 'renter' ? 'lender' : 'renter'));
    }, []);

    // Add a borrow request (Renter flow)
    const addBooking = useCallback((item, details) => {
        const booking = {
            id: `booking-${Date.now()}`,
            item: {
                id: item.id,
                title: item.title,
                image: item.image,
                location: item.location,
            },
            startDate: details.startDate,
            endDate: details.endDate,
            totalCost: details.totalCost,
            securityDeposit: details.securityDeposit,
            status: details.status || 'requested',
            createdAt: new Date().toISOString(),
        };
        setMyBookings(prev => [booking, ...prev]);

        // Add a notification
        addNotification(`Request sent for ${item.title}`, 'info');

        return booking;
    }, []);

    // Create a new listing (Lender flow)
    const createListing = useCallback((itemData) => {
        const newListing = {
            ...itemData,
            id: `listing-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'active',
            available: true,
            verified: true,
            rating: 5.0,
            reviewCount: 0,
        };
        setMyListings(prev => [newListing, ...prev]);
        addNotification(`Listing "${itemData.title}" is now live!`, 'success');
        return newListing;
    }, []);

    // Notification management
    const addNotification = useCallback((message, type = 'info') => {
        setNotifications(prev => [
            { id: Date.now(), message, type, time: 'Just now', read: false },
            ...prev
        ]);
    }, []);

    const markNotificationRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Wishlist management
    const toggleWishlist = useCallback((itemId) => {
        setWishlist(prev => {
            const isAdded = prev.includes(itemId);
            if (!isAdded) addNotification('Item added to wishlist', 'info');
            return isAdded ? prev.filter(id => id !== itemId) : [...prev, itemId];
        });
    }, []);

    // Recently viewed management
    const addToRecentlyViewed = useCallback((item) => {
        setRecentlyViewed(prev => {
            const filtered = prev.filter(i => i.id !== item.id);
            return [item, ...filtered].slice(0, 5); // Keep last 5
        });
    }, []);

    // Pre-populate some dummy data for a "wired" feel
    useEffect(() => {
        setIncomingRequests([
            {
                id: 'req-1',
                item: { title: 'DSLR Camera Canon EOS', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200' },
                renterName: 'Rahul S.',
                renterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
                renterRating: 4.8,
                startDate: '2024-03-10',
                endDate: '2024-03-12',
                totalCost: 1500,
                status: 'pending'
            }
        ]);

        setNotifications([
            { id: 1, message: 'Your booking for Camping Tent was accepted!', type: 'success', time: '2 hours ago', read: false },
            { id: 2, message: 'New request received for your Drill Machine', type: 'info', time: '5 hours ago', read: true },
            { id: 3, message: 'Welcome to RentiGO! Complete your profile to build trust.', type: 'info', time: '1 day ago', read: true },
        ]);


    }, []);

    return (
        <RentalContext.Provider value={{
            userRole,
            setUserRole,
            toggleRole,
            myBookings,
            myListings,
            incomingRequests,
            wishlist,
            recentlyViewed,
            notifications,
            messages,
            userProfile,
            addBooking,
            createListing,
            toggleWishlist,
            addToRecentlyViewed,
            addNotification,
            markNotificationRead,
            acceptRequest: (id) => {
                setIncomingRequests(p => p.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
                addNotification('Request accepted. Contact the renter to coordinate.', 'success');
            },
            declineRequest: (id) => {
                setIncomingRequests(p => p.map(r => r.id === id ? { ...r, status: 'declined' } : r));
                addNotification('Request declined.', 'info');
            },
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
