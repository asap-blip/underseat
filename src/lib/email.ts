import { Resend } from "resend";

const FROM_ADDRESS = "Underseat <notifications@mail.pasawworks.com>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendCarrierSuggestionEmail(data: {
  carrierName: string;
  email?: string;
  submittedAt: Date;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) {
    console.log("📧 [Email skipped] Missing credentials (RESEND_API_KEY or ADMIN_EMAIL)");
    return;
  }

  const resend = getResend();
  if (!resend) {
    console.log("📧 [Email skipped] RESEND_API_KEY not configured");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `📦 New carrier suggestion: ${data.carrierName}`,
      html: `
        <h2>New carrier suggestion</h2>
        <p><strong>Carrier:</strong> ${data.carrierName}</p>
        ${data.email ? `<p><strong>Submitted by:</strong> ${data.email}</p>` : ""}
        <p><strong>Submitted at:</strong> ${data.submittedAt.toLocaleString()}</p>
        <p><a href="https://flypewpet.vercel.app/admin/import-carriers">Add this carrier →</a></p>
      `,
    });
    console.log(`✅ Email sent for carrier suggestion: ${data.carrierName}`, );
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

export async function sendReportNotification(data: {
  carrierName: string;
  airlineName?: string;
  fitStatus: string;
  notes?: string;
  submittedAt: Date;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) {
    console.log("📧 [Email skipped] Missing credentials (RESEND_API_KEY or ADMIN_EMAIL)");
    return;
  }

  const resend = getResend();
  if (!resend) {
    console.log("📧 [Email skipped] RESEND_API_KEY not configured");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `✈️ New carrier report: ${data.carrierName}`,
      html: `
        <h2>New carrier report</h2>
        <p><strong>Carrier:</strong> ${data.carrierName}</p>
        ${data.airlineName ? `<p><strong>Airline:</strong> ${data.airlineName}</p>` : ""}
        <p><strong>Fit status:</strong> ${data.fitStatus}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
        <p><strong>Submitted at:</strong> ${data.submittedAt.toLocaleString()}</p>
        <p><a href="https://flypewpet.vercel.app/admin/reports">Review this report →</a></p>
      `,
    });
    console.log(`✅ Email sent for report: ${data.carrierName}`, );
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}