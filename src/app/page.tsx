import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Globe2, Play, Smartphone, Trophy, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Diamond Portfolio | Baseball Player Portfolio Websites",
  description: "Build a polished baseball recruiting website with stats, video, academics, and one simple link.",
};

const features = [
  { icon: Video, title: "Film that is easy to watch", body: "Put your best clips, training video, and full highlight reel where coaches can find them fast." },
  { icon: Trophy, title: "Baseball-first player details", body: "Show position, bats and throws, hitting or pitching stats, teams, and season history." },
  { icon: Smartphone, title: "Built completely from your phone", body: "Upload photos, add links, preview every change, and publish without touching a desktop." },
];

const plans = [
  {
    name: "Standard",
    price: 29,
    description: "Everything needed for a polished, shareable player website.",
    features: ["Complete portfolio builder", "Hosting and secure profile link", "Unlimited edits", "Mobile-ready player page"],
  },
  {
    name: "Premium",
    price: 39,
    description: "Your player portfolio on its own professional address.",
    features: ["Everything in Standard", "One custom domain included", "Domain search inside the app", "Setup and renewal managed"],
  },
];

export default function HomePage() {
  return (
    <main className="bg-[#f7f7f4] text-[#171717]">
      <section className="relative flex min-h-[88svh] max-h-[820px] flex-col overflow-hidden bg-[#172018] text-white">
        <Image src="/images/baseball-hero.png" alt="Baseball player standing at home plate" fill priority className="object-cover object-[68%_center] sm:object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,15,11,0.96)_0%,rgba(10,15,11,0.76)_38%,rgba(10,15,11,0.12)_74%,rgba(10,15,11,0.12)_100%)]" />
        <header className="relative z-10 border-b border-white/15">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" aria-label="Diamond Portfolio home">
              <Image src="/brand-placeholder.svg" alt="Diamond Portfolio" width={240} height={48} className="h-9 w-auto invert" />
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/auth" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-white/70 hover:text-white sm:flex">Sign in</Link>
              <Link href="/builder" className="flex min-h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-black">
                Start building <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-12 pt-10 sm:px-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-red-300">One link. Your whole game.</p>
            <h1 className="max-w-xl text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">Baseball player portfolio websites</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
              Give coaches one clean place to see your film, stats, academics, contact details, and the player behind the numbers.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <Link href="/builder" className="flex min-h-13 items-center justify-center gap-2 rounded-md bg-red-500 px-6 font-bold text-white hover:bg-red-400">
                Build yours now <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#see-it" className="flex min-h-13 items-center justify-center gap-2 rounded-md border border-white/30 px-6 font-semibold text-white hover:bg-white/10">
                <Play className="h-4 w-4 fill-current" /> See what you can build
              </a>
            </div>
            <p className="mt-4 text-xs text-white/45">Start free. Your work saves on this device. Choose a plan when you are ready to publish.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-black/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {["Film, stats, and academics together", "Designed for coaches on mobile", "Update anytime during the season"].map((item) => (
            <p key={item} className="flex min-h-16 items-center gap-3 py-4 text-sm font-semibold sm:px-6 first:sm:pl-0">
              <Check className="h-4 w-4 shrink-0 text-red-500" /> {item}
            </p>
          ))}
        </div>
      </section>

      <section id="see-it" className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Made for recruiting</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Everything a coach needs. Nothing to hunt for.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-black/60">
              A player profile opens with the essentials, then moves naturally through video, strengths, season numbers, training, and life off the field.
            </p>
            <Link href="/builder" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#172018] px-5 font-bold text-white">
              Open the builder <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-black/10 bg-[#0a0a0a] shadow-2xl shadow-black/15">
            <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] text-white/35">alexrivera.com</span>
            </div>
            <div className="relative aspect-[4/3] min-h-[360px] overflow-hidden text-white">
              <Image src="/images/baseball-hero.png" alt="" fill className="object-cover object-[68%_center] opacity-75" sizes="(min-width:1024px) 60vw, 100vw" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.15))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-red-300">Shortstop / Class of 2027</p>
                <p className="mt-2 text-4xl font-black sm:text-6xl">Alex Rivera</p>
                <p className="mt-2 text-sm text-white/60">Motor City Select / Detroit, MI</p>
                <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 sm:grid-cols-6">
                  {[[".347","AVG"],[".429","OBP"],[".518","SLG"],["5","HR"],["31","RBI"],["14","SB"]].map(([value,label]) => (
                    <div key={label} className="rounded-md bg-black/55 px-2 py-3 text-center backdrop-blur">
                      <p className="font-black">{value}</p><p className="text-[9px] text-white/45">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">A better first impression</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Built around how baseball players are actually evaluated.</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="border-t-2 border-[#172018] pt-5">
                <Icon className="h-6 w-6 text-red-500" />
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/55">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#172018] py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Simple from the first tap</p>
              <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Build it between games.</h2>
            </div>
            <ol className="grid gap-0 border-t border-white/15">
              {[
                ["01", "Add the basics", "Enter player details, team, position, and current stats."],
                ["02", "Make it yours", "Upload photos, choose colors, add film, and connect recruiting profiles."],
                ["03", "Preview and publish", "Check the mobile experience, choose a plan, and share one link."],
              ].map(([number,title,body]) => (
                <li key={number} className="grid grid-cols-[48px_1fr] gap-3 border-b border-white/15 py-6">
                  <span className="font-mono text-sm text-red-300">{number}</span>
                  <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-white/50">{body}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Straightforward pricing</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">Choose your link.</h2>
            <p className="mx-auto mt-4 max-w-xl text-black/55">Both plans include the complete builder and hosting. Premium adds a domain we cover while the subscription stays active.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.name} className={`rounded-lg border p-6 sm:p-8 ${plan.name === "Premium" ? "border-[#172018] bg-[#172018] text-white" : "border-black/15 bg-white"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xl font-bold">{plan.name}</p><p className={`mt-2 text-sm leading-6 ${plan.name === "Premium" ? "text-white/55" : "text-black/55"}`}>{plan.description}</p></div>
                  {plan.name === "Premium" && <Globe2 className="h-6 w-6 text-red-300" />}
                </div>
                <p className="mt-8 text-5xl font-black">${plan.price}<span className="text-sm font-medium opacity-50"> / month</span></p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-red-400" />{feature}</li>)}
                </ul>
                <Link href="/builder" className={`mt-8 flex min-h-12 items-center justify-center gap-2 rounded-md font-bold ${plan.name === "Premium" ? "bg-white text-black" : "bg-[#172018] text-white"}`}>
                  Start building <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Your next introduction</p><h2 className="mt-3 max-w-2xl text-4xl font-black sm:text-5xl">Make it easy for the right coach to remember you.</h2></div>
          <Link href="/builder" className="flex min-h-13 shrink-0 items-center gap-2 rounded-md bg-red-500 px-6 font-bold text-white">Build your portfolio <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Image src="/brand-placeholder.svg" alt="Diamond Portfolio" width={240} height={48} className="h-8 w-auto" />
          <div className="flex gap-5"><Link href="/builder">Builder</Link><Link href="/auth">Sign in</Link><a href="#pricing">Pricing</a></div>
        </div>
      </footer>
    </main>
  );
}
