import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Looking for Bullet Crackers shop...");
  
  const { data: shops, error: fetchErr } = await supabase
    .from("shops")
    .select("id, name_en, slug, status")
    .ilike("name_en", "%bullet%");

  if (fetchErr) {
    console.error("Failed to fetch shops:", fetchErr);
    process.exit(1);
  }

  if (!shops || shops.length === 0) {
    console.error("Could not find any shop matching 'bullet'");
    process.exit(1);
  }

  for (const shop of shops) {
    console.log(`Found shop: ${shop.name_en} (Current status: ${shop.status})`);
    const { error: updateErr } = await supabase
      .from("shops")
      .update({ status: "active" })
      .eq("id", shop.id);
      
    if (updateErr) {
      console.error(`Failed to enable ${shop.name_en}:`, updateErr);
    } else {
      console.log(`Successfully enabled ${shop.name_en}!`);
    }
  }
}

main().catch(console.error);
