"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeDollarSign, Building2, Check, Copy, CreditCard, Link2, Plus, Settings, Users } from "lucide-react";
import type { PartnerOrganizationRow, PartnerRole } from "@/lib/partners";

type PaymentLink = { id: string; name: string; tier: "pro" | "elite"; url: string; unit_amount: number | null; currency: string | null };
type Athlete = { id: string; first_name: string; last_name: string; invited_email: string | null; slug: string; partner_plan: "pro" | "elite"; partner_billing_source: "customer_subscription" | "partner_paid"; partner_billing_status: string; billing_tier: string; is_published: boolean; has_custom_domain: boolean; partner_profile_checkouts?: Array<{ token: string; active: boolean }> };

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function PartnerDashboardClient({ organization, role, athletes, paymentLinks, memberCount }: { organization: PartnerOrganizationRow; role: PartnerRole; athletes: Athlete[]; paymentLinks: PaymentLink[]; memberCount: number }) {
  const [tab, setTab] = useState<"athletes" | "payments" | "brand" | "team">("athletes");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<"pro" | "elite">("pro");
  const [billingSource, setBillingSource] = useState<"customer_subscription" | "partner_paid">("customer_subscription");
  const canAdmin = role === "owner" || role === "admin";
  const counts = useMemo(() => ({
    active: athletes.filter((athlete) => ["active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
    live: athletes.filter((athlete) => athlete.is_published).length,
    pro: athletes.filter((athlete) => athlete.partner_plan === "pro" && ["active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
    elite: athletes.filter((athlete) => athlete.partner_plan === "elite" && ["active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
  }), [athletes]);
  const estimated = (organization.partnership_type === "white_label" ? organization.white_label_monthly_cents : 0) + counts.pro * organization.pro_wholesale_cents + counts.elite * organization.elite_wholesale_cents + athletes.filter((a) => a.has_custom_domain).length * organization.domain_wholesale_cents;

  async function run(task: () => Promise<unknown>) {
    setBusy(true); setMessage("");
    try { await task(); setMessage("Saved. Refreshing…"); window.location.reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function createAthlete(form: FormData) {
    await run(() => api(`/api/partner/organizations/${organization.id}/athletes`, { method: "POST", body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), position: form.get("position"), team: form.get("team"), plan, billingSource, paymentLinkId: form.get("paymentLinkId") }) }));
  }

  async function connectStripe() {
    setBusy(true);
    try { const data = await api(`/api/partner/organizations/${organization.id}/stripe/connect`, { method: "POST" }); window.location.assign(data.url); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Stripe connection failed."); setBusy(false); }
  }

  async function setupBilling() {
    setBusy(true);
    try { const data = await api(`/api/partner/organizations/${organization.id}/billing/checkout`, { method: "POST" }); window.location.assign(data.url); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Billing setup failed."); setBusy(false); }
  }

  async function uploadLogo(file: File) {
    setBusy(true); setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(`/api/partner/organizations/${organization.id}/logo`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Logo upload failed.");
      setMessage("Logo uploaded. Refreshing…");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logo upload failed.");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#070b10] text-white" style={{ "--partner": organization.primary_color } as React.CSSProperties}>
      <header className="border-b border-white/10 bg-[#0a1119]">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="flex items-center gap-3">
            {organization.logo_url ? <Image src={organization.logo_url} alt="" width={48} height={48} unoptimized className="h-11 w-11 rounded-lg object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--partner)]"><Building2 className="h-5 w-5" /></span>}
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Partner workspace</p><h1 className="font-black">{organization.name}</h1></div>
          </div>
          <div className="flex items-center gap-2"><Link href="/dashboard" className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-bold text-white/55 hover:text-white">My account</Link><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase text-white/45">{organization.partnership_type.replace("_", " ")}</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[["Active athletes", counts.active], ["Published", counts.live], ["Team members", memberCount], ["Est. wholesale", `$${(estimated / 100).toFixed(0)}/mo`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div>)}
        </section>
        {message && <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">{message}</p>}
        <div className="mt-7 flex gap-1 overflow-x-auto border-b border-white/10">
          {[["athletes", "Athletes", Users], ["payments", "Payments", BadgeDollarSign], ["brand", "Brand", Settings], ["team", "Team", Users]].map(([id, label, Icon]) => <button key={String(id)} onClick={() => setTab(id as typeof tab)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-bold ${tab === id ? "border-[var(--partner)] text-white" : "border-transparent text-white/40"}`}><Icon className="h-4 w-4" />{label as string}</button>)}
        </div>

        {tab === "athletes" && <section className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <form action={createAthlete} className="h-fit rounded-2xl border border-white/10 bg-[#0b131c] p-5">
            <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-[var(--partner)]" /><h2 className="font-black">Create athlete</h2></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><input name="firstName" required placeholder="First name" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /><input name="lastName" required placeholder="Last name" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /></div>
            <input name="email" required type="email" placeholder="Athlete email" className="mt-3 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" />
            <div className="mt-3 grid grid-cols-2 gap-3"><input name="position" placeholder="Position" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /><input name="team" placeholder="Team" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2">{(["pro", "elite"] as const).map((value) => <button type="button" key={value} onClick={() => setPlan(value)} className={`rounded-lg border px-3 py-3 text-sm font-bold capitalize ${plan === value ? "border-[var(--partner)] bg-[var(--partner)]/15" : "border-white/10"}`}>{value}</button>)}</div>
            <label className="mt-4 block text-xs font-bold text-white/45">Who pays Diamond Profile?</label>
            <select value={billingSource} onChange={(event) => setBillingSource(event.target.value as typeof billingSource)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b131c] px-3 py-3 text-sm"><option value="customer_subscription">Athlete pays through my Stripe</option><option value="partner_paid">My organization pays wholesale</option></select>
            {billingSource === "customer_subscription" && <select name="paymentLinkId" required className="mt-3 w-full rounded-lg border border-white/10 bg-[#0b131c] px-3 py-3 text-sm"><option value="">Select {plan} checkout</option>{paymentLinks.filter((link) => link.tier === plan).map((link) => <option key={link.id} value={link.id}>{link.name}</option>)}</select>}
            <button disabled={busy} className="mt-5 w-full rounded-lg bg-[var(--partner)] px-4 py-3 text-sm font-black disabled:opacity-50">Create and invite athlete</button>
          </form>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b131c]">
            <div className="border-b border-white/10 p-5"><h2 className="font-black">Managed athletes</h2><p className="mt-1 text-xs text-white/35">Create, edit, publish, and manage billing access.</p></div>
            <div className="divide-y divide-white/[.07]">{athletes.map((athlete) => {
              const token = athlete.partner_profile_checkouts?.find((item) => item.active)?.token;
              const checkoutPath = token ? `/p/${token}` : null;
              const entitled = ["active", "past_due", "canceling"].includes(athlete.partner_billing_status);
              return <article key={athlete.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{athlete.first_name} {athlete.last_name}</strong><select disabled={!canAdmin || busy} value={athlete.partner_plan} onChange={(event) => { const nextPlan = event.target.value as "pro" | "elite"; const paymentLinkId = paymentLinks.find((link) => link.tier === nextPlan)?.id; if (athlete.partner_billing_source === "customer_subscription" && !paymentLinkId) { setMessage(`Add a verified ${nextPlan} Payment Link first.`); return; } if (window.confirm(`Move ${athlete.first_name} to ${nextPlan === "elite" ? "Elite" : "Pro"}? Active customer subscriptions will be updated in Stripe.`)) void run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "change_plan", plan: nextPlan, paymentLinkId }) })); }} className="rounded-full border border-white/10 bg-[#0b131c] px-2 py-1 text-[10px] font-bold uppercase text-white/55"><option value="pro">Pro</option><option value="elite">Elite</option></select><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/45">{athlete.partner_billing_status}</span></div><p className="mt-1 text-xs text-white/35">{athlete.invited_email} · {athlete.is_published ? "Live" : "Draft"}</p></div><div className="flex flex-wrap gap-2">{checkoutPath && <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${checkoutPath}`); setMessage("Athlete checkout link copied."); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold"><Copy className="mr-1 inline h-3 w-3" />Checkout</button>}<Link href={`/builder?mode=edit&playerId=${athlete.id}&returnTo=${encodeURIComponent(`/partner/${organization.id}`)}`} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black">Edit profile</Link>{canAdmin && !entitled && athlete.partner_billing_source === "partner_paid" && <button onClick={() => run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "activate" }) }))} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-bold text-emerald-200">Activate</button>}{canAdmin && entitled && <button onClick={() => run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "deactivate" }) }))} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-200">Deactivate</button>}</div></article>;
            })}{athletes.length === 0 && <p className="p-10 text-center text-sm text-white/35">Create your first athlete to begin.</p>}</div>
          </div>
        </section>}

        {tab === "payments" && <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6"><CreditCard className="h-6 w-6 text-[var(--partner)]" /><h2 className="mt-4 text-xl font-black">Wholesale billing</h2><p className="mt-2 text-sm leading-6 text-white/45">Your card pays Diamond Profile only for active partner-paid or customer-paid athlete seats. Canceled subscriptions automatically stop counting.</p><button disabled={busy || !canAdmin} onClick={setupBilling} className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-black text-black">{organization.billing_payment_method_ready ? "Update billing card" : "Add billing card"}</button><p className="mt-3 text-xs text-white/35">Status: {organization.billing_payment_method_ready ? "Ready" : "Setup required"} · {organization.platform_subscription_status}</p>{organization.billing_sync_error && <p className="mt-3 text-xs text-red-200">{organization.billing_sync_error}</p>}</div>
          <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6"><Link2 className="h-6 w-6 text-[var(--partner)]" /><h2 className="mt-4 text-xl font-black">Your Stripe checkout</h2><p className="mt-2 text-sm leading-6 text-white/45">Connect your Stripe account, then paste recurring Payment Links. Revenue goes to your Stripe account and Diamond Profile follows subscription status automatically.</p><button disabled={busy || !canAdmin} onClick={connectStripe} className="mt-5 rounded-lg bg-[var(--partner)] px-4 py-3 text-sm font-black">{organization.stripe_account_status === "active" ? "Reconnect Stripe" : "Connect Stripe"}</button><p className="mt-3 text-xs text-white/35">Status: {organization.stripe_account_status.replace("_", " ")}</p></div>
          {canAdmin && organization.stripe_account_status === "active" && <form action={(form) => run(() => api(`/api/partner/organizations/${organization.id}/payment-links`, { method: "POST", body: JSON.stringify({ name: form.get("name"), tier: form.get("tier"), url: form.get("url") }) }))} className="rounded-2xl border border-white/10 bg-[#0b131c] p-6 lg:col-span-2"><h2 className="font-black">Add verified Payment Link</h2><div className="mt-4 grid gap-3 md:grid-cols-[180px_130px_1fr_auto]"><input name="name" required placeholder="Checkout name" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><select name="tier" className="rounded-lg border border-white/10 bg-[#0b131c] px-3 py-3 text-sm"><option value="pro">Pro</option><option value="elite">Elite</option></select><input name="url" required placeholder="https://buy.stripe.com/..." className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><button disabled={busy} className="rounded-lg bg-white px-5 text-sm font-black text-black">Verify</button></div><div className="mt-5 flex flex-wrap gap-2">{paymentLinks.map((link) => <span key={link.id} className="rounded-full border border-white/10 px-3 py-2 text-xs"><Check className="mr-1 inline h-3 w-3 text-emerald-300" />{link.name} · {link.tier}</span>)}</div></form>}
        </section>}

        {tab === "brand" && <form action={(form) => run(() => api(`/api/partner/organizations/${organization.id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), logoUrl: form.get("logoUrl"), primaryColor: form.get("primaryColor"), supportEmail: form.get("supportEmail") }) }))} className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#0b131c] p-6"><h2 className="text-xl font-black">Brand settings</h2><p className="mt-2 text-sm text-white/40">White-label partners replace Diamond Profile branding on managed profiles. Standard partners remain co-branded.</p><label className="mt-5 block text-xs font-bold text-white/45">Organization name</label><input name="name" defaultValue={organization.name} className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><label className="mt-4 block text-xs font-bold text-white/45">Logo</label><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"><input name="logoUrl" defaultValue={organization.logo_url || ""} placeholder="Logo URL or upload a file" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-white/65 hover:text-white">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} /></label></div><div className="mt-4 grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-white/45">Brand color</label><input name="primaryColor" type="color" defaultValue={organization.primary_color} className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/25 p-2" /></div><div><label className="block text-xs font-bold text-white/45">Support email</label><input name="supportEmail" type="email" defaultValue={organization.support_email || ""} className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /></div></div><button disabled={!canAdmin || busy} className="mt-5 rounded-lg bg-[var(--partner)] px-5 py-3 text-sm font-black">Save brand</button></form>}

        {tab === "team" && <section className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#0b131c] p-6"><h2 className="text-xl font-black">Partner team</h2><p className="mt-2 text-sm text-white/40">Invite administrators, editors, or read-only viewers.</p>{canAdmin && <form action={(form) => run(() => api(`/api/partner/organizations/${organization.id}/members`, { method: "POST", body: JSON.stringify({ email: form.get("email"), role: form.get("role") }) }))} className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto]"><input name="email" required type="email" placeholder="teammate@email.com" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><select name="role" className="rounded-lg border border-white/10 bg-[#0b131c] px-3 py-3 text-sm"><option value="editor">Editor</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select><button disabled={busy} className="rounded-lg bg-white px-4 py-3 text-sm font-black text-black">Invite</button></form>}<p className="mt-5 text-xs text-white/35">{memberCount} active member{memberCount === 1 ? "" : "s"}</p></section>}
      </div>
    </main>
  );
}
