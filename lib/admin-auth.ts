import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "staff";
}

/** The proxy (middleware) already guards the route; this fetches the profile for display. */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("id, email, name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data as AdminUser | null;
}
