'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * AccountPage Component
 * ---------------------
 * Displays the logged-in merchant's shop profile details,
 * and allows them to edit fields and save updates to Supabase.
 *
 * Features:
 * 1. Loads the merchant's session; redirects to /login if unauthenticated.
 * 2. Fetches the shop record from `public.shops` using auth.user.id.
 * 3. Displays all fields in a read-only summary view.
 * 4. Provides an "Edit" mode to update shop name, owner, address, etc.
 * 5. Saves changes back to Supabase via an update query.
 */

interface ShopProfile {
    shop_name: string;
    owner_name: string;
    contact_no_1: string;
    contact_no_2: string | null;
    address: string;
    building_name: string;
    latitude: number | null;
    longitude: number | null;
}

const BUILDING_OPTIONS = [
    'Unity Plaza (Colombo 04)',
    'Majestic City (Colombo 04)',
    'Liberty Plaza (Colombo 03)',
    'Pettah Market Cluster',
    'Other / Standalone Store',
];

// Maps display label → stored DB value
const BUILDING_VALUE_MAP: Record<string, string> = {
    'Unity Plaza (Colombo 04)': 'Unity Plaza',
    'Majestic City (Colombo 04)': 'Majestic City',
    'Liberty Plaza (Colombo 03)': 'Liberty Plaza',
    'Pettah Market Cluster': 'Pettah Market',
    'Other / Standalone Store': 'Other',
};

const BUILDING_LABEL_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(BUILDING_VALUE_MAP).map(([label, val]) => [val, label])
);

export default function AccountPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [shop, setShop] = useState<ShopProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Draft state for editing
    const [draft, setDraft] = useState<ShopProfile | null>(null);

    // =========================================================================
    // LOAD SESSION & SHOP PROFILE
    // =========================================================================
    useEffect(() => {
        async function loadProfile() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push('/login');
                return;
            }

            setUserId(session.user.id);
            setUserEmail(session.user.email ?? '');

            const { data, error } = await supabase
                .from('shops')
                .select('shop_name, owner_name, contact_no_1, contact_no_2, address, building_name, latitude, longitude')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Failed to load shop profile:', error.message);
            } else if (data) {
                setShop(data);
                setDraft(data);
            }

            setLoading(false);
        }

        loadProfile();
    }, [router]);

    // =========================================================================
    // SAVE EDITS TO SUPABASE
    // =========================================================================
    const handleSave = async () => {
        if (!draft || !userId) return;
        setSaving(true);

        const { error } = await supabase
            .from('shops')
            .update({
                shop_name: draft.shop_name,
                owner_name: draft.owner_name,
                contact_no_1: draft.contact_no_1,
                contact_no_2: draft.contact_no_2 || null,
                address: draft.address,
                building_name: draft.building_name,
            })
            .eq('id', userId);

        if (error) {
            alert(`Failed to save changes: ${error.message}`);
        } else {
            setShop(draft);
            setIsEditing(false);
            alert('Profile updated successfully!');
        }

        setSaving(false);
    };

    const handleCancel = () => {
        setDraft(shop); // Reset draft to last saved state
        setIsEditing(false);
    };

    // =========================================================================
    // LOADING STATE
    // =========================================================================
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-4">Loading account details...</p>
            </div>
        );
    }

    if (!shop || !draft) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                <p className="text-slate-500 text-sm">No shop profile found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">My Account</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Signed in as <span className="font-semibold text-indigo-600">{userEmail}</span>
                    </p>
                </div>

                {/* Edit / Save / Cancel Actions */}
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="text-sm font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-5 py-2 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                        >
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Shop Identity Banner */}
                <div className="bg-indigo-600 px-6 py-5 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-extrabold text-white">
                        🏪
                    </div>
                    <div>
                        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Shop Profile</p>
                        <h2 className="text-white text-xl font-extrabold">{shop.shop_name}</h2>
                        <p className="text-indigo-200 text-sm">
                            {BUILDING_LABEL_MAP[shop.building_name] ?? shop.building_name}
                        </p>
                    </div>
                </div>

                {/* Profile Fields */}
                <div className="divide-y divide-slate-100">

                    {/* Shop Name */}
                    <Field
                        label="Shop Name"
                        value={draft.shop_name}
                        editing={isEditing}
                        onChange={(v) => setDraft({ ...draft, shop_name: v })}
                    />

                    {/* Owner Name */}
                    <Field
                        label="Owner / Manager Name"
                        value={draft.owner_name}
                        editing={isEditing}
                        onChange={(v) => setDraft({ ...draft, owner_name: v })}
                    />

                    {/* Complex / Building */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase w-44 shrink-0">
                            Complex / Cluster
                        </span>
                        {isEditing ? (
                            <select
                                value={BUILDING_LABEL_MAP[draft.building_name] ?? draft.building_name}
                                onChange={(e) =>
                                    setDraft({ ...draft, building_name: BUILDING_VALUE_MAP[e.target.value] ?? e.target.value })
                                }
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                            >
                                {BUILDING_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-sm text-slate-800 font-medium">
                                {BUILDING_LABEL_MAP[shop.building_name] ?? shop.building_name}
                            </span>
                        )}
                    </div>

                    {/* Address */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase w-44 shrink-0 pt-1">
                            Store Address
                        </span>
                        {isEditing ? (
                            <textarea
                                value={draft.address}
                                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                            />
                        ) : (
                            <span className="text-sm text-slate-800 font-medium">{shop.address}</span>
                        )}
                    </div>

                    {/* Primary Contact */}
                    <Field
                        label="Primary Contact No"
                        value={draft.contact_no_1}
                        editing={isEditing}
                        inputType="tel"
                        onChange={(v) => setDraft({ ...draft, contact_no_1: v })}
                    />

                    {/* Secondary Contact */}
                    <Field
                        label="Secondary Contact"
                        value={draft.contact_no_2 ?? ''}
                        editing={isEditing}
                        inputType="tel"
                        placeholder="Not provided"
                        onChange={(v) => setDraft({ ...draft, contact_no_2: v || null })}
                    />

                    {/* Email (read-only — managed by Supabase Auth) */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase w-44 shrink-0">
                            Email Address
                        </span>
                        <span className="text-sm text-slate-800 font-medium flex items-center gap-2">
                            {userEmail}
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Managed by Auth
                            </span>
                        </span>
                    </div>

                    {/* GPS Coordinates (read-only — set during registration) */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase w-44 shrink-0">
                            GPS Coordinates
                        </span>
                        {shop.latitude && shop.longitude ? (
                            <span className="text-sm text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                ✓ {shop.latitude.toFixed(5)}, {shop.longitude.toFixed(5)}
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 italic">Not pinned yet</span>
                        )}
                    </div>

                </div>
            </div>

            {/* Back to Dashboard */}
            <div className="mt-6 text-center">
                <a href="/dashboard" className="text-sm text-indigo-600 hover:underline font-semibold">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    );
}

// =========================================================================
// REUSABLE FIELD COMPONENT (View / Edit Toggle)
// =========================================================================
interface FieldProps {
    label: string;
    value: string;
    editing: boolean;
    inputType?: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

function Field({ label, value, editing, inputType = 'text', placeholder = 'Not provided', onChange }: FieldProps) {
    return (
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase w-44 shrink-0">
                {label}
            </span>
            {editing ? (
                <input
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
            ) : (
                <span className="text-sm text-slate-800 font-medium">
                    {value || <span className="text-slate-400 italic">{placeholder}</span>}
                </span>
            )}
        </div>
    );
}
