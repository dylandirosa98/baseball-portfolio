import { NextRequest, NextResponse } from "next/server";
import { muxRequest, muxPlaybackUrl, muxThumbnailUrl } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizedPlayer } from "@/lib/partners";

type MuxUploadResponse = {
  data: {
    id: string;
    status: string;
    asset_id?: string;
  };
};

type MuxAssetResponse = {
  data: {
    id: string;
    status: string;
    playback_ids?: { id: string; policy: string }[];
  };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uploadId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { uploadId } = await context.params;
    const playerId = request.nextUrl.searchParams.get("playerId");
    const access = await authorizedPlayer(user.id, playerId, false);
    if (playerId && !access) return NextResponse.json({ error: "Managed athlete access was not found." }, { status: 404 });
    const admin = createAdminClient();
    const { data: uploadRecord, error: ownershipError } = await admin
      .from("mux_uploads")
      .select("upload_id, user_id, player_id")
      .eq("upload_id", uploadId)
      .maybeSingle();
    if (ownershipError) throw new Error(ownershipError.message);
    if (!uploadRecord || (uploadRecord.user_id !== user.id && uploadRecord.player_id !== access?.player.id)) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    const upload = await muxRequest<MuxUploadResponse>(`/video/v1/uploads/${uploadId}`);
    const assetId = upload.data.asset_id;

    if (!assetId) {
      return NextResponse.json({
        uploadId: upload.data.id,
        uploadStatus: upload.data.status,
        assetId: null,
        assetStatus: null,
        playbackId: null,
      });
    }

    const asset = await muxRequest<MuxAssetResponse>(`/video/v1/assets/${assetId}`);
    const playbackId = asset.data.playback_ids?.find((id) => id.policy === "public")?.id ?? null;
    const { error: statusError } = await admin.from("mux_uploads").update({
      status: asset.data.status,
      asset_id: assetId,
      playback_id: playbackId,
      updated_at: new Date().toISOString(),
    }).eq("upload_id", uploadId);
    if (statusError) throw new Error(statusError.message);

    return NextResponse.json({
      uploadId: upload.data.id,
      uploadStatus: upload.data.status,
      assetId,
      assetStatus: asset.data.status,
      playbackId,
      url: playbackId ? muxPlaybackUrl(playbackId) : null,
      thumbnailUrl: playbackId ? muxThumbnailUrl(playbackId) : null,
    });
  } catch (error) {
    console.error("Video processing status failed", error);
    return NextResponse.json(
      { error: "Unable to check video processing" },
      { status: 500 }
    );
  }
}
