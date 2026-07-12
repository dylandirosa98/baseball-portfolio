import { NextResponse } from "next/server";

const domainPattern = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const domain = normalizeDomain(requestUrl.searchParams.get("domain") || "");

  if (!domainPattern.test(domain) || domain.length > 253) {
    return NextResponse.json({ error: "Enter a valid domain like playername.com." }, { status: 400 });
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

    return NextResponse.json({ domain, available: result.available });
  } catch (error) {
    console.error("Vercel domain request failed", error);
    return NextResponse.json({ error: "Domain search is temporarily unavailable. Try again shortly." }, { status: 502 });
  }
}
