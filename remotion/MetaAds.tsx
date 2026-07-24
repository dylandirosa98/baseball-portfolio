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
} from "remotion";

const RED = "#ed172c";
const RED_BRIGHT = "#ff4052";
const BLACK = "#050506";
const WHITE = "#f8f7f4";
const MUTED = "rgba(248,247,244,.62)";
const FPS = 30;
export const META_AD_FRAMES = 600;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function enter(frame: number, delay = 0, distance = 70) {
  const progress = spring({
    frame: frame - delay,
    fps: FPS,
    config: { damping: 18, stiffness: 135, mass: 0.82 },
  });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

function sceneOpacity(frame: number, duration: number, fade = 10) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], clamp);
}

function Scene({ duration, children, style }: { duration: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: sceneOpacity(frame, duration), ...style }}>{children}</AbsoluteFill>;
}

function Texture({ light = false }: { light?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        opacity: light ? 0.1 : 0.13,
        backgroundImage: `linear-gradient(${light ? "rgba(0,0,0,.14)" : "rgba(255,255,255,.15)"} 1px, transparent 1px), linear-gradient(90deg, ${light ? "rgba(0,0,0,.14)" : "rgba(255,255,255,.15)"} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        maskImage: "linear-gradient(to bottom, black, transparent 88%)",
      }}
    />
  );
}

function Grain() {
  return (
    <AbsoluteFill
      style={{
        opacity: 0.06,
        mixBlendMode: "soft-light",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitchTiles'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 16 : 22, color: dark ? BLACK : WHITE }}>
      <Img src={staticFile("diamond-profile-logo.png")} style={{ width: compact ? 64 : 92, height: compact ? 64 : 92, objectFit: "contain" }} />
      <div style={{ fontSize: compact ? 23 : 31, fontWeight: 950, letterSpacing: compact ? 1.5 : 2.2 }}>DIAMOND PROFILE</div>
    </div>
  );
}

function Phone({ src, height = 1050, rotate = 0, style }: { src: string; height?: number; rotate?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "relative",
        height,
        aspectRatio: "389 / 844",
        padding: 7,
        borderRadius: 52,
        border: "3px solid rgba(255,255,255,.26)",
        background: "#121216",
        boxShadow: "0 55px 130px rgba(0,0,0,.62), 0 0 70px rgba(237,23,44,.16)",
        transform: `rotate(${rotate}deg)`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 43, background: BLACK }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
}

function BigText({ children, size = 128, red = false, style }: { children: React.ReactNode; size?: number; red?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ color: red ? RED_BRIGHT : WHITE, fontSize: size, lineHeight: 0.88, fontWeight: 950, letterSpacing: -size * 0.066, ...style }}>
      {children}
    </div>
  );
}

function Pill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{ padding: "18px 27px", borderRadius: 999, border: `1px solid ${dark ? "rgba(5,5,6,.18)" : "rgba(255,255,255,.2)"}`, background: dark ? "rgba(5,5,6,.05)" : "rgba(5,5,6,.42)", color: dark ? BLACK : WHITE, fontSize: 20, fontWeight: 900, letterSpacing: 2.2 }}>
      {children}
    </div>
  );
}

function RedWipe({ at = 0 }: { at?: number }) {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [at, at + 20], [-130, 130], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return <div style={{ position: "absolute", zIndex: 20, top: 0, bottom: 0, left: `${x}%`, width: 360, background: `linear-gradient(90deg, transparent, ${RED}, transparent)`, transform: "skewX(-12deg)", filter: "blur(8px)", opacity: 0.72 }} />;
}

function Cta({ duration = 140, eyebrow = "START FREE TODAY" }: { duration?: number; eyebrow?: string }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 12), [-1, 1], [0.98, 1.02]);
  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 36%, #f4364a 0%, #b80719 42%, #380007 100%)", color: WHITE, alignItems: "center", textAlign: "center" }}>
        <Texture />
        <div style={{ position: "absolute", top: 205, ...enter(frame, 2, 25) }}><Brand /></div>
        <div style={{ position: "absolute", left: 66, right: 66, top: 520 }}>
          <div style={{ color: "rgba(255,255,255,.7)", fontSize: 23, fontWeight: 900, letterSpacing: 5, ...enter(frame, 8, 25) }}>{eyebrow}</div>
          <BigText size={126} style={{ marginTop: 40, ...enter(frame, 14, 55) }}>BUILD YOUR<br />PROFILE FREE.</BigText>
          <div style={{ display: "inline-flex", marginTop: 74, padding: "28px 46px", borderRadius: 999, background: WHITE, color: BLACK, fontSize: 31, fontWeight: 950, transform: `scale(${pulse})` }}>DIAMONDPROFILE.APP</div>
          <div style={{ marginTop: 42, color: "rgba(255,255,255,.72)", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>YOUR GAME · YOUR STORY · ONE LINK</div>
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function Soundtrack() {
  return <Audio src={staticFile("audio/diamond-profile-promo.mp3")} volume={(frame) => interpolate(frame, [0, 10, META_AD_FRAMES - 35, META_AD_FRAMES - 1], [0, 0.94, 0.94, 0], clamp)} />;
}

function FirstLookHook() {
  const frame = useCurrentFrame();
  const slash = interpolate(frame, [0, 85], [-25, 110], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Scene duration={105}>
      <AbsoluteFill style={{ background: BLACK, color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", top: 150, left: 66, ...enter(frame, 0, 25) }}><Brand compact /></div>
        <div style={{ position: "absolute", left: `${slash}%`, top: -100, width: 180, height: 2200, background: RED, transform: "rotate(12deg)", opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 66, right: 66, top: 570 }}>
          <BigText size={141} style={enter(frame, 5, 70)}>COACHES</BigText>
          <BigText size={141} red style={{ marginTop: 12, ...enter(frame, 13, 70) }}>SCROLL FAST.</BigText>
          <div style={{ marginTop: 55, color: MUTED, fontSize: 29, fontWeight: 750, lineHeight: 1.35, ...enter(frame, 25, 35) }}>Make the first look count.</div>
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function FirstLookProfile() {
  const frame = useCurrentFrame();
  const phone = spring({ frame: frame - 2, fps: FPS, config: { damping: 20, stiffness: 105, mass: 0.9 } });
  const drift = interpolate(frame, [0, 195], [25, -20], clamp);
  return (
    <Scene duration={205}>
      <AbsoluteFill style={{ background: "linear-gradient(155deg,#5a0711 0%,#080709 50%,#020203 100%)", color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", left: 64, right: 64, top: 118, zIndex: 3 }}>
          <div style={{ color: RED_BRIGHT, fontSize: 22, fontWeight: 950, letterSpacing: 4, ...enter(frame, 3, 25) }}>ONE CLEAN LINK</div>
          <BigText size={99} style={{ marginTop: 25, ...enter(frame, 10, 45) }}>THE FULL<br />PLAYER.</BigText>
        </div>
        <div style={{ position: "absolute", right: -5, top: 445, opacity: phone, transform: `translateY(${interpolate(phone, [0, 1], [170, drift])}px)` }}>
          <Phone src="images/marketing-design-1.png" height={1190} rotate={2.2} />
        </div>
        <div style={{ position: "absolute", zIndex: 4, left: 52, bottom: 220, display: "flex", flexDirection: "column", gap: 14 }}>
          {["FILM", "STATS", "ACADEMICS", "STORY"].map((label, index) => <div key={label} style={enter(frame, 42 + index * 7, 28)}><Pill>{label}</Pill></div>)}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function FirstLookDesigns() {
  const frame = useCurrentFrame();
  const shots = ["images/marketing-design-1.png", "images/marketing-design-2.png", "images/marketing-design-3.png"];
  const shotIndex = Math.min(2, Math.floor(frame / 55));
  return (
    <Scene duration={175}>
      <AbsoluteFill style={{ background: WHITE, color: BLACK }}>
        <Texture light />
        <div style={{ position: "absolute", left: 64, right: 64, top: 115, zIndex: 5 }}>
          <div style={{ color: RED, fontSize: 22, fontWeight: 950, letterSpacing: 4 }}>BUILT TO STAND OUT</div>
          <div style={{ marginTop: 25, fontSize: 82, lineHeight: 0.94, fontWeight: 950, letterSpacing: -5.2 }}>Three designs.<br />Your story.</div>
        </div>
        {shots.map((src, index) => {
          const local = frame - index * 55;
          const opacity = interpolate(local, [-8, 5, 46, 59], [0, 1, 1, 0], clamp);
          const x = interpolate(local, [-8, 8, 48, 59], [650, 0, 0, -580], clamp);
          return <Phone key={src} src={src} height={1160} style={{ position: "absolute", top: 440, left: 290, opacity, transform: `translateX(${x}px) rotate(${index === 1 ? -1 : 1}deg)` }} />;
        })}
        <div style={{ position: "absolute", left: 64, bottom: 190, display: "flex", gap: 13 }}>
          {[0, 1, 2].map((index) => <span key={index} style={{ width: shotIndex === index ? 72 : 20, height: 8, borderRadius: 99, background: shotIndex === index ? RED : "rgba(5,5,6,.18)" }} />)}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

export function MetaAdFirstLook() {
  return (
    <AbsoluteFill style={{ background: BLACK, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Soundtrack />
      <Sequence from={0} durationInFrames={105}><FirstLookHook /></Sequence>
      <Sequence from={92} durationInFrames={205}><FirstLookProfile /></Sequence>
      <Sequence from={282} durationInFrames={175}><FirstLookDesigns /></Sequence>
      <Sequence from={440} durationInFrames={160}><Cta duration={160} /></Sequence>
    </AbsoluteFill>
  );
}

function PuzzleHook() {
  const frame = useCurrentFrame();
  const cards = [
    ["FILM", 90, 620, -7],
    ["STATS", 530, 770, 6],
    ["ACADEMICS", 110, 1040, 4],
    ["CONTACT", 535, 1220, -5],
  ] as const;
  return (
    <Scene duration={150}>
      <AbsoluteFill style={{ background: WHITE, color: BLACK }}>
        <Texture light />
        <div style={{ position: "absolute", left: 64, top: 135, ...enter(frame, 0, 25) }}><Brand dark compact /></div>
        <div style={{ position: "absolute", left: 64, right: 64, top: 270, fontSize: 88, lineHeight: 0.92, fontWeight: 950, letterSpacing: -5.4, ...enter(frame, 6, 45) }}>YOUR RECRUITING<br />STORY ISN’T A<br /><span style={{ color: RED }}>PUZZLE.</span></div>
        {cards.map(([label, left, top, rotate], index) => {
          const progress = spring({ frame: frame - 18 - index * 7, fps: FPS, config: { damping: 15, stiffness: 125, mass: 0.85 } });
          return (
            <div key={label} style={{ position: "absolute", left, top, width: 350, padding: "32px 26px", border: "2px solid rgba(5,5,6,.17)", borderRadius: 18, background: index === 1 ? BLACK : "#f1efeb", color: index === 1 ? WHITE : BLACK, boxShadow: "0 24px 60px rgba(0,0,0,.14)", fontSize: 27, fontWeight: 950, letterSpacing: 3, opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [100, 0])}px) rotate(${rotate}deg)` }}>{label}<span style={{ float: "right", color: RED }}>↗</span></div>
          );
        })}
        <div style={{ position: "absolute", left: 64, bottom: 195, color: "rgba(5,5,6,.55)", fontSize: 28, fontWeight: 750, ...enter(frame, 72, 32) }}>Stop sending coaches on a search.</div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function OneLinkScene() {
  const frame = useCurrentFrame();
  const phoneProgress = spring({ frame: frame - 4, fps: FPS, config: { damping: 19, stiffness: 110, mass: 0.88 } });
  return (
    <Scene duration={315}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 75% 30%, #570710 0%, #0a0709 48%, #030304 100%)", color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", left: 64, right: 64, top: 115, zIndex: 5 }}>
          <div style={{ color: RED_BRIGHT, fontSize: 22, fontWeight: 950, letterSpacing: 4, ...enter(frame, 3, 22) }}>ONE PROFILE. ONE LINK.</div>
          <BigText size={94} style={{ marginTop: 28, ...enter(frame, 10, 45) }}>EVERYTHING<br />THEY NEED.</BigText>
          <div style={{ marginTop: 38, maxWidth: 820, color: MUTED, fontSize: 28, lineHeight: 1.35, fontWeight: 700, ...enter(frame, 22, 30) }}>Film, stats, academics, contact details, and your story—organized for the first look.</div>
        </div>
        <div style={{ position: "absolute", left: 250, top: 590, opacity: phoneProgress, transform: `translateY(${interpolate(phoneProgress, [0, 1], [180, 0])}px)` }}>
          <Phone src="images/marketing-hero.png" height={1190} rotate={-1.3} />
        </div>
        <div style={{ position: "absolute", zIndex: 5, left: 64, right: 64, bottom: 170, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "22px 34px", borderRadius: 999, border: "1px solid rgba(255,255,255,.18)", background: "rgba(5,5,6,.82)", backdropFilter: "blur(12px)", fontSize: 23, fontWeight: 900, letterSpacing: 1.2, ...enter(frame, 54, 30) }}>diamondprofile.app/ethan-cole</div>
        </div>
        <RedWipe at={278} />
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

export function MetaAdOneLink() {
  return (
    <AbsoluteFill style={{ background: BLACK, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Soundtrack />
      <Sequence from={0} durationInFrames={150}><PuzzleHook /></Sequence>
      <Sequence from={132} durationInFrames={315}><OneLinkScene /></Sequence>
      <Sequence from={430} durationInFrames={170}><Cta duration={170} eyebrow="ONE LINK STARTS HERE" /></Sequence>
    </AbsoluteFill>
  );
}

function NotGenericHook() {
  const frame = useCurrentFrame();
  return (
    <Scene duration={145}>
      <AbsoluteFill style={{ background: "linear-gradient(145deg,#080709 0%,#290007 52%,#760912 100%)", color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", left: 64, top: 140, ...enter(frame, 0, 25) }}><Brand compact /></div>
        <div style={{ position: "absolute", left: 64, right: 64, top: 500 }}>
          <BigText size={126} style={enter(frame, 5, 65)}>YOUR GAME</BigText>
          <BigText size={126} style={{ marginTop: 12, ...enter(frame, 13, 65) }}>DOESN’T LOOK</BigText>
          <BigText size={148} red style={{ marginTop: 12, ...enter(frame, 21, 65) }}>GENERIC.</BigText>
          <div style={{ marginTop: 58, color: MUTED, fontSize: 30, fontWeight: 750, ...enter(frame, 38, 30) }}>Your recruiting profile shouldn’t either.</div>
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function DesignCarousel() {
  const frame = useCurrentFrame();
  const items = [
    ["CINEMATIC", "images/marketing-design-1.png", "#ff4052"],
    ["CLUBHOUSE", "images/marketing-design-2.png", "#ef1f32"],
    ["PROSPECT CARD", "images/marketing-design-3.png", "#d7ac63"],
  ] as const;
  const segment = 100;
  return (
    <Scene duration={330}>
      <AbsoluteFill style={{ background: BLACK, color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", zIndex: 5, left: 64, right: 64, top: 105, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: RED_BRIGHT, fontSize: 20, fontWeight: 950, letterSpacing: 4 }}>ONE PLAYER · THREE DESIGNS</div><div style={{ marginTop: 17, fontSize: 56, lineHeight: 1, fontWeight: 950, letterSpacing: -3 }}>Pick your look.</div></div>
          <Brand compact />
        </div>
        {items.map(([title, src, accent], index) => {
          const local = frame - index * segment;
          const opacity = interpolate(local, [-12, 5, 86, 103], [0, 1, 1, 0], clamp);
          const x = interpolate(local, [-12, 8, 84, 103], [850, 0, 0, -850], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          const scale = interpolate(local, [0, 80], [0.96, 1.015], clamp);
          return (
            <div key={title} style={{ position: "absolute", inset: "290px 0 0", opacity, transform: `translateX(${x}px) scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Phone src={src} height={1240} />
              <div style={{ marginTop: 42, color: accent, fontSize: 28, fontWeight: 950, letterSpacing: 5 }}>{title}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 125, display: "flex", justifyContent: "center", gap: 14 }}>
          {items.map((item, index) => {
            const active = Math.min(2, Math.floor(frame / segment)) === index;
            return <span key={item[0]} style={{ width: active ? 72 : 20, height: 8, borderRadius: 99, background: active ? item[2] : "rgba(255,255,255,.2)" }} />;
          })}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

export function MetaAdThreeDesigns() {
  return (
    <AbsoluteFill style={{ background: BLACK, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Soundtrack />
      <Sequence from={0} durationInFrames={145}><NotGenericHook /></Sequence>
      <Sequence from={128} durationInFrames={330}><DesignCarousel /></Sequence>
      <Sequence from={440} durationInFrames={160}><Cta duration={160} eyebrow="CHOOSE YOUR DESIGN" /></Sequence>
    </AbsoluteFill>
  );
}

export const metaAdConfig = { fps: FPS, durationInFrames: META_AD_FRAMES };
