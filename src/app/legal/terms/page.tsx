import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Underseat",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: June 23, 2026</p>

      <h2>1. Service description</h2>
      <p>
        Underseat (flypewpet) is a pet carrier compatibility checker for air travel.
        It compares carrier dimensions against published airline in-cabin pet policies
        and provides a Pass / Tight fit / No verdict based on the data we have on file.
      </p>

      <h2>2. Not a guarantee</h2>
      <p>
        <strong>Important:</strong> Underseat is a compatibility research tool, not a
        guarantee of acceptance. Airlines make the final decision at check-in or the
        gate. Always confirm current policy with your airline before traveling. We
        are not responsible for denied boarding, fees, or any other consequences
        resulting from reliance on this tool.
      </p>

      <h2>3. Affiliate disclosure</h2>
      <p>
        Some links on this site are affiliate links. If you click an affiliate link
        and make a purchase, we may earn a commission at no extra cost to you. This
        does not affect which carriers we recommend. Recommendations are based on
        fit data and airline rules, not affiliate relationships.
      </p>

      <h2>4. User submissions</h2>
      <p>
        When you submit a traveler report, airline request, or other feedback, you
        grant us permission to use that information to improve the service. Submitted
        data may be displayed publicly in aggregate form (e.g., &quot;3 travelers
        confirmed this carrier fits on Air Canada&quot;). Do not submit sensitive
        personal information.
      </p>

      <h2>5. Data accuracy</h2>
      <p>
        Airline pet policies change frequently. While we make reasonable efforts to
        keep data current, we cannot guarantee that every rule, dimension, or weight
        limit is up to date. Carrier specifications (dimensions, weight) come from
        manufacturer listings and may vary by production batch.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Underseat and its contributors are
        not liable for any damages arising from use of this service, including but
        not limited to denied boarding, pet-related travel disruptions, or incorrect
        carrier selection.
      </p>

      <h2>7. Changes</h2>
      <p>
        These terms may be updated at any time. Continued use after changes
        constitutes acceptance of the updated terms. Check this page periodically.
      </p>

      <h2>8. Contact</h2>
      <p>
        For questions about these terms, open an issue on the project repository or
        contact the maintainer through the channels listed on the <Link href="/">homepage</Link>.
      </p>
    </article>
  );
}