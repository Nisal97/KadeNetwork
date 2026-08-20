'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * LoginPage Component
 * -------------------
 * Authentication portal for registered KadeNetwork merchants.
 *
 * Key Functions:
 * 1. Collects merchant credentials (Email & Password).
 * 2. Calls supabase.auth.signInWithPassword to authenticate.
 * 3. Redirects to /dashboard on success.
 * 4. Displays error message inline on failure (wrong credentials, unconfirmed email, etc.).
 * 5. Hold-to-view eye button on the password field.
 */
export default function LoginPage() {
    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // =========================================================================
    // FORM SUBMISSION — Supabase Auth Sign In
    // =========================================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            // Map common Supabase error messages to friendlier copy
            if (authError.message.includes('Invalid login credentials')) {
                setError('Incorrect email or password. Please try again.');
            } else if (authError.message.includes('Email not confirmed')) {
                setError('Please confirm your email address before signing in.');
            } else {
                setError(authError.message);
            }
            setLoading(false);
            return;
        }

        // On success, redirect to merchant dashboard
        router.push('/dashboard');
        router.refresh();
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                {/* =========================================================================
                    HEADER
                    ========================================================================= */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl text-2xl mb-4">
                        🔐
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Merchant Sign In
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Access your inventory dashboard and inter-shop network
                    </p>
                </div>

                {/* =========================================================================
                    ERROR BANNER (shown on failed login)
                    ========================================================================= */}
                {error && (
                    <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* =========================================================================
                    LOGIN FORM
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

                    {/* Password Input with Hold-to-View Button */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-3.5 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                            />
                            {/* Hold-to-View Password Button */}
                            <button
                                type="button"
                                title="Click and hold to view password"
                                onMouseDown={() => setShowPassword(true)}
                                onMouseUp={() => setShowPassword(false)}
                                onMouseLeave={() => setShowPassword(false)}
                                onTouchStart={() => setShowPassword(true)}
                                onTouchEnd={() => setShowPassword(false)}
                                className="absolute right-3 text-slate-400 hover:text-slate-600 select-none p-1 cursor-pointer"
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm mt-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* =========================================================================
                    REGISTRATION REDIRECT LINK
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