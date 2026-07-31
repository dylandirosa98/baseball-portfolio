import { NextResponse } from "next/server";
import { notifyNewAccount } from "@/lib/account-notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { userId?: unknown };
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ ok: true });

  const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
  if (error || !data.user) return NextResponse.json({ ok: true });
  const createdAt = new Date(data.user.created_at).getTime();
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > 60 * 60 * 1000) {
    return NextResponse.json({ ok: true });
  }

  try {
    await notifyNewAccount(data.user);
  } catch (notificationError) {
    console.error("New-account notification failed", notificationError);
  }
  return NextResponse.json({ ok: true });
}
