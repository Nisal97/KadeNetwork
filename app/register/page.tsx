'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LocationPickerModal from '../components/LocationPickerModal';

/**
 * RegisterPage Component
 * ----------------------
 * Full shop registration and onboarding form for KadeNetwork.
 *
 * Key Functions:
 * 1. Collects Business & Shop Details (Shop Name, Owner Name, Physical Address).
 * 2. Integrates Google Maps Modal for pinpoint GPS accuracy (latitude & longitude) and Places Autocomplete.
 * 3. Two-Channel Verification:
 *    - Mobile SMS OTP Verification (prevents fraudulent accounts).
 *    - Email OTP Verification (ensures valid credentials).
 * 4. Password and Security setup.
 * 5. Guard Clause: Disables form submission until both Mobile and Email are verified.
 */
export default function RegisterPage() {
    // =========================================================================
    // 1. BUSINESS & SHOP STATE
    // =========================================================================
    const [shopName, setShopName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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
    // 4. SECURITY & GEOLOCATION STATE
    // =========================================================================
    const [password, setPassword] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [geoStatus, setGeoStatus] = useState<string>('');

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
     * Main Form Submit Handler
     * -------------------------
     * Enforces required verification checks and constructs the final merchant payload.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Guard Clause: Prevent submission if contact channels are unverified
        if (!isMobileVerified || !isEmailVerified) {
            alert('Please verify both your Mobile Number and Email Address before submitting.');
            return;
        }

        const payload = {
            shopName,
            ownerName,
            contactNo1,
            contactNo2: contactNo2 || null,
            address,
            email,
            password,
            latitude: coordinates?.lat || null,
            longitude: coordinates?.lng || null,
            isMobileVerified,
            isEmailVerified,
        };

        console.log('Registration Payload:', payload);
        // Future backend integration:
        // await supabase.from('shops').insert([payload]);
        alert('Shop Registration Complete! Next step: Supabase API payload integration.');
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

                        {/* Physical Address Textarea */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Store Address / Location <span className="text-red-500">*</span>
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
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100 transition"
                                />
                                {!isMobileVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendMobileOtp}
                                        className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                    >
                                        {isMobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                ) : (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Mobile OTP Input (Shown only after sending OTP) */}
                        {isMobileOtpSent && !isMobileVerified && (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit Mobile OTP"
                                    value={mobileOtp}
                                    onChange={(e) => setMobileOtp(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm outline-none bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyMobileOtp}
                                    className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded hover:bg-emerald-700 transition cursor-pointer"
                                >
                                    Verify Code
                                </button>
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
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100 transition"
                                />
                                {!isEmailVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendEmailOtp}
                                        className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                    >
                                        {isEmailOtpSent ? 'Resend Code' : 'Send Code'}
                                    </button>
                                ) : (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Email OTP Input (Shown only after sending OTP) */}
                        {isEmailOtpSent && !isEmailVerified && (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit Email Code"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm outline-none bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyEmailOtp}
                                    className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded hover:bg-emerald-700 transition cursor-pointer"
                                >
                                    Verify Code
                                </button>
                            </div>
                        )}

                        {/* Account Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* =========================================================================
                        SUBMIT BUTTON
                        Protected by verification checks.
                        ========================================================================= */}
                    <button
                        type="submit"
                        disabled={!isMobileVerified || !isEmailVerified}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed mt-4 cursor-pointer"
                    >
                        Complete Registration
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