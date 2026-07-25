import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimPartnerInvitations } from "@/lib/partners";

export const dynamic = "force-dynamic";

export default async function PartnerIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/partner");
  await claimPartnerInvitations(user);
  const { data } = await createAdminClient().from("partner_memberships").select("organization_id").eq("user_id", user.id).eq("status", "active").order("created_at").limit(1).maybeSingle();
  if (data?.organization_id) redirect(`/partner/${data.organization_id}`);
  redirect("/dashboard?partner=none");
}

