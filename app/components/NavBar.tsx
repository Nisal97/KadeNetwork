'use client';

/**
 * NavBar Component
 * ----------------
 * Client-side navigation bar that reads the Supabase session state.
 *
 * Behaviour:
 * - NOT logged in  → Shows "Shop Login" and "Register Shop" buttons.
 * - Logged in      → Hides login/register buttons; shows "My Account" and "Sign Out" buttons.
 *
 * Listens to `supabase.auth.onAuthStateChange` so the nav updates
 * instantly after sign-in or sign-out without a page reload.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function NavBar() {
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session on mount
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        // Subscribe to auth state changes (login / logout)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    // While checking session, render nothing to avoid nav flicker
    if (loading) return null;

    return (
        <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Brand Logo & Name */}
                <Link
                    href={session ? '/dashboard' : '/'}
                    className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:opacity-90 transition"
                >
                    <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-sm font-extrabold shadow-xs">
                        KN
                    </span>
                    <span>KadeNetwork</span>
                </Link>

                {/* Navigation Action Links — change based on auth state */}
                <nav className="flex items-center gap-3">
                    {session ? (
                        // ── LOGGED IN STATE ──────────────────────────────────
                        <>
                            {/* My Account Button */}
                            <Link
                                href="/account"
                                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                            >
                                <span>👤</span>
                                <span>My Account</span>
                            </Link>

                            {/* Sign Out Button */}
                            <button
                                onClick={handleSignOut}
                                className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg border border-red-200 transition cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        // ── GUEST STATE ──────────────────────────────────────
                        <>
                            {/* Existing Merchant Login */}
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition px-2 py-1"
                            >
                                Shop Login
                            </Link>

                            {/* Shop Registration CTA */}
                            <Link
                                href="/register"
                                className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-xs"
                            >
                                Register Shop
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
