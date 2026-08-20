import type { Metadata } from "next";
import NavBar from "./components/NavBar";
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
 * 2. Sticky/Top Header Navigation via <NavBar> (auth-aware client component).
 *    - Guest: shows "Shop Login" and "Register Shop" buttons.
 *    - Logged in: shows "My Account" and "Sign Out" buttons.
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
            HEADER / TOP NAVIGATION BAR (auth-aware)
            Switches between guest and authenticated nav items based on session.
            ========================================================================= */}
        <NavBar />

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