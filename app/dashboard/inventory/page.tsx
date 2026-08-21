'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * MyInventoryPage Component
 * -------------------------
 * Allows a logged-in merchant to search, filter, and manage their own inventory.
 *
 * Features:
 * 1. Search bar for item names (case-insensitive keyword match on item_name + brand).
 * 2. Category thumbnails (3 per row) below the search box. Clicking a category
 *    shows the items inside that category.
 * 3. Price range slider.
 * 4. Each item shows name, price, quantity, active toggle, and quantity controls.
 * 5. Toggle to enable/disable an item (sold out). Disabled items don't appear in peer search.
 * 6. - / + buttons to adjust quantity. When quantity reaches 0, the item is auto-disabled;
 *    when it goes back to 1+, it's auto-enabled.
 *
 * Required Supabase setup:
 * - `inventory` table with a `quantity INTEGER NOT NULL DEFAULT 0` column.
 *   If missing, run: ALTER TABLE public.inventory ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
    id: string;
    category: string;
    item_name: string;
    brand: string | null;
    price: number;
    quantity: number;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyInventoryPage() {
    const router = useRouter();
    const [shopId, setShopId] = useState<string | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(1500000);

    // Search results state
    const [searchResults, setSearchResults] = useState<InventoryItem[] | null>(null);

    // ─── Data Fetching ───────────────────────────────────────────────────────

    const fetchItems = useCallback(async (id: string) => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('shop_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Inventory fetch error:', error.message);
        } else {
            setItems((data ?? []) as InventoryItem[]);
        }
    }, []);

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }
            setShopId(session.user.id);
            await fetchItems(session.user.id);
            setPageLoading(false);
        }
        init();
    }, [router, fetchItems]);

    // ─── Toggle is_active ────────────────────────────────────────────────────

    async function handleToggle(item: InventoryItem) {
        const newValue = !item.is_active;
        // Optimistic update
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, is_active: newValue } : i))
        );
        setSearchResults((prev) =>
            prev ? prev.map((i) => (i.id === item.id ? { ...i, is_active: newValue } : i)) : prev
        );

        const { error } = await supabase
            .from('inventory')
            .update({ is_active: newValue })
            .eq('id', item.id)
            .eq('shop_id', shopId);

        if (error) {
            // Revert on failure
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, is_active: !newValue } : i))
            );
            setSearchResults((prev) =>
                prev ? prev.map((i) => (i.id === item.id ? { ...i, is_active: !newValue } : i)) : prev
            );
            alert(`Toggle failed: ${error.message}`);
        }
    }

    // ─── Adjust Quantity ─────────────────────────────────────────────────────

    async function handleQuantityChange(item: InventoryItem, delta: number) {
        const newQuantity = Math.max(0, item.quantity + delta);
        // When quantity reaches 0, auto-disable the item.
        // When quantity goes back to 1 or higher, auto-enable it.
        const newActive = newQuantity > 0;

        // Optimistic update
        setItems((prev) =>
            prev.map((i) =>
                i.id === item.id
                    ? { ...i, quantity: newQuantity, is_active: newActive }
                    : i
            )
        );
        setSearchResults((prev) =>
            prev
                ? prev.map((i) =>
                      i.id === item.id
                          ? { ...i, quantity: newQuantity, is_active: newActive }
                          : i
                  )
                : prev
        );

        const { error } = await supabase
            .from('inventory')
            .update({ quantity: newQuantity, is_active: newActive })
            .eq('id', item.id)
            .eq('shop_id', shopId);

        if (error) {
            // Revert on failure
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? { ...i, quantity: item.quantity, is_active: item.is_active }
                        : i
                )
            );
            setSearchResults((prev) =>
                prev
                    ? prev.map((i) =>
                          i.id === item.id
                              ? { ...i, quantity: item.quantity, is_active: item.is_active }
                              : i
                      )
                    : prev
            );
            alert(`Quantity update failed: ${error.message}`);
        }
    }

    // ─── Search handler ──────────────────────────────────────────────────────

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();

        const keywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const results = items.filter((item) => {
            // Search term (item name + brand, case-insensitive, match ANY keyword)
            if (keywords.length > 0) {
                const haystack = `${item.item_name} ${item.brand ?? ''}`.toLowerCase();
                if (!keywords.some((kw) => haystack.includes(kw))) return false;
            }

            // Price range filter (min/max)
            const price = Number(item.price);
            if (price < minPrice || price > maxPrice) return false;

            return true;
        });

        setSearchResults(results);
    }

    // ─── Clear search ────────────────────────────────────────────────────────

    function clearSearch() {
        setSearchTerm('');
        setSearchResults(null);
    }

    // Count items per category for the thumbnails
    const categoryCounts = CATEGORIES.map((c) => ({
        ...c,
        count: items.filter((i) => i.category === c.value).length,
    }));

    // ─── Render ──────────────────────────────────────────────────────────────

    if (pageLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-4">Loading your inventory...</p>
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
                <h1 className="text-2xl font-extrabold text-slate-900">My Inventory</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    {items.length} item{items.length !== 1 ? 's' : ''} total ·{' '}
                    <span className="text-emerald-600 font-semibold">
                        {items.filter((i) => i.is_active).length} active
                    </span>
                    {' '}·{' '}
                    <span className="text-slate-400">
                        {items.reduce((sum, i) => sum + i.quantity, 0)} units in stock
                    </span>
                </p>
            </div>

            {/* ── Search Box ────────────────────────────────────────────── */}
            <form
                onSubmit={handleSearch}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6 space-y-4"
            >
                {/* Search Bar + Button */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Search Items
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="e.g. iPhone, charger, laptop..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
                        >
                            🔍 Search
                        </button>
                    </div>
                </div>

                {/* Price Range Slider (single bar, two pointers) */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">
                            Price Range
                        </label>
                        <span className="text-sm font-extrabold text-indigo-700">
                            Rs. {minPrice.toLocaleString()} — Rs. {maxPrice.toLocaleString()}
                        </span>
                    </div>

                    {/* Dual-thumb range slider */}
                    <div className="dual-range relative h-6">
                        {/* Track background */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-slate-200" />
                        {/* Highlighted selected range */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-indigo-500"
                            style={{
                                left: `${(minPrice / 1500000) * 100}%`,
                                right: `${100 - (maxPrice / 1500000) * 100}%`,
                            }}
                        />
                        {/* Min thumb (left pointer) */}
                        <input
                            type="range"
                            min={0}
                            max={1500000}
                            step={10000}
                            value={minPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setMinPrice(Math.min(val, maxPrice));
                            }}
                            className="absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none cursor-pointer z-20"
                            style={{
                                WebkitAppearance: 'none',
                                appearance: 'none',
                            }}
                        />
                        {/* Max thumb (right pointer) */}
                        <input
                            type="range"
                            min={0}
                            max={1500000}
                            step={10000}
                            value={maxPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setMaxPrice(Math.max(val, minPrice));
                            }}
                            className="absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none cursor-pointer z-30"
                            style={{
                                WebkitAppearance: 'none',
                                appearance: 'none',
                            }}
                        />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>Rs. 0</span>
                        <span>Rs. 1,500,000</span>
                    </div>
                </div>
            </form>

            {/* ── Search Results (when search is active) ─────────────────── */}
            {searchResults !== null ? (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-700">
                            {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} found
                        </h2>
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                            ✕ Clear search
                        </button>
                    </div>

                    {searchResults.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">No items found</h3>
                            <p className="text-sm text-slate-500">
                                Try a different keyword or adjust the price range.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchResults.map((item) => (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-xl overflow-hidden flex transition-all ${
                                        item.is_active
                                            ? 'border-slate-200 shadow-sm'
                                            : 'border-slate-200 opacity-60'
                                    }`}
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
                                            {/* Category badge + status */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-2 py-0.5 rounded-full">
                                                    {getCategoryEmoji(item.category)} {item.category}
                                                </span>
                                                {!item.is_active && (
                                                    <span className="text-[11px] bg-rose-50 text-rose-600 border border-rose-100 font-semibold px-2 py-0.5 rounded-full">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <p className="font-bold text-slate-900 text-sm truncate">{item.item_name}</p>

                                            {/* Brand + Price */}
                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                {item.brand && (
                                                    <span className="text-xs text-slate-500">{item.brand}</span>
                                                )}
                                                <span className="text-sm font-extrabold text-indigo-700">
                                                    Rs. {Number(item.price).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Quantity Stepper */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item, -1)}
                                                        disabled={item.quantity <= 0}
                                                        title="Decrease quantity"
                                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-lg hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                                    >
                                                        −
                                                    </button>
                                                    <span
                                                        className={`w-10 text-center text-sm font-extrabold ${
                                                            item.quantity > 0 ? 'text-slate-900' : 'text-rose-600'
                                                        }`}
                                                    >
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item, 1)}
                                                        title="Increase quantity"
                                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-lg hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer flex items-center justify-center"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                    Qty
                                                </span>
                                            </div>

                                            {/* Active / Sold Out Toggle */}
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(item)}
                                                    title={item.is_active ? 'Click to mark as sold out' : 'Click to mark as available'}
                                                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                                                        item.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                            item.is_active ? 'translate-x-5' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                                <span className={`text-[10px] font-semibold ${item.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {item.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Category Thumbnails (3 per row) — shown only when NOT searching ── */
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-700 mb-3">Browse by Category</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {categoryCounts.map((cat) => {
                            const hasItems = cat.count > 0;
                            return (
                                <Link
                                    key={cat.value}
                                    href={`/dashboard/inventory/${encodeURIComponent(cat.value)}`}
                                    className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 transition ${
                                        hasItems
                                            ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-sm cursor-pointer'
                                            : 'bg-slate-50 border-slate-200 text-slate-300 pointer-events-none'
                                    }`}
                                >
                                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                                        {cat.emoji}
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-bold text-center leading-tight">
                                        {cat.value}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        hasItems
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {cat.count} item{cat.count !== 1 ? 's' : ''}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
