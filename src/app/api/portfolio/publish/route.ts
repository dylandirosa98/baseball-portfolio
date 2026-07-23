import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Create a free account to publish your portfolio." }, { status: 401 });

  const { data, error } = await supabase
    .from("players")
    .update({ is_published: true })
    .eq("user_id", user.id)
    .select("slug")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Save your player name before publishing." }, { status: 409 });

  return NextResponse.json({ published: true, slug: data.slug });
}
