import { NextRequest, NextResponse } from "next/server";
import { BILLING_LIMITS, type BillingTier } from "@/lib/billing";
import { muxRequest } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";

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

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("billing_tier, mux_upload_count")
      .eq("user_id", user.id)
      .maybeSingle();
    if (playerError) throw new Error(playerError.message);

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

    const { data: reserved, error: countError } = await supabase
      .from("players")
      .update({ mux_upload_count: uploadCount + 1 })
      .eq("user_id", user.id)
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

      const { error: uploadRecordError } = await supabase.from("mux_uploads").insert({
        upload_id: upload.data.id,
        user_id: user.id,
        status: "waiting",
      });
      if (uploadRecordError) throw new Error(uploadRecordError.message);

      return NextResponse.json({ uploadId: upload.data.id, uploadUrl: upload.data.url });
    } catch (error) {
      await supabase
        .from("players")
        .update({ mux_upload_count: uploadCount })
        .eq("user_id", user.id)
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
