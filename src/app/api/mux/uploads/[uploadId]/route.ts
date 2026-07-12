import { NextResponse } from "next/server";
import { muxRequest, muxPlaybackUrl, muxThumbnailUrl } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";

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
  _request: Request,
  context: { params: Promise<{ uploadId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { uploadId } = await context.params;
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check Mux upload" },
      { status: 500 }
    );
  }
}
