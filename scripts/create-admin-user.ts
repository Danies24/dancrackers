/**
 * Creates (or updates the password for) an admin user in Supabase Auth plus
 * the matching admin_users profile row (§21.10). Run against local dev or a
 * real project by pointing the env vars at it.
 *
 * Usage: npx tsx scripts/create-admin-user.ts <email> <password> <name> [owner|staff]
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const [, , email, password, name, role = "staff"] = process.argv;
  if (!email || !password || !name) {
    console.error("Usage: tsx scripts/create-admin-user.ts <email> <password> <name> [owner|staff]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let authUserId = created?.user?.id;

  if (createError) {
    if (createError.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (!existing) throw createError;
      authUserId = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, { password });
      console.log(`User already existed — password updated for ${email}`);
    } else {
      throw createError;
    }
  } else {
    console.log(`Created auth user ${email}`);
  }

  const { error: profileError } = await supabase
    .from("admin_users")
    .upsert({ auth_user_id: authUserId, email, name, role }, { onConflict: "email" });

  if (profileError) throw profileError;

  console.log(`admin_users profile ready for ${email} (${role})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
