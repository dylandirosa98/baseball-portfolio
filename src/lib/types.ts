export interface PlayerStats {
  gamesPlayed: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  homeRuns: number;
  runsBattedIn: number;
  stolenBases: number;
  inningsPitched: number;
  wins?: number;
  losses?: number;
  earnedRunAverage?: number;
  whip?: number;
  strikeoutsPitched?: number;
}

export interface SeasonStats {
  season: string;
  team: string;
  league: string;
  stats: PlayerStats;
}

export interface Highlight {
  title: string;
  url: string;
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxUploadId?: string;
}

export interface SocialLink {
  platform: "instagram" | "twitter" | "youtube" | "tiktok" | "email" | "perfectgame" | "maxpreps" | "ncsa" | "hudl";
  url: string;
  showInHero?: boolean;
}

export interface Skillset {
  name: string;
  description: string;
  watchUrl?: string;
  videoDisplay?: "button" | "embed";
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxUploadId?: string;
  videos?: MediaItem[];
}

export interface MediaItem {
  type: "photo" | "video";
  url: string;
  title?: string;
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxUploadId?: string;
}

export interface TimelineEntry {
  title: string;
  description: string;
  media: MediaItem[];
}

export interface Player {
  slug: string;
  firstName: string;
  lastName: string;
  position: string;
  number: number;
  team: string;
  league: string;
  hometown: string;
  height: string;
  weight: string;
  bats: "Left" | "Right" | "Switch";
  throws: "Left" | "Right";
  birthYear: number;
  bio: string;
  headshotUrl: string;
  heroImageUrl: string;
  currentStats: PlayerStats;
  seasonHistory: SeasonStats[];
  highlights: Highlight[];
  socialLinks: SocialLink[];
  themeColor: string;
  highlightReelUrl?: string;
  resumeUrl?: string;
  skillsets?: Skillset[];
  sectionOrder?: string[];
  interests?: string;
  interestsMedia?: MediaItem[];
  trainingVideoUrl?: string;
  trainingDescription?: string;
  trainingVideos?: { url: string; title?: string; description?: string; thumbnailUrl?: string; muxPlaybackId?: string; muxAssetId?: string; muxUploadId?: string }[];
  timeline?: TimelineEntry[];
  transcriptUrl?: string;
  showStatsBar?: boolean;
  lightMode?: boolean;
  customDomain?: string;
  teamLogoUrl?: string;
  numberColor?: string;
  media?: MediaItem[];
}

export interface PlayerWithMeta extends Player {
  id: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
