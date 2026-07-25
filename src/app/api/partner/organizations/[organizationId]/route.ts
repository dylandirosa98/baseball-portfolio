import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerAccess } from "@/lib/partners";

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await partnerAccess(user.id, organizationId, ["owner", "admin"]))) {
    return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) values.name = body.name.trim().slice(0, 120);
  if (typeof body.primaryColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.primaryColor)) values.primary_color = body.primaryColor;
  if (typeof body.logoUrl === "string") values.logo_url = body.logoUrl.trim().slice(0, 1000) || null;
  if (typeof body.supportEmail === "string") values.support_email = body.supportEmail.trim().toLowerCase().slice(0, 255) || null;
  const result = await createAdminClient().from("partner_organizations").update(values).eq("id", organizationId).select("*").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ organization: result.data });
}

