"use client";

import { useState } from "react";

export function MerchantSignupForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="soft-panel p-6">
      <h2 className="text-xl font-semibold text-slate-900">Get started</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign up and get your embed code in under 5 minutes. No credit card required for Starter.
      </p>
      {submitted ? (
        <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Thanks! We&apos;ll be in touch soon. For now, use the embed snippet below.
        </p>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="soft-label">Store name</label>
          <input
            type="text"
            required
            placeholder="PetGear Co."
            className="soft-input"
          />
        </div>
        <div>
          <label className="soft-label">Email</label>
          <input
            type="email"
            required
            placeholder="you@store.com"
            className="soft-input"
          />
        </div>
        <div>
          <label className="soft-label">Website</label>
          <input
            type="url"
            placeholder="https://yourstore.com"
            className="soft-input"
          />
        </div>
        <div>
          <label className="soft-label">Monthly traffic</label>
          <select className="soft-input">
            <option value="">Select…</option>
            <option value="under-10k">Under 10k visits</option>
            <option value="10k-50k">10k to 50k visits</option>
            <option value="50k-200k">50k to 200k visits</option>
            <option value="200k+">200k+ visits</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitted}
            className="primary-cta px-6 py-2.5 text-sm disabled:opacity-60"
          >
            Create my account
          </button>
        </div>
      </form>
      )}
    </section>
  );
}
