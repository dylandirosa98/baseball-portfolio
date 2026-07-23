import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().slice(0, 100) : "";
  const metric = body.metric;

  if (!/^[a-z0-9-]+$/.test(slug) || (metric !== "profile_view" && metric !== "video_play")) {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_portfolio_event", {
    target_slug: slug,
    event_metric: metric,
  });
  if (error) {
    console.error("Portfolio analytics event failed", error);
    return NextResponse.json({ error: "Analytics event could not be recorded." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
