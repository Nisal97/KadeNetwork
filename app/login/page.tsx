'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [shopName, setShopName] = useState('');
    const [building, setBuilding] = useState('Unity Plaza');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRegister) {
            console.log('Registering Shop:', { shopName, building, email, password });
            alert(`Registration attempt for "${shopName}". Next step: Connect Supabase Auth!`);
        } else {
            console.log('Logging in:', { email, password });
            alert(`Login attempt for "${email}". Next step: Connect Supabase Auth!`);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">

                {/* Form Title Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isRegister ? 'Register Your Kade' : 'Merchant Sign In'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {isRegister
                            ? 'Join the local inter-shop inventory network'
                            : 'Access your inventory dashboard'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Shop / Business Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. TechZone Arcade"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Complex / Location
                                </label>
                                <select
                                    value={building}
                                    onChange={(e) => setBuilding(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                                >
                                    <option value="Unity Plaza">Unity Plaza (Colombo 04)</option>
                                    <option value="Majestic City">Majestic City (Colombo 04)</option>
                                    <option value="Liberty Plaza">Liberty Plaza (Colombo 03)</option>
                                    <option value="Pettah Market">Pettah Market Cluster</option>
                                    <option value="Other">Other / Standalone Store</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="owner@shop.lk"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm mt-2"
                    >
                        {isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                {/* Toggle between Register and Sign In */}
                <div className="mt-6 text-center text-sm text-slate-600">
                    {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        {isRegister ? 'Sign In here' : 'Register your shop'}
                    </button>
                </div>

            </div>
        </div>
    );
}