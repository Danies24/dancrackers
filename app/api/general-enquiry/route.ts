import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { nameSchema, phoneSchema } from "@/lib/validation";
import { checkEnquiryRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * A lightweight top-of-funnel lead form (homepage). Deliberately NOT the
 * priced order pipeline in /api/enquiry — no cart, no total, no order
 * reference. It just gets someone a callback. See the general_enquiries
 * migration for why this is a separate table.
 */
const bodySchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  category: z.string().max(80).optional(),
  message: z.string().max(1000).optional(),
  company: z.string().max(0).optional(), // honeypot
  formRenderedAt: z.number().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Please check the form and try again." } },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const tooFast = typeof input.formRenderedAt === "number" && Date.now() - input.formRenderedAt < 3000;
  if (input.company || tooFast) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkEnquiryRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many attempts. Please try again later." } },
      { status: 429 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("general_enquiries").insert({
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    category: input.category || null,
    message: input.message || null,
  });

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "We couldn't save your enquiry. Please call or WhatsApp us instead." } },
      { status: 500 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `📩 Quick enquiry — ${input.name} — ${input.phone}${input.category ? ` — ${input.category}` : ""}${input.message ? `\n"${input.message}"` : ""}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
