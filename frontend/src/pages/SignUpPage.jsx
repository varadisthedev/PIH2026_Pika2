import React from 'react';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Already signed in → redirect to dashboard
  if (isLoaded && isSignedIn) {
    console.log('✅ [SignUp] User already signed in — redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('📝 [SignUp] Rendering Clerk SignUp page');

  return (
    <div className="hero-bg min-h-screen flex flex-col items-center justify-center px-4 py-16 gap-8">
      <div className="text-center animate-fade-up">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-dark dark:bg-brand-green flex items-center justify-center shadow-lg">
            <MapPin size={24} className="text-brand-frost dark:text-brand-dark" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-brand-dark dark:text-brand-frost">
            Renti<span className="text-brand-teal dark:text-brand-green">GO</span>
          </span>
        </div>
        <p className="text-sm font-bold tracking-wide uppercase text-brand-teal dark:text-brand-aqua/80">
          Join your neighbourhood rental marketplace
        </p>
      </div>

      <SignUp
        routing="hash"
        fallbackRedirectUrl="/dashboard"
        signInUrl="/login"
      />
    </div>
  );
}
