import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import Home from '../pages/Home.jsx';
import Browse from '../pages/Browse.jsx';
import ItemDetails from '../pages/ItemDetails.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Login from '../pages/Login.jsx';
import SignUpPage from '../pages/SignUpPage.jsx';

/** Pages that should NOT have the shared Navbar/Footer (full-screen layouts) */
const BARE_ROUTES = ['/login', '/sign-up'];

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
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/item/:id" element={<ItemDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Clerk auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
