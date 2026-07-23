import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfileSlug, profileSlugError } from "@/lib/slug";

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("slug") || "";
  const slug = normalizeProfileSlug(value);
  const validationError = profileSlugError(slug);

  if (validationError) {
    return NextResponse.json({ slug, available: false, error: validationError });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_player_slug_available", { candidate_slug: slug });
  if (error) {
    console.error("Profile URL availability failed", error);
    return NextResponse.json({ error: "Address availability could not be checked." }, { status: 500 });
  }

  return NextResponse.json({ slug, available: data === true });
}
