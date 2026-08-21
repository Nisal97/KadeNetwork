'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * CategoryInventoryPage Component
 * -------------------------------
 * Shows all items under a specific category for the logged-in merchant.
 * Accessed by clicking a category thumbnail on the My Inventory page.
 *
 * Features:
 * 1. Displays the category name and item count.
 * 2. Each item shows name, price, quantity, active toggle, and quantity controls.
 * 3. Toggle to enable/disable an item (sold out). Disabled items don't appear in peer search.
 * 4. - / + buttons to adjust quantity. When quantity reaches 0, the item is auto-disabled;
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

export default function CategoryInventoryPage() {
    const router = useRouter();
    const params = useParams<{ category: string }>();
    const category = decodeURIComponent(params.category);

    const [shopId, setShopId] = useState<string | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    // ─── Data Fetching ───────────────────────────────────────────────────────

    const fetchItems = useCallback(async (id: string) => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('shop_id', id)
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Inventory fetch error:', error.message);
        } else {
            setItems((data ?? []) as InventoryItem[]);
        }
    }, [category]);

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
            alert(`Quantity update failed: ${error.message}`);
        }
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    if (pageLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-4">Loading category...</p>
            </div>
        );
    }

    const emoji = getCategoryEmoji(category);
    const activeCount = items.filter((i) => i.is_active).length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="mb-6">
                <Link
                    href="/dashboard/inventory"
                    className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition mb-1 inline-block"
                >
                    ← My Inventory
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{emoji}</span>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">{category}</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {items.length} item{items.length !== 1 ? 's' : ''} ·{' '}
                            <span className="text-emerald-600 font-semibold">{activeCount} active</span>
                            {' '}·{' '}
                            <span className="text-slate-400">
                                {items.reduce((sum, i) => sum + i.quantity, 0)} units in stock
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Items ─────────────────────────────────────────────────── */}
            {items.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="text-5xl mb-4">{emoji}</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No items in this category</h3>
                    <p className="text-sm text-slate-500 mb-5">
                        Add items to this category to see them here.
                    </p>
                    <Link
                        href="/dashboard/inventory/manage"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
                    >
                        ➕ Add Item
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
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
                                    emoji
                                )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Status badge */}
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
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
    );
}