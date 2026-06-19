"use client";

export function MerchantSignupForm() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">Get started</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign up and get your embed code in under 5 minutes. No credit card required for Starter.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Thanks! We'll be in touch soon. For now, use the embed snippet below.");
        }}
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Store name</label>
          <input
            type="text"
            required
            placeholder="PetGear Co."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            type="email"
            required
            placeholder="you@store.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Website</label>
          <input
            type="url"
            placeholder="https://yourstore.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Monthly traffic</label>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="">Select…</option>
            <option value="under-10k">Under 10k visits</option>
            <option value="10k-50k">10k – 50k visits</option>
            <option value="50k-200k">50k – 200k visits</option>
            <option value="200k+">200k+ visits</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create my account
          </button>
        </div>
      </form>
    </section>
  );
}
