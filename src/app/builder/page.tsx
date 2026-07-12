"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  Globe2,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Paintbrush,
  PanelsTopLeft,
  Plus,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import PlayerTemplate from "@/components/PlayerTemplate";
import ImageUpload from "@/components/admin/ImageUpload";
import MediaPhotoUpload from "@/components/admin/MediaPhotoUpload";
import MediaVideoUpload from "@/components/admin/MediaVideoUpload";
import type { Highlight, MediaItem, Player, PlayerStats, Skillset, SocialLink } from "@/lib/types";

const STORAGE_KEY = "diamond_builder_draft_v1";
const ACTIVE_STEP_KEY = "diamond_builder_active_step_v1";

const emptyStats: PlayerStats = {
  gamesPlayed: 0,
  battingAverage: 0,
  onBasePercentage: 0,
  sluggingPercentage: 0,
  homeRuns: 0,
  runsBattedIn: 0,
  stolenBases: 0,
  inningsPitched: 0,
  wins: 0,
  losses: 0,
  earnedRunAverage: 0,
  whip: 0,
  strikeoutsPitched: 0,
};

const defaultDraft: Player = {
  slug: "preview",
  firstName: "",
  lastName: "",
  position: "Shortstop",
  number: 0,
  team: "",
  league: "",
  hometown: "",
  height: "",
  weight: "",
  bats: "Right",
  throws: "Right",
  birthYear: 0,
  bio: "",
  headshotUrl: "/images/headshot-placeholder.svg",
  heroImageUrl: "/images/hero-placeholder.svg",
  teamLogoUrl: "",
  currentStats: { ...emptyStats },
  seasonHistory: [],
  highlights: [],
  socialLinks: [],
  themeColor: "#b91c1c",
  numberColor: "",
  highlightReelUrl: "",
  resumeUrl: "",
  skillsets: [],
  media: [],
  interests: "",
  interestsMedia: [],
  trainingDescription: "",
  trainingVideos: [],
  timeline: [],
  transcriptUrl: "",
  showStatsBar: true,
  lightMode: false,
  sectionOrder: ["about", "skillsets", "interests", "training", "timeline", "career-stats", "highlights"],
};

type StepId = "info" | "photos" | "style" | "stats" | "content" | "links" | "review";

type Step = {
  id: StepId;
  label: string;
  caption: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  { id: "info", label: "Basics", caption: "Name, team, player details", icon: CircleUserRound },
  { id: "photos", label: "Photos", caption: "Your key profile images", icon: ImageIcon },
  { id: "style", label: "Design", caption: "Colors and page style", icon: Paintbrush },
  { id: "stats", label: "Stats", caption: "Current season numbers", icon: BarChart3 },
  { id: "content", label: "Story", caption: "Bio, media, and highlights", icon: PanelsTopLeft },
  { id: "links", label: "Links", caption: "Socials and documents", icon: Link2 },
  { id: "review", label: "Launch", caption: "Choose a plan and go live", icon: Rocket },
];

const platformOptions: SocialLink["platform"][] = [
  "instagram",
  "twitter",
  "youtube",
  "tiktok",
  "email",
  "perfectgame",
  "maxpreps",
  "ncsa",
  "hudl",
];

const platformLabels: Record<SocialLink["platform"], string> = {
  instagram: "Instagram",
  twitter: "Twitter",
  youtube: "YouTube",
  tiktok: "TikTok",
  email: "Email",
  perfectgame: "Perfect Game",
  maxpreps: "MaxPreps",
  ncsa: "NCSA",
  hudl: "HUDL",
};

const hitterStats: [keyof PlayerStats, string][] = [
  ["gamesPlayed", "GP"],
  ["battingAverage", "AVG"],
  ["onBasePercentage", "OBP"],
  ["sluggingPercentage", "SLG"],
  ["homeRuns", "HR"],
  ["runsBattedIn", "RBI"],
];

const pitcherStats: [keyof PlayerStats, string][] = [
  ["inningsPitched", "IP"],
  ["wins", "W"],
  ["losses", "L"],
  ["earnedRunAverage", "ERA"],
  ["whip", "WHIP"],
  ["strikeoutsPitched", "K"],
];

const inputClass = "min-h-12 w-full rounded-lg border border-white/10 bg-[#151515] px-3.5 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-red-400 focus:ring-2 focus:ring-red-500/15";
const labelClass = "mb-2 block text-xs font-medium text-white/60";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-30";

function mergeDraft(value: unknown): Player {
  if (!value || typeof value !== "object") return defaultDraft;
  return {
    ...defaultDraft,
    ...(value as Partial<Player>),
    currentStats: { ...emptyStats, ...((value as Partial<Player>).currentStats ?? {}) },
    seasonHistory: (value as Partial<Player>).seasonHistory ?? [],
    highlights: (value as Partial<Player>).highlights ?? [],
    socialLinks: (value as Partial<Player>).socialLinks ?? [],
    skillsets: (value as Partial<Player>).skillsets ?? [],
    media: (value as Partial<Player>).media ?? [],
    interestsMedia: (value as Partial<Player>).interestsMedia ?? [],
    trainingVideos: (value as Partial<Player>).trainingVideos ?? [],
    timeline: (value as Partial<Player>).timeline ?? [],
    sectionOrder: (value as Partial<Player>).sectionOrder ?? defaultDraft.sectionOrder,
  };
}

function completionFor(step: StepId, draft: Player) {
  switch (step) {
    case "info":
      return [draft.firstName, draft.lastName, draft.position, draft.team, draft.league].filter(Boolean).length;
    case "photos":
      return [draft.headshotUrl && !draft.headshotUrl.includes("placeholder"), draft.heroImageUrl && !draft.heroImageUrl.includes("placeholder"), draft.teamLogoUrl].filter(Boolean).length;
    case "style":
      return [draft.themeColor, draft.numberColor || draft.themeColor].filter(Boolean).length;
    case "stats":
      return Object.values(draft.currentStats).some((value) => Number(value) > 0) ? 1 : 0;
    case "content":
      return [draft.bio, ...(draft.skillsets ?? []).map((skill) => skill.name), (draft.media ?? []).length, draft.highlights.length, (draft.trainingVideos ?? []).length, draft.interests].filter(Boolean).length;
    case "links":
      return [draft.resumeUrl, draft.transcriptUrl, ...draft.socialLinks.map((link) => link.url)].filter(Boolean).length;
    case "review":
      return draft.firstName && draft.lastName ? 1 : 0;
  }
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function uploadSlugFor(draft: Player) {
  return [draft.firstName, draft.lastName]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-") || "builder-draft";
}

function profileCompletion(draft: Player) {
  const essentials = [
    !!draft.firstName && !!draft.lastName,
    !!draft.team,
    !!draft.league,
    !!draft.heroImageUrl && !draft.heroImageUrl.includes("placeholder"),
    !!draft.bio,
    (draft.media ?? []).some((item) => !!item.url) ||
      draft.highlights.some((item) => !!item.url) ||
      (draft.trainingVideos ?? []).some((item) => !!item.url),
  ];
  return Math.round((essentials.filter(Boolean).length / essentials.length) * 100);
}

export default function BuilderPage() {
  const [draft, setDraft] = useState<Player>(defaultDraft);
  const [activeStep, setActiveStep] = useState<StepId>("info");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "full">("phone");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"saving" | "saved">("saved");
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(ACTIVE_STEP_KEY) as StepId | null;
      const checkout = new URLSearchParams(window.location.search).get("checkout");

      if (saved) setDraft(mergeDraft(JSON.parse(saved)));
      if (savedStep && steps.some((step) => step.id === savedStep)) setActiveStep(savedStep);

      void fetch("/api/portfolio")
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json();
          setCloudEnabled(true);
          if (data.player && !saved) setDraft(mergeDraft(data.player));
        })
        .catch(() => undefined);
      if (checkout === "success" || checkout === "canceled") {
        setCheckoutResult(checkout);
        setActiveStep("review");
      }
    } catch {
      setDraft(defaultDraft);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    localStorage.setItem(ACTIVE_STEP_KEY, activeStep);
    if (!cloudEnabled) setSaveState("saved");
  }, [draft, activeStep, loaded, cloudEnabled]);

  useEffect(() => {
    if (!loaded || !cloudEnabled || !draft.firstName.trim() || !draft.lastName.trim()) return;
    setSaveState("saving");
    const timeout = window.setTimeout(async () => {
      try {
        await fetch("/api/portfolio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        setSaveState("saved");
      } catch {
        setSaveState("saved");
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [draft, loaded, cloudEnabled]);

  useEffect(() => {
    if (!previewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewOpen]);

  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const currentStep = steps[activeIndex];
  const previewPlayer = useMemo<Player>(() => ({ ...draft, slug: draft.slug || "preview" }), [draft]);
  const completion = profileCompletion(draft);

  function update(updates: Partial<Player>) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  function goToStep(step: StepId) {
    setActiveStep(step);
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }

  function nextStep() {
    const next = steps[Math.min(steps.length - 1, activeIndex + 1)];
    goToStep(next.id);
  }

  function previousStep() {
    const previous = steps[Math.max(0, activeIndex - 1)];
    goToStep(previous.id);
  }

  function scrollToCheckout() {
    document.getElementById("launch-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-[100dvh] bg-[#090909] pb-[calc(6.75rem+env(safe-area-inset-bottom))] text-white lg:pb-0">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#090909]/95 backdrop-blur-xl">
        <header className="px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-2">
            <Link
              href="/"
              aria-label="Back to home"
              title="Back to home"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white/40">Diamond Portfolio</p>
              <h1 className="truncate text-base font-bold sm:text-lg">
                {draft.firstName ? `${draft.firstName}'s portfolio` : "Build your portfolio"}
              </h1>
            </div>

            <div aria-live="polite" className="hidden min-w-20 items-center justify-end gap-1.5 text-xs text-white/40 sm:flex">
              {saveState === "saving" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveState === "saving" ? "Saving" : cloudEnabled ? "Saved to account" : "Saved on device"}
            </div>

            <Link
              href={cloudEnabled ? "/account" : "/auth"}
              aria-label={cloudEnabled ? "Open account" : "Sign in to sync"}
              title={cloudEnabled ? "Account" : "Sign in to sync"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              <CircleUserRound className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="Preview portfolio"
              title="Preview portfolio"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/[0.06] lg:hidden"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden min-[390px]:inline">Preview</span>
            </button>
          </div>
        </header>

        <nav className="border-t border-white/[0.06] px-3 py-2 lg:hidden" aria-label="Builder steps">
          <div className="mx-auto mb-2 flex max-w-xl items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/75">
              {activeIndex + 1} of {steps.length}: {currentStep.label}
            </span>
            <span className="text-[11px] text-white/35">{completion}% ready</span>
          </div>
          <div className="mx-auto mb-2 h-1 max-w-xl overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-500 transition-[width] duration-300"
              style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="mx-auto grid max-w-xl grid-cols-7 gap-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = step.id === activeStep;
              const hasContent = completionFor(step.id, draft) > 0;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  aria-label={step.label}
                  aria-current={active ? "step" : undefined}
                  title={step.label}
                  className={`flex h-10 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    active
                      ? "bg-white text-black"
                      : "text-white/35 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {hasContent && !active && index < activeIndex ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1480px] gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[410px_minmax(0,1fr)] lg:py-5">
        <aside className="min-w-0 space-y-4">
          <nav className="hidden rounded-lg border border-white/10 bg-white/[0.025] p-2 lg:block" aria-label="Builder steps">
            <div className="mb-2 flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold text-white/55">Your progress</span>
              <span className="text-xs font-semibold text-white/35">{completion}% ready</span>
            </div>
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-red-500 transition-[width] duration-300" style={{ width: `${completion}%` }} />
            </div>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = step.id === activeStep;
              const hasContent = completionFor(step.id, draft) > 0;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    active ? "bg-white text-black" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-black text-white" : "bg-white/[0.06] text-white/45"
                  }`}>
                    {hasContent && !active && index < activeIndex ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className={`block truncate text-xs ${active ? "text-black/55" : "text-white/30"}`}>
                      {step.caption}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <section id="builder-editor" className="rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <StepEditor
              draft={draft}
              step={activeStep}
              update={update}
              checkoutResult={checkoutResult}
            />
            <div className="mt-6 hidden items-center justify-between gap-3 border-t border-white/10 pt-4 lg:flex">
              <button type="button" onClick={previousStep} disabled={activeIndex === 0} className={buttonClass}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {activeIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={scrollToCheckout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85">
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        </aside>

        <section className="sticky top-[84px] hidden h-[calc(100dvh-104px)] min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#111] lg:block">
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
            <div>
              <span className="block text-xs font-semibold text-white/60">Live preview</span>
              <span className="block text-[11px] text-white/30">Every change appears here</span>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-black/30 p-1" aria-label="Preview size">
              <button
                type="button"
                onClick={() => setPreviewMode("phone")}
                aria-label="Phone preview"
                title="Phone preview"
                className={`flex h-8 w-9 items-center justify-center rounded-md transition ${previewMode === "phone" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("full")}
                aria-label="Full-width preview"
                title="Full-width preview"
                className={`flex h-8 w-9 items-center justify-center rounded-md transition ${previewMode === "full" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-3.5rem)] overflow-hidden bg-[#161616] p-3">
            <div className={`mx-auto h-full overflow-y-auto bg-black transition-[width] duration-200 ${
              previewMode === "phone" ? "w-[390px] max-w-full border-x border-white/10" : "w-full"
            }`}>
              <PlayerTemplate player={previewPlayer} />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0b0b]/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <button
            type="button"
            onClick={previousStep}
            disabled={activeIndex === 0}
            aria-label="Previous step"
            title="Previous step"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex h-12 min-w-24 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/75"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={activeIndex < steps.length - 1 ? nextStep : scrollToCheckout}
            className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black"
          >
            <span className="truncate">{activeIndex < steps.length - 1 ? "Continue" : "Checkout"}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black lg:hidden" role="dialog" aria-modal="true" aria-label="Portfolio preview">
          <div className="flex h-[calc(3.75rem+env(safe-area-inset-top))] items-end justify-between border-b border-white/10 bg-black px-4 pb-2.5 pt-[env(safe-area-inset-top)]">
            <div>
              <span className="block text-sm font-semibold text-white/80">Your portfolio</span>
              <span className="block text-[11px] text-white/35">Mobile preview</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
              title="Close preview"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(100dvh-3.75rem-env(safe-area-inset-top))] overflow-y-auto">
            <PlayerTemplate player={previewPlayer} />
          </div>
        </div>
      )}
    </main>
  );
}

function StepEditor({ draft, step, update, checkoutResult }: { draft: Player; step: StepId; update: (updates: Partial<Player>) => void; checkoutResult: "success" | "canceled" | null }) {
  if (step === "info") return <InfoStep draft={draft} update={update} />;
  if (step === "photos") return <PhotosStep draft={draft} update={update} />;
  if (step === "style") return <StyleStep draft={draft} update={update} />;
  if (step === "stats") return <StatsStep draft={draft} update={update} />;
  if (step === "content") return <ContentStep draft={draft} update={update} />;
  if (step === "links") return <LinksStep draft={draft} update={update} />;
  return <ReviewStep draft={draft} update={update} checkoutResult={checkoutResult} />;
}

function SectionHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-white/45">{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-white/50 ${checked ? "bg-red-500" : "bg-white/10"}`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white/75">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-4 text-white/35">{description}</span>}
      </span>
    </label>
  );
}

function InfoStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  const positions = ["Pitcher", "Catcher", "First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field", "Utility"];

  return (
    <div>
      <SectionHeader title="Player basics" body="Start with the details a coach needs to recognize the player." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <input
            className={inputClass}
            value={draft.firstName}
            onChange={(event) => update({ firstName: event.target.value })}
            autoComplete="given-name"
            enterKeyHint="next"
            placeholder="Alex"
          />
        </Field>
        <Field label="Last name">
          <input
            className={inputClass}
            value={draft.lastName}
            onChange={(event) => update({ lastName: event.target.value })}
            autoComplete="family-name"
            enterKeyHint="next"
            placeholder="Morgan"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Team">
          <input
            className={inputClass}
            value={draft.team}
            onChange={(event) => update({ team: event.target.value })}
            placeholder="Team name"
          />
        </Field>
        <Field label="League">
          <input
            className={inputClass}
            value={draft.league}
            onChange={(event) => update({ league: event.target.value })}
            placeholder="League or division"
          />
        </Field>

        <fieldset>
          <legend className={labelClass}>Position</legend>
          <div className="grid grid-cols-3 gap-2">
            {positions.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => update({ position })}
                aria-pressed={draft.position === position}
                className={`min-h-12 rounded-lg border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  draft.position === position
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.025] text-white/55 hover:border-white/25 hover:text-white"
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Jersey number">
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            max="99"
            value={draft.number || ""}
            onChange={(event) => update({ number: event.target.value === "" ? 0 : Number(event.target.value) })}
            placeholder="18"
          />
        </Field>
      </div>

      <details className="mt-5 border-t border-white/10 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/65">
          More player details
          <span className="text-xs font-normal text-white/30">Optional</span>
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hometown">
            <input
              className={inputClass}
              value={draft.hometown}
              onChange={(event) => update({ hometown: event.target.value })}
              autoComplete="address-level2"
              placeholder="Detroit, MI"
            />
          </Field>
          <fieldset>
            <legend className={labelClass}>Bats</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["Left", "Right", "Switch"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => update({ bats: side })}
                  aria-pressed={draft.bats === side}
                  className={`min-h-12 rounded-lg border text-xs font-semibold transition ${
                    draft.bats === side
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.025] text-white/55"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>Throws</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["Left", "Right"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => update({ throws: side })}
                  aria-pressed={draft.throws === side}
                  className={`min-h-12 rounded-lg border text-sm font-semibold transition ${
                    draft.throws === side
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.025] text-white/55"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Height">
            <input
              className={inputClass}
              value={draft.height}
              onChange={(event) => update({ height: event.target.value })}
              placeholder={'5\'10"'}
            />
          </Field>
          <Field label="Weight">
            <input
              className={inputClass}
              value={draft.weight}
              onChange={(event) => update({ weight: event.target.value })}
              placeholder="170 lbs"
            />
          </Field>
          <Field label="Birth year">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="1980"
              max={new Date().getFullYear()}
              value={draft.birthYear || ""}
              onChange={(event) => update({ birthYear: event.target.value === "" ? 0 : Number(event.target.value) })}
              placeholder="2008"
            />
          </Field>
        </div>
      </details>
    </div>
  );
}

function PhotosStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  const uploadSlug = uploadSlugFor(draft);

  return (
    <div>
      <SectionHeader title="Add your photos" body="Strong images make the biggest difference. You can replace any photo later." />
      <div className="divide-y divide-white/10 border-y border-white/10">
        <div className="py-5">
          <h3 className="text-sm font-semibold text-white/80">Headshot</h3>
          <p className="mt-1 text-xs text-white/35">A clear, square photo for the profile.</p>
          <div className="mt-3">
            <ImageUpload slug={uploadSlug} folder="headshot" currentUrl={draft.headshotUrl} onUpload={(url) => update({ headshotUrl: url })} />
          </div>
          <div className="mt-4">
            <Field label="Bio">
              <textarea className={inputClass} rows={5} value={draft.bio} onChange={(e) => update({ bio: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="py-5">
          <h3 className="text-sm font-semibold text-white/80">Main player photo</h3>
          <p className="mt-1 text-xs text-white/35">A full-body action photo or player cutout works best.</p>
          <div className="mt-3">
            <ImageUpload slug={uploadSlug} folder="hero" currentUrl={draft.heroImageUrl} onUpload={(url) => update({ heroImageUrl: url })} />
          </div>
        </div>
        <div className="py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white/80">Team logo</h3>
            <span className="text-xs text-white/30">Optional</span>
          </div>
          <p className="mt-1 text-xs text-white/35">Use a transparent logo when possible.</p>
          <div className="mt-3">
            <ImageUpload slug={uploadSlug} folder="logo" currentUrl={draft.teamLogoUrl ?? ""} onUpload={(url) => update({ teamLogoUrl: url })} />
          </div>
        </div>
      </div>
      <details className="mt-4 border-t border-white/10 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/55">
          Use image links instead
          <span className="text-xs font-normal text-white/30">Advanced</span>
        </summary>
        <div className="mt-4 space-y-4">
          <Field label="Headshot URL"><input className={inputClass} type="url" inputMode="url" value={draft.headshotUrl} onChange={(event) => update({ headshotUrl: event.target.value })} /></Field>
          <Field label="Main photo URL"><input className={inputClass} type="url" inputMode="url" value={draft.heroImageUrl} onChange={(event) => update({ heroImageUrl: event.target.value })} /></Field>
          <Field label="Team logo URL"><input className={inputClass} type="url" inputMode="url" value={draft.teamLogoUrl ?? ""} onChange={(event) => update({ teamLogoUrl: event.target.value })} /></Field>
        </div>
      </details>
    </div>
  );
}

const colorChoices = ["#dc2626", "#2563eb", "#059669", "#d97706", "#7c3aed", "#52525b"];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {colorChoices.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Use ${color}`}
            aria-pressed={value.toLowerCase() === color}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border transition ${
              value.toLowerCase() === color ? "border-white ring-2 ring-white/25" : "border-white/10"
            }`}
            style={{ backgroundColor: color }}
          >
            {value.toLowerCase() === color && <Check className="h-4 w-4 text-white drop-shadow" />}
          </button>
        ))}
        <label
          className="relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-white/15"
          title="Choose a custom color"
        >
          <span className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]" />
          <span className="relative h-5 w-5 rounded-full border-2 border-white bg-black/20" />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`Choose custom ${label.toLowerCase()}`}
          />
        </label>
      </div>
    </fieldset>
  );
}

function StyleStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  return (
    <div>
      <SectionHeader title="Make it feel personal" body="Pick a team color and the page appearance. The preview updates instantly." />
      <div className="space-y-5">
        <ColorField label="Team color" value={draft.themeColor} onChange={(themeColor) => update({ themeColor })} />

        <fieldset>
          <legend className={labelClass}>Page appearance</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Dark", lightMode: false },
              { label: "Light", lightMode: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => update({ lightMode: option.lightMode })}
                aria-pressed={!!draft.lightMode === option.lightMode}
                className={`min-h-12 rounded-lg border text-sm font-semibold transition ${
                  !!draft.lightMode === option.lightMode
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.025] text-white/55"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <details className="border-t border-white/10 pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/55">
            Jersey number color
            <span className="text-xs font-normal text-white/30">Optional</span>
          </summary>
          <div className="mt-4">
            <ColorField label="Number color" value={draft.numberColor || draft.themeColor} onChange={(numberColor) => update({ numberColor })} />
          </div>
        </details>
      </div>
    </div>
  );
}

function StatsStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  const fields = draft.position === "Pitcher" ? pitcherStats : hitterStats;

  return (
    <div>
      <SectionHeader title="Current season stats" body="Add what you have now or skip this step and return later." />
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              className={inputClass}
              type="number"
              inputMode={["battingAverage", "onBasePercentage", "sluggingPercentage", "inningsPitched", "earnedRunAverage", "whip"].includes(key) ? "decimal" : "numeric"}
              step={["battingAverage", "onBasePercentage", "sluggingPercentage"].includes(key) ? "0.001" : ["inningsPitched", "earnedRunAverage", "whip"].includes(key) ? "0.1" : "1"}
              value={draft.currentStats[key] || ""}
              onChange={(event) => update({
                currentStats: {
                  ...draft.currentStats,
                  [key]: event.target.value === "" ? 0 : Number(event.target.value),
                },
              })}
              placeholder="0"
            />
          </Field>
        ))}
      </div>
      <div className="mt-4">
        <Toggle
          checked={draft.showStatsBar ?? true}
          onChange={(showStatsBar) => update({ showStatsBar })}
          label="Show stats on the portfolio"
          description="Turn this off until the numbers are ready."
        />
      </div>
    </div>
  );
}

type ContentPanel = "skills" | "media" | "highlights" | "training" | "interests";

type ContentIndexes = Record<ContentPanel, number> & { skillVideos: number };

const contentTabs: { id: ContentPanel; label: string }[] = [
  { id: "skills", label: "Player Profile" },
  { id: "media", label: "Main Media" },
  { id: "highlights", label: "Highlights" },
  { id: "training", label: "Training" },
  { id: "interests", label: "Off the Field" },
];

function ContentStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  const [activePanel, setActivePanel] = useState<ContentPanel>("skills");
  const [indexes, setIndexes] = useState<ContentIndexes>({
    skills: 0,
    media: 0,
    highlights: 0,
    training: 0,
    interests: 0,
    skillVideos: 0,
  });
  const uploadSlug = uploadSlugFor(draft);

  function setIndex(key: keyof ContentIndexes, value: number) {
    setIndexes((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function updateAndClamp(updates: Partial<Player>, key: keyof ContentIndexes, nextCount: number) {
    update(updates);
    setIndexes((prev) => ({ ...prev, [key]: Math.min(prev[key], Math.max(0, nextCount - 1)) }));
  }

  return (
    <div>
      <SectionHeader title="Build the story" body="Start with the skill cards and add only the sections that help tell the player\'s story." />
      <div className="scrollbar-hide -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Portfolio content sections">
        {contentTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            role="tab"
            aria-selected={activePanel === tab.id}
            className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs font-semibold transition ${activePanel === tab.id ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/25 hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activePanel === "skills" && (
        <SkillsContentEditor
          draft={draft}
          uploadSlug={uploadSlug}
          skillIndex={indexes.skills}
          videoIndex={indexes.skillVideos}
          onSkillIndex={(value) => setIndex("skills", value)}
          onVideoIndex={(value) => setIndex("skillVideos", value)}
          updateAndClamp={updateAndClamp}
        />
      )}
      {activePanel === "media" && (
        <MediaContentEditor
          title="Main Media Carousel"
          body="These are the photos and videos shown in the main media carousel."
          items={draft.media ?? []}
          index={indexes.media}
          uploadSlug={uploadSlug}
          uploadOffset={0}
          onIndex={(value) => setIndex("media", value)}
          onChange={(items) => updateAndClamp({ media: items }, "media", items.length)}
        />
      )}
      {activePanel === "highlights" && (
        <HighlightsContentEditor
          highlights={draft.highlights}
          index={indexes.highlights}
          uploadSlug={uploadSlug}
          onIndex={(value) => setIndex("highlights", value)}
          onChange={(highlights) => updateAndClamp({ highlights }, "highlights", highlights.length)}
        />
      )}
      {activePanel === "training" && (
        <TrainingContentEditor
          draft={draft}
          index={indexes.training}
          uploadSlug={uploadSlug}
          onIndex={(value) => setIndex("training", value)}
          onChange={(trainingVideos) => updateAndClamp({ trainingVideos }, "training", trainingVideos.length)}
          update={update}
        />
      )}
      {activePanel === "interests" && (
        <InterestsContentEditor
          draft={draft}
          index={indexes.interests}
          uploadSlug={uploadSlug}
          onIndex={(value) => setIndex("interests", value)}
          onChange={(items) => updateAndClamp({ interestsMedia: items }, "interests", items.length)}
          update={update}
        />
      )}
    </div>
  );
}

function CarouselEditor({
  title,
  count,
  index,
  addLabel,
  emptyText,
  onIndex,
  onAdd,
  onRemove,
  onMove,
  children,
}: {
  title: string;
  count: number;
  index: number;
  addLabel: string;
  emptyText: string;
  onIndex: (index: number) => void;
  onAdd: () => void;
  onRemove: () => void;
  onMove: (direction: number) => void;
  children: React.ReactNode;
}) {
  const hasItems = count > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white/85">{title}</h3>
          <p className="mt-0.5 text-xs text-white/30">{hasItems ? `Item ${index + 1} of ${count}` : "Nothing added yet"}</p>
        </div>
        <button type="button" className={buttonClass} onClick={onAdd}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      {hasItems ? (
        <>
          <div className="mb-4 flex items-center gap-1 border-y border-white/[0.07] py-2">
            <button
              type="button"
              onClick={() => onIndex(index - 1)}
              disabled={index === 0}
              aria-label="Previous item"
              title="Previous item"
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-8 flex-1 text-center text-xs font-semibold text-white/45">{index + 1} / {count}</span>
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label="Move item earlier"
              title="Move item earlier"
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === count - 1}
              aria-label="Move item later"
              title="Move item later"
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove item"
              title="Remove item"
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-red-400/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onIndex(index + 1)}
              disabled={index === count - 1}
              aria-label="Next item"
              title="Next item"
              className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {children}
        </>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-4 text-sm text-white/40 transition hover:border-white/30 hover:text-white/65"
        >
          <Plus className="h-5 w-5" />
          {emptyText}
        </button>
      )}
    </div>
  );
}

function SkillsContentEditor({
  draft,
  uploadSlug,
  skillIndex,
  videoIndex,
  onSkillIndex,
  onVideoIndex,
  updateAndClamp,
}: {
  draft: Player;
  uploadSlug: string;
  skillIndex: number;
  videoIndex: number;
  onSkillIndex: (index: number) => void;
  onVideoIndex: (index: number) => void;
  updateAndClamp: (updates: Partial<Player>, key: keyof ContentIndexes, nextCount: number) => void;
}) {
  const skills = draft.skillsets ?? [];
  const index = Math.min(skillIndex, Math.max(0, skills.length - 1));
  const skill = skills[index];

  function setSkills(next: Skillset[]) {
    updateAndClamp({ skillsets: next }, "skills", next.length);
  }

  return (
    <div className="space-y-4">
      <CarouselEditor
        title="Skill Cards"
        count={skills.length}
        index={index}
        addLabel="Add Skill"
        emptyText="Add the first player profile skill card"
        onIndex={(value) => onSkillIndex(Math.max(0, Math.min(skills.length - 1, value)))}
        onAdd={() => {
          setSkills([...skills, { name: "", description: "", videoDisplay: "button", videos: [] }]);
          onSkillIndex(skills.length);
          onVideoIndex(0);
        }}
        onRemove={() => {
          setSkills(skills.filter((_, i) => i !== index));
          onVideoIndex(0);
        }}
        onMove={(direction) => setSkills(moveItem(skills, index, index + direction))}
      >
        {skill && (
          <SkillSlideEditor
            skill={skill}
            uploadSlug={uploadSlug}
            videoIndex={videoIndex}
            onVideoIndex={onVideoIndex}
            onChange={(next) => setSkills(skills.map((item, i) => i === index ? next : item))}
          />
        )}
      </CarouselEditor>
    </div>
  );
}

function SkillSlideEditor({ skill, uploadSlug, videoIndex, onVideoIndex, onChange }: { skill: Skillset; uploadSlug: string; videoIndex: number; onVideoIndex: (index: number) => void; onChange: (skill: Skillset) => void }) {
  const videos = skill.videos ?? [];
  const index = Math.min(videoIndex, Math.max(0, videos.length - 1));
  const video = videos[index];

  function setVideos(next: MediaItem[]) {
    onChange({
      ...skill,
      videos: next,
      watchUrl: next[0]?.url ?? "",
      thumbnailUrl: next[0]?.thumbnailUrl,
      muxPlaybackId: next[0]?.muxPlaybackId,
      muxAssetId: next[0]?.muxAssetId,
      muxUploadId: next[0]?.muxUploadId,
    });
    onVideoIndex(Math.min(index, Math.max(0, next.length - 1)));
  }

  return (
    <div className="space-y-4">
      <Field label="Skill Name"><input className={inputClass} value={skill.name} onChange={(e) => onChange({ ...skill, name: e.target.value })} /></Field>
      <Field label="Description"><textarea className={inputClass} rows={3} value={skill.description} onChange={(e) => onChange({ ...skill, description: e.target.value })} /></Field>
      <Field label="Display">
        <select className={inputClass} value={skill.videoDisplay ?? "button"} onChange={(e) => onChange({ ...skill, videoDisplay: e.target.value as "button" | "embed" })}>
          <option value="button">Button opens popup</option>
          <option value="embed">Embed in card</option>
        </select>
      </Field>
      <CarouselEditor
        title="Skill Videos"
        count={videos.length}
        index={index}
        addLabel="Add Video"
        emptyText="Add a video for this skill"
        onIndex={(value) => onVideoIndex(Math.max(0, Math.min(videos.length - 1, value)))}
        onAdd={() => {
          setVideos([...videos, { type: "video", url: "", title: skill.name }]);
          onVideoIndex(videos.length);
        }}
        onRemove={() => setVideos(videos.filter((_, i) => i !== index))}
        onMove={(direction) => setVideos(moveItem(videos, index, index + direction))}
      >
        {video && (
          <MediaItemFields
            item={video}
            label={`Skill Video ${index + 1}`}
            uploadSlug={uploadSlug}
            uploadIndex={700 + index}
            lockType="video"
            onChange={(next) => setVideos(videos.map((item, i) => i === index ? next : item))}
            onRemove={() => setVideos(videos.filter((_, i) => i !== index))}
            onMove={(direction) => setVideos(moveItem(videos, index, index + direction))}
          />
        )}
      </CarouselEditor>
    </div>
  );
}

function MediaContentEditor({ title, body, items, index, uploadSlug, uploadOffset, defaultType = "photo", onIndex, onChange }: { title: string; body: string; items: MediaItem[]; index: number; uploadSlug: string; uploadOffset: number; defaultType?: "photo" | "video"; onIndex: (index: number) => void; onChange: (items: MediaItem[]) => void }) {
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[safeIndex];

  function setItems(next: MediaItem[]) {
    onChange(next);
    onIndex(Math.min(safeIndex, Math.max(0, next.length - 1)));
  }

  return (
    <div className="space-y-4">
      <SectionHeader title={title} body={body} />
      <CarouselEditor
        title={title}
        count={items.length}
        index={safeIndex}
        addLabel="Add Item"
        emptyText="Add the first carousel item"
        onIndex={(value) => onIndex(Math.max(0, Math.min(items.length - 1, value)))}
        onAdd={() => {
          onChange([...items, { type: defaultType, url: "", title: "" }]);
          onIndex(items.length);
        }}
        onRemove={() => setItems(items.filter((_, i) => i !== safeIndex))}
        onMove={(direction) => setItems(moveItem(items, safeIndex, safeIndex + direction))}
      >
        {item && (
          <MediaItemFields
            item={item}
            label={`${title} Item ${safeIndex + 1}`}
            uploadSlug={uploadSlug}
            uploadIndex={uploadOffset + safeIndex}
            lockType={defaultType === "video" ? "video" : undefined}
            onChange={(next) => setItems(items.map((current, i) => i === safeIndex ? next : current))}
            onRemove={() => setItems(items.filter((_, i) => i !== safeIndex))}
            onMove={(direction) => setItems(moveItem(items, safeIndex, safeIndex + direction))}
          />
        )}
      </CarouselEditor>
    </div>
  );
}

function HighlightsContentEditor({ highlights, index, uploadSlug, onIndex, onChange }: { highlights: Highlight[]; index: number; uploadSlug: string; onIndex: (index: number) => void; onChange: (items: Highlight[]) => void }) {
  const safeIndex = Math.min(index, Math.max(0, highlights.length - 1));
  const highlight = highlights[safeIndex];

  function setHighlights(next: Highlight[]) {
    onChange(next);
    onIndex(Math.min(safeIndex, Math.max(0, next.length - 1)));
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Highlights" body="Edit one highlight video at a time." />
      <CarouselEditor
        title="Highlights"
        count={highlights.length}
        index={safeIndex}
        addLabel="Add Highlight"
        emptyText="Add the first highlight video"
        onIndex={(value) => onIndex(Math.max(0, Math.min(highlights.length - 1, value)))}
        onAdd={() => {
          onChange([...highlights, { title: "", url: "" }]);
          onIndex(highlights.length);
        }}
        onRemove={() => setHighlights(highlights.filter((_, i) => i !== safeIndex))}
        onMove={(direction) => setHighlights(moveItem(highlights, safeIndex, safeIndex + direction))}
      >
        {highlight && (
          <div className="space-y-3">
            <Field label="Title"><input className={inputClass} value={highlight.title} onChange={(e) => setHighlights(highlights.map((item, i) => i === safeIndex ? { ...item, title: e.target.value } : item))} /></Field>
            <MediaVideoUpload
              item={{
                type: "video",
                url: highlight.url,
                title: highlight.title,
                thumbnailUrl: highlight.thumbnailUrl,
                muxPlaybackId: highlight.muxPlaybackId,
                muxAssetId: highlight.muxAssetId,
                muxUploadId: highlight.muxUploadId,
              }}
              slug={uploadSlug}
              inputClass={inputClass}
              labelClass={labelClass}
              allowAudioChoice={false}
              onChange={(next) => setHighlights(highlights.map((item, i) => i === safeIndex ? {
                ...item,
                url: next.url,
                thumbnailUrl: next.thumbnailUrl,
                muxPlaybackId: next.muxPlaybackId,
                muxAssetId: next.muxAssetId,
                muxUploadId: next.muxUploadId,
              } : item))}
            />
          </div>
        )}
      </CarouselEditor>
    </div>
  );
}

function TrainingContentEditor({ draft, index, uploadSlug, onIndex, onChange, update }: { draft: Player; index: number; uploadSlug: string; onIndex: (index: number) => void; onChange: (items: NonNullable<Player["trainingVideos"]>) => void; update: (updates: Partial<Player>) => void }) {
  const training = draft.trainingVideos ?? [];
  const mediaItems = training.map((item) => ({ type: "video" as const, url: item.url, title: item.title, thumbnailUrl: item.thumbnailUrl, muxPlaybackId: item.muxPlaybackId, muxAssetId: item.muxAssetId, muxUploadId: item.muxUploadId }));

  function setMediaItems(items: MediaItem[]) {
    onChange(items.map((item) => ({ url: item.url, title: item.title, thumbnailUrl: item.thumbnailUrl, muxPlaybackId: item.muxPlaybackId, muxAssetId: item.muxAssetId, muxUploadId: item.muxUploadId })));
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Training" body="Edit one training slide at a time." />
      <Field label="Shared Training Description"><textarea className={inputClass} rows={3} value={draft.trainingDescription ?? ""} onChange={(e) => update({ trainingDescription: e.target.value })} /></Field>
      <MediaContentEditor
        title="Training Slides"
        body="Each slide can have its own title and Mux video."
        items={mediaItems}
        index={index}
        uploadSlug={uploadSlug}
        uploadOffset={300}
        defaultType="video"
        onIndex={onIndex}
        onChange={setMediaItems}
      />
    </div>
  );
}

function InterestsContentEditor({ draft, index, uploadSlug, onIndex, onChange, update }: { draft: Player; index: number; uploadSlug: string; onIndex: (index: number) => void; onChange: (items: MediaItem[]) => void; update: (updates: Partial<Player>) => void }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Outside the Rink" body="Add the section text, then edit one media slide at a time." />
      <Field label="Section Text"><textarea className={inputClass} rows={4} value={draft.interests ?? ""} onChange={(e) => update({ interests: e.target.value })} /></Field>
      <MediaContentEditor
        title="Outside the Rink Media"
        body="Photos and videos for life away from baseball."
        items={draft.interestsMedia ?? []}
        index={index}
        uploadSlug={uploadSlug}
        uploadOffset={500}
        onIndex={onIndex}
        onChange={onChange}
      />
    </div>
  );
}

function MediaItemFields({
  item,
  label,
  uploadSlug,
  uploadIndex,
  lockType,
  onChange,
}: {
  item: MediaItem;
  label: string;
  uploadSlug: string;
  uploadIndex: number;
  lockType?: "photo" | "video";
  onChange: (item: MediaItem) => void;
  onRemove?: () => void;
  onMove?: (direction: number) => void;
}) {
  const shownType = lockType ?? item.type;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-white/35">{label}</p>
      {!lockType && (
        <fieldset>
          <legend className={labelClass}>Media type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["photo", "video"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange({
                  ...item,
                  type,
                  url: "",
                  thumbnailUrl: undefined,
                  muxPlaybackId: undefined,
                  muxAssetId: undefined,
                  muxUploadId: undefined,
                })}
                aria-pressed={item.type === type}
                className={`min-h-11 rounded-lg border text-sm font-semibold capitalize transition ${
                  item.type === type
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.025] text-white/55"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <Field label="Title">
        <input
          className={inputClass}
          value={item.title ?? ""}
          onChange={(event) => onChange({ ...item, title: event.target.value })}
          placeholder="Add a short title"
        />
      </Field>
      {shownType === "photo" ? (
        <div className="space-y-4">
          <div>
            <span className={labelClass}>Photo</span>
            <MediaPhotoUpload slug={uploadSlug} index={uploadIndex} currentUrl={item.url} onUpload={(url) => onChange({ ...item, type: "photo", url })} />
          </div>
          <details className="border-t border-white/10 pt-3">
            <summary className="min-h-11 cursor-pointer text-xs font-semibold text-white/40">Use a photo link</summary>
            <div className="mt-3">
              <Field label="Photo URL">
                <input
                  className={inputClass}
                  type="url"
                  inputMode="url"
                  value={item.url}
                  onChange={(event) => onChange({ ...item, type: "photo", url: event.target.value })}
                />
              </Field>
            </div>
          </details>
        </div>
      ) : (
        <MediaVideoUpload
          item={{ ...item, type: "video" }}
          slug={uploadSlug}
          inputClass={inputClass}
          labelClass={labelClass}
          allowAudioChoice={false}
          onChange={(next) => onChange({ ...next, type: "video" })}
        />
      )}
    </div>
  );
}

function LinksStep({ draft, update }: { draft: Player; update: (updates: Partial<Player>) => void }) {
  const links = draft.socialLinks;

  return (
    <div>
      <SectionHeader title="Add useful links" body="Bring social profiles, recruiting pages, and documents into one place." />

      <div className="space-y-4 border-y border-white/10 py-5">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Documents</h3>
          <p className="mt-1 text-xs text-white/35">Optional links to files already stored online.</p>
        </div>
        <Field label="Player resume">
          <input
            className={inputClass}
            type="url"
            inputMode="url"
            value={draft.resumeUrl ?? ""}
            onChange={(event) => update({ resumeUrl: event.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="School transcript">
          <input
            className={inputClass}
            type="url"
            inputMode="url"
            value={draft.transcriptUrl ?? ""}
            onChange={(event) => update({ transcriptUrl: event.target.value })}
            placeholder="https://"
          />
        </Field>
      </div>

      <div className="pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Profile links</h3>
            <p className="mt-1 text-xs text-white/35">{links.length ? `${links.length} added` : "Add social or recruiting profiles"}</p>
          </div>
          <button
            type="button"
            className={buttonClass}
            onClick={() => update({ socialLinks: [...links, { platform: "instagram", url: "" }] })}
          >
            <Plus className="h-4 w-4" />
            Add link
          </button>
        </div>

        {links.length === 0 ? (
          <button
            type="button"
            onClick={() => update({ socialLinks: [{ platform: "instagram", url: "" }] })}
            className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 text-sm text-white/40"
          >
            <Link2 className="h-5 w-5" />
            Add your first link
          </button>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={index} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white/70">
                    {platformLabels[link.platform]}
                  </span>
                  <button
                    type="button"
                    onClick={() => update({ socialLinks: links.filter((_, itemIndex) => itemIndex !== index) })}
                    aria-label={`Remove ${platformLabels[link.platform]} link`}
                    title="Remove link"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-red-400/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <Field label="Platform">
                    <select
                      className={inputClass}
                      value={link.platform}
                      onChange={(event) => update({
                        socialLinks: links.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, platform: event.target.value as SocialLink["platform"] } : item
                        ),
                      })}
                    >
                      {platformOptions.map((platform) => (
                        <option key={platform} value={platform}>{platformLabels[platform]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={link.platform === "email" ? "Email address" : "Profile URL"}>
                    <input
                      className={inputClass}
                      type={link.platform === "email" ? "email" : "url"}
                      inputMode={link.platform === "email" ? "email" : "url"}
                      value={link.url}
                      onChange={(event) => update({
                        socialLinks: links.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, url: event.target.value } : item
                        ),
                      })}
                      placeholder={link.platform === "email" ? "player@example.com" : "https://"}
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </Field>
                  {(["ncsa", "hudl"] as SocialLink["platform"][]).includes(link.platform) && (
                    <Toggle
                      checked={!!link.showInHero}
                      onChange={(showInHero) => update({
                        socialLinks: links.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, showInHero } : item
                        ),
                      })}
                      label="Feature near the player name"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type PlanId = "standard" | "premium";
type DomainState = "idle" | "checking" | "available" | "unavailable" | "error";

const launchPlans: { id: PlanId; name: string; price: number; description: string; features: string[] }[] = [
  {
    id: "standard",
    name: "Standard",
    price: 29,
    description: "Everything needed to build and share a polished portfolio.",
    features: ["Full portfolio builder", "Hosting and secure profile link", "Edit anytime from your phone"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    description: "A professional home for players who want their own address.",
    features: ["Everything in Standard", "One custom domain included", "Domain setup and renewal managed for you"],
  },
];

function suggestedDomain(draft: Player) {
  const name = [draft.firstName, draft.lastName]
    .filter(Boolean)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return name ? `${name}.com` : "";
}

function normalizeDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return domain.includes(".") ? domain : `${domain}.com`;
}

function ReviewStep({
  draft,
  update,
  checkoutResult,
}: {
  draft: Player;
  update: (updates: Partial<Player>) => void;
  checkoutResult: "success" | "canceled" | null;
}) {
  const [plan, setPlan] = useState<PlanId>("standard");
  const [domainInput, setDomainInput] = useState(draft.customDomain || suggestedDomain(draft));
  const [domainState, setDomainState] = useState<DomainState>(draft.customDomain ? "available" : "idle");
  const [domainMessage, setDomainMessage] = useState("");
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    const savedPlan = localStorage.getItem("diamond_builder_plan");
    if (savedPlan !== "standard" && savedPlan !== "premium") return;
    const frame = requestAnimationFrame(() => setPlan(savedPlan));
    return () => cancelAnimationFrame(frame);
  }, []);

  const checks = [
    ["Player name", !!draft.firstName && !!draft.lastName],
    ["Team and league", !!draft.team && !!draft.league],
    ["Hero photo", !!draft.heroImageUrl && !draft.heroImageUrl.includes("placeholder")],
    ["Player bio", !!draft.bio],
    [
      "Video or highlight",
      (draft.media ?? []).some((item) => !!item.url) ||
        draft.highlights.some((item) => !!item.url) ||
        (draft.trainingVideos ?? []).some((item) => !!item.url),
    ],
  ] as const;
  const readyCount = checks.filter(([, done]) => done).length;
  const selectedPlan = launchPlans.find((item) => item.id === plan) ?? launchPlans[0];

  function choosePlan(nextPlan: PlanId) {
    setPlan(nextPlan);
    localStorage.setItem("diamond_builder_plan", nextPlan);
    setCheckoutMessage("");
  }

  async function searchDomain(event: React.FormEvent) {
    event.preventDefault();
    const domain = normalizeDomain(domainInput);

    if (!/^(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)) {
      setDomainState("error");
      setDomainMessage("Enter a domain like alexmorgan.com.");
      return;
    }

    setDomainInput(domain);
    setDomainState("checking");
    setDomainMessage("");

    try {
      const response = await fetch(`/api/domains/search?domain=${encodeURIComponent(domain)}`);
      const data = await response.json();

      if (!response.ok) {
        setDomainState("error");
        setDomainMessage(data.error || "Domain search is unavailable right now.");
        return;
      }

      if (data.available) {
        setDomainState("available");
        setDomainMessage(`${domain} is available and can be included with Premium.`);
        update({ customDomain: domain });
      } else {
        setDomainState("unavailable");
        setDomainMessage(`${domain} is already taken. Try another name.`);
        if (draft.customDomain === domain) update({ customDomain: "" });
      }
    } catch {
      setDomainState("error");
      setDomainMessage("Could not check that domain. Try again in a moment.");
    }
  }

  async function startCheckout() {
    setCheckoutState("loading");
    setCheckoutMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          slug: uploadSlugFor(draft),
          playerName: [draft.firstName, draft.lastName].filter(Boolean).join(" "),
          domain: plan === "premium" && domainState === "available" ? domainInput : "",
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/auth");
        return;
      }

      if (!response.ok || !data.url) {
        setCheckoutState("error");
        setCheckoutMessage(data.error || "Checkout could not start. Try again.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setCheckoutState("error");
      setCheckoutMessage("Checkout could not start. Check your connection and try again.");
    }
  }

  return (
    <div>
      <SectionHeader
        title="Ready when you are"
        body="Choose a plan to publish. You can keep improving every section after you subscribe."
      />

      {checkoutResult === "success" && (
        <div className="mb-5 flex gap-3 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <div>
            <p className="font-semibold">Checkout complete</p>
            <p className="mt-0.5 text-emerald-100/65">Your subscription is being confirmed. Your draft is still saved here.</p>
          </div>
        </div>
      )}

      {checkoutResult === "canceled" && (
        <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/65">
          No charge was made. Your draft and plan choice are still here.
        </div>
      )}

      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/85">Profile check</h3>
            <p className="mt-0.5 text-xs text-white/35">Missing items will not block checkout.</p>
          </div>
          <span className="text-xs font-semibold text-white/45">{readyCount} of {checks.length} ready</span>
        </div>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.08]">
          {checks.map(([label, done]) => (
            <div key={label} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
              <span className="text-white/65">{label}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${done ? "text-emerald-300" : "text-white/30"}`}>
                {done && <Check className="h-3.5 w-3.5" />}
                {done ? "Ready" : "Add later"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/85">Choose your plan</h3>
        <p className="mt-1 text-xs text-white/35">Monthly billing. Change or cancel from your account.</p>
        <div className="mt-3 grid gap-3">
          {launchPlans.map((item) => {
            const selected = item.id === plan;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choosePlan(item.id)}
                aria-pressed={selected}
                className={`w-full rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  selected
                    ? item.id === "premium"
                      ? "border-amber-300/60 bg-amber-300/[0.08]"
                      : "border-white/50 bg-white/[0.07]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="text-base font-bold">{item.name}</span>
                      {item.id === "premium" && (
                        <span className="rounded-md bg-amber-300 px-2 py-1 text-[10px] font-bold text-black">CUSTOM DOMAIN</span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-white/45">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-2xl font-bold">${item.price}</span>
                    <span className="block text-[11px] text-white/35">per month</span>
                  </span>
                </span>
                <span className="mt-4 grid gap-2 border-t border-white/10 pt-3">
                  {item.features.map((feature) => (
                    <span key={feature} className="flex items-center gap-2 text-xs text-white/60">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${item.id === "premium" ? "text-amber-300" : "text-emerald-300"}`} />
                      {feature}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {plan === "premium" && (
        <section className="mt-6 border-y border-white/10 py-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/85">Find your domain</h3>
              <p className="mt-1 text-xs leading-5 text-white/40">Choose one now or after subscribing. Diamond Portfolio covers and manages one domain while Premium stays active.</p>
            </div>
          </div>
          <form onSubmit={searchDomain} className="mt-4 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Custom domain</span>
              <input
                className={inputClass}
                value={domainInput}
                onChange={(event) => {
                  setDomainInput(event.target.value);
                  setDomainState("idle");
                  setDomainMessage("");
                }}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="playername.com"
              />
            </label>
            <button
              type="submit"
              disabled={!domainInput.trim() || domainState === "checking"}
              aria-label="Search domain"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-black disabled:opacity-40"
            >
              {domainState === "checking" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </button>
          </form>
          {domainMessage && (
            <p
              aria-live="polite"
              className={`mt-3 flex items-start gap-2 text-xs leading-5 ${
                domainState === "available"
                  ? "text-emerald-300"
                  : domainState === "unavailable"
                    ? "text-amber-200"
                    : "text-red-300"
              }`}
            >
              {domainState === "available" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              {domainMessage}
            </p>
          )}
        </section>
      )}

      <div id="launch-checkout" className="scroll-mt-40 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{selectedPlan.name}</p>
            <p className="mt-0.5 text-xs text-white/35">
              ${selectedPlan.price} billed monthly{plan === "premium" && domainState === "available" ? ` with ${domainInput}` : ""}
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-white/35" />
        </div>
        <button
          type="button"
          onClick={startCheckout}
          disabled={checkoutState === "loading"}
          className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85 disabled:opacity-60"
        >
          {checkoutState === "loading" ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Opening checkout
            </>
          ) : (
            <>
              Continue to secure checkout
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/30">
          <LockKeyhole className="h-3.5 w-3.5" />
          Payment is completed securely with Stripe
        </p>
        {checkoutState === "error" && (
          <p aria-live="polite" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.08] p-3 text-xs leading-5 text-red-200">
            {checkoutMessage}
          </p>
        )}
      </div>
    </div>
  );
}
