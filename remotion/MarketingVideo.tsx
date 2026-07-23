import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  red: "#e5162a",
  redBright: "#ff3347",
  redDark: "#480007",
  ink: "#050506",
  white: "#f8f7f4",
  muted: "rgba(248,247,244,0.58)",
  line: "rgba(255,255,255,0.13)",
};

const FPS = 30;
const TOTAL_FRAMES = 1080;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function sceneOpacity(frame: number, duration: number, fade = 16) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], clamp);
}

function rise(frame: number, delay: number, fps: number, distance = 64) {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 125, mass: 0.85 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

function slide(frame: number, delay: number, fps: number, distance: number) {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, stiffness: 115, mass: 0.9 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateX(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

function Scene({ duration, children }: { duration: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: sceneOpacity(frame, duration) }}>{children}</AbsoluteFill>;
}

function Grid({ strong = false }: { strong?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        opacity: strong ? 0.2 : 0.1,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
        backgroundSize: strong ? "72px 72px" : "54px 54px",
        maskImage: "linear-gradient(to bottom, black, transparent 82%)",
      }}
    />
  );
}

function Grain() {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.075,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")",
        mixBlendMode: "soft-light",
      }}
    />
  );
}

function BrandLockup({ vertical, compact = false }: { vertical: boolean; compact?: boolean }) {
  const logo = compact ? (vertical ? 82 : 70) : vertical ? 130 : 104;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: vertical ? 24 : 20 }}>
      <Img src={staticFile("diamond-profile-logo.png")} style={{ width: logo, height: logo, objectFit: "contain" }} />
      <div>
        <div
          style={{
            fontSize: compact ? (vertical ? 26 : 22) : vertical ? 38 : 32,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -1.2,
          }}
        >
          DIAMOND PROFILE
        </div>
        {!compact && (
          <div style={{ marginTop: 10, color: COLORS.muted, fontSize: vertical ? 18 : 16, fontWeight: 700, letterSpacing: 3.2 }}>
            BASEBALL RECRUITING WEBSITES
          </div>
        )}
      </div>
    </div>
  );
}

function Eyebrow({ children, vertical }: { children: React.ReactNode; vertical: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15, color: COLORS.redBright, fontSize: vertical ? 24 : 21, fontWeight: 900, letterSpacing: 4.4, textTransform: "uppercase" }}>
      <span style={{ width: vertical ? 44 : 38, height: 5, borderRadius: 99, background: COLORS.redBright }} />
      {children}
    </div>
  );
}

function KineticLine({
  text,
  delay,
  size,
  accent = false,
}: {
  text: string;
  delay: number;
  size: number;
  accent?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 17, stiffness: 115, mass: 0.9 } });
  return (
    <div style={{ overflow: "hidden", paddingBottom: size * 0.05 }}>
      <div
        style={{
          color: accent ? COLORS.redBright : COLORS.white,
          fontSize: size,
          fontWeight: 950,
          letterSpacing: -size * 0.064,
          lineHeight: 0.88,
          opacity: progress,
          transform: `translateY(${interpolate(progress, [0, 1], [size * 0.9, 0])}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function PhoneFrame({
  src,
  height,
  rotate = 0,
  accent = COLORS.red,
  shadow = true,
  style,
}: {
  src: string;
  height: number;
  rotate?: number;
  accent?: string;
  shadow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        height,
        aspectRatio: "389 / 844",
        padding: Math.max(8, height * 0.012),
        borderRadius: height * 0.045,
        border: `2px solid ${accent}`,
        background: "linear-gradient(145deg, #202024, #050506)",
        boxShadow: shadow ? `0 ${height * 0.07}px ${height * 0.18}px rgba(0,0,0,.62), 0 0 ${height * 0.08}px ${accent}26` : undefined,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: height * 0.018, left: "50%", zIndex: 2, width: "22%", height: height * 0.012, borderRadius: 99, background: "#020203", transform: "translateX(-50%)" }} />
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: height * 0.034, background: COLORS.ink }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
}

function HookScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 78 : 128;
  const sweep = interpolate(frame, [0, 130], [-30, 115], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Scene duration={150}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${vertical ? "78% 18%" : "72% 45%"}, #5c0712 0%, ${COLORS.ink} 48%, #020203 100%)`, color: COLORS.white }}>
        <Grid strong />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sweep}%`, width: vertical ? 240 : 320, transform: "skewX(-18deg)", background: "linear-gradient(90deg, transparent, rgba(229,22,42,.34), transparent)", filter: "blur(6px)" }} />
        <div style={{ position: "absolute", top: vertical ? 92 : 72, left: pad, ...rise(frame, 2, fps, 24) }}>
          <BrandLockup vertical={vertical} compact />
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, top: vertical ? 440 : 260 }}>
          <KineticLine text="YOUR GAME" delay={14} size={vertical ? 150 : 132} />
          <KineticLine text="IS BIGGER" delay={25} size={vertical ? 150 : 132} accent />
          <KineticLine text="THAN A STAT LINE." delay={36} size={vertical ? 116 : 116} />
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, bottom: vertical ? 170 : 95, display: "flex", justifyContent: "space-between", alignItems: "flex-end", ...rise(frame, 67, fps, 28) }}>
          <div style={{ maxWidth: vertical ? 760 : 840, color: COLORS.muted, fontSize: vertical ? 31 : 27, lineHeight: 1.35, fontWeight: 600 }}>
            Film. Stats. Academics. Story.<br />One profile built for the next opportunity.
          </div>
          {!vertical && <div style={{ color: "rgba(255,255,255,.32)", fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>DIAMONDPROFILE.APP</div>}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function ProfileScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 76 : 124;
  const phoneEnter = slide(frame, 13, fps, vertical ? 120 : 180);
  const drift = interpolate(frame, [0, 225], [0, -18], clamp);
  const tags = ["FILM", "STATS", "ACADEMICS", "STORY"];
  return (
    <Scene duration={225}>
      <AbsoluteFill style={{ background: COLORS.white, color: COLORS.ink }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 40%, rgba(229,22,42,.18), transparent 36%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: vertical ? 14 : 18, background: COLORS.red }} />
        <div style={{ position: "absolute", left: pad, right: pad, top: vertical ? 110 : 118, width: vertical ? "auto" : 900 }}>
          <div style={rise(frame, 6, fps, 30)}><Eyebrow vertical={vertical}>One link. The complete player.</Eyebrow></div>
          <h2 style={{ margin: vertical ? "42px 0 0" : "36px 0 0", fontSize: vertical ? 108 : 94, lineHeight: 0.92, letterSpacing: -6.2, maxWidth: vertical ? 930 : 900, ...rise(frame, 18, fps, 55) }}>
            Give coaches the full picture—fast.
          </h2>
          <p style={{ margin: vertical ? "36px 0 0" : "30px 0 0", maxWidth: vertical ? 760 : 720, color: "rgba(5,5,6,.56)", fontSize: vertical ? 30 : 25, lineHeight: 1.4, fontWeight: 600, ...rise(frame, 29, fps, 35) }}>
            A polished recruiting website that puts the most important information in one easy-to-share place.
          </p>
        </div>
        <div
          style={{
            position: "absolute",
            right: vertical ? 60 : 185,
            bottom: vertical ? -330 : 80,
            ...phoneEnter,
            transform: `${phoneEnter.transform} translateY(${drift}px)`,
          }}
        >
          <PhoneFrame src="images/marketing-design-1.png" height={vertical ? 1040 : 850} rotate={vertical ? -1.3 : 1.5} />
        </div>
        <div style={{ position: "absolute", left: pad, bottom: vertical ? 150 : 105, display: "grid", gridTemplateColumns: vertical ? "repeat(2, 210px)" : "repeat(2, 175px)", gap: 12 }}>
          {tags.map((tag, index) => (
            <div key={tag} style={{ borderTop: `3px solid ${index === 0 ? COLORS.red : "rgba(5,5,6,.18)"}`, paddingTop: 12, color: index === 0 ? COLORS.red : "rgba(5,5,6,.48)", fontSize: vertical ? 19 : 16, fontWeight: 900, letterSpacing: 2.4, ...rise(frame, 50 + index * 5, fps, 22) }}>{tag}</div>
          ))}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function ValueScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 76 : 124;
  const items = [
    ["01", "Lead with the film that matters"],
    ["02", "Add baseball-native stats"],
    ["03", "Keep academics and contact details close"],
    ["04", "Update anytime from your phone"],
  ];
  const number = interpolate(frame, [32, 112], [0, 1], clamp);
  return (
    <Scene duration={225}>
      <AbsoluteFill style={{ background: `linear-gradient(135deg, #09090b 0%, #120105 62%, ${COLORS.redDark} 100%)`, color: COLORS.white }}>
        <Grid />
        <div style={{ position: "absolute", top: vertical ? 116 : 96, left: pad, right: pad }}>
          <div style={rise(frame, 7, fps, 28)}><Eyebrow vertical={vertical}>Built for the coach’s first look</Eyebrow></div>
          <h2 style={{ margin: "34px 0 0", maxWidth: vertical ? 900 : 1260, fontSize: vertical ? 107 : 101, lineHeight: 0.92, letterSpacing: -6.2, ...rise(frame, 17, fps, 58) }}>
            Everything they need.<br /><span style={{ color: COLORS.redBright }}>Nothing to hunt for.</span>
          </h2>
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, bottom: vertical ? 150 : 105, display: "grid", gridTemplateColumns: vertical ? "1fr" : "repeat(2, 1fr)", columnGap: 74, rowGap: vertical ? 28 : 34 }}>
          {items.map(([indexLabel, label], index) => (
            <div key={indexLabel} style={{ display: "grid", gridTemplateColumns: vertical ? "92px 1fr" : "74px 1fr", alignItems: "start", gap: 20, paddingTop: vertical ? 22 : 18, borderTop: `1px solid ${COLORS.line}`, ...slide(frame, 52 + index * 8, fps, index % 2 === 0 ? -70 : 70) }}>
              <span style={{ color: COLORS.redBright, fontSize: vertical ? 26 : 21, fontWeight: 900 }}>{indexLabel}</span>
              <span style={{ fontSize: vertical ? 34 : 29, lineHeight: 1.15, fontWeight: 800 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", right: vertical ? -140 : 76, top: vertical ? 610 : 150, color: "rgba(229,22,42,.08)", fontSize: vertical ? 650 : 560, fontWeight: 950, lineHeight: 0.8, letterSpacing: -70, transform: `scale(${0.98 + number * 0.02})` }}>1</div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

const designs = [
  { title: "CINEMATIC", src: "images/marketing-design-1.png", accent: "#ff3347" },
  { title: "CLUBHOUSE", src: "images/marketing-design-2.png", accent: "#e5162a" },
  { title: "PROSPECT CARD", src: "images/marketing-design-3.png", accent: "#ff5968" },
];

function DesignsScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 68 : 108;
  return (
    <Scene duration={255}>
      <AbsoluteFill style={{ background: COLORS.ink, color: COLORS.white }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, rgba(229,22,42,.22), transparent 48%)" }} />
        <Grid />
        <div style={{ position: "absolute", top: vertical ? 82 : 66, left: pad, right: pad, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <div style={rise(frame, 4, fps, 24)}><Eyebrow vertical={vertical}>One story. Three distinct designs.</Eyebrow></div>
            <h2 style={{ margin: "24px 0 0", fontSize: vertical ? 82 : 77, lineHeight: 0.95, letterSpacing: -4.8, ...rise(frame, 14, fps, 40) }}>Pick the look.<br />Keep every detail.</h2>
          </div>
          {!vertical && <p style={{ width: 430, margin: 0, color: COLORS.muted, fontSize: 23, lineHeight: 1.38, fontWeight: 600, ...rise(frame, 27, fps, 28) }}>Switch the presentation without rebuilding the profile.</p>}
        </div>

        {vertical ? (
          <div style={{ position: "absolute", inset: "430px 0 0" }}>
            {designs.map((design, index) => {
              const start = index * 72;
              const exitStart = index === designs.length - 1 ? 234 : start + 60;
              const exitEnd = index === designs.length - 1 ? 254 : start + 78;
              const x = interpolate(frame, [start - 14, start + 9, exitStart, exitEnd], [900, 0, 0, -900], clamp);
              const opacity = interpolate(frame, [start - 10, start + 5, exitStart, exitEnd], [0, 1, 1, 0], clamp);
              const scale = interpolate(frame, [start, start + 22], [0.92, 1], clamp);
              return (
                <div key={design.title} style={{ position: "absolute", inset: 0, opacity, transform: `translateX(${x}px) scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <PhoneFrame src={design.src} height={1050} accent={design.accent} />
                  <div style={{ marginTop: 42, fontSize: 27, fontWeight: 950, letterSpacing: 5, color: design.accent }}>{design.title}</div>
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", gap: 16 }}>
              {designs.map((design, index) => {
                const active = Math.min(2, Math.max(0, Math.floor((frame + 8) / 72))) === index;
                return <span key={design.title} style={{ width: active ? 68 : 18, height: 7, borderRadius: 99, background: active ? COLORS.redBright : "rgba(255,255,255,.22)" }} />;
              })}
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", left: pad, right: pad, bottom: 70, display: "flex", alignItems: "end", justifyContent: "center", gap: 70 }}>
            {designs.map((design, index) => {
              const enter = spring({ frame: frame - 38 - index * 10, fps, config: { damping: 18, stiffness: 105, mass: 0.9 } });
              return (
                <div key={design.title} style={{ opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [130, index === 1 ? -12 : 20])}px) rotate(${index === 0 ? -3 : index === 2 ? 3 : 0}deg)`, textAlign: "center" }}>
                  <PhoneFrame src={design.src} height={690} accent={design.accent} shadow={index === 1} />
                  <div style={{ marginTop: 26, fontSize: 18, fontWeight: 950, letterSpacing: 3.2, color: design.accent }}>{design.title}</div>
                </div>
              );
            })}
          </div>
        )}
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function MomentumScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 78 : 128;
  const pulse = 0.9 + Math.sin(frame / 9) * 0.03;
  return (
    <Scene duration={165}>
      <AbsoluteFill style={{ background: COLORS.white, color: COLORS.ink }}>
        <div style={{ position: "absolute", right: vertical ? -310 : -80, top: vertical ? 480 : 80, opacity: 0.09, transform: `scale(${pulse})` }}>
          <Img src={staticFile("diamond-profile-logo.png")} style={{ width: vertical ? 970 : 820, height: vertical ? 970 : 820, objectFit: "contain", filter: "grayscale(1)" }} />
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, top: vertical ? 170 : 155 }}>
          <div style={rise(frame, 5, fps, 28)}><Eyebrow vertical={vertical}>Built for momentum</Eyebrow></div>
          <h2 style={{ margin: "34px 0 0", maxWidth: vertical ? 900 : 1180, fontSize: vertical ? 112 : 105, lineHeight: 0.91, letterSpacing: -6.7, ...rise(frame, 16, fps, 58) }}>Publish once.<br />Keep getting better.</h2>
          <p style={{ margin: "38px 0 0", maxWidth: vertical ? 820 : 850, color: "rgba(5,5,6,.56)", fontSize: vertical ? 32 : 29, lineHeight: 1.42, fontWeight: 600, ...rise(frame, 30, fps, 34) }}>Update film, stats, photos, and recruiting information whenever the season changes.</p>
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, bottom: vertical ? 210 : 135, display: "grid", gridTemplateColumns: vertical ? "1fr" : "repeat(3, 1fr)", gap: vertical ? 18 : 22 }}>
          {["BUILD FROM YOUR PHONE", "SHARE ONE CLEAN LINK", "ANALYTICS ON PAID PLANS"].map((label, index) => (
            <div key={label} style={{ minHeight: vertical ? 120 : 138, display: "flex", alignItems: "center", gap: 22, padding: vertical ? "0 30px" : "0 28px", border: "1px solid rgba(5,5,6,.13)", borderRadius: 18, background: index === 1 ? COLORS.ink : "rgba(5,5,6,.035)", color: index === 1 ? COLORS.white : COLORS.ink, ...rise(frame, 48 + index * 7, fps, 38) }}>
              <span style={{ width: 12, height: 12, borderRadius: 99, background: COLORS.red }} />
              <span style={{ fontSize: vertical ? 23 : 18, fontWeight: 950, letterSpacing: 1.8 }}>{label}</span>
            </div>
          ))}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function CtaScene({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pad = vertical ? 76 : 120;
  const ring = interpolate(frame, [0, 135], [0.82, 1.12], clamp);
  return (
    <Scene duration={135}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #7a0716 0%, ${COLORS.red} 38%, #8f0010 100%)`, color: COLORS.white, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <Grid strong />
        <div style={{ position: "absolute", width: vertical ? 1280 : 1050, height: vertical ? 1280 : 1050, borderRadius: "50%", border: "2px solid rgba(255,255,255,.16)", transform: `scale(${ring})` }} />
        <div style={{ position: "relative", width: "100%", padding: `0 ${pad}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={rise(frame, 2, fps, 30)}><BrandLockup vertical={vertical} compact /></div>
          <h2 style={{ margin: vertical ? "88px 0 0" : "58px 0 0", maxWidth: vertical ? 930 : 1500, fontSize: vertical ? 128 : 118, lineHeight: 0.9, letterSpacing: -7.2, ...rise(frame, 12, fps, 66) }}>Build your Diamond Profile free.</h2>
          <div style={{ marginTop: vertical ? 72 : 48, padding: vertical ? "27px 46px" : "24px 42px", borderRadius: 999, background: COLORS.white, color: COLORS.ink, fontSize: vertical ? 31 : 27, fontWeight: 950, letterSpacing: -0.7, ...rise(frame, 30, fps, 35) }}>DIAMONDPROFILE.APP</div>
          <p style={{ margin: vertical ? "40px 0 0" : "28px 0 0", color: "rgba(255,255,255,.7)", fontSize: vertical ? 24 : 20, fontWeight: 700, letterSpacing: 2.4, ...rise(frame, 40, fps, 24) }}>YOUR GAME. YOUR STORY. ONE LINK.</p>
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

export function MarketingVideo({ vertical }: { vertical: boolean }) {
  return (
    <AbsoluteFill style={{ background: COLORS.ink, color: COLORS.white, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Audio
        src={staticFile("audio/diamond-profile-promo.mp3")}
        volume={(frame) => interpolate(frame, [0, 15, TOTAL_FRAMES - 60, TOTAL_FRAMES - 1], [0, 0.93, 0.93, 0], clamp)}
      />
      <Sequence from={0} durationInFrames={150}><HookScene vertical={vertical} /></Sequence>
      <Sequence from={135} durationInFrames={225}><ProfileScene vertical={vertical} /></Sequence>
      <Sequence from={345} durationInFrames={225}><ValueScene vertical={vertical} /></Sequence>
      <Sequence from={555} durationInFrames={255}><DesignsScene vertical={vertical} /></Sequence>
      <Sequence from={795} durationInFrames={165}><MomentumScene vertical={vertical} /></Sequence>
      <Sequence from={945} durationInFrames={135}><CtaScene vertical={vertical} /></Sequence>
    </AbsoluteFill>
  );
}

export const marketingVideoConfig = {
  fps: FPS,
  durationInFrames: TOTAL_FRAMES,
};
