import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: shops, error } = await supabase.from("shops").select("id, name_en, slug, status");
  if (error) console.error(error);
  else console.table(shops);
}
main();
