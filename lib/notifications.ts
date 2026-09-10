import "server-only";
import { Resend } from "resend";
import { formatRupees } from "./format";

/**
 * §18. Three independent channels after the DB write commits. Every
 * failure here is logged, never thrown — the enquiry is already durably
 * stored, so a dead email provider must never fail the request (§16.5 step 9).
 */

export interface NotificationOrder {
  orderRef: string;
  name: string;
  phone: string;
  city: string;
  pincode: string;
  grandTotal: number;
  captainCode?: string;
  notes?: string;
  itemLines: string[]; // pre-formatted "1. Seven Shot — 10 pkt — ₹1,440"
  adminOrderUrl: string;
}

export async function sendEnquiryNotifications(order: NotificationOrder): Promise<void> {
  await Promise.allSettled([sendEmailNotification(order), sendTelegramNotification(order)]);
}

async function sendEmailNotification(order: NotificationOrder): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const dan = process.env.NOTIFY_EMAIL_DAN;
  const arun = process.env.NOTIFY_EMAIL_ARUN;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || (!dan && !arun)) {
    console.warn(`[notifications] Resend not configured — skipped email for ${order.orderRef}`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const to = [dan, arun].filter((v): v is string => Boolean(v));
    await resend.emails.send({
      from,
      to,
      subject: `🎆 New enquiry ${order.orderRef} — ${formatRupees(order.grandTotal)} — ${order.city} — via ${order.captainCode ?? "DIRECT"}`,
      html: buildEmailHtml(order),
    });
  } catch (error) {
    console.error(`[notifications] Email failed for ${order.orderRef}`, error);
  }
}

function buildEmailHtml(order: NotificationOrder): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>New enquiry ${order.orderRef}</h2>
      <p><strong>${order.name}</strong> — <a href="tel:+91${order.phone}">${order.phone}</a></p>
      <p>${order.city} ${order.pincode}</p>
      <p>${order.itemLines.join("<br/>")}</p>
      <p><strong>Total: ${formatRupees(order.grandTotal)}</strong></p>
      <p>Captain: ${order.captainCode ?? "DIRECT"}</p>
      ${order.notes ? `<p>Notes: ${order.notes}</p>` : ""}
      <p><a href="${order.adminOrderUrl}">Open in admin →</a></p>
    </div>
  `;
}

async function sendTelegramNotification(order: NotificationOrder): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = [process.env.TELEGRAM_CHAT_ID_DAN, process.env.TELEGRAM_CHAT_ID_ARUN].filter(
    (v): v is string => Boolean(v),
  );
  if (!token || chatIds.length === 0) {
    console.warn(`[notifications] Telegram not configured — skipped for ${order.orderRef}`);
    return;
  }

  const text = [
    `🎆 New enquiry ${order.orderRef} — ${formatRupees(order.grandTotal)} — ${order.city} — via ${order.captainCode ?? "DIRECT"}`,
    "",
    `${order.name} — ${order.phone}`,
    `${order.city} ${order.pincode}`,
    "",
    ...order.itemLines,
    "",
    `Total: ${formatRupees(order.grandTotal)}`,
    order.notes ? `Notes: ${order.notes}` : "",
    order.adminOrderUrl,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
        if (!res.ok) {
          console.error(`[notifications] Telegram responded ${res.status} for ${order.orderRef} (chat ${chatId})`);
        }
      } catch (error) {
        console.error(`[notifications] Telegram failed for ${order.orderRef} (chat ${chatId})`, error);
      }
    }),
  );
}

export interface DigestOrder {
  orderRef: string;
  name: string;
  city: string;
  grandTotal: number;
  ageHours: number;
}

export interface DigestInput {
  newSinceLastDigest: DigestOrder[];
  slaBreaches: DigestOrder[]; // NEW and older than 2 hours — highlighted (§18.6)
  confirmedAwaitingPayment: DigestOrder[];
}

/**
 * §18.6. The 09:00/18:00 IST safety-net digest — catches a silent
 * notification outage by summarising state independently of the
 * per-enquiry alerts.
 */
export async function sendDigestEmail(input: DigestInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const dan = process.env.NOTIFY_EMAIL_DAN;
  const arun = process.env.NOTIFY_EMAIL_ARUN;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || (!dan && !arun)) {
    console.warn("[digest] Resend not configured — skipping digest email");
    return;
  }

  const rows = (orders: DigestOrder[]) =>
    orders.length === 0
      ? "<p>None.</p>"
      : `<ul>${orders
          .map((o) => `<li>${o.orderRef} — ${o.name} — ${o.city} — ${formatRupees(o.grandTotal)} (${o.ageHours.toFixed(1)}h)</li>`)
          .join("")}</ul>`;

  const subject =
    input.slaBreaches.length > 0
      ? `⚠️ Digest: ${input.slaBreaches.length} SLA breach(es), ${input.newSinceLastDigest.length} new`
      : `Digest: ${input.newSinceLastDigest.length} new enquiries`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>Dan Crackers — digest</h2>
      ${input.slaBreaches.length > 0 ? `<h3 style="color:#B3261E">SLA breach — over 2h, no contact</h3>${rows(input.slaBreaches)}` : ""}
      <h3>New since last digest</h3>
      ${rows(input.newSinceLastDigest)}
      <h3>Confirmed, awaiting payment</h3>
      ${rows(input.confirmedAwaitingPayment)}
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const to = [dan, arun].filter((v): v is string => Boolean(v));
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error("[digest] send failed", error);
  }
}
