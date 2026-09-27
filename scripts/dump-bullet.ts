import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: shop } = await supabase.from("shops").select("*").ilike("name_en", "%bullet%").single();
  console.log(JSON.stringify(shop, null, 2));
}

main().catch(console.error);
