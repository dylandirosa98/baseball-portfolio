import { NextRequest, NextResponse } from "next/server";
import { BILLING_LIMITS, type BillingTier } from "@/lib/billing";
import { muxRequest } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizedPlayer } from "@/lib/partners";

type MuxCreateUploadResponse = {
  data: {
    id: string;
    url: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Create an account to upload videos." }, { status: 401 });

    const playerId = request.nextUrl.searchParams.get("playerId");
    const access = await authorizedPlayer(user.id, playerId, true);
    if (playerId && !access) return NextResponse.json({ error: "Managed athlete access was not found." }, { status: 404 });
    const player = access?.player;

    const tier = (player?.billing_tier || "free") as BillingTier;
    const uploadCount = player?.mux_upload_count ?? 0;
    if (tier === "free") {
      return NextResponse.json({ error: "Professional in-app video uploads require Pro or Elite. Free portfolios can embed up to 5 YouTube videos." }, { status: 403 });
    }
    if (uploadCount >= BILLING_LIMITS[tier].muxVideos) {
      return NextResponse.json({ error: "Pro includes up to 10 professionally hosted video uploads. Upgrade to Elite for fair-use unlimited in-app uploads." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 2 * 1024 * 1024 * 1024) {
      return NextResponse.json({ error: "Choose a video smaller than 2 GB." }, { status: 400 });
    }
    const title = typeof body.title === "string" ? body.title : "Player video";
    const passthrough = JSON.stringify({
      title,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      createdAt: new Date().toISOString(),
      userId: user.id,
    });

    const admin = createAdminClient();
    const { data: reserved, error: countError } = await admin
      .from("players")
      .update({ mux_upload_count: uploadCount + 1 })
      .eq("id", player?.id || "")
      .eq("mux_upload_count", uploadCount)
      .select("mux_upload_count")
      .maybeSingle();
    if (countError) throw new Error(countError.message);
    if (!reserved) {
      return NextResponse.json({ error: "Another upload started at the same time. Try again." }, { status: 409 });
    }

    try {
      const upload = await muxRequest<MuxCreateUploadResponse>("/video/v1/uploads", {
        method: "POST",
        body: JSON.stringify({
          cors_origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          new_asset_settings: {
            playback_policies: ["public"],
            video_quality: "basic",
            passthrough,
          },
        }),
      });

      const { error: uploadRecordError } = await admin.from("mux_uploads").insert({
        upload_id: upload.data.id,
        user_id: user.id,
        player_id: player?.id || null,
        status: "waiting",
      });
      if (uploadRecordError) throw new Error(uploadRecordError.message);

      return NextResponse.json({ uploadId: upload.data.id, uploadUrl: upload.data.url });
    } catch (error) {
      await admin
        .from("players")
        .update({ mux_upload_count: uploadCount })
        .eq("id", player?.id || "")
        .eq("mux_upload_count", uploadCount + 1);
      throw error;
    }
  } catch (error) {
    console.error("Video upload creation failed", error);
    return NextResponse.json(
      { error: "Unable to create video upload" },
      { status: 500 },
    );
  }
}
