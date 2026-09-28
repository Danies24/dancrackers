import { NextResponse } from "next/server";
import { z } from "zod";
import { putSharedCart } from "@/lib/cart-share-store";

const bodySchema = z.object({
  shopSlug: z.string().trim().min(1).max(80),
  items: z
    .array(
      z.object({
        slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(120),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(300),
});

/**
 * POST /api/cart/share. Only used when the compact ?s=&i= link would exceed
 * SHARE_URL_LENGTH_LIMIT (lib/cart-share.ts) — persists the item list (no
 * prices) and returns a short id for /cart/shared?id=... to resolve.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid cart." } },
      { status: 400 },
    );
  }

  const id = await putSharedCart(parsed.data);
  if (!id) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Sharing a cart this large isn't available right now." } },
      { status: 503 },
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
