import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: shop } = await supabase.from("shops").select("id").eq("slug", "gurusamy-fireworks").single();
  const { data: matches } = await supabase
      .from("products")
      .select("id, name_en")
      .eq("shop_id", shop.id)
      .ilike("name_en", `%bomb%`);
  console.log(matches);
}
main();
