import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkTrackRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashIp } from "@/lib/hash";

const bodySchema = z.object({
  event: z.string(),
  code: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/track (§9.4, §22.1). Fire-and-forget from the client — always
 * 204, even on bad input, and never blocks the /c/[code] redirect.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await checkTrackRateLimit(ip);
  if (!allowed) return new NextResponse(null, { status: 204 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || parsed.data.event !== "click" || !parsed.data.code) {
    return new NextResponse(null, { status: 204 });
  }

  const code = parsed.data.code.toUpperCase();

  try {
    const supabase = createAdminClient();
    const { data: captain } = await supabase
      .from("captains")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    await supabase.from("captain_clicks").insert({
      captain_code: code,
      captain_id: captain?.id ?? null,
      referrer: request.headers.get("referer"),
      user_agent: request.headers.get("user-agent"),
      ip_hash: hashIp(ip),
    });
  } catch (error) {
    console.error("[track] failed to record click", error);
  }

  return new NextResponse(null, { status: 204 });
}
