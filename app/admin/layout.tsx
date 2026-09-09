import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentAdminUser } from "@/lib/admin-auth";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdminUser();

  // The login page itself has no admin session yet — render it bare.
  if (!admin) {
    return <div className="min-h-screen bg-cream">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminNav userName={admin.name} />
      <main className="mx-auto max-w-4xl px-4 py-5">{children}</main>
    </div>
  );
}
