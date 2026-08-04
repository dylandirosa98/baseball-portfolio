import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/admin-auth";
import AdminContentStudio from "@/components/admin/AdminContentStudio";
import FacebookAdStudio from "@/components/admin/FacebookAdStudio";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin/content");
  if (!isPlatformAdmin(user.email)) notFound();

  return (
    <main className="min-h-screen bg-[#060d13] text-white">
      <header className="border-b border-white/10 bg-[#08121a]">
        <div className="mx-auto flex min-h-20 max-w-[1700px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/diamond-profile-logo.png" alt="" width={48} height={48} className="h-10 w-10 object-contain" />
            <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6673]">Private operations</p><h1 className="text-lg font-black">Content Studio</h1></div>
          </Link>
          <div className="flex gap-2"><Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Admin</Link><Link href="/dashboard" className="hidden min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-white/60 hover:text-white sm:inline-flex"><LayoutDashboard className="h-4 w-4" /> User dashboard</Link></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1700px] space-y-6 px-3 py-5 sm:px-7 sm:py-8 lg:px-10">
        <nav aria-label="Content workspaces" className="flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#08121a] p-2">
          <a href="#facebook-ads" className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-[#e5162a] px-5 text-sm font-black text-white">Facebook ads</a>
          <a href="#content-studio" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-5 text-sm font-bold text-white/55 hover:bg-white/5 hover:text-white">Instagram carousels</a>
        </nav>
        <FacebookAdStudio />
        <AdminContentStudio />
      </div>
    </main>
  );
}
