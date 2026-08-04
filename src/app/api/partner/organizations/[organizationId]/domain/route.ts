import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerAccess } from "@/lib/partners";
import { isValidPartnerDomain, normalizePartnerDomain, partnerAdminHostname, partnerBuilderHostname, partnerPlayerHostname } from "@/lib/domain-name";
import { attachProjectDomain, getProjectDomain } from "@/lib/vercel-domains";

function verificationRecords(domain: string, details: Awaited<ReturnType<typeof getProjectDomain>>) {
  return (details?.verification ?? []).map((record) => ({
    domain,
    verified: Boolean(details?.verified),
    type: record.type,
    name: record.domain,
    value: record.value,
  }));
}

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  if (access.organization.partnership_type !== "white_label") {
    return NextResponse.json({ error: "A connected white-label domain is available only on white-label partnerships." }, { status: 409 });
  }
  if (access.organization.status !== "active") {
    return NextResponse.json({ error: "Activate white-label billing before connecting the branded subdomains." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const domain = normalizePartnerDomain(String(body.domain || access.organization.profile_domain || ""));
  if (!isValidPartnerDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid apex domain such as academybaseball.com." }, { status: 400 });
  }
  const builderDomain = partnerBuilderHostname(domain);
  const adminDomain = partnerAdminHostname(domain);
  const admin = createAdminClient();
  const claimed = await admin.from("partner_organizations").select("id").eq("profile_domain", domain).neq("id", organizationId).maybeSingle();
  if (claimed.error) return NextResponse.json({ error: claimed.error.message }, { status: 500 });
  if (claimed.data) return NextResponse.json({ error: "That domain is already connected to another organization." }, { status: 409 });

  try {
    const playerResult = await admin.from("players").select("slug").eq("organization_id", organizationId);
    if (playerResult.error) throw playerResult.error;
    const athleteDomains = (playerResult.data ?? []).map((player) => partnerPlayerHostname(player.slug, domain));
    const [builder, partnerAdmin, ...athletes] = await Promise.all([
      attachProjectDomain(builderDomain),
      attachProjectDomain(adminDomain),
      ...athleteDomains.map((athleteDomain) => attachProjectDomain(athleteDomain)),
    ]);
    const records = [
      ...verificationRecords(builderDomain, builder),
      ...verificationRecords(adminDomain, partnerAdmin),
      ...athletes.flatMap((details, index) => verificationRecords(athleteDomains[index], details)),
    ];
    const verified = Boolean(builder?.verified && partnerAdmin?.verified && athletes.every((details) => details?.verified));
    const update = await admin.from("partner_organizations").update({
      profile_domain: domain,
      profile_domain_status: verified ? "active" : "pending",
      profile_domain_error: null,
      profile_domain_verification: records,
      profile_domain_verified_at: verified ? new Date().toISOString() : null,
    }).eq("id", organizationId).select("*").single();
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
    return NextResponse.json({
      organization: update.data,
      domain,
      builderDomain,
      adminDomain,
      athleteDomains,
      verified,
      verification: records,
      dns: {
        apex: `${domain} is not connected to Diamond Profile and remains available for the partner's existing business website.`,
        tools: `Point ${adminDomain} and ${builderDomain} to Vercel using the returned records.`,
        athletes: `Add one wildcard CNAME at the registrar so *.${domain} points to Vercel. Diamond Profile attaches each exact athlete hostname to the project as the athlete is created.`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel could not connect this domain.";
    await admin.from("partner_organizations").update({
      profile_domain: domain,
      profile_domain_status: "failed",
      profile_domain_error: message.slice(0, 1000),
    }).eq("id", organizationId);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
