'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * LoginPage Component
 * -------------------
 * Provides the authentication portal for registered merchants.
 *
 * Key Functions:
 * 1. Collects merchant credentials (Email & Password).
 * 2. Prepares auth payload for backend integration (e.g. Supabase Auth).
 * 3. Provides a clean navigation route to `/register` for unauthenticated merchants.
 */
export default function LoginPage() {
  // =========================================================================
  // STATE MANAGEMENT
  // Tracks user input for email and password fields.
  // =========================================================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Form Submission Handler
   * -----------------------
   * Triggered when the user submits the sign-in form.
   * Validates credentials and passes them to authentication service.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in merchant:', { email, password });
    
    // Future backend integration:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    alert(`Login attempt for "${email}". Next step: Connect Supabase Auth!`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* =========================================================================
            HEADER
            Displays the form title and purpose.
            ========================================================================= */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Merchant Sign In
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access your inventory dashboard and inter-shop network
          </p>
        </div>

        {/* =========================================================================
            LOGIN FORM
            Collects email and password with client-side HTML5 validation.
            ========================================================================= */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="owner@shop.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
          </div>

          {/* Sign In Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm mt-2 cursor-pointer"
          >
            Sign In
          </button>
        </form>

        {/* =========================================================================
            REGISTRATION REDIRECT LINK
            Directs new merchants to the full shop onboarding & verification page.
            ========================================================================= */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register your shop
          </Link>
        </div>
      </div>
    </div>
  );
}