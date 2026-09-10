import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCaptainStats } from "@/lib/captain-stats";
import { CaptainDetailClient } from "@/components/admin/captain-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminCaptainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: captain }, { data: orders }] = await Promise.all([
    supabase.from("captains").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("captain_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!captain) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${siteUrl.replace(/\/$/, "")}/c/${captain.code}`;
  const qrDataUrl = await QRCode.toDataURL(link, { width: 400, margin: 2 });

  const statsByCaptain = computeCaptainStats(orders ?? []);
  const stats = statsByCaptain.get(id) ?? {
    totalOrders: 0,
    deliveredOrders: 0,
    distinctCustomers: 0,
    revenue: 0,
    commissionEarned: 0,
    commissionPayable: 0,
  };

  return (
    <CaptainDetailClient
      initialCaptain={captain}
      recentOrders={orders ?? []}
      stats={stats}
      link={link}
      qrDataUrl={qrDataUrl}
      siteUrl={siteUrl}
    />
  );
}
