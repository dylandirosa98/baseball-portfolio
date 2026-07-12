import { NextRequest, NextResponse } from "next/server";
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
    if (!user) return NextResponse.json({ error: "Create a free account to upload videos." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title : "Player video";
    const passthrough = JSON.stringify({
      title,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      createdAt: new Date().toISOString(),
      userId: user.id,
    });

    const upload = await muxRequest<MuxCreateUploadResponse>("/video/v1/uploads", {
      method: "POST",
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
          passthrough,
        },
      }),
    });

    return NextResponse.json({
      uploadId: upload.data.id,
      uploadUrl: upload.data.url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Mux upload" },
      { status: 500 }
    );
  }
}
