import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedKinds = new Set(["headshot", "hero", "logo", "media"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"]);
const maxBytes = 15 * 1024 * 1024;

function safeSegment(value: string, fallback: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return clean || fallback;
}

function extensionFor(file: File) {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]+$/.test(nameExt)) return nameExt;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Create a free account to upload photos. Your other changes are still saved." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const slug = safeSegment(String(formData.get("slug") || "temp"), "temp");
    const kind = String(formData.get("kind") || "");
    const index = Number.parseInt(String(formData.get("index") || "0"), 10);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }
    if (!allowedKinds.has(kind)) {
      return NextResponse.json({ error: "Invalid image upload type" }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Image must be 15MB or smaller" }, { status: 400 });
    }
    if (file.type && !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const ext = extensionFor(file);
    const filename = kind === "media" ? `media-${Number.isFinite(index) ? index : 0}.${ext}` : `${kind}.${ext}`;
    const path = `${user.id}/${slug}/${filename}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    await supabase.storage.from("player-images").remove([path]);
    const { error } = await supabase.storage
      .from("player-images")
      .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("player-images").getPublicUrl(path);
    return NextResponse.json({ url: `${data.publicUrl}?t=${Date.now()}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image upload failed" },
      { status: 500 }
    );
  }
}
