'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * ManageInventoryPage Component
 * -----------------------------
 * Allows a logged-in merchant to add, edit, and manage their shop inventory.
 *
 * Features:
 * 1. Add new items with category, name, brand, price, image, and description.
 * 2. Edit existing items using the same inline form.
 * 3. Toggle item availability (is_active). Inactive items do NOT appear in the peer search.
 * 4. Delete items with a confirmation prompt.
 * 5. Image upload to Supabase Storage bucket `item-images`.
 *
 * Required Supabase setup (run in SQL Editor):
 * ─────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.inventory (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
 *   category TEXT NOT NULL,
 *   item_name TEXT NOT NULL,
 *   brand TEXT,
 *   price NUMERIC(10,2) NOT NULL,
 *   quantity INTEGER NOT NULL DEFAULT 0,
 *   description TEXT,
 *   image_url TEXT,
 *   is_active BOOLEAN NOT NULL DEFAULT TRUE,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * If you already created the table without `quantity`, run:
 *   ALTER TABLE public.inventory ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;
 * ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "own_inventory" ON public.inventory FOR ALL TO authenticated
 *   USING (shop_id = auth.uid()) WITH CHECK (shop_id = auth.uid());
 *
 * Also in Supabase Dashboard → Storage → New Bucket:
 *   Name: item-images | Public: YES
 * Then add storage policies:
 *   INSERT policy: auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'item-images'
 *   SELECT policy: bucket_id = 'item-images' (public)
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

interface FormState {
    category: string;
    item_name: string;
    brand: string;
    price: string;
    quantity: string;
    description: string;
    is_active: boolean;
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

const DEFAULT_FORM: FormState = {
    category: CATEGORIES[0].value,
    item_name: '',
    brand: '',
    price: '',
    quantity: '1',
    description: '',
    is_active: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManageInventoryPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [shopId, setShopId] = useState<string | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
            setItems(data ?? []);
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

    // ─── Form Helpers ─────────────────────────────────────────────────────────

    function openNewItem() {
        setEditingId(null);
        setForm(DEFAULT_FORM);
        setImageFile(null);
        setImagePreview(null);
        setShowForm(true);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }

    function openEditItem(item: InventoryItem) {
        setEditingId(item.id);
        setForm({
            category: item.category,
            item_name: item.item_name,
            brand: item.brand ?? '',
            price: String(item.price),
            quantity: String(item.quantity),
            description: item.description ?? '',
            is_active: item.is_active,
        });
        setImageFile(null);
        setImagePreview(item.image_url);
        setShowForm(true);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(DEFAULT_FORM);
        setImageFile(null);
        setImagePreview(null);
    }

    // ─── Upload Image to Supabase Storage ────────────────────────────────────

    async function uploadImage(): Promise<string | null> {
        if (!imageFile || !shopId) return null;
        const ext = imageFile.name.split('.').pop();
        const path = `${shopId}/${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('item-images')
            .upload(path, imageFile, { upsert: true });

        if (error) {
            console.error('Image upload failed:', error.message);
            alert(`Image upload failed: ${error.message}\n\nMake sure the 'item-images' bucket is created as Public in Supabase Dashboard → Storage.`);
            return null;
        }

        const { data } = supabase.storage.from('item-images').getPublicUrl(path);
        return data.publicUrl;
    }

    // ─── Save (Add or Update) ────────────────────────────────────────────────

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!shopId) return;
        setSaving(true);

        // Upload new image if selected; otherwise keep existing URL
        let imageUrl: string | null = imagePreview;
        if (imageFile) {
            imageUrl = await uploadImage();
        }

        const payload = {
            shop_id: shopId,
            category: form.category,
            item_name: form.item_name.trim(),
            brand: form.brand.trim() || null,
            price: parseFloat(form.price),
            quantity: Math.max(0, parseInt(form.quantity) || 0),
            description: form.description.trim() || null,
            image_url: imageUrl,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
        };

        let dbError = null;

        if (editingId) {
            const { error } = await supabase
                .from('inventory')
                .update(payload)
                .eq('id', editingId)
                .eq('shop_id', shopId);
            dbError = error;
        } else {
            const { error } = await supabase.from('inventory').insert([payload]);
            dbError = error;
        }

        if (dbError) {
            alert(`Failed to save item: ${dbError.message}`);
        } else {
            cancelForm();
            await fetchItems(shopId);
        }

        setSaving(false);
    }

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
            .eq('id', item.id);

        if (error) {
            // Revert on failure
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, is_active: !newValue } : i))
            );
            alert(`Toggle failed: ${error.message}`);
        }
    }

    // ─── Delete Item ─────────────────────────────────────────────────────────

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to permanently delete this item?')) return;

        const { error } = await supabase.from('inventory').delete().eq('id', id);

        if (error) {
            alert(`Delete failed: ${error.message}`);
        } else {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    if (pageLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-4">Loading inventory...</p>
            </div>
        );
    }

    const activeCount = items.filter((i) => i.is_active).length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Link
                        href="/dashboard"
                        className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition mb-1 inline-block"
                    >
                        ← Dashboard
                    </Link>
                    <h1 className="text-2xl font-extrabold text-slate-900">Manage Inventory</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {items.length} item{items.length !== 1 ? 's' : ''} total ·{' '}
                        <span className="text-emerald-600 font-semibold">{activeCount} active</span>
                        {items.length - activeCount > 0 && (
                            <span className="text-slate-400">
                                {' '}· {items.length - activeCount} inactive
                            </span>
                        )}
                    </p>
                </div>

                {!showForm && (
                    <button
                        onClick={openNewItem}
                        className="self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-2"
                    >
                        <span className="text-base">➕</span> Add New Item
                    </button>
                )}
            </div>

            {/* ── Add / Edit Form ───────────────────────────────────────── */}
            {showForm && (
                <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-bold text-lg">
                                {editingId ? '✏️ Edit Item' : '➕ Add New Item'}
                            </h2>
                            <p className="text-indigo-200 text-xs mt-0.5">
                                {editingId
                                    ? 'Update the details for this inventory item.'
                                    : 'Fill in the details to list a new item in your shop inventory.'}
                            </p>
                        </div>
                        <button
                            onClick={cancelForm}
                            className="text-indigo-200 hover:text-white text-xl font-bold cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-500 transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white transition"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.emoji} {c.value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Item Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. iPhone 15 Pro Max"
                                    value={form.item_name}
                                    onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                />
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Brand <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Apple, Samsung, Sony"
                                    value={form.brand}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Trade Price (LKR) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                                        Rs.
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    step="1"
                                    placeholder="0"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                Additional Details <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Colour: Black, Storage: 256GB, Condition: Brand New, Warranty: 1 year..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none transition"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                Item Photo <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <div className="flex items-start gap-4">
                                {/* Preview */}
                                {imagePreview ? (
                                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <Image
                                            src={imagePreview}
                                            alt="Item preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center hover:bg-rose-700 cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-3xl bg-slate-50">
                                        📷
                                    </div>
                                )}

                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="item-image-upload"
                                    />
                                    <label
                                        htmlFor="item-image-upload"
                                        className="inline-block text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg border border-slate-300 transition cursor-pointer"
                                    >
                                        {imagePreview ? '🔄 Change Photo' : '📁 Choose Photo'}
                                    </label>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        JPG, PNG or WebP. Recommended: square image under 2MB.
                                        <br />
                                        Requires the <code className="bg-slate-100 px-1 rounded">item-images</code> bucket in Supabase Storage.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Item Available for Trade</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    If toggled off, this item won&apos;t appear in the inter-shop search.
                                </p>
                            </div>
                            {/* Toggle Switch */}
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                                    form.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                        form.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    editingId ? '💾 Save Changes' : '✅ Add to Inventory'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="px-5 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Item List ─────────────────────────────────────────────── */}
            {items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No items yet</h3>
                    <p className="text-sm text-slate-500 mb-5">
                        Add your first inventory item to start sharing with the network.
                    </p>
                    {!showForm && (
                        <button
                            onClick={openNewItem}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
                        >
                            ➕ Add First Item
                        </button>
                    )}
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
                                    getCategoryEmoji(item.category)
                                )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Category badge + active status */}
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-2 py-0.5 rounded-full">
                                            {getCategoryEmoji(item.category)} {item.category}
                                        </span>
                                        {!item.is_active && (
                                            <span className="text-[11px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <p className="font-bold text-slate-900 text-sm truncate">{item.item_name}</p>

                                    {/* Brand + Price + Quantity */}
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        {item.brand && (
                                            <span className="text-xs text-slate-500">{item.brand}</span>
                                        )}
                                        <span className="text-sm font-extrabold text-indigo-700">
                                            Rs. {Number(item.price).toLocaleString()}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            item.quantity > 0
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {item.description && (
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 shrink-0">
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
                                            {item.is_active ? 'In Stock' : 'Sold Out'}
                                        </span>
                                    </div>

                                    {/* Edit */}
                                    <button
                                        onClick={() => openEditItem(item)}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition cursor-pointer"
                                    >
                                        ✏️ Edit
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition cursor-pointer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Floating Add Button (when items exist) ────────────────── */}
            {items.length > 0 && !showForm && (
                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={openNewItem}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-full shadow-lg transition cursor-pointer flex items-center gap-2 text-sm"
                    >
                        ➕ Add Item
                    </button>
                </div>
            )}
        </div>
    );
}
