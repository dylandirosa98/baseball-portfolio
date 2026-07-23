"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
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
  Cloud,
  Eye,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Link2,
  LayoutDashboard,
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
import type { Highlight, MediaItem, Player, PlayerDesign, PlayerStats, PlayerWithMeta, Skillset, SocialLink } from "@/lib/types";
import { DEFAULT_PLAYER_IMAGE, normalizedHeroImageScale } from "@/lib/player-image";
import { PROFILE_DOMAIN, normalizeProfileSlug, profileSlugError, sanitizeProfileSlugInput } from "@/lib/slug";
import { isStandardComDomain, normalizeManagedDomain } from "@/lib/domain-name";

const STORAGE_KEY = "diamond_builder_draft_v1";
const ACTIVE_STEP_KEY = "diamond_builder_active_step_v1";
const SCOPED_STORAGE_PREFIX = "diamond_builder_account_draft_v1:";

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
  headshotUrl: DEFAULT_PLAYER_IMAGE,
  heroImageUrl: DEFAULT_PLAYER_IMAGE,
  heroImageScale: 120,
  teamLogoUrl: "",
  currentStats: { ...emptyStats },
  seasonHistory: [],
  highlights: [],
  socialLinks: [],
  themeColor: "#b91c1c",
  design: "design-1",
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

type StoredDraft = {
  draft: Player;
  savedAt: number;
  pending?: boolean;
};

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

function isStepId(value: string | null): value is StepId {
  return steps.some((step) => step.id === value);
}

function safeReturnPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function readStoredDraft(key: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "draft" in parsed) {
      const stored = parsed as { draft?: unknown; savedAt?: unknown; pending?: unknown };
      return {
        draft: mergeDraft(stored.draft),
        savedAt: typeof stored.savedAt === "number" ? stored.savedAt : 0,
        pending: stored.pending === true,
      };
    }
    return { draft: mergeDraft(parsed), savedAt: 0 };
  } catch {
    return null;
  }
}

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
  const savedDesign = (value as Partial<Player>).design;
  const design: PlayerDesign = savedDesign === "design-2" || savedDesign === "design-3" ? savedDesign : "design-1";
  const savedPlayer = value as Partial<Player>;
  const heroImageScale = normalizedHeroImageScale(savedPlayer.heroImageUrl, savedPlayer.heroImageScale);
  return {
    ...defaultDraft,
    ...(value as Partial<Player>),
    design,
    heroImageScale,
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
      return [draft.design || "design-1", draft.themeColor, draft.numberColor || draft.themeColor].filter(Boolean).length;
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

function stepIsReady(step: StepId, draft: Player) {
  if (step === "info") return Boolean(draft.firstName && draft.lastName && draft.team && draft.league);
  if (step === "photos") return Boolean(draft.heroImageUrl && !draft.heroImageUrl.includes("placeholder"));
  if (step === "style") return Boolean(draft.design && draft.themeColor);
  if (step === "stats") return draft.showStatsBar === false || Object.values(draft.currentStats).some((value) => Number(value) > 0);
  if (step === "review") return Boolean(draft.firstName && draft.lastName && draft.slug && draft.slug !== "preview");
  return completionFor(step, draft) > 0;
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
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [hasCloudProfile, setHasCloudProfile] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [storageKey, setStorageKey] = useState(STORAGE_KEY);
  const [returnPath, setReturnPath] = useState("/dashboard");
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<"success" | "canceled" | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const saveRequestRef = useRef(0);
  const draftVersionRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const legacyDraft = readStoredDraft(STORAGE_KEY);
      const savedStep = localStorage.getItem(ACTIVE_STEP_KEY);
      const checkout = new URLSearchParams(window.location.search).get("checkout");
      const params = new URLSearchParams(window.location.search);
      const requestedStep = params.get("step");
      const requestedEditMode = params.get("mode") === "edit";
      const requestedReturnPath = safeReturnPath(params.get("returnTo"));
      let nextDraft = legacyDraft?.draft ?? defaultDraft;
      let nextStorageKey = STORAGE_KEY;
      let nextDirty = Boolean(legacyDraft && legacyDraft.savedAt > 0);

      try {
        const response = await fetch("/api/portfolio");
        if (response.ok) {
          const data = await response.json() as { player?: PlayerWithMeta | null; userId?: string };
          const scopedKey = data.userId ? SCOPED_STORAGE_PREFIX + data.userId : STORAGE_KEY;
          const scopedDraft = readStoredDraft(scopedKey);
          const cloudDraft = data.player ? mergeDraft(data.player) : null;
          const cloudUpdatedAt = data.player?.updatedAt ? Date.parse(data.player.updatedAt) : 0;
          const localIsNewer = Boolean(scopedDraft?.pending && scopedDraft.savedAt > cloudUpdatedAt);
          const recoveredDraft = localIsNewer && data.player ? mergeDraft({
            ...scopedDraft!.draft,
            id: data.player.id,
            isPublished: data.player.isPublished,
            billingTier: data.player.billingTier,
            hasCustomDomain: data.player.hasCustomDomain,
            muxUploadCount: data.player.muxUploadCount,
            createdAt: data.player.createdAt,
            updatedAt: data.player.updatedAt,
          }) : null;

          nextStorageKey = scopedKey;
          nextDraft = recoveredDraft ?? cloudDraft ?? scopedDraft?.draft ?? legacyDraft?.draft ?? defaultDraft;
          nextDirty = localIsNewer || (!cloudDraft && Boolean(scopedDraft ?? legacyDraft));
          setCloudEnabled(true);
          setHasCloudProfile(Boolean(data.player));
          setIsPublished(Boolean(data.player?.isPublished));
          if (cloudDraft && !localIsNewer) setLastSavedAt(cloudUpdatedAt || Date.now());
        }
      } catch {
        setSaveMessage("Working offline. Changes are still saved on this device.");
      }

      if (!active) return;
      setStorageKey(nextStorageKey);
      setDraft(nextDraft);
      setDirty(nextDirty);
      setEditMode(requestedEditMode);
      setReturnPath(requestedReturnPath);
      if (isStepId(requestedStep)) setActiveStep(requestedStep);
      else if (isStepId(savedStep)) setActiveStep(savedStep);
      if (checkout === "success" || checkout === "canceled") {
        setCheckoutResult(checkout);
        if (!isStepId(requestedStep)) setActiveStep("review");
      }
      setLoaded(true);
    }

    void hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const localSavedAt = dirty ? Date.now() : lastSavedAt ?? Date.now();
    localStorage.setItem(storageKey, JSON.stringify({ draft, savedAt: localSavedAt, pending: cloudEnabled && dirty } satisfies StoredDraft));
    localStorage.setItem(ACTIVE_STEP_KEY, activeStep);
    if (!cloudEnabled) setSaveState("saved");
  }, [draft, activeStep, loaded, cloudEnabled, storageKey, dirty, lastSavedAt]);

  const persistDraft = useCallback(async (nextDraft: Player) => {
    localStorage.setItem(storageKey, JSON.stringify({ draft: nextDraft, savedAt: Date.now(), pending: cloudEnabled } satisfies StoredDraft));
    if (!cloudEnabled) {
      setSaveState("saved");
      setSaveMessage("Saved on this device. Sign in to sync your changes.");
      return true;
    }
    if (!nextDraft.firstName.trim() || !nextDraft.lastName.trim()) {
      setSaveState("error");
      setSaveMessage("Add a first and last name before saving to your account.");
      return false;
    }

    const requestId = ++saveRequestRef.current;
    const version = draftVersionRef.current;
    setSaveState("saving");
    setSaveMessage("");
    try {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDraft),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Your changes could not be saved.");
      if (requestId === saveRequestRef.current) {
        const savedAt = Date.now();
        setSaveState("saved");
        setHasCloudProfile(true);
        setLastSavedAt(savedAt);
        localStorage.setItem(storageKey, JSON.stringify({ draft: nextDraft, savedAt, pending: false } satisfies StoredDraft));
        if (version === draftVersionRef.current) setDirty(false);
      }
      return true;
    } catch (error) {
      if (requestId === saveRequestRef.current) {
        setSaveState("error");
        setSaveMessage(error instanceof Error ? error.message : "Your changes could not be saved.");
      }
      return false;
    }
  }, [cloudEnabled, storageKey]);

  useEffect(() => {
    if (!loaded || !cloudEnabled || !dirty || !draft.firstName.trim() || !draft.lastName.trim()) return;
    setSaveState("saving");
    autosaveTimeoutRef.current = window.setTimeout(() => void persistDraft(draft), 900);
    return () => {
      if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current);
    };
  }, [draft, loaded, cloudEnabled, dirty, persistDraft]);

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
  const editingExisting = editMode || hasCloudProfile;
  const liveHref = isPublished && draft.slug && draft.slug !== "preview" ? `/${draft.slug}` : null;

  const update = useCallback((updates: Partial<Player>) => {
    draftVersionRef.current += 1;
    setDirty(true);
    setSaveMessage("");
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  async function saveNow() {
    if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current);
    return persistDraft(draft);
  }

  async function saveAndReturn() {
    setLeaving(true);
    const saved = dirty ? await saveNow() : true;
    if (saved) {
      const destination = new URL(returnPath, window.location.origin);
      if (cloudEnabled && hasCloudProfile) destination.searchParams.set("updated", "1");
      window.location.assign(destination.pathname + destination.search);
      return;
    }
    setLeaving(false);
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
            {editingExisting ? (
              <button
                type="button"
                onClick={() => void saveAndReturn()}
                disabled={leaving}
                aria-label="Save and return to dashboard"
                title="Save and return to dashboard"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
              >
                {leaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LayoutDashboard className="h-5 w-5" />}
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Back to home"
                title="Back to home"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}

            <NextImage src="/diamond-profile-logo.png" alt="" width={48} height={48} className="hidden h-9 w-9 shrink-0 object-contain min-[430px]:block" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white/40">{editingExisting ? "Website editor" : "Diamond Profile"}</p>
              <h1 className="truncate text-base font-bold sm:text-lg">
                {editingExisting ? `Editing ${draft.firstName || "your"} profile` : draft.firstName ? `${draft.firstName}'s portfolio` : "Build your portfolio"}
              </h1>
            </div>

            <div aria-live="polite" className="hidden min-w-24 items-center justify-end gap-1.5 text-xs text-white/40 md:flex">
              {saveState === "saving" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : saveState === "error" ? (
                <X className="h-3.5 w-3.5 text-red-300" />
              ) : (
                <Cloud className="h-3.5 w-3.5" />
              )}
              {saveState === "saving" ? "Saving changes" : saveState === "error" ? "Save failed" : dirty ? "Changes pending" : cloudEnabled ? "All changes saved" : "Saved on device"}
            </div>

            {editingExisting ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveNow()}
                  disabled={saveState === "saving" || !dirty}
                  className="hidden h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 sm:flex"
                >
                  {saveState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void saveAndReturn()}
                  disabled={leaving}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-black transition hover:bg-white/85 disabled:opacity-60"
                >
                  {leaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span className="hidden min-[390px]:inline">Done</span>
                </button>
              </>
            ) : (
              <Link
                href={cloudEnabled ? "/dashboard" : "/auth"}
                aria-label={cloudEnabled ? "Open dashboard" : "Sign in to sync"}
                title={cloudEnabled ? "Dashboard" : "Sign in to sync"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              >
                <CircleUserRound className="h-5 w-5" />
              </Link>
            )}

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
              const ready = stepIsReady(step.id, draft);
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
                  {ready && !active && index < activeIndex ? (
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
        {editingExisting && (
          <section className="flex flex-col justify-between gap-4 rounded-lg border border-red-500/20 bg-[linear-gradient(110deg,rgba(229,22,42,.13),rgba(255,255,255,.025))] p-4 sm:flex-row sm:items-center lg:col-span-2">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isPublished ? "bg-emerald-400" : "bg-amber-300"}`} />
              <div className="min-w-0">
                <p className="font-bold">{isPublished ? "Editing your live website" : "Editing your saved draft"}</p>
                <p className="mt-1 text-xs leading-5 text-white/40">Make one change or update the full profile. Autosave keeps this connected to your dashboard.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {liveHref && (
                <Link href={liveHref} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/65 hover:bg-white/5 hover:text-white">
                  View live site <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
              <button type="button" onClick={() => void saveAndReturn()} disabled={leaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-black disabled:opacity-60">
                Save & return <LayoutDashboard className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        )}
        {saveMessage && (
          <div className={`rounded-lg border px-4 py-3 text-xs leading-5 lg:col-span-2 ${saveState === "error" ? "border-red-400/25 bg-red-400/10 text-red-100" : "border-white/10 bg-white/[0.035] text-white/55"}`} role="status">
            {saveMessage}
          </div>
        )}
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
              const ready = stepIsReady(step.id, draft);
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
                    {ready && !active && index < activeIndex ? (
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
              isPublished={isPublished}
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
                  {isPublished ? "Publishing & plans" : "Launch options"}
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
            <span className="truncate">{activeIndex < steps.length - 1 ? "Continue" : isPublished ? "Publishing" : "Launch"}</span>
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

function StepEditor({ draft, step, update, checkoutResult, isPublished }: { draft: Player; step: StepId; update: (updates: Partial<Player>) => void; checkoutResult: "success" | "canceled" | null; isPublished: boolean }) {
  if (step === "info") return <InfoStep draft={draft} update={update} />;
  if (step === "photos") return <PhotosStep draft={draft} update={update} />;
  if (step === "style") return <StyleStep draft={draft} update={update} />;
  if (step === "stats") return <StatsStep draft={draft} update={update} />;
  if (step === "content") return <ContentStep draft={draft} update={update} />;
  if (step === "links") return <LinksStep draft={draft} update={update} />;
  return <ReviewStep draft={draft} update={update} checkoutResult={checkoutResult} isPublished={isPublished} />;
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
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white/80">Headshot</h3>
            <span className="text-xs text-white/30">Optional</span>
          </div>
          <p className="mt-1 text-xs text-white/35">Add a clear square photo, or keep the default player silhouette.</p>
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
          <Field label="Headshot URL (optional)"><input className={inputClass} type="url" inputMode="url" value={draft.headshotUrl} onChange={(event) => update({ headshotUrl: event.target.value })} /></Field>
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
        <fieldset>
          <legend className={labelClass}>Portfolio design</legend>
          <div className="space-y-2">
            {([
              { id: "design-1", label: "Design 1", description: "Cinematic" },
              { id: "design-2", label: "Design 2", description: "Clubhouse" },
              { id: "design-3", label: "Design 3", description: "Prospect card" },
            ] as { id: PlayerDesign; label: string; description: string }[]).map((option) => {
              const active = (draft.design || "design-1") === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update({ design: option.id })}
                  aria-pressed={active}
                  className={"flex w-full items-center gap-3 rounded-lg border p-2 text-left transition " + (active ? "border-white bg-white/[0.08] ring-1 ring-white/20" : "border-white/10 bg-white/[0.02] hover:border-white/25")}
                >
                  <span
                    aria-hidden
                    className={"builder-design-thumb " + option.id}
                    style={{ "--picker-accent": draft.themeColor } as React.CSSProperties}
                  >
                    <span /><span /><span />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{option.label}</span>
                      {active && <Check className="h-4 w-4 text-emerald-400" />}
                    </span>
                    <span className="mt-1 block text-xs text-white/40">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label htmlFor="hero-image-scale" className="text-sm font-semibold text-white/75">Hero image size</label>
                <p className="mt-1 text-xs text-white/35">Adjust how large the player appears in every design.</p>
              </div>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-bold tabular-nums text-white/65">
                {normalizedHeroImageScale(draft.heroImageUrl, draft.heroImageScale)}%
              </span>
            </div>
            <input
              id="hero-image-scale"
              type="range"
              min="80"
              max="150"
              step="5"
              value={normalizedHeroImageScale(draft.heroImageUrl, draft.heroImageScale)}
              onChange={(event) => update({ heroImageScale: Number(event.target.value) })}
              className="mt-4 h-2 w-full cursor-pointer accent-white"
              aria-label="Hero image size"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-white/25">
              <span>Smaller</span>
              <button type="button" onClick={() => update({ heroImageScale: 100 })} className="min-h-8 px-2 text-white/45 transition hover:text-white">Reset</button>
              <span>Larger</span>
            </div>
          </div>
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
  const contentTabsRef = useRef<HTMLDivElement>(null);
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

  function scrollContentTabs(direction: -1 | 1) {
    contentTabsRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  return (
    <div>
      <SectionHeader title="Build the story" body="Start with the skill cards and add only the sections that help tell the player\'s story." />
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-end gap-2">
          <span className="mr-1 text-[11px] font-medium text-white/40">Scroll sections</span>
          <button
            type="button"
            onClick={() => scrollContentTabs(-1)}
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            aria-label="Scroll story sections left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollContentTabs(1)}
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            aria-label="Scroll story sections right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div
          ref={contentTabsRef}
          className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-1 touch-pan-x"
          role="tablist"
          aria-label="Portfolio content sections"
        >
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePanel(tab.id)}
              role="tab"
              aria-selected={activePanel === tab.id}
              className={`min-h-11 shrink-0 snap-start rounded-lg border px-3 text-xs font-semibold transition ${activePanel === tab.id ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/25 hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
        body="Each slide can have its own title and professionally hosted video."
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

type BillingTier = "free" | "pro" | "elite";
type DomainState = "idle" | "checking" | "available" | "unavailable" | "error";
type SlugState = "idle" | "checking" | "available" | "unavailable" | "error";

const launchPlans = [
  { id: "free" as const, name: "Free", price: 0, description: "A complete hosted player profile with generous embedded media.", features: ["10 portfolio images", "5 embedded YouTube videos", "Free Diamond Profile hosting"] },
  { id: "pro" as const, name: "Pro", price: 15, description: "Professional video hosting and performance insights.", features: ["25 portfolio images", "10 professionally hosted video uploads", "Portfolio and video analytics"] },
  { id: "elite" as const, name: "Elite", price: 25, description: "Maximum flexibility for players with an extensive body of work.", features: ["Fair-use unlimited images", "Fair-use unlimited professionally hosted videos", "Portfolio and video analytics"] },
];

function suggestedDomain(draft: Player) {
  const name = [draft.firstName, draft.lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z0-9]/g, "");
  return name ? name + ".com" : "";
}

function ReviewStep({ draft, update, checkoutResult, isPublished }: {
  draft: Player;
  update: (updates: Partial<Player>) => void;
  checkoutResult: "success" | "canceled" | null;
  isPublished: boolean;
}) {
  const cloudDraft = draft as Player & Partial<PlayerWithMeta>;
  const currentTier = cloudDraft.billingTier === "pro" || cloudDraft.billingTier === "elite" ? cloudDraft.billingTier : "free";
  const currentHasCustomDomain = Boolean(cloudDraft.hasCustomDomain);
  const [tier, setTier] = useState<BillingTier>(currentTier);
  const initialSlug = draft.slug && draft.slug !== "preview" ? normalizeProfileSlug(draft.slug) : uploadSlugFor(draft);
  const [profileSlug, setProfileSlug] = useState(initialSlug);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [slugMessage, setSlugMessage] = useState("");
  const [customDomain, setCustomDomain] = useState(currentHasCustomDomain);
  const [domainInput, setDomainInput] = useState(draft.customDomain || suggestedDomain(draft));
  const [domainState, setDomainState] = useState<DomainState>(draft.customDomain ? "available" : "idle");
  const [domainMessage, setDomainMessage] = useState("");
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    const savedTier = localStorage.getItem("diamond_builder_tier");
    const savedDomain = localStorage.getItem("diamond_builder_custom_domain");
    const frame = requestAnimationFrame(() => {
      if ((!isPublished || checkoutResult === "canceled") && currentTier === "free" && (savedTier === "free" || savedTier === "pro" || savedTier === "elite")) setTier(savedTier);
      if (!currentHasCustomDomain && savedDomain === "true" && (!isPublished || checkoutResult === "canceled")) setCustomDomain(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [checkoutResult, currentHasCustomDomain, currentTier, isPublished]);

  useEffect(() => {
    const slug = normalizeProfileSlug(profileSlug);
    const validationError = profileSlugError(profileSlug);
    if (validationError) {
      setSlugState("error");
      setSlugMessage(validationError);
      return;
    }

    const controller = new AbortController();
    setSlugState("checking");
    setSlugMessage("Checking availability...");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/slugs/search?slug=" + encodeURIComponent(slug), { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          setSlugState("error");
          setSlugMessage(data.error || "Address availability could not be checked.");
        } else if (data.available) {
          setSlugState("available");
          setSlugMessage(PROFILE_DOMAIN + "/" + data.slug + " is available.");
          if (draft.slug !== data.slug) update({ slug: data.slug });
        } else {
          setSlugState("unavailable");
          setSlugMessage(data.error || "That address is already taken.");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSlugState("error");
          setSlugMessage("Address availability could not be checked.");
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [draft.slug, profileSlug, update]);

  const checks = [
    ["Player name", !!draft.firstName && !!draft.lastName],
    ["Team and league", !!draft.team && !!draft.league],
    ["Hero photo", !!draft.heroImageUrl && !draft.heroImageUrl.includes("placeholder")],
    ["Player bio", !!draft.bio],
    ["Video or highlight", (draft.media ?? []).some((item) => !!item.url) || draft.highlights.some((item) => !!item.url) || (draft.trainingVideos ?? []).some((item) => !!item.url)],
  ] as const;
  const readyCount = checks.filter(([, done]) => done).length;
  const selectedPlan = launchPlans.find((item) => item.id === tier) ?? launchPlans[0];
  const needsTierCheckout = currentTier === "free" && tier !== "free";
  const needsDomainCheckout = customDomain && !currentHasCustomDomain;
  const needsCheckout = needsTierCheckout || needsDomainCheckout;
  const checkoutTotal = (needsTierCheckout ? selectedPlan.price : 0) + (needsDomainCheckout ? 10 : 0);
  const domainReady = currentHasCustomDomain || !customDomain || domainState === "available";
  const slugReady = slugState === "available";

  function chooseTier(nextTier: BillingTier) {
    setTier(nextTier);
    localStorage.setItem("diamond_builder_tier", nextTier);
    setCheckoutMessage("");
  }

  function toggleDomain() {
    if (currentHasCustomDomain) return;
    const next = !customDomain;
    setCustomDomain(next);
    localStorage.setItem("diamond_builder_custom_domain", String(next));
    setCheckoutMessage("");
  }

  async function searchDomain(event: React.FormEvent) {
    event.preventDefault();
    const domain = normalizeManagedDomain(domainInput);
    if (!isStandardComDomain(domain)) {
      setDomainState("error");
      setDomainMessage("The included offer supports standard .com domains, such as alexmorgan.com.");
      return;
    }

    setDomainInput(domain);
    setDomainState("checking");
    setDomainMessage("");
    try {
      const response = await fetch("/api/domains/search?domain=" + encodeURIComponent(domain));
      const data = await response.json();
      if (!response.ok) {
        setDomainState("error");
        setDomainMessage(data.error || "Domain search is unavailable right now.");
      } else if (data.available) {
        setDomainState("available");
        setDomainMessage(domain + " is available. Diamond Profile will purchase and manage it while the add-on stays active.");
        update({ customDomain: domain });
      } else {
        setDomainState("unavailable");
        setDomainMessage(domain + " is already taken or is not a standard-priced domain. Try another name.");
        if (draft.customDomain === domain) update({ customDomain: "" });
      }
    } catch {
      setDomainState("error");
      setDomainMessage("Could not check that domain. Try again in a moment.");
    }
  }

  async function saveDraft() {
    const launchDraft = { ...draft, slug: profileSlug };
    const response = await fetch("/api/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(launchDraft),
    });
    const data = await response.json();
    if (response.status === 401) {
      window.location.assign("/auth");
      return null;
    }
    if (!response.ok) throw new Error(data.error || "Your portfolio could not be saved.");
    return data;
  }

  async function startLaunch() {
    if (!slugReady) {
      setCheckoutState("error");
      setCheckoutMessage("Choose an available Diamond Profile address first.");
      return;
    }
    if (!domainReady) {
      setCheckoutState("error");
      setCheckoutMessage("Search for and confirm an available .com domain first.");
      return;
    }
    setCheckoutState("loading");
    setCheckoutMessage("");

    try {
      const saved = await saveDraft();
      if (!saved) return;

      if (isPublished && !needsCheckout) {
        window.location.assign("/dashboard?updated=1");
        return;
      }

      if (!isPublished) {
        const publishResponse = await fetch("/api/portfolio/publish", { method: "POST" });
        const publishData = await publishResponse.json();
        if (!publishResponse.ok) throw new Error(publishData.error || "Your portfolio could not be published.");
      }

      if (!needsCheckout) {
        window.location.assign(isPublished ? "/dashboard?updated=1" : "/dashboard?published=1");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          customDomain,
          slug: profileSlug,
          playerName: [draft.firstName, draft.lastName].filter(Boolean).join(" "),
          domain: customDomain ? domainInput : "",
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/auth");
        return;
      }
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not start. Try again.");
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutState("error");
      setCheckoutMessage(error instanceof Error ? error.message : "Checkout could not start. Try again.");
    }
  }

  return (
    <div>
      <SectionHeader
        title={isPublished ? "Publishing & plans" : "Publish your portfolio"}
        body={isPublished ? "Your website is live. Keep the current plan, save profile changes, or add services when you need them." : "Start free, then add professional video, analytics, or a managed custom domain whenever you need them."}
      />

      <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/55">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/85">Choose your profile address</h3>
            <p className="mt-1 text-xs leading-5 text-white/40">This is the link coaches and recruiters will use.</p>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="sr-only">Diamond Profile address</span>
          <span className="flex min-h-12 items-center overflow-hidden rounded-lg border border-white/10 bg-black/30 focus-within:border-white/35">
            <span className="shrink-0 border-r border-white/10 px-3 text-xs text-white/40">{PROFILE_DOMAIN}/</span>
            <input
              value={profileSlug}
              onChange={(event) => {
                setProfileSlug(sanitizeProfileSlugInput(event.target.value));
                setSlugState("idle");
                setSlugMessage("");
              }}
              minLength={3}
              maxLength={60}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-white outline-none"
              placeholder="player-name"
            />
            <span className="flex w-10 shrink-0 justify-center">
              {slugState === "checking" && <LoaderCircle className="h-4 w-4 animate-spin text-white/45" />}
              {slugState === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
              {(slugState === "unavailable" || slugState === "error") && <X className="h-4 w-4 text-red-300" />}
            </span>
          </span>
        </label>
        {slugMessage && (
          <p aria-live="polite" className={"mt-2 text-xs leading-5 " + (slugState === "available" ? "text-emerald-300" : slugState === "checking" ? "text-white/35" : "text-red-300")}>
            {slugMessage}
          </p>
        )}
      </section>


      {checkoutResult === "success" && (
        <div className="mb-5 flex gap-3 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <div><p className="font-semibold">Checkout complete</p><p className="mt-0.5 text-emerald-100/65">Your add-ons are being confirmed and your portfolio remains live.</p></div>
        </div>
      )}
      {checkoutResult === "canceled" && <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/65">No charge was made. Your portfolio and selections are still saved.</div>}

      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h3 className="text-sm font-semibold text-white/85">Profile check</h3><p className="mt-0.5 text-xs text-white/35">Missing items will not block publishing.</p></div>
          <span className="text-xs font-semibold text-white/45">{readyCount} of {checks.length} ready</span>
        </div>
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.08]">
          {checks.map(([label, done]) => (
            <div key={label} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
              <span className="text-white/65">{label}</span>
              <span className={"inline-flex items-center gap-1.5 text-xs font-semibold " + (done ? "text-emerald-300" : "text-white/30")}>{done && <Check className="h-3.5 w-3.5" />}{done ? "Ready" : "Add later"}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/85">Choose a base plan</h3>
        <p className="mt-1 text-xs text-white/35">Free stays free. Paid plans bill monthly and can be canceled from your account.</p>
        {currentTier !== "free" && <p className="mt-2 text-xs leading-5 text-amber-100/55">Your current paid plan stays selected here. Use Manage billing in the dashboard to switch or cancel it.</p>}
        <div className="mt-3 grid gap-3">
          {launchPlans.map((item) => {
            const selected = item.id === tier;
            const locked = currentTier !== "free" && item.id !== currentTier;
            return (
              <button key={item.id} type="button" onClick={() => chooseTier(item.id)} aria-pressed={selected} disabled={locked}
                className={"w-full rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-35 " + (selected ? "border-white/55 bg-white/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/25")}>
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="text-base font-bold">{item.name}</span>
                      {item.id === "pro" && <span className="rounded-md bg-emerald-300 px-2 py-1 text-[10px] font-bold text-black">POPULAR</span>}
                      {item.id === "elite" && <span className="rounded-md bg-amber-300 px-2 py-1 text-[10px] font-bold text-black">UNLIMITED</span>}
                      {item.id === currentTier && isPublished && <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-bold text-white/55">CURRENT</span>}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-white/45">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-right"><span className="text-2xl font-bold">{"$"}{item.price}</span><span className="block text-[11px] text-white/35">{item.price ? "per month" : "forever"}</span></span>
                </span>
                <span className="mt-4 grid gap-2 border-t border-white/10 pt-3">
                  {item.features.map((feature) => <span key={feature} className="flex items-center gap-2 text-xs text-white/60"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />{feature}</span>)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <button type="button" onClick={toggleDomain} aria-pressed={customDomain} disabled={currentHasCustomDomain} className="flex w-full items-center gap-3 text-left disabled:cursor-default">
          <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg " + (customDomain ? "bg-amber-300 text-black" : "bg-white/[0.06] text-white/45")}><Globe2 className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Custom Domain</span><span className="mt-0.5 block text-xs leading-5 text-white/40">We purchase, connect, renew, and manage one standard .com domain.</span></span>
          <span className="shrink-0 text-right"><span className="block text-lg font-bold">+$10</span><span className="block text-[10px] text-white/35">per month</span></span>
        </button>

        {currentHasCustomDomain && <p className="mt-3 text-xs leading-5 text-white/35">Your managed domain is active. Subscription changes are handled from Manage billing in the dashboard.</p>}

        {customDomain && !currentHasCustomDomain && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <form onSubmit={searchDomain} className="flex gap-2">
              <label className="min-w-0 flex-1"><span className="sr-only">Custom domain</span>
                <input className={inputClass} value={domainInput} onChange={(event) => { setDomainInput(event.target.value); setDomainState("idle"); setDomainMessage(""); }}
                  inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="playername.com" />
              </label>
              <button type="submit" disabled={!domainInput.trim() || domainState === "checking"} aria-label="Search domain" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-black disabled:opacity-40">
                {domainState === "checking" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>
            </form>
            <p className="mt-2 text-[11px] leading-4 text-white/30">Premium and unusually expensive domains are not included.</p>
            {domainMessage && <p aria-live="polite" className={"mt-3 flex items-start gap-2 text-xs leading-5 " + (domainState === "available" ? "text-emerald-300" : domainState === "unavailable" ? "text-amber-200" : "text-red-300")}>{domainState === "available" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{domainMessage}</p>}
          </div>
        )}
      </section>

      <div id="launch-checkout" className="scroll-mt-40 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold">{selectedPlan.name}{customDomain ? " + Custom Domain" : ""}</p><p className="mt-0.5 text-xs text-white/35">{needsCheckout ? `$${checkoutTotal} in new monthly services` : isPublished ? "No new charge—save your latest changes" : "No card required for free hosting"}</p></div>
          <ShieldCheck className="h-5 w-5 text-white/35" />
        </div>
        <button type="button" onClick={startLaunch} disabled={checkoutState === "loading" || !slugReady || !domainReady}
          className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black transition hover:bg-white/85 disabled:opacity-60">
          {checkoutState === "loading" ? <><LoaderCircle className="h-4 w-4 animate-spin" />{needsCheckout ? "Opening checkout" : "Saving changes"}</> : <>{needsCheckout ? "Continue to secure checkout" : isPublished ? "Save changes and return" : currentTier === "free" ? "Publish free" : "Publish profile"}<ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/30">
          {needsCheckout ? <><LockKeyhole className="h-3.5 w-3.5" />Payment is completed securely with Stripe</> : isPublished ? <>Your live website stays online while changes save</> : <>No payment information required</>}
        </p>
        {checkoutState === "error" && <p aria-live="polite" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.08] p-3 text-xs leading-5 text-red-200">{checkoutMessage}</p>}
      </div>
    </div>
  );
}
