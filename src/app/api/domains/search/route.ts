import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDomainPrice, maximumDomainPrice } from "@/lib/vercel-domains";

const domainPattern = /^(?!-)[a-z0-9-]+\.com$/;

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const domain = normalizeDomain(requestUrl.searchParams.get("domain") || "");

  if (!domainPattern.test(domain) || domain.length > 253) {
    return NextResponse.json({ error: "Enter a standard .com domain like playername.com." }, { status: 400 });
  }

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Domain search is not connected yet. Add a Vercel API token to enable it." },
      { status: 503 },
    );
  }

  const availabilityUrl = new URL(
    `https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/availability`,
  );
  if (process.env.VERCEL_TEAM_ID) {
    availabilityUrl.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  }

  try {
    const { data: claimed } = await createAdminClient()
      .from("players")
      .select("id")
      .eq("custom_domain", domain)
      .maybeSingle();
    if (claimed) return NextResponse.json({ domain, available: false });

    const vercelResponse = await fetch(availabilityUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const result = (await vercelResponse.json()) as {
      available?: boolean;
      message?: string;
      error?: { message?: string };
    };

    if (!vercelResponse.ok || typeof result.available !== "boolean") {
      console.error("Vercel domain availability failed", result.message || result.error?.message || vercelResponse.statusText);
      return NextResponse.json({ error: "Domain search is temporarily unavailable. Try again shortly." }, { status: 502 });
    }

    if (!result.available) return NextResponse.json({ domain, available: false });

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
