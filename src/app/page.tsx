import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CirclePlay,
  Film,
  Globe2,
  LayoutTemplate,
  Link2,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Diamond Profile | Baseball Recruiting Websites",
  description: "Turn film, stats, academics, and your story into one baseball recruiting website coaches can understand fast.",
};

const plans = [
  {
    name: "Free",
    price: 0,
    eyebrow: "Get on the board",
    description: "Build and publish a complete baseball recruiting profile.",
    features: ["10 portfolio images", "5 embedded YouTube videos", "All three profile designs", "Diamond Profile hosting"],
  },
  {
    name: "Pro",
    price: 15,
    eyebrow: "Most players start here",
    description: "Add professionally hosted video and see what gets watched.",
    features: ["25 portfolio images", "25 embedded videos", "10 hosted video uploads", "Portfolio and video analytics", "Everything in Free"],
  },
  {
    name: "Elite",
    price: 25,
    eyebrow: "No roster limits",
    description: "For players with a deeper body of film, training, and media.",
    features: ["Fair-use unlimited images", "Fair-use unlimited hosted videos", "Portfolio and video analytics", "Everything in Pro"],
  },
];

const testimonials = [
  { quote: "Placeholder for a parent story about sending one polished link to college coaches.", person: "Parent testimonial", detail: "Player family · Coming soon" },
  { quote: "Placeholder for a player story about keeping film, stats, and recruiting information current.", person: "Player testimonial", detail: "Class year · Coming soon" },
  { quote: "Placeholder for a coach perspective on finding the important information without hunting.", person: "Coach testimonial", detail: "Program name · Coming soon" },
];

function ProductWindow() {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="absolute -inset-10 rounded-full bg-[#ff5a2f]/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#09131c] shadow-[0_45px_100px_rgba(0,0,0,0.55)]">
        <div className="flex h-11 items-center gap-1.5 border-b border-white/10 px-4">
          <span className="h-2 w-2 rounded-full bg-[#ff5a2f]" />
          <span className="h-2 w-2 rounded-full bg-[#f4c95d]" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-3 truncate rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[9px] text-white/35">diamondprofile.app/marcus-cole</span>
        </div>
        <div className="relative min-h-[460px] overflow-hidden sm:min-h-[520px]">
          <Image src="/images/baseball-hero-no-people.png" alt="" fill priority className="object-cover object-center opacity-65" sizes="(min-width:1024px) 50vw, 92vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,11,17,0.98)_0%,rgba(4,11,17,0.72)_48%,rgba(4,11,17,0.12)_100%)]" />
          <div className="absolute -bottom-10 right-[-11%] h-[88%] w-[68%]">
            <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-80" sizes="45vw" />
          </div>
          <span className="absolute right-4 top-12 font-mono text-[8rem] font-black leading-none text-[#ff5a2f]/25 sm:text-[11rem]">12</span>
          <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8a69]">Shortstop · Class of 2027</p>
            <h3 className="mt-2 max-w-md text-5xl font-black uppercase leading-[0.82] tracking-[-0.06em] sm:text-7xl">Marcus<br />Cole</h3>
            <p className="mt-4 text-xs text-white/45">Motor City Select · Detroit, Michigan</p>
            <div className="mt-6 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-6">
              {[[".347", "AVG"], [".429", "OBP"], [".518", "SLG"], ["5", "HR"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => (
                <div key={label} className="bg-[#071018]/90 px-2 py-3 text-center backdrop-blur">
                  <strong className="block text-sm">{value}</strong><span className="text-[8px] font-bold tracking-wider text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-3 z-20 rounded-xl border border-white/10 bg-[#111d26]/95 p-3 shadow-2xl backdrop-blur sm:-left-10 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200"><BarChart3 className="h-4 w-4" /></span>
          <span><strong className="block text-sm">Recruiting analytics</strong><span className="text-[10px] text-white/35">See what gets viewed and played</span></span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#f2eee3] text-[#071018]">
      <section className="relative min-h-screen overflow-hidden bg-[#071018] text-white">
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="absolute -left-40 top-48 h-[32rem] w-[32rem] rounded-full border-[5rem] border-[#ff5a2f]/10" />
        <header className="relative z-30 border-b border-white/10 bg-[#071018]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-10">
            <Link href="/" className="flex items-center gap-3" aria-label="Diamond Profile home">
              <Image src="/diamond-profile-logo.png" alt="" width={54} height={54} className="h-11 w-11 object-contain" priority />
              <span className="hidden text-sm font-black uppercase tracking-[0.16em] min-[390px]:block">Diamond Profile</span>
            </Link>
            <nav className="hidden items-center gap-8 text-xs font-bold text-white/55 md:flex">
              <a href="#product" className="hover:text-white">Product</a>
              <a href="#designs" className="hover:text-white">Designs</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/auth" className="hidden min-h-11 items-center px-3 text-sm font-bold text-white/55 hover:text-white sm:flex">Sign in</Link>
              <Link href="/builder" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#ff5a2f] px-4 text-sm font-black text-white transition hover:bg-[#ff714d]">
                Build yours <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-16 px-4 py-16 sm:px-7 lg:grid-cols-[0.86fr_1.14fr] lg:px-10 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a2f]" /> Built for baseball recruiting
            </div>
            <h1 className="mt-8 max-w-2xl text-[clamp(3.6rem,7.6vw,7.5rem)] font-black uppercase leading-[0.78] tracking-[-0.07em]">
              More than<br /><span className="text-[#ff5a2f]">a stat line.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
              Turn your film, numbers, academics, training, and story into one recruiting website a coach can understand before the next pitch.
            </p>
            <div className="mt-9 flex flex-col gap-3 min-[430px]:flex-row">
              <Link href="/builder" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-white px-6 font-black text-[#071018]">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#product" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 font-bold text-white/75 hover:bg-white/5">
                <CirclePlay className="h-4 w-4" /> See the product
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-white/35">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Publish free</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Build from your phone</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Update anytime</span>
            </div>
          </div>
          <ProductWindow />
        </div>
      </section>

      <section className="border-b border-[#071018]/15 bg-[#ff5a2f] text-white">
        <div className="mx-auto grid max-w-[1440px] sm:grid-cols-3">
          {[
            ["01", "One link for every coach"],
            ["02", "Three designs. Your colors."],
            ["03", "Film performance you can measure"],
          ].map(([number, copy]) => (
            <div key={number} className="flex min-h-20 items-center gap-4 border-b border-white/20 px-5 last:border-0 sm:border-b-0 sm:border-r sm:px-7 sm:last:border-r-0 lg:px-10">
              <span className="font-mono text-xs text-white/55">{number}</span><strong className="text-sm">{copy}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-7">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc3f18]">The recruiting packet evolved</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Everything important. In the right order.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#071018]/55 lg:justify-self-end">
              Coaches should not have to open six apps, chase a PDF, and search social media to understand a player. Diamond Profile gives the essentials first, then makes the deeper story easy to explore.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            <article className="relative min-h-[430px] overflow-hidden rounded-2xl bg-[#071018] p-6 text-white sm:p-8 lg:col-span-7">
              <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(45deg,transparent_48%,white_49%,white_51%,transparent_52%)] [background-size:22px_22px]" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5a2f]"><Film className="h-5 w-5" /></span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">Video · Highlights · Training</span>
              </div>
              <div className="absolute inset-x-6 bottom-6 z-10 sm:inset-x-8 sm:bottom-8">
                <div className="mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,#172b3b,#0b1721)]">
                  <CirclePlay className="h-14 w-14 text-[#ff8a69]" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">Put the best rep first.</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">Host video professionally on paid plans or embed YouTube on Free. Every clip stays connected to the player context around it.</p>
              </div>
            </article>

            <article className="rounded-2xl border border-[#071018]/15 bg-white p-6 sm:p-8 lg:col-span-5">
              <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#071018] text-white"><Trophy className="h-5 w-5" /></span><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#071018]/30">Baseball native</span></div>
              <h3 className="mt-10 text-3xl font-black uppercase tracking-tight">Stats that speak baseball.</h3>
              <p className="mt-3 text-sm leading-6 text-[#071018]/50">Position-aware hitting and pitching numbers, season history, teams, bats and throws, academics, and recruiting profiles.</p>
              <div className="mt-8 grid grid-cols-3 gap-2">
                {[[".347", "AVG"], [".429", "OBP"], [".518", "SLG"], ["5", "HR"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-[#f2eee3] p-3 text-center"><strong className="block text-lg">{value}</strong><span className="font-mono text-[8px] font-bold text-[#071018]/35">{label}</span></div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#071018]/15 bg-[#f4c95d] p-6 sm:p-8 lg:col-span-4">
              <Smartphone className="h-6 w-6" />
              <h3 className="mt-10 text-2xl font-black uppercase">Built between games.</h3>
              <p className="mt-3 text-sm leading-6 text-[#071018]/60">Upload, reorder, preview, publish, and update the entire experience from a phone.</p>
            </article>
            <article className="rounded-2xl border border-[#071018]/15 bg-white p-6 sm:p-8 lg:col-span-4">
              <BarChart3 className="h-6 w-6 text-[#dc3f18]" />
              <h3 className="mt-10 text-2xl font-black uppercase">Know what gets watched.</h3>
              <p className="mt-3 text-sm leading-6 text-[#071018]/50">Paid dashboards show profile views and video plays across the last 30 days.</p>
            </article>
            <article className="rounded-2xl border border-[#071018]/15 bg-[#d9e7e2] p-6 sm:p-8 lg:col-span-4">
              <Globe2 className="h-6 w-6" />
              <h3 className="mt-10 text-2xl font-black uppercase">Your name. Your .com.</h3>
              <p className="mt-3 text-sm leading-6 text-[#071018]/55">Add a managed standard .com separately. We purchase, connect, and renew it while subscribed.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="designs" className="bg-[#071018] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-7">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8a69]">Not another template dump</p><h2 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Three ways to own the first impression.</h2></div>
            <p className="max-w-md text-sm leading-6 text-white/45">Every design uses the same player information. Switch the presentation without rebuilding the content.</p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              { name: "Cinematic", number: "01", tone: "from-[#5f1710] via-[#181415] to-[#080b0d]", position: "items-end", text: "Big image, bold name, immediate impact." },
              { name: "Clubhouse", number: "02", tone: "from-[#142b35] via-[#0d1920] to-[#070c10]", position: "items-center", text: "Editorial split layout with structured details." },
              { name: "Prospect Card", number: "03", tone: "from-[#34301d] via-[#17170f] to-[#080a08]", position: "items-end justify-center text-center", text: "Centered identity with a modern player-card feel." },
            ].map((design) => (
              <article key={design.name} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                <div className={`relative flex aspect-[4/5] overflow-hidden bg-gradient-to-br p-5 ${design.tone} ${design.position}`}>
                  <span className="absolute right-2 top-3 font-mono text-[7rem] font-black leading-none text-white/[0.06]">{design.number}</span>
                  <div className="absolute bottom-0 right-[-10%] h-[82%] w-[78%] transition-transform duration-500 group-hover:scale-105">
                    <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-65" sizes="(min-width:1024px) 30vw, 90vw" />
                  </div>
                  <div className="relative z-10">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#ff8a69]">Design {design.number}</p>
                    <p className="mt-2 text-4xl font-black uppercase leading-[0.85]">{design.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-5"><p className="text-sm text-white/45">{design.text}</p><Palette className="h-4 w-4 shrink-0 text-white/25" /></div>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/builder" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#ff5a2f] px-5 font-black">Try every design free <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#071018]/10 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-7">
          <div className="text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc3f18]">From blank page to shared link</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Built for momentum, not setup fatigue.</h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[#071018]/15 bg-[#071018]/15 md:grid-cols-3">
            {[
              { step: "01", icon: Sparkles, title: "Build the story", body: "Add player details, photos, stats, academics, film, training, and recruiting links." },
              { step: "02", icon: LayoutTemplate, title: "Choose the look", body: "Pick one of three designs, set the team color, size the hero image, and preview mobile." },
              { step: "03", icon: Link2, title: "Publish and track", body: "Choose an address, publish free, or add hosted video, analytics, and a managed domain." },
            ].map(({ step, icon: Icon, title, body }) => (
              <article key={step} className="bg-[#f2eee3] p-7 sm:p-9">
                <div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#dc3f18]">{step}</span><Icon className="h-5 w-5 text-[#071018]/35" /></div>
                <h3 className="mt-16 text-2xl font-black uppercase">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#071018]/50">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d9e7e2] py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1320px] items-center gap-14 px-4 sm:px-7 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#265c54]">A dashboard after launch</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Publishing is the start, not the finish.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#071018]/55">Manage the live site, monitor plan usage, check domain status, handle billing, and—on paid plans—see profile views and video plays from one command center.</p>
            <Link href="/auth" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#071018] px-5 font-black text-white">Open your dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-2xl border border-[#071018]/15 bg-[#071018] p-5 text-white shadow-2xl sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a69]">Last 30 days</p><h3 className="mt-2 text-xl font-black">Portfolio performance</h3></div><BarChart3 className="h-5 w-5 text-white/30" /></div>
            <div className="mt-8 flex h-52 items-end gap-2">
              {[24, 38, 18, 56, 44, 72, 52, 88, 62, 100, 74, 92, 68, 84, 96].map((height, index) => (
                <div key={index} className="flex h-full min-w-0 flex-1 items-end gap-px"><span className="w-1/2 rounded-t-sm bg-[#ff5a2f]" style={{ height: height + "%" }} /><span className="w-1/2 rounded-t-sm bg-[#f4c95d]" style={{ height: Math.max(8, height * 0.52) + "%" }} /></div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[["1,284", "Profile views"], ["317", "Video plays"], ["16", "Active days"]].map(([value, label]) => <div key={label}><strong className="block text-xl">{value}</strong><span className="text-[10px] text-white/35">{label}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071018] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8a69]">Stories will live here</p><h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Built for the people behind the player.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-white/40">These are intentionally marked placeholders until real customers approve their stories.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <article key={testimonial.person} className="flex min-h-72 flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Placeholder testimonial {String(index + 1).padStart(2, "0")}</span>
                <blockquote className="mt-7 text-xl font-bold leading-8 text-white/75">“{testimonial.quote}”</blockquote>
                <div className="mt-auto border-t border-white/10 pt-5"><p className="text-sm font-bold">{testimonial.person}</p><p className="mt-1 text-xs text-white/30">{testimonial.detail}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-7">
          <div className="text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc3f18]">Straightforward pricing</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">Start free. Add horsepower when it matters.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#071018]/50">Every tier includes a live player website. The custom-domain add-on is independent, so any tier can use it.</p>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const featured = plan.name === "Pro";
              return (
                <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${featured ? "border-[#071018] bg-[#071018] text-white shadow-2xl" : "border-[#071018]/15 bg-white"}`}>
                  {featured && <span className="absolute right-5 top-5 rounded-full bg-[#ff5a2f] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em]">Most popular</span>}
                  <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${featured ? "text-[#ff8a69]" : "text-[#dc3f18]"}`}>{plan.eyebrow}</p>
                  <h3 className="mt-3 text-3xl font-black uppercase">{plan.name}</h3>
                  <p className={`mt-3 min-h-12 text-sm leading-6 ${featured ? "text-white/45" : "text-[#071018]/50"}`}>{plan.description}</p>
                  <p className="mt-8 text-5xl font-black tracking-tight"><sup className="text-lg">$</sup>{plan.price}<span className="ml-1 text-xs font-semibold opacity-40">{plan.price ? "/month" : "forever"}</span></p>
                  <ul className={`mt-8 flex-1 space-y-3 border-t pt-6 text-sm ${featured ? "border-white/10 text-white/70" : "border-[#071018]/10 text-[#071018]/65"}`}>
                    {plan.features.map((feature) => <li key={feature} className="flex gap-3"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-[#ff8a69]" : "text-[#dc3f18]"}`} />{feature}</li>)}
                  </ul>
                  <Link href="/builder" className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg font-black ${featured ? "bg-white text-[#071018]" : "bg-[#071018] text-white"}`}>Start building <ArrowRight className="h-4 w-4" /></Link>
                </article>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col justify-between gap-5 rounded-2xl border border-[#071018]/15 bg-[#d9e7e2] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071018] text-white"><Globe2 className="h-5 w-5" /></span><div><h3 className="text-xl font-black uppercase">Managed custom domain</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#071018]/55">One standard .com purchased, connected, renewed, and managed by Diamond Profile. Available with Free, Pro, or Elite.</p></div></div>
            <p className="shrink-0 text-3xl font-black">$10<span className="text-xs opacity-40">/month</span></p>
          </div>
        </div>
      </section>

      <section className="bg-[#ff5a2f] py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-10 px-4 sm:px-7 lg:flex-row lg:items-end">
          <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">The next coach is one link away</p><h2 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.82] tracking-[-0.06em] sm:text-7xl">Make the introduction count.</h2></div>
          <Link href="/builder" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-7 font-black text-[#071018]">Build your profile <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="bg-[#071018] py-10 text-white">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-7">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
            <Link href="/" className="flex items-center gap-3"><Image src="/diamond-profile-logo.png" alt="" width={60} height={60} className="h-12 w-12 object-contain" /><span className="text-sm font-black uppercase tracking-[0.14em]">Diamond Profile</span></Link>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/40"><Link href="/builder">Builder</Link><Link href="/auth">Sign in</Link><Link href="/dashboard">Dashboard</Link><a href="#pricing">Pricing</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/support">Support</Link></div>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-[10px] uppercase tracking-[0.16em] text-white/20 sm:flex-row"><span>© {new Date().getFullYear()} Diamond Profile</span><span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Built for the player journey</span></div>
        </div>
      </footer>
    </main>
  );
}
