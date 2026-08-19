import Link from "next/link";

export default function HomePage() {
  return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        {/* Hero Section */}
        <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
          Connecting Local Merchants in Sri Lanka
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Never turn down a walk-in customer again.
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Instantly check stock availability across neighboring shops in Unity Plaza, Majestic City, or your local market cluster. Get trade pricing and make the sale together.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
              href="/login?mode=register"
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition text-center"
          >
            Register Your Shop
          </Link>
          <Link
              href="/login"
              className="bg-white border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition text-center"
          >
            Existing Merchant Login
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-6 text-left border-t border-slate-200 pt-12">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">📍</div>
            <h3 className="font-bold text-slate-900 mb-2">Hyper-Local Radius Search</h3>
            <p className="text-sm text-slate-600">Search stock within 500m, 1km, or specific shopping complex floors.</p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">🤝</div>
            <h3 className="font-bold text-slate-900 mb-2">Trade Pricing (B2B)</h3>
            <p className="text-sm text-slate-600">View peer-to-peer trade prices to maintain margins on shared sales.</p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">⚡</div>
            <h3 className="font-bold text-slate-900 mb-2">Direct Click-to-Call</h3>
            <p className="text-sm text-slate-600">Instantly dial neighboring shop owners with a single tap on your phone.</p>
          </div>
        </div>
      </div>
  );
}