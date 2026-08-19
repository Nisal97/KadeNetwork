'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
    // --- Form State ---
    const [shopName, setShopName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');

    // Mobile Verification State
    const [contactNo1, setContactNo1] = useState('');
    const [mobileOtp, setMobileOtp] = useState('');
    const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);

    // Optional Contact No 2
    const [contactNo2, setContactNo2] = useState('');

    // Email Verification State
    const [email, setEmail] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // Security & Geolocation
    const [password, setPassword] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [geoStatus, setGeoStatus] = useState<string>('');

    // --- Handlers ---

    // Request Mobile OTP (Simulated mock function)
    const handleSendMobileOtp = () => {
        if (!contactNo1 || contactNo1.length < 9) {
            alert('Please enter a valid mobile number first.');
            return;
        }
        setIsMobileOtpSent(true);
        alert(`Mock SMS OTP sent to ${contactNo1}. Use code: 123456`);
    };

    const handleVerifyMobileOtp = () => {
        if (mobileOtp === '123456') {
            setIsMobileVerified(true);
            alert('Mobile number verified successfully!');
        } else {
            alert('Invalid Mobile OTP. Enter 123456 for testing.');
        }
    };

    // Request Email OTP (Simulated mock function)
    const handleSendEmailOtp = () => {
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address first.');
            return;
        }
        setIsEmailOtpSent(true);
        alert(`Mock Email OTP sent to ${email}. Use code: 654321`);
    };

    const handleVerifyEmailOtp = () => {
        if (emailOtp === '654321') {
            setIsEmailVerified(true);
            alert('Email verified successfully!');
        } else {
            alert('Invalid Email OTP. Enter 654321 for testing.');
        }
    };

    // Capture GPS Location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setGeoStatus('Geolocation is not supported by your browser');
            return;
        }
        setGeoStatus('Fetching location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setGeoStatus('Location attached successfully!');
            },
            () => {
                setGeoStatus('Unable to retrieve your location. Please check browser permissions.');
            }
        );
    };

    // Submit Handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Guard Clause: Prevent submission if verifications are missing
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
        alert('Shop Registration Complete! Next step: Supabase API payload integration.');
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Register Shop on KadeNetwork</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Provide your business details and verify your contact channels to join the network.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Business Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">1. Shop Information</h3>

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
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
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
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                                />
                            </div>
                        </div>

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
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                            />
                        </div>

                        {/* Geolocation Hook */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-300 transition"
                            >
                                📍 Attach Exact GPS Location
                            </button>
                            {geoStatus && <span className="text-xs text-slate-500">{geoStatus}</span>}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 2: Contact Numbers & Mobile Verification */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">2. Contact Numbers & Verification</h3>

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
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100"
                                />
                                {!isMobileVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendMobileOtp}
                                        className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
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

                        {/* Mobile OTP Field */}
                        {isMobileOtpSent && !isMobileVerified && (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit Mobile OTP"
                                    value={mobileOtp}
                                    onChange={(e) => setMobileOtp(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyMobileOtp}
                                    className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded hover:bg-emerald-700 transition"
                                >
                                    Verify Code
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Secondary Contact No <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="0112345678"
                                value={contactNo2}
                                onChange={(e) => setContactNo2(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 3: Credentials & Email Verification */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">3. Credentials & Email Verification</h3>

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
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100"
                                />
                                {!isEmailVerified ? (
                                    <button
                                        type="button"
                                        onClick={handleSendEmailOtp}
                                        className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        {isEmailOtpSent ? 'Resend Link' : 'Send Code'}
                                    </button>
                                ) : (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center">
                    ✓ Verified
                  </span>
                                )}
                            </div>
                        </div>

                        {/* Email OTP Field */}
                        {isEmailOtpSent && !isEmailVerified && (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit Email Code"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyEmailOtp}
                                    className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded hover:bg-emerald-700 transition"
                                >
                                    Verify Code
                                </button>
                            </div>
                        )}

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
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!isMobileVerified || !isEmailVerified}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed mt-4"
                    >
                        Complete Registration
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Already registered?{' '}
                    <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                        Sign In here
                    </Link>
                </p>
            </div>
        </div>
    );
}