/**
 * Generates a captain's QR code PNG plus the ready-to-forward kit text
 * (§20.7). Run after creating the captain row (via SQL, Supabase Studio, or
 * a future admin UI).
 *
 * Usage: npx tsx scripts/generate-qr.ts <CODE> [siteUrl]
 * Example: npx tsx scripts/generate-qr.ts RAJ12 https://kolagalam.example.com
 */
import { config } from "dotenv";
import { writeFile, mkdir } from "node:fs/promises";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { buildCaptainKitMessage } from "../lib/whatsapp";

config({ path: ".env.local" });

async function main() {
  const [, , code, siteUrlArg] = process.argv;
  if (!code) {
    console.error("Usage: tsx scripts/generate-qr.ts <CODE> [siteUrl]");
    process.exit(1);
  }

  const siteUrl = siteUrlArg ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: captain } = await supabase.from("captains").select("code, name").eq("code", code.toUpperCase()).maybeSingle();
    if (!captain) {
      console.warn(`No captain found with code ${code} — generating the QR anyway.`);
    } else {
      console.log(`Captain: ${captain.name} (${captain.code})`);
    }
  }

  const link = `${siteUrl.replace(/\/$/, "")}/c/${code.toUpperCase()}`;
  const outDir = "public/captain-kits";
  await mkdir(outDir, { recursive: true });

  const pngPath = `${outDir}/${code.toUpperCase()}.png`;
  await QRCode.toFile(pngPath, link, { width: 600, margin: 2 });

  const message = buildCaptainKitMessage(code.toUpperCase(), siteUrl);
  const txtPath = `${outDir}/${code.toUpperCase()}.txt`;
  await writeFile(txtPath, `${message}\n\nQR: ${pngPath}\nLink: ${link}\n`);

  console.log(`Wrote ${pngPath}`);
  console.log(`Wrote ${txtPath}`);
  console.log(`\n${message}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
