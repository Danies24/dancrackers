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
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
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

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error(`[notifications] Telegram responded ${res.status} for ${order.orderRef}`);
    }
  } catch (error) {
    console.error(`[notifications] Telegram failed for ${order.orderRef}`, error);
  }
}
