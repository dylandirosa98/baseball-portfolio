import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerAccess } from "@/lib/partners";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(request: NextRequest, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await partnerAccess(user.id, organizationId, ["owner", "admin"]))) {
    return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Upload a PNG, JPG, WebP, or SVG logo smaller than 5 MB." }, { status: 400 });
  }
  const extension = file.type === "image/svg+xml" ? "svg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `partners/${organizationId}/logo.${extension}`;
  const admin = createAdminClient();
  const upload = await admin.storage.from("player-images").upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: true });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });
  const url = admin.storage.from("player-images").getPublicUrl(path).data.publicUrl + `?t=${Date.now()}`;
  const update = await admin.from("partner_organizations").update({ logo_url: url }).eq("id", organizationId);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
  return NextResponse.json({ url });
}
