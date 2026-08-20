'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface ShopProfile {
    shop_name: string;
    owner_name: string;
    building_name: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [shop, setShop] = useState<ShopProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getShopProfile() {
            // 1. Get currently authenticated user from Supabase Session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                // If not logged in, redirect to login page
                router.push('/login');
                return;
            }

            // 2. Fetch the corresponding shop record from the public.shops table
            const { data, error } = await supabase
                .from('shops')
                .select('shop_name, owner_name, building_name')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching shop profile:', error.message);
            } else if (data) {
                setShop(data);
            }

            setLoading(false);
        }

        getShopProfile();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 mt-4">Loading your shop dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
                        📍 {shop?.building_name || 'Unity Plaza'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Welcome, {shop?.shop_name || 'Merchant'}!
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Owner: <span className="font-semibold text-slate-700">{shop?.owner_name || 'Shopkeeper'}</span> | Select an option below to begin trading.
                    </p>
                </div>

                <button
                    onClick={handleSignOut}
                    className="self-start sm:self-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg border border-red-200 transition"
                >
                    Sign Out
                </button>
            </div>

            {/* 3 Main Action Choices */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Option 1: Search External Network Stock */}
                <Link
                    href="/dashboard/search"
                    className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-600 hover:shadow-md transition flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                            🔍
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Search Network Stock</h2>
                        <p className="text-sm text-slate-600">
                            Customer asking for something out of stock? Search nearby shops by item name and radius to secure a deal.
                        </p>
                    </div>
                    <span className="mt-6 text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                        Search External Items →
                    </span>
                </Link>

                {/* Option 2: Add / Update Inventory */}
                <Link
                    href="/dashboard/inventory/manage"
                    className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-600 hover:shadow-md transition flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                            ➕
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Update Inventory</h2>
                        <p className="text-sm text-slate-600">
                            Add new items, adjust trade prices, change quantities, or toggle items as sold out to keep peer listings accurate.
                        </p>
                    </div>
                    <span className="mt-6 text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                        Add or Edit Stock →
                    </span>
                </Link>

                {/* Option 3: Search / View My Inventory */}
                <Link
                    href="/dashboard/inventory"
                    className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-600 hover:shadow-md transition flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                            📦
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Search My Inventory</h2>
                        <p className="text-sm text-slate-600">
                            Review your personal listed stock items, set trade prices, and quickly monitor your available quantities.
                        </p>
                    </div>
                    <span className="mt-6 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                        View My Stock List →
                    </span>
                </Link>

            </div>
        </div>
    );
}