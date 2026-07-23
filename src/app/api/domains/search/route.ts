import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDomainAvailability, getDomainPrice, maximumDomainPrice } from "@/lib/vercel-domains";
import { isStandardComDomain, normalizeManagedDomain } from "@/lib/domain-name";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const domain = normalizeManagedDomain(requestUrl.searchParams.get("domain") || "");

  if (!isStandardComDomain(domain)) {
    return NextResponse.json({ error: "Enter a standard .com domain like playername.com." }, { status: 400 });
  }

  const token = process.env.VERCEL_API_TOKEN;
  if (!token || !process.env.VERCEL_PROJECT_ID_OR_NAME) {
    return NextResponse.json(
      { error: "Domain search is not connected yet. Add the Vercel credentials to enable it." },
      { status: 503 },
    );
  }

  try {
    const { data: claimed, error: claimedError } = await createAdminClient()
      .from("players")
      .select("id")
      .eq("custom_domain", domain)
      .maybeSingle();
    if (claimedError) throw claimedError;
    if (claimed) return NextResponse.json({ domain, available: false });

    if (!(await getDomainAvailability(domain))) return NextResponse.json({ domain, available: false });

    const price = await getDomainPrice(domain);
    const maxPrice = maximumDomainPrice();
    return NextResponse.json({
      domain,
      available: price.purchasePrice <= maxPrice,
      purchasePrice: price.purchasePrice,
      renewalPrice: price.renewalPrice,
      standardPrice: price.purchasePrice <= maxPrice,
    });
  } catch (error) {
    console.error("Vercel domain request failed", error);
    return NextResponse.json({ error: "Domain search is temporarily unavailable. Try again shortly." }, { status: 502 });
  }
}
