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

const featureCards = [
  { icon: Film, title: "Film and training", body: "Lead with highlights, training clips, and the moments coaches should see first." },
  { icon: Trophy, title: "Baseball-native stats", body: "Show position-aware hitting, pitching, season, team, bats, throws, and recruiting data." },
  { icon: Smartphone, title: "Built for your phone", body: "Upload, reorder, preview, publish, and update the entire profile between games." },
  { icon: BarChart3, title: "Recruiting analytics", body: "Paid plans show profile views and video plays across the last 30 days." },
  { icon: Globe2, title: "A real .com", body: "Add a managed standard .com that we purchase, connect, renew, and manage." },
  { icon: Palette, title: "Three designs", body: "Change the presentation, team color, and hero image size without rebuilding your content." },
];

const testimonials = [
  { quote: "Placeholder for a parent story about sending one polished link to college coaches.", person: "Parent testimonial", detail: "Player family · Coming soon" },
  { quote: "Placeholder for a player story about keeping film, stats, and recruiting information current.", person: "Player testimonial", detail: "Class year · Coming soon" },
  { quote: "Placeholder for a coach perspective on finding the important information without hunting.", person: "Coach testimonial", detail: "Program name · Coming soon" },
];

function ProductWindow() {
  return (
    <div className="relative mx-auto w-full max-w-[780px]">
      <div className="absolute -inset-12 rounded-full bg-[#e01010]/25 blur-[90px]" />
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#100204] p-1.5 shadow-[0_45px_120px_rgba(0,0,0,.65)] sm:p-2">
        <div className="overflow-hidden rounded-[1rem] border border-white/10 bg-[#090b0e]">
          <div className="flex h-11 items-center gap-3 border-b border-white/10 bg-[#15171a] px-3 sm:px-4">
            <Image src="/diamond-profile-logo.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            <strong className="hidden text-[11px] text-white/75 sm:block">Diamond Profile</strong>
            <span className="min-w-0 flex-1 truncate rounded-md border border-white/5 bg-black/25 px-3 py-1.5 text-center font-mono text-[8px] text-white/35">
              diamondprofile.app/marcus-cole
            </span>
            <span className="h-2 w-2 rounded-full bg-[#e01010]" />
          </div>
          <div className="relative min-h-[430px] overflow-hidden sm:min-h-[515px]">
            <Image src="/images/baseball-hero-no-people.png" alt="" fill priority className="object-cover object-center opacity-55" sizes="(min-width:1024px) 780px, 94vw" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,9,.98)_0%,rgba(5,7,9,.76)_50%,rgba(5,7,9,.18)_100%)]" />
            <div className="absolute inset-y-0 left-0 z-20 hidden w-10 flex-col items-center gap-4 border-r border-white/10 bg-[#0c0e11]/85 py-5 sm:flex">
              {[Film, Trophy, BarChart3, Palette].map((Icon, index) => (
                <span key={index} className={`flex h-7 w-7 items-center justify-center rounded-md ${index === 0 ? "bg-[#e01010] text-white" : "text-white/25"}`}><Icon className="h-3.5 w-3.5" /></span>
              ))}
            </div>
            <span className="absolute right-4 top-10 font-mono text-[8rem] font-black leading-none text-[#e01010]/30 sm:right-8 sm:text-[12rem]">12</span>
            <div className="absolute bottom-0 right-[-9%] h-[90%] w-[72%] sm:right-[-5%] sm:w-[66%]">
              <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-90" sizes="(min-width:1024px) 520px, 70vw" />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(transparent,rgba(5,7,9,.96)_38%)] px-5 pb-5 pt-28 sm:pl-16 sm:pr-8 sm:pb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff7a7a]">Shortstop · Class of 2027</p>
              <h3 className="mt-2 text-4xl font-bold tracking-[-0.055em] text-white sm:text-6xl">Marcus Cole</h3>
              <p className="mt-2 text-[11px] text-white/45">Motor City Select · Detroit, Michigan</p>
              <div className="mt-5 grid max-w-lg grid-cols-3 gap-1 sm:grid-cols-6">
                {[[".347", "AVG"], [".429", "OBP"], [".518", "SLG"], ["5", "HR"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-2.5 text-center backdrop-blur-md">
                    <strong className="block text-sm text-white">{value}</strong><span className="text-[8px] font-bold tracking-wider text-white/30">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardWindow() {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[#071018]/15 bg-white shadow-[0_22px_70px_rgba(7,16,24,.16)]">
      <div className="flex h-11 items-center gap-2 border-b border-[#071018]/10 px-4">
        <span className="h-2 w-2 rounded-full bg-[#e01010]" />
        <span className="h-2 w-2 rounded-full bg-[#f1c85b]" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-auto text-[9px] font-semibold text-[#071018]/35">Player dashboard</span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b91c1c]">Last 30 days</p><h3 className="mt-1 text-xl font-bold">Portfolio performance</h3></div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#071018] text-white"><BarChart3 className="h-4 w-4" /></span>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-2">
          {[["1,284", "Profile views"], ["317", "Video plays"], ["16", "Active days"]].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-[#f3f1ec] p-3 sm:p-4"><strong className="block text-lg sm:text-2xl">{value}</strong><span className="text-[9px] text-[#071018]/45">{label}</span></div>
          ))}
        </div>
        <div className="mt-7 flex h-44 items-end gap-2 rounded-xl bg-[#f6f4f0] px-4 pt-5">
          {[24, 38, 18, 56, 44, 72, 52, 88, 62, 100, 74, 92, 68, 84, 96].map((height, index) => (
            <span key={index} className="min-w-0 flex-1 rounded-t-sm bg-[linear-gradient(#f03535,#b00000)]" style={{ height: height + "%" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-black text-white">
      <header className="relative z-50 border-b border-white/10 bg-[#18181b]">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3" aria-label="Diamond Profile home">
            <Image src="/diamond-profile-logo.png" alt="" width={46} height={46} className="h-10 w-10 object-contain" priority />
            <span className="hidden text-base font-black tracking-[-0.02em] min-[390px]:block">DIAMOND PROFILE</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[15px] text-white/70 lg:flex">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#designs" className="transition hover:text-white">Designs</a>
            <a href="#dashboard" className="transition hover:text-white">Dashboard</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth" className="hidden min-h-11 items-center px-3 text-sm text-white/65 hover:text-white sm:flex">Sign in</Link>
            <Link href="/builder" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85 sm:px-5">
              Build yours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative bg-[radial-gradient(circle_at_25%_4%,#ef2838_0%,#a90714_21%,#310008_50%,#050505_78%)] px-4 pb-24 pt-20 sm:px-7 sm:pt-24 lg:pb-32">
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(black,transparent_60%)]" />
        <div className="relative mx-auto max-w-[1280px] text-center">
          <p className="text-sm font-semibold text-white/70 sm:text-base">The recruiting website built for baseball</p>
          <h1 className="mx-auto mt-7 max-w-[1050px] text-[clamp(3.25rem,7.2vw,6.85rem)] font-bold leading-[0.92] tracking-[-0.06em]">
            More than a stat line.<br />Your whole game.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/68 sm:text-xl sm:leading-8">
            Turn film, numbers, academics, training, and your story into one recruiting website a coach can understand before the next pitch.
          </p>
          <div className="mt-14 sm:mt-16"><ProductWindow /></div>
          <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/builder" className="inline-flex min-h-13 min-w-52 items-center justify-center gap-2 rounded-full bg-white px-7 text-lg font-medium text-black transition hover:scale-[1.02]">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#product" className="inline-flex min-h-13 min-w-52 items-center justify-center gap-2 rounded-full border border-white/35 px-7 text-lg text-white transition hover:bg-white/10">
              <CirclePlay className="h-4 w-4" /> Explore the product
            </a>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#ff7a7a]" /> Publish free</span>
            <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#ff7a7a]" /> Build from your phone</span>
            <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#ff7a7a]" /> Update anytime</span>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-7">
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 overflow-hidden rounded-[2rem] border border-[#ff5662] bg-[linear-gradient(125deg,#ffd9dc_0%,#f1c4ca_48%,#ddb7dc_100%)] p-7 text-[#111218] sm:p-12 lg:grid-cols-[.82fr_1.18fr] lg:p-16">
          <div>
            <p className="text-sm font-semibold text-[#b0000d]">The player command center</p>
            <h2 className="mt-5 max-w-lg text-4xl font-bold leading-[1.03] tracking-[-0.045em] sm:text-5xl">Launch once. Keep improving every week.</h2>
            <p className="mt-6 max-w-lg text-lg leading-7 text-[#111218]/70">Manage the live site, monitor plan usage, check domain status, handle billing, and see paid analytics from one dashboard.</p>
            <Link href="/auth" className="mt-8 inline-flex min-h-13 items-center gap-2 rounded-full bg-[#18181b] px-7 font-medium text-white">Open your dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <DashboardWindow />
        </div>
      </section>

      <section id="product" className="mx-auto max-w-[1360px] px-4 pb-28 pt-24 sm:px-7 sm:pt-32">
        <p className="text-xl font-semibold text-[#ff4c59]">For {"{players}"}</p>
        <h2 className="mt-5 max-w-5xl text-5xl font-bold leading-[.98] tracking-[-0.055em] sm:text-7xl">Everything a coach needs. In one place.</h2>

        <div className="mt-16 rounded-[2rem] border border-[#721620] bg-[#21070c] p-6 sm:p-10 lg:p-14">
          <h3 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-3xl">A complete recruiting toolkit that keeps the player—not the platform—at the center.</h3>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="group min-h-48 rounded-2xl border border-[#a02a35] bg-[#47101a] p-6 transition hover:-translate-y-1 hover:bg-[#57131e]">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${index % 3 === 0 ? "bg-[linear-gradient(135deg,#ff5d68,#9f0010)]" : index % 3 === 1 ? "bg-[linear-gradient(135deg,#ff9b67,#d8112a)]" : "bg-[linear-gradient(135deg,#f36b96,#7d1326)]"}`}><Icon className="h-5 w-5" /></span>
                  <div><h4 className="text-lg font-bold">{title}</h4><p className="mt-2 text-sm leading-6 text-white/58">{body}</p></div>
                </div>
              </article>
            ))}
          </div>
          <Link href="/builder" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-white">Explore the builder <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 pb-12 sm:px-7">
        <div className="flex flex-col justify-between gap-8 border-y border-white/15 py-14 lg:flex-row lg:items-center">
          <h2 className="text-4xl font-bold tracking-[-0.045em] sm:text-5xl">One link. The complete player.</h2>
          <p className="text-[clamp(4rem,9vw,8rem)] font-light leading-none tracking-[-0.07em] text-[#ff4c59]">1 LINK</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-7 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          <div className="border-l-4 border-[#e01010] pl-7">
            <p className="text-sm font-semibold text-[#ff5965]">Film that starts the conversation</p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Put the best rep first.</h2>
            <p className="mt-6 text-lg leading-8 text-white/62">Host video professionally on paid plans or embed YouTube on Free. Every clip stays connected to the player context around it.</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/15 bg-[#17181c] p-3 shadow-2xl">
            <div className="flex h-9 items-center gap-2 px-2 text-[10px] text-white/35"><span className="h-2 w-2 rounded-full bg-[#e01010]" /> Hitting highlights · Spring 2027</div>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#401018,#111317_55%,#090a0c)]">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_70%_30%,#ff4d5b,transparent_35%)]" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur"><CirclePlay className="h-9 w-9 text-white" /></span>
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between"><div><p className="text-lg font-semibold">Marcus Cole</p><p className="mt-1 text-xs text-white/40">6 clips · 04:18</p></div><span className="rounded-full bg-[#e01010] px-3 py-1 text-[10px] font-bold">FEATURED</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-7 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr] lg:gap-20">
          <div className="order-2 rounded-[1.4rem] border border-white/15 bg-[#131417] p-5 lg:order-1 sm:p-8">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">2027 season</p><Trophy className="h-5 w-5 text-[#ff5965]" /></div>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[[".347", "AVG"], [".429", "OBP"], [".518", "SLG"], ["5", "HR"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[.035] p-5"><strong className="block text-3xl tracking-tight">{value}</strong><span className="mt-1 block text-[10px] font-bold tracking-wider text-white/35">{label}</span></div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-[#e01010] p-5"><p className="text-sm font-semibold">Shortstop · Bats R · Throws R</p><p className="mt-1 text-xs text-white/65">Motor City Select · Class of 2027</p></div>
          </div>
          <div className="order-1 border-l-4 border-[#e01010] pl-7 lg:order-2">
            <p className="text-sm font-semibold text-[#ff5965]">Stats that speak baseball</p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">The numbers, with the right context.</h2>
            <p className="mt-6 text-lg leading-8 text-white/62">Position-aware hitting and pitching numbers, season history, teams, bats and throws, academics, and recruiting profiles.</p>
          </div>
        </div>
      </section>

      <section id="designs" className="mx-auto max-w-[1360px] px-4 py-24 sm:px-7 sm:py-32">
        <p className="text-xl font-semibold text-[#ff4c59]">For {"{first impressions}"}</p>
        <h2 className="mt-5 max-w-5xl text-5xl font-bold leading-[.98] tracking-[-0.055em] sm:text-7xl">Same player. Three distinct ways to show up.</h2>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">Every design uses the same information. Switch the presentation without rebuilding the content.</p>

        <div className="mt-14 rounded-[2rem] border border-[#721620] bg-[#21070c] p-5 sm:p-8">
          <div className="mx-auto mb-7 flex w-fit rounded-full border border-white/25 p-1 text-xs sm:text-sm">
            <span className="rounded-full border border-[#ff4c59] px-4 py-2">Cinematic</span><span className="px-4 py-2 text-white/55">Clubhouse</span><span className="px-4 py-2 text-white/55">Prospect Card</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { name: "Cinematic", number: "01", tone: "from-[#8c121f] via-[#2c0a10] to-[#08090b]", copy: "Big image, bold name, immediate impact." },
              { name: "Clubhouse", number: "02", tone: "from-[#4d1018] via-[#180d12] to-[#08090b]", copy: "Editorial split layout with structured details." },
              { name: "Prospect Card", number: "03", tone: "from-[#70121c] via-[#260d13] to-[#08090b]", copy: "Centered identity with a modern player-card feel." },
            ].map((design) => (
              <article key={design.name} className="group overflow-hidden rounded-2xl border border-[#a02a35] bg-[#3b0c14]">
                <div className={`relative flex aspect-[4/5] items-end overflow-hidden bg-gradient-to-br p-5 ${design.tone}`}>
                  <span className="absolute right-3 top-3 text-[6rem] font-light leading-none text-white/10">{design.number}</span>
                  <div className="absolute bottom-0 right-[-10%] h-[82%] w-[82%] transition duration-500 group-hover:scale-105"><Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-75" sizes="(min-width:1024px) 380px, 90vw" /></div>
                  <div className="relative z-10"><p className="text-xs font-semibold text-[#ff7a7a]">Design {design.number}</p><h3 className="mt-2 text-3xl font-bold">{design.name}</h3></div>
                </div>
                <div className="flex min-h-24 items-center justify-between gap-4 p-5"><p className="text-sm leading-6 text-white/58">{design.copy}</p><Palette className="h-4 w-4 shrink-0 text-white/30" /></div>
              </article>
            ))}
          </div>
          <Link href="/builder" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Try every design free <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 py-24 sm:px-7 sm:py-32">
        <p className="text-xl font-semibold text-[#ff4c59]">From {"{blank page}"} to shared link</p>
        <h2 className="mt-5 max-w-5xl text-5xl font-bold leading-[.98] tracking-[-0.055em] sm:text-7xl">Built for momentum, not setup fatigue.</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/15 bg-white/15 md:grid-cols-3">
          {[
            { step: "01", icon: Sparkles, title: "Build the story", body: "Add player details, photos, stats, academics, film, training, and recruiting links." },
            { step: "02", icon: LayoutTemplate, title: "Choose the look", body: "Pick one of three designs, set the team color, size the hero image, and preview mobile." },
            { step: "03", icon: Link2, title: "Publish and track", body: "Choose an address, publish free, or add hosted video, analytics, and a managed domain." },
          ].map(({ step, icon: Icon, title, body }) => (
            <article key={step} className="bg-[#151518] p-7 sm:p-10">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#ff5965]">{step}</span><Icon className="h-5 w-5 text-white/35" /></div>
              <h3 className="mt-20 text-2xl font-bold">{title}</h3>
              <p className="mt-4 text-sm leading-6 text-white/50">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="dashboard" className="px-4 py-5 sm:px-7">
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 overflow-hidden rounded-[2rem] border border-[#ff5662] bg-[linear-gradient(125deg,#ffd9dc_0%,#efc7d4_52%,#d6c2e8_100%)] p-7 text-[#111218] sm:p-12 lg:grid-cols-[.85fr_1.15fr] lg:p-16">
          <div>
            <p className="text-sm font-semibold text-[#b0000d]">A dashboard after launch</p>
            <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[1.03] tracking-[-0.045em] sm:text-5xl">Publishing is the start, not the finish.</h2>
            <p className="mt-6 max-w-lg text-lg leading-7 text-[#111218]/70">Keep the site current, manage billing and domain status, monitor limits, and—on paid plans—see what coaches view and play.</p>
            <Link href="/auth" className="mt-8 inline-flex min-h-13 items-center gap-2 rounded-full bg-[#18181b] px-7 font-medium text-white">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <DashboardWindow />
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 py-28 sm:px-7 sm:py-36">
        <p className="text-xl font-semibold text-[#ff4c59]">Stories will live here</p>
        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <h2 className="max-w-4xl text-5xl font-bold leading-[.98] tracking-[-0.055em] sm:text-7xl">Built for the people behind the player.</h2>
          <p className="max-w-sm text-sm leading-6 text-white/45">These are intentionally marked placeholders until real customers approve their stories.</p>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article key={testimonial.person} className="flex min-h-80 flex-col rounded-2xl border border-white/15 bg-[#151518] p-7">
              <span className="text-xs font-semibold text-[#ff5965]">Placeholder testimonial {String(index + 1).padStart(2, "0")}</span>
              <blockquote className="mt-8 text-xl font-medium leading-8 text-white/78">“{testimonial.quote}”</blockquote>
              <div className="mt-auto border-t border-white/10 pt-5"><p className="text-sm font-semibold">{testimonial.person}</p><p className="mt-1 text-xs text-white/35">{testimonial.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1360px] px-4 py-24 sm:px-7 sm:py-32">
        <p className="text-xl font-semibold text-[#ff4c59]">Straightforward pricing</p>
        <h2 className="mt-5 max-w-5xl text-5xl font-bold leading-[.98] tracking-[-0.055em] sm:text-7xl">Start free. Add horsepower when it matters.</h2>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">Every tier includes a live player website. The custom-domain add-on is independent, so any tier can use it.</p>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.name === "Pro";
            return (
              <article key={plan.name} className={`relative flex min-h-[540px] flex-col rounded-[1.6rem] border p-7 sm:p-9 ${featured ? "border-[#ff5965] bg-[linear-gradient(150deg,#5a1019,#1d090d)]" : "border-white/15 bg-[#151518]"}`}>
                {featured && <span className="absolute right-6 top-6 rounded-full bg-[#e01010] px-3 py-1.5 text-[10px] font-bold">MOST POPULAR</span>}
                <p className="text-xs font-semibold text-[#ff5965]">{plan.eyebrow}</p>
                <h3 className="mt-4 text-3xl font-bold">{plan.name}</h3>
                <p className="mt-4 min-h-14 text-sm leading-6 text-white/50">{plan.description}</p>
                <p className="mt-8 text-5xl font-light tracking-tight"><sup className="text-lg">$</sup>{plan.price}<span className="ml-1 text-xs text-white/35">{plan.price ? "/month" : "forever"}</span></p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-white/10 pt-7 text-sm text-white/68">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5965]" />{feature}</li>)}
                </ul>
                <Link href="/builder" className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full font-medium ${featured ? "bg-white text-black" : "border border-white/35 text-white"}`}>Start building <ArrowRight className="h-4 w-4" /></Link>
              </article>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col justify-between gap-6 rounded-[1.6rem] border border-[#ff5965] bg-[#25080d] p-7 sm:flex-row sm:items-center sm:p-9">
          <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e01010]"><Globe2 className="h-5 w-5" /></span><div><h3 className="text-xl font-bold">Managed custom domain</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">One standard .com purchased, connected, renewed, and managed by Diamond Profile. Available with Free, Pro, or Elite.</p></div></div>
          <p className="shrink-0 text-4xl font-light">$10<span className="text-xs text-white/35">/month</span></p>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-7">
        <div className="relative mx-auto overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_20%_10%,#ff4a59_0%,#d60b1c_28%,#68000c_62%,#1c0004_100%)] px-7 py-20 text-center sm:px-12 sm:py-28">
          <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(120deg,transparent_35%,white_36%,transparent_37%,transparent_63%,white_64%,transparent_65%)] [background-size:80px_80px]" />
          <div className="relative mx-auto max-w-5xl">
            <p className="text-sm font-semibold text-white/65">The next coach is one link away</p>
            <h2 className="mt-6 text-5xl font-bold leading-[.95] tracking-[-0.055em] sm:text-7xl">Make the introduction count.</h2>
            <Link href="/builder" className="mt-10 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-lg font-medium text-black">Build your profile <ArrowUpRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>

      <footer className="mt-20 border-t border-white/10 bg-[#18181b] py-10">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-7">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-9 sm:flex-row sm:items-center">
            <Link href="/" className="flex items-center gap-3"><Image src="/diamond-profile-logo.png" alt="" width={52} height={52} className="h-11 w-11 object-contain" /><span className="font-black">DIAMOND PROFILE</span></Link>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/45"><Link href="/builder">Builder</Link><Link href="/auth">Sign in</Link><Link href="/dashboard">Dashboard</Link><a href="#pricing">Pricing</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/support">Support</Link></div>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-[10px] uppercase tracking-[0.16em] text-white/25 sm:flex-row"><span>© {new Date().getFullYear()} Diamond Profile</span><span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Built for the player journey</span></div>
        </div>
      </footer>
    </main>
  );
}
