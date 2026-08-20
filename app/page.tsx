import Link from "next/link";

/**
 * HomePage Component
 * ------------------
 * The public landing page for KadeNetwork.
 *
 * Key Functions:
 * 1. Hero Section: Introduces the platform's core value proposition (inter-shop stock sharing in Sri Lanka).
 * 2. Primary CTAs: Directs new shop owners to `/register` and existing merchants to `/login`.
 * 3. Feature Grid: Highlights key platform capabilities (Hyper-Local Radius Search, B2B Trade Pricing, Direct Click-to-Call).
 */
export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      {/* =========================================================================
          HERO SECTION
          Highlights the target audience (Local merchants in Sri Lanka).
          ========================================================================= */}
      <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
        Connecting Local Merchants in Sri Lanka
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
        Never turn down a walk-in customer again.
      </h1>

      {/* Sub-headline / Elevator Pitch */}
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
        Instantly check stock availability across neighboring shops in Unity Plaza,
        Majestic City, or your local market cluster. Get trade pricing and make the sale together.
      </p>

      {/* =========================================================================
          CALL TO ACTION (CTA) BUTTONS
          - Primary button routes to dedicated shop registration (/register)
          - Secondary button routes to merchant login (/login)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        {/* Register CTA */}
        <Link
          href="/register"
          className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition text-center"
        >
          Register Your Shop
        </Link>

        {/* Existing Merchant Sign In */}
        <Link
          href="/login"
          className="bg-white border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition text-center"
        >
          Existing Merchant Login
        </Link>
      </div>

      {/* =========================================================================
          FEATURE HIGHLIGHTS GRID
          Explains the 3 core functional pillars of KadeNetwork.
          ========================================================================= */}
      <div className="grid md:grid-cols-3 gap-6 text-left border-t border-slate-200 pt-12">
        {/* Feature 1: Proximity & Geolocation Search */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">
            📍
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Hyper-Local Radius Search</h3>
          <p className="text-sm text-slate-600">
            Search stock within 500m, 1km, or specific shopping complex floors.
          </p>
        </div>

        {/* Feature 2: Wholesale & Margin Protection */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">
            🤝
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Trade Pricing (B2B)</h3>
          <p className="text-sm text-slate-600">
            View peer-to-peer trade prices to maintain margins on shared sales.
          </p>
        </div>

        {/* Feature 3: Real-Time Merchant Communication */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">
            ⚡
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Direct Click-to-Call</h3>
          <p className="text-sm text-slate-600">
            Instantly dial neighboring shop owners with a single tap on your phone.
          </p>
        </div>
      </div>
    </div>
  );
}