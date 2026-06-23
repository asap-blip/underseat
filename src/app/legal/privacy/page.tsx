import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Underseat",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm prose-slate max-w-3xl mx-auto leading-relaxed">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: June 23, 2026</p>

      <h2>1. What we collect</h2>
      <p>
        We collect only the information you voluntarily provide through our forms:
      </p>
      <ul>
        <li>
          <strong>Trip details</strong> — airline, cabin, pet weight, carrier dimensions.
          These are processed on the server and retained briefly for result sharing.
        </li>
        <li>
          <strong>Email address</strong> — when you submit a form (save a check, request
          an airline, or report a carrier). We use this only to respond or follow up
          on that submission.
        </li>
        <li>
          <strong>Traveler reports</strong> — airline, carrier, fit outcome, and optional
          notes. These are used to improve carrier recommendations. No personally
          identifying information is required.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>Process compatibility checks you request</li>
        <li>Improve carrier and airline data</li>
        <li>Respond to your questions or submissions</li>
        <li>Monitor aggregate usage (page views, clicks)</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your data, share it with advertisers, or use it
        for behavioral profiling.
      </p>

      <h2>3. Affiliate links</h2>
      <p>
        Some outbound links to merchant sites (Amazon, Chewy, etc.) are affiliate links.
        When you click one and make a purchase, we may earn a small commission at no
        extra cost to you. These clicks are tracked anonymously so we can measure
        conversion. No personal data is shared with the affiliate network.
      </p>

      <h2>4. Not a guarantee</h2>
      <p>
        Underseat is a compatibility checker, not a guarantee. We provide information
        based on published airline rules and user reports, but the final acceptance
        decision is always made by the airline. Always confirm current policy directly
        with your airline before travel.
      </p>

      <h2>5. Cookies</h2>
      <p>
        This site uses minimal cookies for essential functionality (session management).
        We do not use third-party tracking cookies. If you use the affiliate links,
        the merchant site (e.g., Amazon) may set its own cookies, which are governed
        by that site&apos;s privacy policy.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain submitted data only as long as needed to provide the service. You
        may request deletion of your data by contacting us. Report data (airline,
        carrier, outcome) is retained in aggregate for recommendation quality even
        after personal information is removed.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        We use trusted third-party infrastructure providers to host our service.
        These providers do not access your data for their own purposes.
      </p>

      <h2>8. Contact</h2>
      <p>
        If you have questions about this policy or want to request data removal, email
        the project maintainer at the address listed on the repository.
      </p>
    </article>
  );
}