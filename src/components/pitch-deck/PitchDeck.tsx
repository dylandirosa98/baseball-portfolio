"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Film,
  Globe2,
  Handshake,
  Layers3,
  Mail,
  Maximize2,
  MonitorSmartphone,
  Palette,
  Play,
  Presentation,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const TOTAL_SLIDES = 10;

const profileImages = [
  { src: "/images/marketing-design-1.png", alt: "Mason Carter Diamond Profile website" },
  { src: "/images/marketing-design-2.png", alt: "Breydan Hayes Diamond Profile website" },
  { src: "/images/marketing-design-3.png", alt: "Ethan Cole Diamond Profile website" },
];

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] sm:text-xs ${dark ? "text-[#a8000d]" : "text-[#ff6a73]"}`}>
      <span className={`h-2 w-2 ${dark ? "bg-[#c90012]" : "bg-[#f31d2f]"}`} />
      {children}
    </p>
  );
}

function SlideTitle({ children, dark = false, compact = false }: { children: React.ReactNode; dark?: boolean; compact?: boolean }) {
  return (
    <h2 className={`${compact ? "text-[clamp(2rem,5vw,4.6rem)]" : "text-[clamp(2.35rem,6vw,5.8rem)]"} mt-4 max-w-5xl font-black leading-[0.92] tracking-[-0.065em] ${dark ? "text-[#090b0e]" : "text-white"}`}>
      {children}
    </h2>
  );
}

function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/diamond-profile-logo.png" alt="" width={36} height={36} className="h-8 w-8 object-contain sm:h-9 sm:w-9" priority />
      <span className={`text-[11px] font-black tracking-[-0.02em] sm:text-sm ${dark ? "text-[#090b0e]" : "text-white"}`}>DIAMOND PROFILE</span>
    </div>
  );
}

function SlideShell({
  children,
  number,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  number: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <article className={`pitch-slide relative h-full w-full overflow-y-auto overflow-x-hidden ${light ? "bg-[#f1eee7] text-[#090b0e]" : "bg-[#08090b] text-white"} ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex min-h-full flex-col p-5 pb-24 sm:p-9 sm:pb-28 lg:p-14 lg:pb-28">
        <div className="flex items-center justify-between">
          <BrandMark dark={light} />
          <span className={`font-mono text-[10px] font-bold tracking-[0.18em] ${light ? "text-black/35" : "text-white/30"}`}>{number}</span>
        </div>
        {children}
      </div>
    </article>
  );
}

function CoverSlide() {
  return (
    <SlideShell number="01 / 10" className="bg-[radial-gradient(circle_at_75%_25%,#6e0610_0%,#210106_32%,#08090b_68%)]">
      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-4">
        <div className="relative z-10">
          <Eyebrow>Partner program</Eyebrow>
          <h1 className="mt-5 max-w-4xl text-[clamp(3.15rem,8vw,7.5rem)] font-black leading-[0.82] tracking-[-0.075em]">
            Give every athlete a profile worth sending.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/58 sm:text-xl sm:leading-8">
            A complete recruiting-profile platform for coaches, academies, trainers, and recruiting organizations—powered by Diamond Profile or presented entirely as your own.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-white/70">
            <span className="rounded-full border border-white/15 bg-white/[.05] px-4 py-2">Standard partnership</span>
            <span className="rounded-full border border-[#f31d2f]/45 bg-[#f31d2f]/10 px-4 py-2 text-[#ff8b92]">Full white label</span>
          </div>
        </div>
        <div className="relative mx-auto h-[55vh] max-h-[660px] min-h-[390px] w-full max-w-[520px]">
          <div className="absolute inset-[8%_5%_5%_8%] rounded-full bg-[#ef172a]/25 blur-[70px]" />
          {profileImages.map((image, index) => (
            <div
              key={image.src}
              className="absolute top-1/2 w-[46%] -translate-y-1/2 overflow-hidden rounded-[1.2rem] bg-black shadow-[0_35px_90px_rgba(0,0,0,.65)] ring-1 ring-white/15"
              style={{ left: `${index * 26}%`, zIndex: index === 1 ? 3 : 2, transform: `translateY(-50%) rotate(${(index - 1) * 5}deg) scale(${index === 1 ? 1 : 0.9})` }}
            >
              <Image src={image.src} alt={image.alt} width={389} height={844} className="h-auto w-full" priority />
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function ProblemSlide() {
  const problems = [
    [Film, "Scattered recruiting material", "Film, stats, academics, contacts, and the player story live across separate links and files."],
    [MonitorSmartphone, "Weak first impressions", "Generic pages and outdated websites make strong athletes harder to understand on a coach’s phone."],
    [Users, "Too much manual work", "Organizations need a repeatable way to launch, update, and manage profiles across an entire roster."],
  ] as const;
  return (
    <SlideShell number="02 / 10" light>
      <div className="flex flex-1 flex-col justify-center py-10">
        <Eyebrow dark>The opportunity</Eyebrow>
        <SlideTitle dark>Athletes have the content. They need one place that makes it count.</SlideTitle>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 lg:grid-cols-3">
          {problems.map(([Icon, title, copy], index) => (
            <div key={title} className="bg-[#f7f4ed] p-6 sm:p-8 lg:min-h-[250px]">
              <div className="flex h-11 w-11 items-center justify-center bg-[#c90012] text-white"><Icon className="h-5 w-5" /></div>
              <span className="mt-7 block font-mono text-[10px] font-bold text-black/30">0{index + 1}</span>
              <h3 className="mt-2 text-xl font-black tracking-[-0.03em] sm:text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/55 sm:text-base">{copy}</p>
            </div>
          ))}
        </div>
        <p className="mt-7 max-w-3xl text-sm font-bold leading-6 text-[#8b0712] sm:text-base">Diamond Profile turns that fragmented experience into a polished, repeatable service your organization can offer every athlete.</p>
      </div>
    </SlideShell>
  );
}

function ProductSlide() {
  return (
    <SlideShell number="03 / 10" className="bg-[radial-gradient(circle_at_20%_40%,#3b0610_0%,#08090b_48%)]">
      <div className="grid flex-1 items-center gap-9 py-9 lg:grid-cols-[.78fr_1.22fr]">
        <div>
          <Eyebrow>The product</Eyebrow>
          <SlideTitle compact>One link. The whole player.</SlideTitle>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg">A mobile-first recruiting website that brings the information coaches need into one fast, professional experience.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              [Film, "Film and hosted video"],
              [BarChart3, "Stats and analytics"],
              [Palette, "Three premium designs"],
              [Globe2, "Shareable player URL"],
              [ShieldCheck, "Academics and contacts"],
              [CircleDollarSign, "Catalog + custom pricing"],
            ].map(([Icon, label]) => (
              <div key={String(label)} className="flex items-center gap-3 border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-bold text-white/75">
                <Icon className="h-4 w-4 text-[#f43a4b]" /> {String(label)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {profileImages.map((image, index) => (
            <div key={image.src} className={`overflow-hidden rounded-[1.1rem] bg-black shadow-2xl ring-1 ring-white/15 ${index === 1 ? "w-[34%]" : "w-[29%] opacity-75"}`}>
              <Image src={image.src} alt={image.alt} width={389} height={844} className="h-auto w-full" />
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function WorkflowSlide() {
  return (
    <SlideShell number="04 / 10" light>
      <div className="flex flex-1 flex-col justify-center py-10">
        <Eyebrow dark>Two creation workflows</Eyebrow>
        <SlideTitle dark compact>Launch athletes the way your team already works.</SlideTitle>
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden bg-[#0a0b0d] p-7 text-white sm:p-9">
            <span className="absolute right-5 top-2 font-mono text-8xl font-black text-white/[.05]">01</span>
            <Mail className="h-7 w-7 text-[#f33a4b]" />
            <h3 className="mt-7 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Invite the athlete to build</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/52 sm:text-base">Enter their name and email, choose the plan, and send a branded invitation. The athlete creates the profile and returns to their dashboard after checkout.</p>
            <div className="mt-7 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/70"><span className="bg-[#c90012] px-3 py-2">Invite</span><ChevronRight className="h-4 w-4" /><span>Build</span><ChevronRight className="h-4 w-4" /><span>Publish</span></div>
          </div>
          <div className="relative overflow-hidden border border-black/15 bg-white p-7 sm:p-9">
            <span className="absolute right-5 top-2 font-mono text-8xl font-black text-black/[.045]">02</span>
            <Sparkles className="h-7 w-7 text-[#c90012]" />
            <h3 className="mt-7 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Build it for the athlete</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-black/55 sm:text-base">Your team builds the profile, then sends a private preview with checkout attached. The athlete approves, pays, and lands directly in the dashboard.</p>
            <div className="mt-7 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-black/60"><span className="bg-[#c90012] px-3 py-2 text-white">Build</span><ChevronRight className="h-4 w-4" /><span>Preview</span><ChevronRight className="h-4 w-4" /><span>Activate</span></div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function PartnerSlide() {
  const capabilities = ["Partner admin workspace", "Roster and profile management", "Invite or done-for-you workflows", "Your own connected Stripe pricing", "Diamond Profile product branding", "No platform subscription fee"];
  return (
    <SlideShell number="05 / 10" className="bg-[linear-gradient(115deg,#08090b_55%,#260007)]">
      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          <Eyebrow>Option one</Eyebrow>
          <SlideTitle compact>Standard partnership</SlideTitle>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-white/55">The fastest way to add professional recruiting profiles to your current service—with Diamond Profile visible as the technology behind the experience.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => <div key={item} className="flex items-start gap-3 text-sm font-semibold text-white/75"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[#d31324]"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}
          </div>
        </div>
        <div className="border border-white/15 bg-white/[.045] p-7 backdrop-blur sm:p-9">
          <Handshake className="h-8 w-8 text-[#f84857]" />
          <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-white/35">Wholesale pricing</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-end justify-between border-b border-white/10 pb-3"><span className="font-bold">Pro athlete</span><strong className="text-3xl tracking-[-0.05em]">$8<span className="text-sm text-white/35"> /mo</span></strong></div>
            <div className="flex items-end justify-between border-b border-white/10 pb-3"><span className="font-bold">Elite athlete</span><strong className="text-3xl tracking-[-0.05em]">$12<span className="text-sm text-white/35"> /mo</span></strong></div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/45">You choose the athlete’s retail price. Diamond Profile charges only the wholesale rate for each active seat.</p>
        </div>
      </div>
    </SlideShell>
  );
}

function WhiteLabelSlide() {
  return (
    <SlideShell number="06 / 10" light className="bg-[radial-gradient(circle_at_85%_20%,#ffd5d8_0%,#f1eee7_42%)]">
      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <Eyebrow dark>Option two</Eyebrow>
          <SlideTitle dark compact>Fully white-labeled</SlideTitle>
          <p className="mt-5 max-w-xl text-lg leading-7 text-black/55">Your brand becomes the product. Your organization controls the experience, the athlete relationship, and the retail price while Diamond Profile runs the infrastructure.</p>
          <div className="mt-7 space-y-3">
            {[
              ["admin.yourdomain.com", "Roster, billing, and management"],
              ["builder.yourdomain.com", "Your branded profile builder"],
              ["athlete.yourdomain.com", "Every athlete’s live profile"],
            ].map(([domain, label]) => (
              <div key={domain} className="grid gap-1 border-l-4 border-[#c90012] bg-white/75 px-4 py-3 sm:grid-cols-[200px_1fr] sm:items-center">
                <strong className="font-mono text-xs text-[#97000d]">{domain}</strong><span className="text-sm text-black/50">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-black/42">Your existing main website stays exactly where it is. Only the product subdomains connect to Diamond Profile.</p>
        </div>
        <div className="relative bg-[#0a0b0d] p-7 text-white shadow-[22px_22px_0_#c90012] sm:p-10">
          <Palette className="h-8 w-8 text-[#f84857]" />
          <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">Your name. Your colors. Your customer.</h3>
          <div className="mt-7 grid grid-cols-3 gap-2 text-center">
            {[['$200', 'platform / mo'], ['$4', 'Pro seat / mo'], ['$6', 'Elite seat / mo']].map(([value, label]) => (
              <div key={label} className="border border-white/10 bg-white/[.04] px-2 py-5"><strong className="block text-2xl sm:text-3xl">{value}</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</span></div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-white/45">Branding and tenant subdomain connection are included. Active athlete seats are billed at the discounted white-label rate.</p>
        </div>
      </div>
    </SlideShell>
  );
}

function ComparisonSlide() {
  const rows = [
    ["Athlete management workspace", true, true],
    ["Invite + done-for-you workflows", true, true],
    ["Connected Stripe retail checkout", true, true],
    ["Diamond Profile branding", "Visible", "Removed"],
    ["Custom colors, name, logo + support", false, true],
    ["Admin, builder + athlete subdomains", false, true],
    ["Monthly platform fee", "$0", "$200"],
    ["Pro / Elite wholesale seat", "$8 / $12", "$4 / $6"],
  ] as const;
  const Value = ({ value }: { value: boolean | string }) => typeof value === "boolean" ? (value ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <X className="mx-auto h-5 w-5 text-black/20" />) : <span className="font-bold">{value}</span>;
  return (
    <SlideShell number="07 / 10" light>
      <div className="flex flex-1 flex-col justify-center py-8">
        <Eyebrow dark>Side by side</Eyebrow>
        <SlideTitle dark compact>Choose the model that fits your brand.</SlideTitle>
        <div className="mt-8 overflow-hidden border border-black/10 bg-white/65">
          <div className="grid grid-cols-[1.35fr_.7fr_.7fr] bg-[#0a0b0d] px-3 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-white sm:px-6 sm:text-xs"><span>Capability</span><span className="text-center">Partner</span><span className="text-center text-[#ff7b84]">White label</span></div>
          {rows.map(([label, partner, whiteLabel], index) => (
            <div key={label} className={`grid grid-cols-[1.35fr_.7fr_.7fr] items-center px-3 py-3 text-[11px] sm:px-6 sm:py-3.5 sm:text-sm ${index % 2 ? "bg-black/[.035]" : ""}`}>
              <span className="pr-2 font-semibold text-black/65">{label}</span><span className="text-center"><Value value={partner} /></span><span className="text-center"><Value value={whiteLabel} /></span>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function MoneySlide() {
  return (
    <SlideShell number="08 / 10" className="bg-[radial-gradient(circle_at_50%_30%,#420711_0%,#08090b_56%)]">
      <div className="flex flex-1 flex-col justify-center py-10">
        <Eyebrow>Simple economics</Eyebrow>
        <SlideTitle compact>You own the sale. You keep the upside.</SlideTitle>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/52 sm:text-lg">Each organization connects Stripe, controls catalog or athlete-specific pricing, and receives athlete payments directly. Diamond Profile bills wholesale separately—even when an athlete receives a free offer.</p>
        <div className="mt-9 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {[
            [WalletCards, "01", "Athlete pays", "Checkout runs through your connected Stripe account at the retail price you choose."],
            [CircleDollarSign, "02", "Revenue reaches you", "The athlete payment belongs to your organization and appears in your Stripe activity."],
            [Layers3, "03", "Wholesale is separate", "Diamond Profile bills your platform fee and active wholesale seats independently."],
          ].map(([Icon, number, title, copy], index) => (
            <div key={String(title)} className="contents">
              <div className="border border-white/12 bg-black/35 p-6 backdrop-blur sm:p-7">
                <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-[#f84857]" /><span className="font-mono text-xs font-bold text-white/25">{String(number)}</span></div>
                <h3 className="mt-8 text-xl font-black">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-white/45">{String(copy)}</p>
              </div>
              {index < 2 && <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-[#f84857] lg:block" />}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 border-l-4 border-[#e11b2c] bg-white/[.04] px-5 py-4 text-sm">
          <strong>Partner margin = your retail price − wholesale rate</strong><span className="text-white/38">No revenue split. No manual invoicing per athlete.</span>
        </div>
      </div>
    </SlideShell>
  );
}

function OperatingSlide() {
  const steps = [
    ["Connect", "Complete Stripe onboarding and choose your retail pricing."],
    ["Brand", "Standard partners launch immediately; white labels add their identity and subdomains."],
    ["Create", "Invite athletes to build or let your team prepare profiles for them."],
    ["Activate", "The athlete checks out—or your organization covers the wholesale seat."],
    ["Manage", "Edit profiles, manage the roster, send links, and monitor the program in one workspace."],
  ];
  return (
    <SlideShell number="09 / 10" light>
      <div className="flex flex-1 flex-col justify-center py-10">
        <Eyebrow dark>From agreement to live roster</Eyebrow>
        <SlideTitle dark compact>A clean launch. A repeatable operation.</SlideTitle>
        <div className="mt-10 grid gap-3 lg:grid-cols-5">
          {steps.map(([title, copy], index) => (
            <div key={title} className="relative border-t-4 border-[#c90012] bg-white p-5 shadow-sm sm:p-6">
              <span className="font-mono text-xs font-black text-[#b0000f]">0{index + 1}</span>
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/50">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-black/55">
          {["Secure invitations", "Private previews", "Connected payments", "Automated entitlements", "Branded publishing"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#b0000f]" />{item}</span>)}
        </div>
      </div>
    </SlideShell>
  );
}

function ClosingSlide() {
  return (
    <SlideShell number="10 / 10" className="bg-[radial-gradient(circle_at_50%_45%,#8e0714_0%,#290107_36%,#08090b_72%)]">
      <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <Eyebrow>Let’s build the next roster</Eyebrow>
        <h2 className="mt-6 max-w-6xl text-[clamp(3.1rem,8vw,8.3rem)] font-black leading-[0.84] tracking-[-0.075em]">Your athletes.<br />Your advantage.</h2>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/58 sm:text-xl">Give every player a recruiting presence your organization is proud to put its name behind.</p>
        <a href="mailto:dylan@diamondprofile.app?subject=Diamond%20Profile%20Partnership" className="mt-10 inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-7 text-sm font-black text-black transition hover:scale-[1.02] sm:text-base">
          <Mail className="h-5 w-5" /> dylan@diamondprofile.app <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">diamondprofile.app</p>
      </div>
    </SlideShell>
  );
}

const slides = [CoverSlide, ProblemSlide, ProductSlide, WorkflowSlide, PartnerSlide, WhiteLabelSlide, ComparisonSlide, MoneySlide, OperatingSlide, ClosingSlide];

export function PitchDeck({ initialSlide = 0 }: { initialSlide?: number }) {
  const [current, setCurrent] = useState(initialSlide);
  const [overview, setOverview] = useState(false);
  const [copied, setCopied] = useState(false);

  const goTo = useCallback((index: number) => {
    const bounded = Math.max(0, Math.min(TOTAL_SLIDES - 1, index));
    setCurrent(bounded);
    setOverview(false);
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(bounded + 1));
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") { event.preventDefault(); goTo(current + 1); }
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); goTo(current - 1); }
      if (event.key === "Home") { event.preventDefault(); goTo(0); }
      if (event.key === "End") { event.preventDefault(); goTo(TOTAL_SLIDES - 1); }
      if (event.key.toLowerCase() === "o") setOverview((value) => !value);
      if (event.key.toLowerCase() === "f") void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  const CurrentSlide = useMemo(() => slides[current], [current]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="fixed inset-0 z-[200] bg-black text-white">
      <div className="h-full w-full"><CurrentSlide /></div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090a0c]/92 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 sm:gap-4">
          <button onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Previous slide" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white disabled:opacity-20"><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={() => goTo(current + 1)} disabled={current === TOTAL_SLIDES - 1} aria-label="Next slide" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-20"><ArrowRight className="h-4 w-4" /></button>
          <div className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
            {slides.map((_, index) => <button key={index} onClick={() => goTo(index)} aria-label={`Go to slide ${index + 1}`} className={`h-1.5 min-w-2 flex-1 rounded-full transition ${index === current ? "bg-[#ef2335]" : index < current ? "bg-white/35" : "bg-white/12"}`} />)}
          </div>
          <span className="ml-auto min-w-12 font-mono text-[10px] font-bold text-white/55 sm:ml-0">{String(current + 1).padStart(2, "0")} / {TOTAL_SLIDES}</span>
          <button onClick={() => setOverview(true)} className="hidden h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-white/65 hover:text-white md:flex"><Presentation className="h-4 w-4" /> Overview</button>
          <button onClick={copyLink} aria-label="Copy slide link" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/65 hover:text-white"><Copy className="h-4 w-4" />{copied && <span className="sr-only">Copied</span>}</button>
          <button onClick={() => void document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/65 hover:text-white"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      {overview && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#08090b]/98 p-5 pb-24 backdrop-blur sm:p-9">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between"><div><Eyebrow>Slide overview</Eyebrow><h2 className="mt-3 text-3xl font-black">Diamond Profile partnerships</h2></div><button onClick={() => setOverview(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15"><X className="h-5 w-5" /></button></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Partner program", "The opportunity", "The product", "Creation workflows", "Standard partnership", "Full white label", "Side-by-side", "Money flow", "Launch process", "Next step"].map((title, index) => (
                <button key={title} onClick={() => goTo(index)} className={`group aspect-video border p-5 text-left transition hover:-translate-y-1 ${index === current ? "border-[#ef2335] bg-[#ef2335]/10" : "border-white/12 bg-white/[.035] hover:border-white/30"}`}>
                  <span className="font-mono text-[10px] text-white/30">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-8 text-xl font-black">{title}</h3><Play className="mt-3 h-4 w-4 text-[#ef4857] opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {copied && <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-xl">Slide link copied</div>}
    </main>
  );
}
