import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import Home from '../pages/Home.jsx';
import Browse from '../pages/Browse.jsx';
import ItemDetails from '../pages/ItemDetails.jsx';
import Login from '../pages/Login.jsx';
import Wishlist from '../pages/Wishlist.jsx';
import Messages from '../pages/Messages.jsx';
import Profile from '../pages/Profile.jsx';
import Notifications from '../pages/Notifications.jsx';
import Earnings from '../pages/Earnings.jsx';
import MapView from '../pages/MapView.jsx';
import NotFound from '../pages/NotFound.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import MyBookings from '../pages/MyBookings.jsx';

/** Pages that should NOT have the shared Navbar/Footer (full-screen layouts) */
const BARE_ROUTES = ['/login', '/sign-up', '/map'];

function AppLayout({ children }) {
  const { pathname } = useLocation();
  const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  if (isBare) return <div className="min-h-screen">{children}</div>;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Main Flows */}
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/item/:id" element={<ItemDetails />} />
        <Route path="/map" element={<MapView />} />

        {/* Dashboard & Account */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Role-Specific Journeys */}
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-listings" element={<Navigate to="/dashboard" replace />} />
        <Route path="/list-item" element={<Navigate to="/browse" replace />} />
        <Route path="/earnings" element={<Earnings />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Login />} />

        {/* Catch-all & Redirects */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AppLayout>
  );
}
