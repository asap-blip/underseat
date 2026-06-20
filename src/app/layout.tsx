import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "flypewpet — Pet carrier flight compatibility",
  description:
    "Check whether a specific pet carrier meets the in-cabin rules for your exact flight itinerary — leg by leg, with transparent reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="paw-mark h-8 w-8 text-sm">🐾</span>
              <span>flypewpet</span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
              <Link href="/find" className="hover:text-navy">Find a pet carrier</Link>
              <Link href="/carriers" className="hover:text-navy">Shop carriers</Link>
              <Link href="/rules" className="hover:text-navy">Airline pet rules</Link>
              <Link href="/check" className="primary-cta px-4 py-2 text-sm">
                Check my trip
              </Link>
            </nav>
            <Link href="/check" className="primary-cta px-4 py-2 text-sm md:hidden">
              Check my trip
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <footer className="border-t border-stone-200/70 bg-white/70">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs text-slate-500">
            <p>
              flypewpet is a compatibility checker, not a guarantee. Airlines make the
              final acceptance decision at the gate. Always confirm current policy with
              your airline before you travel.
            </p>
            <p>
              Some links on this site are affiliate links. As an Amazon Associate we may earn
              from qualifying purchases. This never affects which carriers we recommend.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
