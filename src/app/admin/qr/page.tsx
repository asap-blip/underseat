import QRCode from "qrcode";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const QR_SIZE = 220;

function isVerified(verification: string) {
  return verification === "team_verified" || verification === "traveler_reported";
}

export default async function QrAdminPage() {
  const repo = getRepository();
  const carriers = await repo.listCarriers();
  const verified = carriers.filter((c) => isVerified(c.verification));

  // Generate QR codes server-side
  const qrCodes = await Promise.all(
    verified.map(async (carrier) => {
      const url = `https://underseat.vercel.app/qr/${carrier.id}`;
      let dataUrl: string;
      try {
        dataUrl = await QRCode.toDataURL(url, {
          width: QR_SIZE,
          margin: 2,
          color: { dark: "#1e293b", light: "#ffffff" },
        });
      } catch {
        dataUrl = "";
      }
      return { carrier, url, dataUrl };
    }),
  );

  // Build a simple text-based CSV-style list for batch download
  const csvLines = verified.map((c) => `https://underseat.vercel.app/qr/${c.id}`);
  const csvBlob = csvLines.join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">QR codes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate QR codes for pet store shelf tags. Each code links to{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/qr/[carrierSlug]</code>.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Showing {verified.length} verified carriers ({carriers.length - verified.length} unverified hidden).
          </p>
        </div>
        <a
          download="underseat-qr-urls.txt"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(csvBlob)}`}
          className="rounded-xl bg-navy px-4 py-2 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
        >
          Download URLs (.txt)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {qrCodes.map(({ carrier, url, dataUrl }) => (
          <div
            key={carrier.id}
            className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm"
          >
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR code for ${carrier.brand} ${carrier.model}`}
                width={QR_SIZE}
                height={QR_SIZE}
                className="rounded-lg"
              />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
                Failed to generate
              </div>
            )}

            <div className="mt-3 min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-caramel">
                {carrier.brand}
              </div>
              <div className="truncate text-sm font-extrabold text-navy">{carrier.model}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {carrier.weightKg} kg · {carrier.lengthCm}×{carrier.widthCm}×{carrier.heightCm} cm
              </div>
            </div>

            <div className="mt-3 flex w-full gap-1.5">
              <a
                download={`qr-${carrier.id}.png`}
                href={dataUrl}
                className="flex-1 rounded-lg bg-brand-100 px-2 py-1.5 text-[11px] font-extrabold text-caramel transition-colors hover:bg-brand-200"
              >
                Download
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-stone-50"
              >
                Preview
              </a>
            </div>
          </div>
        ))}
      </div>

      {verified.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-slate-400">
          No verified carriers found. QR codes are only generated for carriers with verified status.
        </div>
      )}

      <p className="text-xs text-slate-400">
        QR codes link to <code>https://underseat.vercel.app/qr/[slug]</code>. Renders at {QR_SIZE}×{QR_SIZE} px.
        Printed at 300 DPI that is roughly 1.8 × 1.8 in (4.6 cm). Right-click any QR to copy or save individually.
      </p>
    </div>
  );
}