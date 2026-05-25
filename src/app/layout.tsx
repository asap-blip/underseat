import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "flypewpet — Will your pet carrier fly?",
  description:
    "Check whether a specific pet carrier meets the in-cabin rules for your exact flight itinerary — leg by leg, with transparent reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">✈</span>
              flypewpet
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/carriers" className="hover:text-slate-900">Carriers</Link>
              <Link href="/check" className="hover:text-slate-900">Check a trip</Link>
              <Link href="/merchant/petgearco" className="hover:text-slate-900">For merchants</Link>
              <Link
                href="/check"
                className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Start check
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
            flypewpet is a compatibility checker, not a guarantee. Airlines make the
            final acceptance decision at the gate. Always confirm current policy with
            your airline before you travel.
          </div>
        </footer>
      </body>
    </html>
  );
}
