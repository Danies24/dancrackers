import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: products } = await supabase.from("products").select("name_en, supplier_price, mrp, price").eq("shop_id", "00000000-0000-0000-0000-000000000003").limit(3);
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
