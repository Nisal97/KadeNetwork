'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * SearchNetworkStockPage Component
 * --------------------------------
 * Allows a logged-in merchant to search for stock available at OTHER shops
 * within a chosen radius and category.
 *
 * Features:
 * 1. Item name keyword search (case-insensitive, matches ANY keyword against
 *    item_name + brand — handles merchants entering names differently).
 * 2. Radius dropdown (Haversine distance from the current user's shop GPS pin).
 * 3. Category dropdown filter.
 * 4. Results list showing item image, name, shop name, and price.
 * 5. Click a result to open a detail popup with item photo, details, price,
 *    shop name, and the shop's contact numbers.
 *
 * Required Supabase setup:
 * - `inventory` table with `shop_id` FK → `public.shops(id)` (see manage page).
 * - `shops` table with `latitude` / `longitude` columns (set during registration).
 *
 * IMPORTANT — Row Level Security (RLS):
 * The default `own_inventory` policy only lets a merchant read their OWN items,
 * so the network search would return nothing. Run the following in the Supabase
 * SQL Editor to allow authenticated merchants to read other shops' ACTIVE items
 * and shop profiles (writes remain restricted to the owner):
 *
 *   -- Allow any authenticated merchant to read all ACTIVE inventory items
 *   CREATE POLICY "read_active_inventory" ON public.inventory
 *     FOR SELECT TO authenticated
 *     USING (is_active = true);
 *
 *   -- Allow any authenticated merchant to read shop profiles (name, location, contacts)
 *   CREATE POLICY "read_shops" ON public.shops
 *     FOR SELECT TO authenticated
 *     USING (true);
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopInfo {
    id: string;
    shop_name: string;
    latitude: number | null;
    longitude: number | null;
    contact_no_1: string | null;
    contact_no_2: string | null;
}

interface SearchResultItem {
    id: string;
    shop_id: string;
    category: string;
    item_name: string;
    brand: string | null;
    price: number;
    quantity: number;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    shops: ShopInfo[] | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: string; emoji: string }[] = [
    { value: 'Mobile & Smartphones', emoji: '📱' },
    { value: 'Computers & Laptops', emoji: '💻' },
    { value: 'Monitors & Displays', emoji: '🖥️' },
    { value: 'Accessories & Peripherals', emoji: '⌨️' },
    { value: 'Cables & Adapters', emoji: '🔌' },
    { value: 'Batteries & Power Banks', emoji: '🔋' },
    { value: 'Audio & Speakers', emoji: '🎧' },
    { value: 'Networking & Wi-Fi', emoji: '📡' },
    { value: 'Printers & Ink', emoji: '🖨️' },
    { value: 'Storage & Memory', emoji: '💾' },
    { value: 'Stationery & Office', emoji: '🛒' },
    { value: 'Other', emoji: '📦' },
];

const getCategoryEmoji = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.emoji ?? '📦';

const RADIUS_OPTIONS: { value: number; label: string }[] = [
    { value: 500, label: '500 m' },
    { value: 1000, label: '1 km' },
    { value: 2000, label: '2 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
    { value: 0, label: 'Anywhere' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine distance in meters between two lat/lng points. */
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchNetworkStockPage() {
    const router = useRouter();
    const [shopId, setShopId] = useState<string | null>(null);
    const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    // Search form state
    const [searchTerm, setSearchTerm] = useState('');
    const [radius, setRadius] = useState<number>(2000);
    const [category, setCategory] = useState<string>('All');

    // Results state
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [searched, setSearched] = useState(false);
    const [searching, setSearching] = useState(false);

    // Detail popup state
    const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);

    // ─── Init: session + shop location ───────────────────────────────────────

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }
            setShopId(session.user.id);

            // Fetch the current user's shop GPS location for radius filtering
            const { data: shop } = await supabase
                .from('shops')
                .select('latitude, longitude')
                .eq('id', session.user.id)
                .single();

            if (shop?.latitude && shop?.longitude) {
                setMyLocation({ lat: shop.latitude, lng: shop.longitude });
            }
            setPageLoading(false);
        }
        init();
    }, [router]);

    // ─── Search handler ──────────────────────────────────────────────────────

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setSearching(true);
        setSearched(true);

        // 1. Fetch all active inventory items
        const { data: itemsData, error } = await supabase
            .from('inventory')
            .select(
                'id, shop_id, category, item_name, brand, price, description, image_url, is_active, quantity'
            )
            .eq('is_active', true);

        if (error) {
            console.error('Search fetch error:', error.message);
            setResults([]);
            setSearching(false);
            return;
        }

        // 2. Fetch all shops (name, location, contacts) and build a lookup map
        const { data: shopsData } = await supabase
            .from('shops')
            .select('id, shop_name, latitude, longitude, contact_no_1, contact_no_2');

        const shopMap = new Map<string, ShopInfo>(
            (shopsData ?? []).map((s) => [s.id, s as ShopInfo])
        );

        // 3. Merge shop info into each item.
        //    If the `quantity` column doesn't exist yet, it will be undefined —
        //    treat missing quantity as 0 (sold out) so it's excluded from results.
        let filtered: SearchResultItem[] = (itemsData ?? []).map((item) => ({
            ...item,
            quantity: (item as { quantity?: number }).quantity ?? 0,
            shops: shopMap.get(item.shop_id) ? [shopMap.get(item.shop_id)!] : null,
        }));

        // 4. Only show items that are in stock (quantity > 0)
        filtered = filtered.filter((item) => item.quantity > 0);

        // 5. Exclude the current user's own shop items
        if (shopId) {
            filtered = filtered.filter((item) => item.shop_id !== shopId);
        }

        // 6. Category filter
        if (category !== 'All') {
            filtered = filtered.filter((item) => item.category === category);
        }

        // 7. Keyword search on item name + brand (case-insensitive, match ANY keyword)
        const keywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (keywords.length > 0) {
            filtered = filtered.filter((item) => {
                const haystack = `${item.item_name} ${item.brand ?? ''}`.toLowerCase();
                return keywords.some((kw) => haystack.includes(kw));
            });
        }

        // 8. Radius filter (Haversine distance from my shop)
        if (radius > 0 && myLocation) {
            filtered = filtered.filter((item) => {
                const shop = item.shops?.[0];
                if (!shop?.latitude || !shop?.longitude) return false;
                const dist = haversineDistance(
                    myLocation.lat,
                    myLocation.lng,
                    shop.latitude,
                    shop.longitude
                );
                return dist <= radius;
            });
        }

        setResults(filtered);
        setSearching(false);
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    if (pageLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-4">Loading search...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition mb-1 inline-block"
                >
                    ← Dashboard
                </Link>
                <h1 className="text-2xl font-extrabold text-slate-900">Search Network Stock</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Find items available at nearby shops. Search by item name, category, and radius.
                </p>
            </div>

            {/* ── Search Form ───────────────────────────────────────────── */}
            <form
                onSubmit={handleSearch}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-8 space-y-4"
            >
                <div className="grid sm:grid-cols-3 gap-4">
                    {/* Item Name Search */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Item Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. iPhone, charger, laptop..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                        />
                    </div>

                    {/* Radius */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Radius
                        </label>
                        <select
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white transition"
                        >
                            {RADIUS_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white transition"
                        >
                            <option value="All">📦 All Categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.emoji} {c.value}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Search Button + GPS warning */}
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                        {!myLocation && radius > 0 && (
                            <span className="text-amber-600 font-semibold">
                                ⚠️ Your shop has no GPS location pinned — radius search is disabled. Use "Anywhere" instead.
                            </span>
                        )}
                    </p>
                    <button
                        type="submit"
                        disabled={searching}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                    >
                        {searching ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>🔍 Search Stock</>
                        )}
                    </button>
                </div>
            </form>

            {/* ── Initial State (before search) ─────────────────────────── */}
            {!searched && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Search the network</h3>
                    <p className="text-sm text-slate-500">
                        Enter an item name, choose a radius and category, then hit Search to see what nearby shops have in stock.
                    </p>
                </div>
            )}

            {/* ── Results ───────────────────────────────────────────────── */}
            {searched && !searching && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-700">
                            {results.length} item{results.length !== 1 ? 's' : ''} found
                        </h2>
                        <span className="text-xs text-slate-400">
                            {category !== 'All' ? `${category} · ` : ''}
                            {radius > 0
                                ? `within ${RADIUS_OPTIONS.find((r) => r.value === radius)?.label}`
                                : 'Anywhere'}
                        </span>
                    </div>

                    {results.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">No items found</h3>
                            <p className="text-sm text-slate-500">
                                Try a different keyword, widen the radius, or change the category.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {results.map((item) => {
                                const shop = item.shops?.[0];
                                const dist =
                                    myLocation && shop?.latitude && shop?.longitude
                                        ? haversineDistance(
                                              myLocation.lat,
                                              myLocation.lng,
                                              shop.latitude,
                                              shop.longitude
                                          )
                                        : null;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full text-left bg-white border border-slate-200 rounded-xl overflow-hidden flex shadow-sm hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
                                    >
                                        {/* Item Image / Emoji */}
                                        <div className="w-20 sm:w-24 shrink-0 bg-slate-50 flex items-center justify-center text-3xl border-r border-slate-100">
                                            {item.image_url ? (
                                                <div className="relative w-full h-full min-h-[80px]">
                                                    <Image
                                                        src={item.image_url}
                                                        alt={item.item_name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                getCategoryEmoji(item.category)
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Category badge + distance */}
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-2 py-0.5 rounded-full">
                                                        {getCategoryEmoji(item.category)} {item.category}
                                                    </span>
                                                    {dist !== null && (
                                                        <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                                                            📍 {formatDistance(dist)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Item Name */}
                                                <p className="font-bold text-slate-900 text-sm truncate">
                                                    {item.item_name}
                                                </p>

                                                {/* Brand + Shop Name */}
                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                    {item.brand && (
                                                        <span className="text-xs text-slate-500">{item.brand}</span>
                                                    )}
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        🏪 {shop?.shop_name ?? 'Unknown shop'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="shrink-0">
                                                <span className="text-lg font-extrabold text-indigo-700">
                                                    Rs. {Number(item.price).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Detail Popup ──────────────────────────────────────────── */}
            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
}

// ─── Item Detail Modal ────────────────────────────────────────────────────────

function ItemDetailModal({
    item,
    onClose,
}: {
    item: SearchResultItem;
    onClose: () => void;
}) {
    const shop = item.shops?.[0];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header with image ─────────────────────────────────── */}
                <div className="relative h-56 bg-slate-100">
                    {item.image_url ? (
                        <Image
                            src={item.image_url}
                            alt={item.item_name}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-7xl">
                            {getCategoryEmoji(item.category)}
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-md flex items-center justify-center text-lg font-bold transition cursor-pointer"
                    >
                        ✕
                    </button>

                    {/* Category badge */}
                    <span className="absolute bottom-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        {getCategoryEmoji(item.category)} {item.category}
                    </span>
                </div>

                {/* ── Body ──────────────────────────────────────────────── */}
                <div className="p-6">
                    {/* Item name + brand */}
                    <h3 className="text-xl font-extrabold text-slate-900">{item.item_name}</h3>
                    {item.brand && (
                        <p className="text-sm text-slate-500 mt-0.5">{item.brand}</p>
                    )}

                    {/* Price */}
                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 uppercase">Trade Price</span>
                        <span className="text-2xl font-extrabold text-indigo-700">
                            Rs. {Number(item.price).toLocaleString()}
                        </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Details</p>
                            <p className="text-sm text-slate-700 whitespace-pre-line">{item.description}</p>
                        </div>
                    )}

                    {/* Divider */}
                    <hr className="my-5 border-slate-100" />

                    {/* Shop info */}
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Available At</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                            <span>🏪</span> {shop?.shop_name ?? 'Unknown shop'}
                        </p>

                        {/* Contact numbers */}
                        <div className="mt-3 space-y-2">
                            {shop?.contact_no_1 ? (
                                <a
                                    href={`tel:${shop.contact_no_1}`}
                                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-indigo-400 hover:shadow-sm transition group"
                                >
                                    <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm shrink-0">
                                        📞
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Primary Contact</p>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                                            {shop.contact_no_1}
                                        </p>
                                    </div>
                                    <span className="text-indigo-600 text-xs font-bold group-hover:translate-x-0.5 transition">
                                        Call →
                                    </span>
                                </a>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No primary contact listed</p>
                            )}

                            {shop?.contact_no_2 && (
                                <a
                                    href={`tel:${shop.contact_no_2}`}
                                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-indigo-400 hover:shadow-sm transition group"
                                >
                                    <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm shrink-0">
                                        📞
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Secondary Contact</p>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                                            {shop.contact_no_2}
                                        </p>
                                    </div>
                                    <span className="text-indigo-600 text-xs font-bold group-hover:translate-x-0.5 transition">
                                        Call →
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Close action */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-sm cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}