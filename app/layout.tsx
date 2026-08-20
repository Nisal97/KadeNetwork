import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

/**
 * Global Metadata Configuration for SEO and Social Sharing.
 * Next.js automatically injects this into the HTML <head>.
 */
export const metadata: Metadata = {
  title: "KadeNetwork | Inter-Shop Inventory Exchange",
  description: "Find local stock instantly across shop networks in Sri Lanka",
};

/**
 * RootLayout Component
 * --------------------
 * The root layout wraps all pages in the application.
 * It provides:
 * 1. Global typography and background styling (via Tailwind CSS).
 * 2. Sticky/Top Header Navigation with branding and quick links.
 * 3. Dynamic page content injection via `{children}`.
 * 4. Global footer with copyright information.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        {/* =========================================================================
            HEADER / TOP NAVIGATION BAR
            Provides brand identification and top-level navigation routes.
            ========================================================================= */}
        <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Brand Logo & Name */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:opacity-90 transition"
            >
              <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-sm font-extrabold shadow-xs">
                KN
              </span>
              <span>KadeNetwork</span>
            </Link>

            {/* Navigation Action Links */}
            <nav className="flex items-center gap-4">
              {/* Existing Merchant Login */}
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition px-2 py-1"
              >
                Shop Login
              </Link>

              {/* Shop Registration CTA */}
              <Link
                href="/register"
                className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-xs"
              >
                Register Shop
              </Link>
            </nav>
          </div>
        </header>

        {/* =========================================================================
            MAIN CONTENT CONTAINER
            Renders the active route's page component (e.g. Home, Login, Register).
            ========================================================================= */}
        <main className="flex-1">{children}</main>

        {/* =========================================================================
            GLOBAL FOOTER
            Displays copyright and regional network description.
            ========================================================================= */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} KadeNetwork. Built for local Sri Lankan shop networks.
        </footer>
      </body>
    </html>
  );
}