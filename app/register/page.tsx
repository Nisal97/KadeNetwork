'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LocationPickerModal from '../components/LocationPickerModal';

/**
 * RegisterPage Component
 * ----------------------
 * Full shop registration and onboarding form for KadeNetwork with Supabase Backend.
 *
 * Key Functions:
 * 1. Business Details: Shop Name, Owner Name, Complex / Location Cluster, Physical Address.
 * 2. Precision Geolocation: Interactive Google Maps Pin Picker with Places Autocomplete.
 * 3. Mobile SMS OTP Verification (Mock code: 123456) with auto-locking input.
 * 4. Email OTP Verification (Mock code: 654321) with auto-locking input.
 * 5. Password Security & Hold-to-View Toggle + Dynamic Re-type Password Match.
 * 6. Backend Integration: Registers user in Supabase Auth & inserts record into `public.shops`.
 */
export default function RegisterPage() {
    const router = useRouter();

    // =========================================================================
    // 1. BUSINESS & LOCATION STATE
    // =========================================================================
    const [shopName, setShopName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [buildingName, setBuildingName] = useState('Unity Plaza');
    const [address, setAddress] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [geoStatus, setGeoStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // =========================================================================
    // 2. MOBILE VERIFICATION STATE (Primary Contact)
    // =========================================================================
    const [contactNo1, setContactNo1] = useState('');
    const [mobileOtp, setMobileOtp] = useState('');
    const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);

    // Optional Secondary Contact (e.g. landline or alternate mobile)
    const [contactNo2, setContactNo2] = useState('');

    // =========================================================================
    // 3. EMAIL VERIFICATION STATE
    // =========================================================================
    const [email, setEmail] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // =========================================================================
    // 4. SECURITY & PASSWORD STATE
    // =========================================================================
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password criteria validation
    const isLengthValid = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = isLengthValid && hasUppercase && hasNumber && hasSpecialChar;
    const isPasswordMatching = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

    // =========================================================================
    // VERIFICATION & GEOLOCATION HANDLERS
    // =========================================================================

    /**
     * Sends a simulated SMS OTP to the merchant's primary mobile number.
     */
    const handleSendMobileOtp = () => {
        if (!contactNo1 || contactNo1.length < 9) {
            alert('Please enter a valid mobile number first.');
            return;
        }
        setIsMobileOtpSent(true);
        alert(`Mock SMS OTP sent to ${contactNo1}. Use code: 123456`);
    };

    /**
     * Verifies the entered 6-digit SMS OTP against the expected code.
     */
    const handleVerifyMobileOtp = () => {
        if (mobileOtp === '123456') {
            setIsMobileVerified(true);
            alert('Mobile number verified successfully!');
        } else {
            alert('Invalid Mobile OTP. Enter 123456 for testing.');
        }
    };

    /**
     * Sends a simulated Email verification OTP to the merchant's email.
     */
    const handleSendEmailOtp = () => {
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address first.');
            return;
        }
        setIsEmailOtpSent(true);
        alert(`Mock Email OTP sent to ${email}. Use code: 654321`);
    };

    /**
     * Verifies the entered 6-digit Email OTP against the expected code.
     */
    const handleVerifyEmailOtp = () => {
        if (emailOtp === '654321') {
            setIsEmailVerified(true);
            alert('Email verified successfully!');
        } else {
            alert('Invalid Email OTP. Enter 654321 for testing.');
        }
    };

    /**
     * Callback from LocationPickerModal when the merchant confirms location.
     * Updates exact coordinates and auto-populates address if empty.
     */
    const handleLocationConfirm = (data: { lat: number; lng: number; address: string }) => {
        setCoordinates({ lat: data.lat, lng: data.lng });
        setGeoStatus(`GPS pinned: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
        if (data.address && !address) {
            setAddress(data.address);
        }
    };

    /**
     * Main Form Submit Handler (Supabase Integration)
     * ------------------------------------------------
     * 1. Validates verifications & password match.
     * 2. Registers the user via supabase.auth.signUp.
     * 3. Inserts the shop profile into public.shops table.
     * 4. Redirects to /dashboard on success.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Guard Clause: Prevent submission if contact channels are unverified
        if (!isMobileVerified || !isEmailVerified) {
            alert('Please verify both your Mobile Number and Email Address before submitting.');
            return;
        }

        // Guard Clause: Validate password complexity & confirmation match
        if (!isPasswordValid) {
            alert('Please ensure your password has at least 8 characters, 1 uppercase letter, 1 number, and 1 special symbol.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match. Please re-enter matching passwords.');
            return;
        }

        setLoading(true);

        try {
            // 1. Create account in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // If session is null, email confirmation is still enabled in Supabase.
            // The shop insert will fail because auth.uid() returns null without a session.
            if (!authData.session) {
                throw new Error(
                    'Account created but email confirmation is required. Please disable "Enable email confirmations" in your Supabase Authentication settings so the shop profile can be saved immediately.'
                );
            }

            if (authData.user) {
                // 2. Insert Shop Profile linking to auth.user.id
                const { error: shopError } = await supabase.from('shops').insert([
                    {
                        id: authData.user.id,
                        shop_name: shopName,
                        owner_name: ownerName,
                        contact_no_1: contactNo1,
                        contact_no_2: contactNo2 || null,
                        address,
                        building_name: buildingName,
                        latitude: coordinates?.lat || null,
                        longitude: coordinates?.lng || null,
                    },
                ]);

                if (shopError) throw shopError;

                alert('Shop registered successfully!');
                router.push('/dashboard');
            }
        } catch (error: unknown) {
            // Log full error object for debugging
            console.error('Registration error full details:', error);
            // Supabase errors are plain objects with a .message property, not Error instances
            let message = 'An unexpected error occurred';
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                message = String((error as { message: unknown }).message);
            }
            alert(`Registration failed: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                {/* Form Header */}
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Register Shop on KadeNetwork</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Provide your business details and verify your contact channels to join the network.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* =========================================================================
                        SECTION 1: BUSINESS & LOCATION INFORMATION
                        ========================================================================= */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                            1. Shop Information
                        </h3>

                        {/* Shop Name & Owner Name */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Shop Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Apex Tech Computers"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Owner / Manager Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Nimal Perera"
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Complex / Location Cluster Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Complex / Location Cluster <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={buildingName}
                                onChange={(e) => setBuildingName(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white transition"
                            >
                                <option value="Unity Plaza">Unity Plaza (Colombo 04)</option>
                                <option value="Majestic City">Majestic City (Colombo 04)</option>
                                <option value="Liberty Plaza">Liberty Plaza (Colombo 03)</option>
                                <option value="Pettah Market">Pettah Market Cluster</option>
                                <option value="Other">Other / Standalone Store</option>
                            </select>
                        </div>

                        {/* Physical Address Textarea */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Store Address / Floor Details <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={2}
                                placeholder="e.g. Shop #34, 3rd Floor, Unity Plaza, Colombo 04"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none transition"
                            />
                        </div>

                        {/* Google Maps Geolocation Trigger & Status Indicator */}
                        <div className="pt-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(true)}
                                    className="text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2.5 rounded-lg border border-indigo-200 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    <span>📍</span>
                                    <span>
                                        {coordinates
                                            ? 'Change GPS Pin on Google Maps'
                                            : 'Attach Exact GPS Location via Google Maps'}
                                    </span>
                                </button>

                                {/* Visual Confirmation Badge */}
                                {coordinates && (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                                        ✓ Pinned ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
                                    </span>
                                )}
                            </div>
                            {geoStatus && !coordinates && (
                                <span className="text-xs text-slate-500 block">{geoStatus}</span>
                            )}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* =========================================================================
                        SECTION 2: CONTACT NUMBERS & SMS OTP VERIFICATION
                        ========================================================================= */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                            2. Contact Numbers & Verification
                        </h3>

                        {/* Primary Contact with SMS Verification */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Primary Contact No (SMS Verification) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    required
                                    disabled={isMobileVerified}
                                    placeholder="0771234567"
                                    value={contactNo1}
                                    onChange={(e) => setContactNo1(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                                />
                                {!isMobileVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendMobileOtp}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs cursor-pointer whitespace-nowrap"
                                    >
                                        {isMobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                ) : (
                                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1 whitespace-nowrap shadow-xs">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Mobile OTP Input Popup / Box (Shown only after sending OTP and before verification) */}
                        {isMobileOtpSent && !isMobileVerified && (
                            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-indigo-950 uppercase">
                                        Enter Mobile Verification Code (OTP) <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-indigo-700 font-medium">
                                        SMS sent to {contactNo1}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                                        value={mobileOtp}
                                        onChange={(e) => setMobileOtp(e.target.value)}
                                        className="flex-1 px-3.5 py-2 rounded-lg border border-indigo-200 text-sm tracking-widest font-mono text-center focus:ring-2 focus:ring-indigo-600 outline-none bg-white shadow-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyMobileOtp}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                        <span>✓</span> Verify OTP
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    💡 Test code: <strong className="text-indigo-700 font-mono font-bold">123456</strong>. Click <strong>Verify OTP</strong> to lock & verify this contact number.
                                </p>
                            </div>
                        )}

                        {/* Optional Secondary Contact */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Secondary Contact No <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="0112345678"
                                value={contactNo2}
                                onChange={(e) => setContactNo2(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* =========================================================================
                        SECTION 3: CREDENTIALS & EMAIL OTP VERIFICATION
                        ========================================================================= */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                            3. Credentials & Email Verification
                        </h3>

                        {/* Email Input with Verification */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    disabled={isEmailVerified}
                                    placeholder="owner@kade.lk"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                                />
                                {!isEmailVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendEmailOtp}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs cursor-pointer whitespace-nowrap"
                                    >
                                        {isEmailOtpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                ) : (
                                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1 whitespace-nowrap shadow-xs">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Email OTP Input Popup / Box (Shown only after sending OTP and before verification) */}
                        {isEmailOtpSent && !isEmailVerified && (
                            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-indigo-950 uppercase">
                                        Enter Email Verification Code (OTP) <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-indigo-700 font-medium">
                                        OTP sent to {email}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP (e.g. 654321)"
                                        value={emailOtp}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        className="flex-1 px-3.5 py-2 rounded-lg border border-indigo-200 text-sm tracking-widest font-mono text-center focus:ring-2 focus:ring-indigo-600 outline-none bg-white shadow-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyEmailOtp}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                        <span>✓</span> Verify OTP
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    💡 Test code: <strong className="text-indigo-700 font-mono font-bold">654321</strong>. Click <strong>Verify OTP</strong> to lock & verify this email.
                                </p>
                            </div>
                        )}

                        {/* =========================================================================
                            PASSWORD & CONFIRM PASSWORD WITH CRITERIA & PEEK-TO-VIEW
                            ========================================================================= */}
                        <div className="space-y-3 pt-1">
                            {/* Password Requirements Helper Notice (displayed before typing) */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                                <span className="font-bold text-slate-800 block">
                                    🔒 Password Security Requirements:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                                    <div className={`flex items-center gap-1.5 transition-colors ${isLengthValid ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <span>{isLengthValid ? '✓' : '○'}</span>
                                        <span>At least 8 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 transition-colors ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <span>{hasUppercase ? '✓' : '○'}</span>
                                        <span>1 Uppercase letter (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 transition-colors ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <span>{hasNumber ? '✓' : '○'}</span>
                                        <span>1 Number (0-9)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 transition-colors ${hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <span>{hasSpecialChar ? '✓' : '○'}</span>
                                        <span>1 Special symbol (!@#$...)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Password Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-3.5 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
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

                            {/* Re-type / Confirm Password Input (Appears dynamically once user starts entering password) */}
                            {password.length > 0 && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Re-type Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-3.5 pr-11 py-2.5 rounded-lg border text-sm outline-none transition ${
                                                confirmPassword.length > 0
                                                    ? isPasswordMatching
                                                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500'
                                                        : 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                                                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-600'
                                            }`}
                                        />
                                        {/* Hold-to-View Confirm Password Button */}
                                        <button
                                            type="button"
                                            title="Click and hold to view password"
                                            onMouseDown={() => setShowConfirmPassword(true)}
                                            onMouseUp={() => setShowConfirmPassword(false)}
                                            onMouseLeave={() => setShowConfirmPassword(false)}
                                            onTouchStart={() => setShowConfirmPassword(true)}
                                            onTouchEnd={() => setShowConfirmPassword(false)}
                                            className="absolute right-3 text-slate-400 hover:text-slate-600 select-none p-1 cursor-pointer"
                                        >
                                            {showConfirmPassword ? '👁️' : '🙈'}
                                        </button>
                                    </div>

                                    {/* Password Matching Live Indicator */}
                                    {confirmPassword.length > 0 && (
                                        <div className="text-[11px] pt-0.5">
                                            {isPasswordMatching ? (
                                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                                    ✓ Passwords match
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 font-semibold flex items-center gap-1">
                                                    ✕ Passwords do not match
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =========================================================================
                        SUBMIT BUTTON
                        Protected by mobile, email, and password match verifications.
                        ========================================================================= */}
                    <button
                        type="submit"
                        disabled={
                            !isMobileVerified ||
                            !isEmailVerified ||
                            !isPasswordValid ||
                            !isPasswordMatching ||
                            loading
                        }
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? 'Creating Shop Account...' : 'Complete Registration'}
                    </button>
                </form>

                {/* Navigation link to sign in */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Already registered?{' '}
                    <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                        Sign In here
                    </Link>
                </p>
            </div>

            {/* =========================================================================
                GOOGLE MAPS INTERACTIVE LOCATION PICKER MODAL
                Renders only when triggered by user click on the GPS button.
                ========================================================= */}
            <LocationPickerModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                initialCoordinates={coordinates}
                initialAddress={address}
                onConfirm={handleLocationConfirm}
            />
        </div>
    );
}