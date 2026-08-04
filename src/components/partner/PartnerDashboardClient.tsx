"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeDollarSign, Building2, Copy, CreditCard, Eye, Globe2, Link2, Mail, Plus, Receipt, Settings, TrendingUp, UserRoundPen, Users, WalletCards } from "lucide-react";
import type { PartnerOrganizationRow, PartnerRole } from "@/lib/partners";
import type { PartnerStripeAccountStatus } from "@/lib/stripe-connect";
import { partnerAdminHostname, partnerBuilderHostname, partnerPlayerHostname } from "@/lib/domain-name";

type PaymentLink = { id: string; name: string; tier: "pro" | "elite"; url: string; unit_amount: number | null; currency: string | null; platform_cost_cents?: number | null; partner_margin_cents?: number | null; pricing_scope?: "catalog" | "athlete"; player_id?: string | null; active?: boolean };
type Athlete = { id: string; first_name: string; last_name: string; invited_email: string | null; slug: string; partner_plan: "pro" | "elite"; partner_billing_source: "customer_subscription" | "partner_paid"; partner_billing_status: string; partner_creation_mode: "athlete_builds" | "organization_builds"; partner_payment_link_id: string | null; billing_tier: string; is_published: boolean; has_custom_domain: boolean; custom_domain: string | null; custom_domain_status: string | null; partner_profile_checkouts?: Array<{ token: string; active: boolean }>; partner_invitations?: Array<{ token: string; status: string; last_sent_at: string | null; athlete_creation_mode: "athlete_builds" | "organization_builds" }> };

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function PartnerDashboardClient({ organization, stripeStatus, role, athletes, paymentLinks, memberCount, pricingSetupError }: { organization: PartnerOrganizationRow; stripeStatus: PartnerStripeAccountStatus | null; role: PartnerRole; athletes: Athlete[]; paymentLinks: PaymentLink[]; memberCount: number; pricingSetupError?: string | null }) {
  const [tab, setTab] = useState<"athletes" | "pricing" | "economics" | "payments" | "brand" | "domain" | "team">("athletes");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<"pro" | "elite">("pro");
  const [pricingMode, setPricingMode] = useState<"catalog" | "custom" | "free">("catalog");
  const [customRetailPrice, setCustomRetailPrice] = useState("15");
  const [creationMode, setCreationMode] = useState<"athlete_builds" | "organization_builds">("athlete_builds");
  const canAdmin = role === "owner" || role === "admin";
  const canEdit = canAdmin || role === "editor";
  const whiteLabelLocked = organization.partnership_type === "white_label" && organization.status !== "active";
  const builderHost = organization.profile_domain && organization.profile_domain_status === "active"
    ? `https://${partnerBuilderHostname(organization.profile_domain)}`
    : null;
  const adminHost = organization.profile_domain && organization.profile_domain_status === "active"
    ? `https://${partnerAdminHostname(organization.profile_domain)}`
    : null;
  const counts = useMemo(() => ({
    active: athletes.filter((athlete) => ["trialing", "active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
    live: athletes.filter((athlete) => athlete.is_published).length,
    pro: athletes.filter((athlete) => athlete.partner_plan === "pro" && ["trialing", "active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
    elite: athletes.filter((athlete) => athlete.partner_plan === "elite" && ["trialing", "active", "past_due", "canceling"].includes(athlete.partner_billing_status)).length,
  }), [athletes]);
  const seatAndPlatformExpense = organization.wholesale_billing_exempt ? 0 : (organization.partnership_type === "white_label" ? organization.white_label_monthly_cents : 0) + counts.pro * organization.pro_wholesale_cents + counts.elite * organization.elite_wholesale_cents;
  const managedDomainExpense = athletes.filter((athlete) => athlete.has_custom_domain).length * organization.domain_wholesale_cents;
  const estimated = seatAndPlatformExpense + managedDomainExpense;
  const activeStatuses = ["trialing", "active", "past_due", "canceling"];
  const catalogLinks = paymentLinks.filter((link) => (link.pricing_scope || "catalog") === "catalog" && link.active !== false);
  const activeAthleteRows = athletes.filter((athlete) => activeStatuses.includes(athlete.partner_billing_status)).map((athlete) => {
    const link = paymentLinks.find((candidate) => candidate.id === athlete.partner_payment_link_id);
    const retail = athlete.partner_billing_source === "customer_subscription" ? (link?.unit_amount || 0) : 0;
    const wholesale = athlete.partner_plan === "pro" ? organization.pro_wholesale_cents : organization.elite_wholesale_cents;
    return { athlete, link, retail, wholesale, margin: retail - wholesale };
  });
  const retailMrr = activeAthleteRows.reduce((sum, row) => sum + row.retail, 0);
  const grossMargin = retailMrr - estimated;

  async function run(task: () => Promise<unknown>) {
    setBusy(true); setMessage("");
    try { await task(); setMessage("Saved. Refreshing…"); window.location.reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function createAthlete(form: FormData) {
    await run(() => api(`/api/partner/organizations/${organization.id}/athletes`, { method: "POST", body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), position: form.get("position"), team: form.get("team"), plan, creationMode, pricingMode, retailPriceCents: pricingMode === "custom" ? Math.round(Number(customRetailPrice) * 100) : undefined }) }));
  }

  async function sendAthleteInvite(athleteId: string) {
    await run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athleteId}/invite`, { method: "POST" }));
  }

  async function copyAthleteInvite(athleteId: string) {
    setBusy(true); setMessage("");
    try {
      const data = await api(`/api/partner/organizations/${organization.id}/athletes/${athleteId}/invite`);
      await navigator.clipboard.writeText(data.joinUrl);
      setMessage("Secure athlete invitation link copied.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The invitation could not be copied."); }
    finally { setBusy(false); }
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

  async function connectDomain(form: FormData) {
    await run(() => api(`/api/partner/organizations/${organization.id}/domain`, {
      method: "POST",
      body: JSON.stringify({ domain: form.get("domain") }),
    }));
  }

  return (
    <main className="min-h-screen bg-[#070b10] text-white" style={{ "--partner": organization.primary_color } as React.CSSProperties}>
      <header className="border-b border-white/10 bg-[#0a1119]">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="flex items-center gap-3">
            {organization.logo_url ? <Image src={organization.logo_url} alt="" width={48} height={48} unoptimized className="h-11 w-11 rounded-lg object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--partner)]"><Building2 className="h-5 w-5" /></span>}
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Partner workspace</p><h1 className="font-black">{organization.name}</h1></div>
          </div>
          <div className="flex items-center gap-2"><Link href={adminHost || "/dashboard"} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-bold text-white/55 hover:text-white">My account</Link><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase text-white/45">{organization.partnership_type.replace("_", " ")}</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[["Active athletes", counts.active], ["Published", counts.live], ["Team members", memberCount], ["Est. wholesale", `$${(estimated / 100).toFixed(0)}/mo`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div>)}
        </section>
        {message && <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">{message}</p>}
        {whiteLabelLocked && <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-amber-300/25 bg-amber-300/[.08] p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-200">Preview mode</p><h2 className="mt-2 text-xl font-black">Activate white-label access</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">You can review the complete workspace and prepare branding now. Athlete creation, publishing, and branded subdomains unlock after checkout. Promotion codes can be entered in Stripe checkout.</p></div><button disabled={busy || !canAdmin} onClick={setupBilling} className="shrink-0 rounded-lg bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50">Activate white label</button></section>}
        <div className="mt-7 flex gap-1 overflow-x-auto border-b border-white/10">
          {[["athletes", "Athletes", Users], ["pricing", "Price management", BadgeDollarSign], ["economics", "Economics", TrendingUp], ["payments", "Stripe", CreditCard], ["domain", "Domain", Globe2], ["brand", "Brand", Settings], ["team", "Team", Users]].map(([id, label, Icon]) => <button key={String(id)} onClick={() => setTab(id as typeof tab)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-bold ${tab === id ? "border-[var(--partner)] text-white" : "border-transparent text-white/40"}`}><Icon className="h-4 w-4" />{label as string}</button>)}
        </div>

        {tab === "athletes" && <section className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <form action={createAthlete} className="h-fit rounded-2xl border border-white/10 bg-[#0b131c] p-5">
            <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-[var(--partner)]" /><h2 className="font-black">Create athlete</h2></div>
            <p className="mt-2 text-xs leading-5 text-white/35">Choose who creates the first draft. Both options finish in the athlete&apos;s dashboard.</p>
            <div className="mt-4 grid gap-2">
              <button disabled={!canEdit} type="button" onClick={() => setCreationMode("athlete_builds")} className={`rounded-xl border p-3 text-left disabled:opacity-45 ${creationMode === "athlete_builds" ? "border-[var(--partner)] bg-[var(--partner)]/10" : "border-white/10"}`}><span className="flex items-center gap-2 text-sm font-black"><Users className="h-4 w-4" />Invite athlete to build</span><span className="mt-1 block text-xs leading-5 text-white/40">They securely claim the draft, add their details, and pay before publishing if needed.</span></button>
              <button disabled={!canEdit} type="button" onClick={() => setCreationMode("organization_builds")} className={`rounded-xl border p-3 text-left disabled:opacity-45 ${creationMode === "organization_builds" ? "border-[var(--partner)] bg-[var(--partner)]/10" : "border-white/10"}`}><span className="flex items-center gap-2 text-sm font-black"><UserRoundPen className="h-4 w-4" />Build it for the athlete</span><span className="mt-1 block text-xs leading-5 text-white/40">Your team prepares the profile, then sends a private preview with checkout attached.</span></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3"><input name="firstName" required placeholder="First name" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /><input name="lastName" required placeholder="Last name" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /></div>
            <input name="email" required type="email" placeholder="Athlete email" className="mt-3 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" />
            <div className="mt-3 grid grid-cols-2 gap-3"><input name="position" placeholder="Position" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /><input name="team" placeholder="Team" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2">{(["pro", "elite"] as const).map((value) => <button type="button" key={value} onClick={() => setPlan(value)} className={`rounded-lg border px-3 py-3 text-sm font-bold capitalize ${plan === value ? "border-[var(--partner)] bg-[var(--partner)]/15" : "border-white/10"}`}>{value}</button>)}</div>
            <label className="mt-4 block text-xs font-bold text-white/45">What does this athlete pay monthly?</label>
            <div className="mt-2 grid gap-2">
              <button type="button" onClick={() => setPricingMode("catalog")} className={`rounded-lg border p-3 text-left ${pricingMode === "catalog" ? "border-[var(--partner)] bg-[var(--partner)]/10" : "border-white/10"}`}><span className="block text-sm font-black">Standard {plan === "pro" ? "Pro" : "Elite"} price</span><span className="mt-1 block text-xs text-white/40">${((catalogLinks.find((link) => link.tier === plan)?.unit_amount || (plan === "pro" ? 1500 : 2500)) / 100).toFixed(2)}/month through your Stripe</span></button>
              <button type="button" onClick={() => { setPricingMode("custom"); setCustomRetailPrice(plan === "pro" ? "15" : "25"); }} className={`rounded-lg border p-3 text-left ${pricingMode === "custom" ? "border-[var(--partner)] bg-[var(--partner)]/10" : "border-white/10"}`}><span className="block text-sm font-black">Custom athlete price</span><span className="mt-1 block text-xs text-white/40">Use any monthly amount for this offer—even below your wholesale cost.</span></button>
              {pricingMode === "custom" && <div className="flex items-center rounded-lg border border-white/10 bg-black/25 px-3"><span className="text-white/35">$</span><input value={customRetailPrice} onChange={(event) => setCustomRetailPrice(event.target.value)} required type="number" min="0" max="10000" step="0.01" aria-label="Custom athlete monthly price" className="min-h-11 w-full bg-transparent px-2 text-sm outline-none" /><span className="text-xs text-white/30">/month</span></div>}
              <button type="button" onClick={() => setPricingMode("free")} className={`rounded-lg border p-3 text-left ${pricingMode === "free" ? "border-[var(--partner)] bg-[var(--partner)]/10" : "border-white/10"}`}><span className="block text-sm font-black">Free to the athlete</span><span className="mt-1 block text-xs text-white/40">No athlete checkout. Your organization still pays the ${((plan === "pro" ? organization.pro_wholesale_cents : organization.elite_wholesale_cents) / 100).toFixed(0)} wholesale seat.</span></button>
            </div>
            {!canEdit && <p className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-3 text-xs text-white/45">Your viewer role is read-only. Ask an organization admin for editor access to create athletes.</p>}
            <button disabled={busy || whiteLabelLocked || !canEdit} className="mt-5 w-full rounded-lg bg-[var(--partner)] px-4 py-3 text-sm font-black disabled:opacity-50">{whiteLabelLocked ? "Activate to create athletes" : creationMode === "athlete_builds" ? "Create athlete invitation" : "Create draft profile"}</button>
          </form>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b131c]">
            <div className="border-b border-white/10 p-5"><h2 className="font-black">Managed athletes</h2><p className="mt-1 text-xs text-white/35">Create, edit, publish, and manage billing access.</p></div>
            <div className="divide-y divide-white/[.07]">{athletes.map((athlete) => {
              const token = athlete.partner_profile_checkouts?.find((item) => item.active)?.token;
              const invitation = athlete.partner_invitations?.[0];
              const invitationPath = invitation ? `/join/${invitation.token}` : null;
              const entitled = ["trialing", "active", "past_due", "canceling"].includes(athlete.partner_billing_status);
              const editPath = `/builder?mode=edit&playerId=${athlete.id}&returnTo=${encodeURIComponent(`/partner/${organization.id}`)}`;
              const editHref = builderHost ? `${builderHost}${editPath}` : editPath;
              const playerHost = organization.profile_domain && organization.profile_domain_status === "active"
                ? `https://${partnerPlayerHostname(athlete.slug, organization.profile_domain)}`
                : null;
              return <article key={athlete.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{athlete.first_name} {athlete.last_name}</strong><select disabled={!canAdmin || busy} value={athlete.partner_plan} onChange={(event) => { const nextPlan = event.target.value as "pro" | "elite"; const paymentLinkId = paymentLinks.find((link) => link.tier === nextPlan)?.id; if (athlete.partner_billing_source === "customer_subscription" && !paymentLinkId) { setMessage(`Add a verified ${nextPlan} Payment Link first.`); return; } if (window.confirm(`Move ${athlete.first_name} to ${nextPlan === "elite" ? "Elite" : "Pro"}? Active customer subscriptions will be updated in Stripe.`)) void run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "change_plan", plan: nextPlan, paymentLinkId }) })); }} className="rounded-full border border-white/10 bg-[#0b131c] px-2 py-1 text-[10px] font-bold uppercase text-white/55"><option value="pro">Pro</option><option value="elite">Elite</option></select><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/45">{athlete.partner_billing_status}</span></div><p className="mt-1 text-xs text-white/35">{athlete.invited_email} · {athlete.is_published ? "Live" : "Draft"} · {athlete.partner_creation_mode === "organization_builds" ? "Built by your team" : "Athlete builds"}{invitation?.last_sent_at ? ` · Sent ${new Date(invitation.last_sent_at).toLocaleDateString()}` : " · Not sent"}</p></div><div className="flex flex-wrap gap-2">{invitation && canEdit && <button disabled={busy} onClick={() => void sendAthleteInvite(athlete.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold"><Mail className="mr-1 inline h-3 w-3" />{invitation.last_sent_at ? "Resend" : athlete.partner_creation_mode === "organization_builds" ? "Send preview" : "Send invite"}</button>}{invitation && canEdit && <button disabled={busy} onClick={() => void copyAthleteInvite(athlete.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold"><Copy className="mr-1 inline h-3 w-3" />Copy link</button>}{athlete.partner_creation_mode === "organization_builds" && invitationPath && <a href={invitationPath} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold"><Eye className="mr-1 inline h-3 w-3" />Preview</a>}{canEdit && token && athlete.partner_billing_source === "customer_subscription" && <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${token}`); setMessage("Athlete checkout link copied."); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Checkout</button>}{playerHost && athlete.is_published && <a href={playerHost} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Live site</a>}{canEdit && <Link href={editHref} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black">Edit profile</Link>}{canAdmin && !entitled && athlete.partner_billing_source === "partner_paid" && <button onClick={() => run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "activate" }) }))} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-bold text-emerald-200">Activate</button>}{canAdmin && entitled && <button onClick={() => run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}`, { method: "PATCH", body: JSON.stringify({ action: "deactivate" }) }))} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-200">Deactivate</button>}</div></article>;
            })}{athletes.length === 0 && <p className="p-10 text-center text-sm text-white/35">Create your first athlete to begin.</p>}</div>
          </div>
        </section>}

        {tab === "pricing" && <section className="mt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--partner)]">Connected catalog</p><h2 className="mt-2 text-2xl font-black">Price management</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">These are the default monthly prices athletes see. Saving here creates the replacement price directly in your connected Stripe account—no Stripe dashboard work required.</p></div>
            <span className={`w-fit rounded-full px-3 py-2 text-[10px] font-black uppercase ${organization.stripe_account_status === "active" ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{organization.stripe_account_status === "active" ? "Stripe synced" : "Connect Stripe first"}</span>
          </div>
          {pricingSetupError && <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.08] p-4 text-sm text-amber-100">Automatic pricing setup needs attention: {pricingSetupError}</p>}
          {organization.stripe_account_status === "active" ? <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {(["pro", "elite"] as const).map((tier) => {
              const link = catalogLinks.find((item) => item.tier === tier);
              const wholesale = tier === "pro" ? organization.pro_wholesale_cents : organization.elite_wholesale_cents;
              const defaultRetail = tier === "pro" ? 1500 : 2500;
              const retail = link?.unit_amount ?? defaultRetail;
              return <form key={tier} action={(form) => run(() => link ? api(`/api/partner/organizations/${organization.id}/payment-links`, { method: "PATCH", body: JSON.stringify({ id: link.id, priceCents: Math.round(Number(form.get("price")) * 100), migrateExisting: form.get("migrateExisting") === "on" }) }) : api(`/api/partner/organizations/${organization.id}/payment-links`, { method: "POST", body: JSON.stringify({ create: true, name: `${organization.name} ${tier === "pro" ? "Pro" : "Elite"}`, tier, priceCents: Math.round(Number(form.get("price")) * 100) }) }))} className="rounded-2xl border border-white/10 bg-[#0b131c] p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/35">{tier} catalog</p><h3 className="mt-2 text-2xl font-black">{tier === "pro" ? "Pro" : "Elite"}</h3></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/45">{link ? "Live in Stripe" : "Setup needed"}</span></div>
                <label className="mt-7 block text-xs font-bold text-white/45">Athlete retail price</label>
                <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/25 px-4 focus-within:border-[var(--partner)]"><span className="text-xl text-white/35">$</span><input name="price" required type="number" min="0" max="10000" step="0.01" defaultValue={(retail / 100).toFixed(2)} className="min-h-16 min-w-0 flex-1 bg-transparent px-2 text-3xl font-black outline-none" /><span className="text-xs text-white/30">USD / month</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/[.035] p-3"><span className="block text-white/35">Your wholesale</span><strong className="mt-1 block">${(wholesale / 100).toFixed(2)}</strong></div><div className="rounded-lg bg-white/[.035] p-3"><span className="block text-white/35">Margin per athlete</span><strong className={`mt-1 block ${retail - wholesale < 0 ? "text-amber-200" : "text-emerald-200"}`}>${((retail - wholesale) / 100).toFixed(2)}</strong></div></div>
                {link && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 p-3 text-xs leading-5 text-white/50"><input name="migrateExisting" type="checkbox" defaultChecked className="mt-1 accent-[var(--partner)]" /><span><strong className="block text-white/75">Apply to active subscriptions</strong>The new amount starts at each athlete&apos;s next renewal with no mid-cycle proration.</span></label>}
                <button disabled={busy || !canAdmin} className="mt-5 w-full rounded-lg bg-[var(--partner)] px-4 py-3 text-sm font-black disabled:opacity-45">{link ? "Save and sync with Stripe" : "Create Stripe pricing"}</button>
              </form>;
            })}
          </div> : <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b131c] p-7"><Link2 className="h-6 w-6 text-[var(--partner)]" /><h3 className="mt-4 text-xl font-black">Connect Stripe to create your catalog</h3><p className="mt-2 text-sm text-white/45">Once onboarding is complete, Pro starts at $15/month and Elite at $25/month automatically. You can change both here afterward.</p><button disabled={busy || !canAdmin} onClick={connectStripe} className="mt-5 rounded-lg bg-[var(--partner)] px-5 py-3 text-sm font-black">Connect Stripe</button></div>}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5"><h3 className="font-black">Custom athlete offers</h3><p className="mt-2 text-sm leading-6 text-white/40">When creating an athlete, choose the catalog price, enter a private custom monthly price, or make it free to the athlete. Your wholesale seat remains the same in every case.</p></div>
        </section>}

        {tab === "economics" && <section className="mt-6">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--partner)]">Business performance</p><h2 className="mt-2 text-2xl font-black">Revenue and expenses</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">A simple monthly view of what athletes pay through your Stripe and what Diamond Profile bills your organization.</p></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { Icon: WalletCards, label: "Retail MRR", value: retailMrr, detail: "Athlete subscriptions", count: false },
              { Icon: Receipt, label: "Platform expense", value: estimated, detail: "Base, seats, and domains", count: false },
              { Icon: TrendingUp, label: "Est. gross margin", value: grossMargin, detail: "Before Stripe fees and tax", count: false },
              { Icon: Users, label: "Active paid seats", value: activeAthleteRows.length, detail: `${counts.pro} Pro · ${counts.elite} Elite`, count: true },
            ].map(({ Icon, label, value, detail, count }, index) => <div key={label} className="rounded-2xl border border-white/10 bg-[#0b131c] p-5"><Icon className="h-5 w-5 text-[var(--partner)]" /><p className="mt-5 text-xs text-white/40">{label}</p><p className={`mt-2 text-3xl font-black ${index === 2 && value < 0 ? "text-amber-200" : ""}`}>{count ? value : `${value < 0 ? "−" : ""}$${(Math.abs(value) / 100).toFixed(2)}`}</p><p className="mt-2 text-[11px] text-white/30">{detail}</p></div>)}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0b131c]">
            <div className="flex flex-col justify-between gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center"><div><h3 className="font-black">Athlete economics</h3><p className="mt-1 text-xs text-white/35">Monthly recurring amounts by active athlete.</p></div><span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Gross margin excludes the white-label base fee</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-black/20 text-[10px] uppercase tracking-wider text-white/35"><tr><th className="px-5 py-3">Athlete</th><th className="px-4 py-3">Offer</th><th className="px-4 py-3 text-right">Retail</th><th className="px-4 py-3 text-right">Wholesale</th><th className="px-5 py-3 text-right">Seat margin</th></tr></thead><tbody className="divide-y divide-white/[.07]">{activeAthleteRows.map(({ athlete, link, retail, wholesale, margin }) => <tr key={athlete.id}><td className="px-5 py-4"><strong>{athlete.first_name} {athlete.last_name}</strong><span className="ml-2 text-[10px] uppercase text-white/30">{athlete.partner_plan}</span></td><td className="px-4 py-4 text-white/50">{athlete.partner_billing_source === "partner_paid" ? "Free to athlete" : link?.pricing_scope === "athlete" ? "Custom price" : "Catalog price"}</td><td className="px-4 py-4 text-right font-bold">${(retail / 100).toFixed(2)}</td><td className="px-4 py-4 text-right text-white/50">${(wholesale / 100).toFixed(2)}</td><td className={`px-5 py-4 text-right font-black ${margin < 0 ? "text-amber-200" : "text-emerald-200"}`}>{margin < 0 ? "−" : ""}${(Math.abs(margin) / 100).toFixed(2)}</td></tr>)}{activeAthleteRows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-white/35">Active athletes will appear here as soon as their profiles are activated.</td></tr>}</tbody></table></div>
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-xl border border-white/10 p-4"><span className="text-white/35">White-label platform</span><strong className="mt-2 block">${((organization.wholesale_billing_exempt ? 0 : organization.partnership_type === "white_label" ? organization.white_label_monthly_cents : 0) / 100).toFixed(2)}/mo</strong></div><div className="rounded-xl border border-white/10 p-4"><span className="text-white/35">Managed player domains</span><strong className="mt-2 block">${(managedDomainExpense / 100).toFixed(2)}/mo</strong></div><div className="rounded-xl border border-white/10 p-4"><span className="text-white/35">Reporting note</span><strong className="mt-2 block text-xs leading-5 text-white/60">Stripe fees, refunds, discounts, and taxes are not deducted here.</strong></div></div>
        </section>}

        {tab === "payments" && <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6"><CreditCard className="h-6 w-6 text-[var(--partner)]" /><h2 className="mt-4 text-xl font-black">Wholesale billing</h2><p className="mt-2 text-sm leading-6 text-white/45">Your card pays Diamond Profile only for the white-label platform and active athlete seats. Canceled subscriptions automatically stop counting. Stripe promotion codes are applied during checkout.</p><button disabled={busy || !canAdmin} onClick={setupBilling} className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-black text-black">{whiteLabelLocked ? "Activate white label" : organization.partnership_type === "white_label" ? "Manage billing" : organization.billing_payment_method_ready ? "Update billing card" : "Add billing card"}</button><p className="mt-3 text-xs text-white/35">Status: {whiteLabelLocked ? "Activation required" : organization.billing_payment_method_ready ? "Ready" : organization.platform_subscription_status} · {organization.platform_subscription_status}</p>{organization.billing_sync_error && <p className="mt-3 text-xs text-red-200">{organization.billing_sync_error}</p>}</div>
          <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6"><Link2 className="h-6 w-6 text-[var(--partner)]" /><h2 className="mt-4 text-xl font-black">Your Stripe checkout</h2><p className="mt-2 text-sm leading-6 text-white/45">Set up your Stripe account to collect athlete payments directly. Stripe securely handles identity verification and payouts while Diamond Profile keeps athlete access synchronized.</p><button disabled={busy || !canAdmin} onClick={connectStripe} className="mt-5 rounded-lg bg-[var(--partner)] px-4 py-3 text-sm font-black">{stripeStatus?.status === "active" ? "Update Stripe details" : organization.stripe_account_id ? "Continue Stripe onboarding" : "Onboard to collect payments"}</button><p className="mt-3 text-xs text-white/35">Status: {stripeStatus?.status === "active" ? "Ready to accept payments" : stripeStatus?.requirementsStatus === "past_due" ? "Action required in Stripe" : organization.stripe_account_id ? "Onboarding incomplete" : "Not started"}</p></div>
          {organization.stripe_account_status === "active" && <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6 lg:col-span-2"><h2 className="font-black">Stripe catalog managed automatically</h2><p className="mt-2 text-sm leading-6 text-white/40">Diamond Profile creates and replaces your connected Stripe products, prices, and checkout configuration. Use Price management for all retail changes.</p><button type="button" onClick={() => setTab("pricing")} className="mt-4 rounded-lg border border-white/10 px-4 py-3 text-sm font-black">Open Price management</button></div>}
        </section>}

        {tab === "brand" && <form action={(form) => run(() => api(`/api/partner/organizations/${organization.id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), logoUrl: form.get("logoUrl"), primaryColor: form.get("primaryColor"), supportEmail: form.get("supportEmail") }) }))} className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#0b131c] p-6"><h2 className="text-xl font-black">Brand settings</h2><p className="mt-2 text-sm text-white/40">White-label partners replace Diamond Profile branding on managed profiles. Standard partners remain co-branded.</p><label className="mt-5 block text-xs font-bold text-white/45">Organization name</label><input name="name" defaultValue={organization.name} className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><label className="mt-4 block text-xs font-bold text-white/45">Logo</label><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"><input name="logoUrl" defaultValue={organization.logo_url || ""} placeholder="Logo URL or upload a file" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-white/65 hover:text-white">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} /></label></div><div className="mt-4 grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-white/45">Brand color</label><input name="primaryColor" type="color" defaultValue={organization.primary_color} className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/25 p-2" /></div><div><label className="block text-xs font-bold text-white/45">Support email</label><input name="supportEmail" type="email" defaultValue={organization.support_email || ""} className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /></div></div><button disabled={!canAdmin || busy} className="mt-5 rounded-lg bg-[var(--partner)] px-5 py-3 text-sm font-black">Save brand</button></form>}

        {tab === "team" && <section className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#0b131c] p-6"><h2 className="text-xl font-black">Partner team</h2><p className="mt-2 text-sm text-white/40">Invite administrators, editors, or read-only viewers.</p>{canAdmin && <form action={(form) => run(() => api(`/api/partner/organizations/${organization.id}/members`, { method: "POST", body: JSON.stringify({ email: form.get("email"), role: form.get("role") }) }))} className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto]"><input name="email" required type="email" placeholder="teammate@email.com" className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm" /><select name="role" className="rounded-lg border border-white/10 bg-[#0b131c] px-3 py-3 text-sm"><option value="editor">Editor</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select><button disabled={busy} className="rounded-lg bg-white px-4 py-3 text-sm font-black text-black">Invite</button></form>}<p className="mt-5 text-xs text-white/35">{memberCount} active member{memberCount === 1 ? "" : "s"}</p></section>}
        {tab === "domain" && <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {organization.partnership_type === "white_label" ? <form action={connectDomain} className="rounded-2xl border border-white/10 bg-[#0b131c] p-6">
            <Globe2 className="h-6 w-6 text-[var(--partner)]" />
            <h2 className="mt-4 text-xl font-black">Connect your white-label domain</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Use your business domain, such as academybaseball.com. The existing website at the apex remains untouched. Management runs at <strong className="text-white/70">admin.yourdomain.com</strong>, the builder at <strong className="text-white/70">builder.yourdomain.com</strong>, and each athlete at <strong className="text-white/70">slug.yourdomain.com</strong>.</p>
            <input name="domain" required defaultValue={organization.profile_domain || ""} placeholder="academybaseball.com" className="mt-5 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" />
            <button disabled={busy || !canAdmin || whiteLabelLocked} className="mt-4 rounded-lg bg-[var(--partner)] px-5 py-3 text-sm font-black disabled:opacity-45">{whiteLabelLocked ? "Activate to connect" : organization.profile_domain ? "Recheck domain" : "Connect domain"}</button>
            <p className="mt-4 text-xs text-white/35">Status: {organization.profile_domain_status} · Domain connection is included in the white-label platform fee; player managed domains remain a $10/month Diamond Profile add-on.</p>
            {organization.profile_domain_error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-100">{organization.profile_domain_error}</p>}
          </form> : <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6"><Globe2 className="h-6 w-6 text-[var(--partner)]" /><h2 className="mt-4 text-xl font-black">Player domains</h2><p className="mt-2 text-sm leading-6 text-white/45">A white-label apex domain is available on the white-label partnership plan. You can still add separate managed domains for individual players below.</p></div>}
          <div className="rounded-2xl border border-white/10 bg-[#0b131c] p-6">
            <h2 className="text-xl font-black">{organization.partnership_type === "white_label" ? "White-label pricing" : "Partner pricing"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Diamond Profile bills the wholesale base to your organization. You choose the retail price in your connected Stripe Payment Links, and the difference is your margin.</p>
            <button type="button" onClick={() => setTab("pricing")} className="mt-5 rounded-lg border border-white/10 px-4 py-3 text-sm font-black text-white/70 hover:text-white">Manage retail pricing</button>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"><span className="text-white/55">Platform base · Pro</span><strong>${(organization.pro_wholesale_cents / 100).toFixed(0)}/mo per active athlete</strong></div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"><span className="text-white/55">Platform base · Elite</span><strong>${(organization.elite_wholesale_cents / 100).toFixed(0)}/mo per active athlete</strong></div>
              {organization.partnership_type === "white_label" && <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"><span className="text-white/55">White-label platform fee</span><strong>$200/mo before discounts</strong></div>}
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"><span className="text-white/55">Player managed domain</span><strong>$10/mo to Diamond Profile</strong></div>
            </div>
            {builderHost && <a href={builderHost} className="mt-5 inline-flex rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-white/70 hover:text-white">Open branded builder</a>}
          </div>
        </section>}

        {tab === "domain" && <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b131c] p-6">
          <h2 className="text-xl font-black">Player custom domains</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">A player can use a separate custom .com in addition to your white-label subdomain. Diamond Profile purchases and manages it, and the $10/month platform domain charge is included in your wholesale billing—not your partner’s Stripe checkout.</p>
          <div className="mt-5 grid gap-3">{athletes.map((athlete) => <form key={athlete.id} action={(form) => run(() => api(`/api/partner/organizations/${organization.id}/athletes/${athlete.id}/domain`, { method: form.get("action") === "remove" ? "DELETE" : "POST", body: form.get("action") === "remove" ? undefined : JSON.stringify({ domain: form.get("domain") }) }))} className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="text-sm font-bold">{athlete.first_name} {athlete.last_name}</p><p className="mt-1 text-xs text-white/35">{athlete.has_custom_domain ? `${athlete.custom_domain} · ${athlete.custom_domain_status}` : "No separate domain"}</p></div><input name="domain" defaultValue={athlete.custom_domain || ""} placeholder="playername.com" disabled={athlete.has_custom_domain} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm disabled:opacity-45" /><button name="action" value={athlete.has_custom_domain ? "remove" : "connect"} disabled={busy || !canAdmin || (!athlete.has_custom_domain && !organization.billing_payment_method_ready)} className="rounded-lg bg-white px-4 py-2.5 text-xs font-black text-black disabled:opacity-40">{athlete.has_custom_domain ? "Remove domain" : "Add $10 domain"}</button></form>)}</div>
        </section>}
      </div>
    </main>
  );
}
