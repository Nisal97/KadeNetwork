import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KadeNetwork | Inter-Shop Inventory Exchange",
  description: "Find local stock instantly across shop networks in Sri Lanka",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-sm font-extrabold">KN</span>
            KadeNetwork
          </Link>

          <nav className="flex items-center gap-4">
            <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              Shop Login
            </Link>
            <Link
                href="/register"
                className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Register Shop
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} KadeNetwork. Built for local Sri Lankan shop networks.
      </footer>
      </body>
      </html>
  );
}