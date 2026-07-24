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

const FPS = 30;
const DURATION = 600;
const INK = "#070709";
const PAPER = "#f6f3ed";
const WHITE = "#fffdf9";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

type LessonKind = "message" | "audit" | "film" | "update" | "share";

type Lesson = {
  number: string;
  kind: LessonKind;
  accent: string;
  title: string;
  subtitle: string;
  points: string[];
  takeaway: string;
  exampleLabel: string;
  example: string;
  image: string;
  cta: string;
};

const lessons: Record<LessonKind, Lesson> = {
  message: {
    number: "1",
    kind: "message",
    accent: "#ed172c",
    title: "DON’T SEND A LINK\nWITH NO CONTEXT.",
    subtitle: "Give a coach a clear reason to open it.",
    points: ["Who you are", "Why you’re reaching out", "One clear next step"],
    takeaway: "Short. Specific. Easy to answer.",
    exampleLabel: "A CLEARER FIRST MESSAGE",
    example: "Coach Rivera — I’m Mason Carter, a 2027 RHP from Atlanta. I’m interested in your program. Would you be open to taking a look?",
    image: "images/marketing-design-1.png",
    cta: "SEND A CLEARER\nINTRODUCTION.",
  },
  audit: {
    number: "2",
    kind: "audit",
    accent: "#ff3347",
    title: "AUDIT YOUR PROFILE\nBEFORE SHARING IT.",
    subtitle: "A five-minute check can remove avoidable friction.",
    points: ["Current player details", "Film that plays", "Correct contact information"],
    takeaway: "Open every link. Read every field.",
    exampleLabel: "THE FINAL CHECK",
    example: "View it on your phone, confirm the season and grad year, then test the profile link one more time.",
    image: "images/marketing-design-2.png",
    cta: "CHECK IT. THEN\nSHARE IT.",
  },
  film: {
    number: "3",
    kind: "film",
    accent: "#f2b84b",
    title: "YOUR FIRST CLIP\nHAS ONE JOB.",
    subtitle: "Make the player and the play easy to understand.",
    points: ["Lead with a strong rep", "Identify the player quickly", "Trim unnecessary dead time"],
    takeaway: "Clarity earns the next clip.",
    exampleLabel: "FILM CHECKLIST",
    example: "Can someone identify the player, understand the play, and move to the next clip without guessing?",
    image: "images/marketing-design-3.png",
    cta: "MAKE YOUR FILM\nEASY TO FOLLOW.",
  },
  update: {
    number: "4",
    kind: "update",
    accent: "#55d7a0",
    title: "OUTDATED INFO\nCREATES EXTRA WORK.",
    subtitle: "Keep the profile aligned with the player you are now.",
    points: ["Add meaningful new film", "Refresh verified stats", "Confirm team and contact details"],
    takeaway: "Small updates keep the story current.",
    exampleLabel: "A SIMPLE ROUTINE",
    example: "Set a recurring reminder during the season and update only what has actually changed.",
    image: "images/marketing-hero.png",
    cta: "KEEP YOUR STORY\nCURRENT.",
  },
  share: {
    number: "5",
    kind: "share",
    accent: "#7ca9ff",
    title: "MAKE YOUR PROFILE\nEASY TO SHARE.",
    subtitle: "Organization helps your information travel clearly.",
    points: ["One reliable link", "Clear player identity", "Readable on a phone"],
    takeaway: "One place. Less searching. More clarity.",
    exampleLabel: "THE SHARE TEST",
    example: "If your link is forwarded without your original message, can the next person still understand who you are?",
    image: "images/marketing-design-3.png",
    cta: "GIVE THEM ONE\nORGANIZED LINK.",
  },
};

function reveal(frame: number, delay = 0, distance = 55) {
  const progress = spring({ frame: frame - delay, fps: FPS, config: { damping: 18, stiffness: 135, mass: 0.82 } });
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

function Texture({ dark = true }: { dark?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        opacity: dark ? 0.1 : 0.08,
        backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)"} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        maskImage: "linear-gradient(to bottom, black, transparent 90%)",
      }}
    />
  );
}

function Grain() {
  return (
    <AbsoluteFill
      style={{
        opacity: 0.055,
        mixBlendMode: "soft-light",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitchTiles'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 17, color: dark ? INK : WHITE }}>
      <Img src={staticFile("diamond-profile-logo.png")} style={{ width: 67, height: 67, objectFit: "contain" }} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: 2 }}>DIAMOND PROFILE</div>
        <div style={{ marginTop: 5, fontSize: 12, fontWeight: 800, letterSpacing: 3, opacity: 0.48 }}>RECRUITING PLAYBOOK</div>
      </div>
    </div>
  );
}

function Phone({ src, accent, style }: { src: string; accent: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: 535, height: 1160, padding: 7, borderRadius: 58, border: "3px solid rgba(255,255,255,.24)", background: "#111114", boxShadow: `0 50px 130px rgba(0,0,0,.62), 0 0 85px ${accent}2f`, overflow: "hidden", ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 49, overflow: "hidden", background: INK }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
}

function HookScene({ lesson }: { lesson: Lesson }) {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [2, 45], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Scene duration={125}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 16%, ${lesson.accent}46 0%, transparent 35%), ${INK}`, color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", top: 116, left: 62, ...reveal(frame, 0, 25) }}><Brand /></div>
        <div style={{ position: "absolute", top: 325, left: 0, width: `${line}%`, height: 7, background: lesson.accent }} />
        <div style={{ position: "absolute", top: 370, left: 62, right: 62 }}>
          <div style={{ color: lesson.accent, fontSize: 23, fontWeight: 950, letterSpacing: 5, ...reveal(frame, 5, 25) }}>PLAYBOOK {lesson.number} OF 5</div>
          <div style={{ marginTop: 45, whiteSpace: "pre-line", fontSize: 98, lineHeight: 0.92, fontWeight: 950, letterSpacing: -6.5, ...reveal(frame, 11, 70) }}>{lesson.title}</div>
          <div style={{ marginTop: 55, maxWidth: 850, color: "rgba(255,253,249,.62)", fontSize: 32, lineHeight: 1.35, fontWeight: 700, ...reveal(frame, 25, 35) }}>{lesson.subtitle}</div>
        </div>
        <div style={{ position: "absolute", right: -8, bottom: -160, color: lesson.accent, opacity: 0.12, fontSize: 680, lineHeight: 1, fontWeight: 950, letterSpacing: -55 }}>{lesson.number}</div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function PointCard({ text, index, frame, accent }: { text: string; index: number; frame: number; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "28px 30px", border: "1px solid rgba(7,7,9,.13)", borderRadius: 20, background: index === 0 ? INK : "rgba(255,255,255,.7)", color: index === 0 ? WHITE : INK, boxShadow: "0 16px 45px rgba(7,7,9,.08)", ...reveal(frame, 12 + index * 9, 42) }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 45, height: 45, borderRadius: 99, background: accent, color: INK, fontSize: 21, fontWeight: 950 }}>{index + 1}</span>
      <span style={{ fontSize: 29, fontWeight: 900 }}>{text}</span>
    </div>
  );
}

function MessageVisual({ lesson, frame }: { lesson: Lesson; frame: number }) {
  return (
    <div style={{ position: "absolute", left: 62, right: 62, top: 480 }}>
      <div style={{ marginLeft: 85, padding: "31px 35px", borderRadius: "30px 30px 8px 30px", background: INK, color: WHITE, boxShadow: "0 25px 65px rgba(0,0,0,.18)", ...reveal(frame, 8, 60) }}>
        <div style={{ color: lesson.accent, fontSize: 17, fontWeight: 950, letterSpacing: 3 }}>INTRODUCTION</div>
        <div style={{ marginTop: 16, fontSize: 29, lineHeight: 1.38, fontWeight: 700 }}>Coach Rivera — I’m Mason Carter, a 2027 RHP from Atlanta.</div>
      </div>
      <div style={{ marginTop: 20, marginRight: 110, padding: "31px 35px", borderRadius: "30px 30px 30px 8px", border: "2px solid rgba(7,7,9,.12)", background: WHITE, color: INK, ...reveal(frame, 19, 60) }}>
        <div style={{ color: lesson.accent, fontSize: 17, fontWeight: 950, letterSpacing: 3 }}>ONE LINK</div>
        <div style={{ marginTop: 16, fontSize: 28, fontWeight: 900 }}>diamondprofile.app/mason-carter</div>
      </div>
      <div style={{ marginTop: 20, marginLeft: 175, padding: "27px 33px", borderRadius: "30px 30px 8px 30px", background: lesson.accent, color: INK, boxShadow: "0 20px 55px rgba(0,0,0,.12)", ...reveal(frame, 30, 55) }}>
        <div style={{ fontSize: 17, fontWeight: 950, letterSpacing: 3 }}>CLEAR NEXT STEP</div>
        <div style={{ marginTop: 13, fontSize: 28, lineHeight: 1.35, fontWeight: 900 }}>Would you be open to taking a look?</div>
      </div>
    </div>
  );
}

function FilmVisual({ lesson, frame }: { lesson: Lesson; frame: number }) {
  const play = spring({ frame: frame - 10, fps: FPS, config: { damping: 16, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: 62, right: 62, top: 470, height: 570, borderRadius: 28, overflow: "hidden", background: INK, boxShadow: "0 30px 75px rgba(0,0,0,.22)", ...reveal(frame, 5, 70) }}>
      <Img src={staticFile(lesson.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 22%", opacity: 0.78 }} />
      <AbsoluteFill style={{ background: "linear-gradient(to top,rgba(7,7,9,.9),transparent 62%)" }} />
      <div style={{ position: "absolute", left: 53, top: 48, padding: "13px 18px", borderRadius: 99, background: lesson.accent, color: INK, fontSize: 16, fontWeight: 950, letterSpacing: 2 }}>PLAYER IDENTIFIED</div>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 108, height: 108, margin: "-54px", borderRadius: 99, background: "rgba(255,255,255,.92)", color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 43, paddingLeft: 7, transform: `scale(${play})` }}>▶</div>
      <div style={{ position: "absolute", left: 38, right: 38, bottom: 35 }}>
        <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.25)" }}><div style={{ width: "68%", height: "100%", borderRadius: 99, background: lesson.accent }} /></div>
        <div style={{ marginTop: 15, color: WHITE, fontSize: 17, fontWeight: 850, letterSpacing: 2 }}>STRONG REP · CLEAR MARKER · CLEAN EDIT</div>
      </div>
    </div>
  );
}

function UpdateVisual({ lesson, frame }: { lesson: Lesson; frame: number }) {
  const items = [["NOW", "New verified stats"], ["NEXT", "Meaningful new film"], ["ALWAYS", "Accurate contact details"]];
  return (
    <div style={{ position: "absolute", left: 75, right: 75, top: 455 }}>
      <div style={{ position: "absolute", left: 29, top: 40, bottom: 40, width: 3, background: "rgba(7,7,9,.13)" }} />
      {items.map(([label, text], index) => (
        <div key={label} style={{ position: "relative", display: "grid", gridTemplateColumns: "62px 1fr", gap: 27, alignItems: "center", marginBottom: 31, ...reveal(frame, 8 + index * 12, 50) }}>
          <div style={{ zIndex: 1, width: 62, height: 62, borderRadius: 99, border: `4px solid ${lesson.accent}`, background: PAPER, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 22, height: 22, borderRadius: 99, background: lesson.accent }} /></div>
          <div style={{ borderRadius: 22, border: "1px solid rgba(7,7,9,.12)", background: WHITE, padding: "28px 30px", boxShadow: "0 18px 50px rgba(7,7,9,.07)" }}>
            <div style={{ color: lesson.accent, fontSize: 15, fontWeight: 950, letterSpacing: 3 }}>{label}</div>
            <div style={{ marginTop: 10, fontSize: 29, fontWeight: 900 }}>{text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShareVisual({ lesson, frame }: { lesson: Lesson; frame: number }) {
  const nodes = [["PLAYER", 70], ["COACH", 390], ["STAFF", 710]] as const;
  const path = interpolate(frame, [8, 68], [0, 100], clamp);
  return (
    <div style={{ position: "absolute", left: 62, right: 62, top: 465, height: 610 }}>
      <div style={{ position: "absolute", left: 150, top: 80, width: 6, height: `${path}%`, maxHeight: 470, background: `linear-gradient(${lesson.accent}, ${lesson.accent}22)` }} />
      {nodes.map(([label, top], index) => (
        <div key={label} style={{ position: "absolute", left: index === 1 ? 210 : 0, right: index === 1 ? 0 : 210, top, display: "flex", alignItems: "center", gap: 22, padding: "27px 30px", borderRadius: 22, background: index === 0 ? INK : WHITE, color: index === 0 ? WHITE : INK, border: "1px solid rgba(7,7,9,.13)", boxShadow: "0 20px 55px rgba(7,7,9,.1)", ...reveal(frame, 8 + index * 15, 55) }}>
          <span style={{ width: 17, height: 17, borderRadius: 99, background: lesson.accent }} />
          <span style={{ fontSize: 21, fontWeight: 950, letterSpacing: 3 }}>{label}</span>
          <span style={{ marginLeft: "auto", fontSize: 22, opacity: 0.5 }}>↗</span>
        </div>
      ))}
      <div style={{ position: "absolute", left: 145, right: 145, top: 280, padding: "18px 22px", borderRadius: 999, background: lesson.accent, color: INK, textAlign: "center", fontSize: 20, fontWeight: 950 }}>ONE RELIABLE LINK</div>
    </div>
  );
}

function CoreScene({ lesson }: { lesson: Lesson }) {
  const frame = useCurrentFrame();
  const usesCards = lesson.kind === "audit";
  return (
    <Scene duration={250}>
      <AbsoluteFill style={{ background: PAPER, color: INK }}>
        <Texture dark={false} />
        <div style={{ position: "absolute", left: 62, right: 62, top: 95 }}>
          <div style={{ color: lesson.accent, fontSize: 19, fontWeight: 950, letterSpacing: 4, ...reveal(frame, 0, 24) }}>THE PRACTICAL PLAY</div>
          <div style={{ marginTop: 22, maxWidth: 900, fontSize: 66, lineHeight: 0.98, fontWeight: 950, letterSpacing: -4.2, ...reveal(frame, 5, 38) }}>{lesson.takeaway}</div>
        </div>
        {lesson.kind === "message" && <MessageVisual lesson={lesson} frame={frame} />}
        {lesson.kind === "film" && <FilmVisual lesson={lesson} frame={frame} />}
        {lesson.kind === "update" && <UpdateVisual lesson={lesson} frame={frame} />}
        {lesson.kind === "share" && <ShareVisual lesson={lesson} frame={frame} />}
        {usesCards && <div style={{ position: "absolute", left: 62, right: 62, top: 490, display: "flex", flexDirection: "column", gap: 18 }}>{lesson.points.map((point, index) => <PointCard key={point} text={point} index={index} frame={frame} accent={lesson.accent} />)}</div>}
        <div style={{ position: "absolute", left: 62, right: 62, bottom: 105, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {lesson.points.map((point, index) => <div key={point} style={{ borderTop: `4px solid ${lesson.accent}`, paddingTop: 15, color: "rgba(7,7,9,.5)", fontSize: 15, lineHeight: 1.3, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", ...reveal(frame, 55 + index * 7, 24) }}>{point}</div>)}
        </div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function ExampleScene({ lesson }: { lesson: Lesson }) {
  const frame = useCurrentFrame();
  const phone = spring({ frame: frame - 3, fps: FPS, config: { damping: 20, stiffness: 105, mass: 0.9 } });
  return (
    <Scene duration={160}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 77% 24%, ${lesson.accent}3b, transparent 42%), ${INK}`, color: WHITE }}>
        <Texture />
        <div style={{ position: "absolute", zIndex: 4, left: 62, right: 450, top: 165 }}>
          <div style={{ color: lesson.accent, fontSize: 18, fontWeight: 950, letterSpacing: 4, ...reveal(frame, 3, 20) }}>{lesson.exampleLabel}</div>
          <div style={{ marginTop: 33, fontSize: 46, lineHeight: 1.16, fontWeight: 900, letterSpacing: -1.8, ...reveal(frame, 10, 42) }}>{lesson.example}</div>
          <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.16)", color: "rgba(255,253,249,.5)", fontSize: 19, lineHeight: 1.5, fontWeight: 700, ...reveal(frame, 24, 30) }}>Useful information builds trust when it is accurate, current, and easy to verify.</div>
        </div>
        <Phone src={lesson.image} accent={lesson.accent} style={{ position: "absolute", right: -155, top: 250, opacity: phone, transform: `translateY(${interpolate(phone, [0, 1], [180, 0])}px) rotate(3deg)` }} />
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function CtaScene({ lesson }: { lesson: Lesson }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.985, 1.015]);
  return (
    <Scene duration={105}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 28%, #f43b4e 0%, #b80819 42%, #340006 100%)", color: WHITE, alignItems: "center", textAlign: "center" }}>
        <Texture />
        <div style={{ position: "absolute", top: 150, ...reveal(frame, 0, 24) }}><Brand /></div>
        <div style={{ position: "absolute", left: 62, right: 62, top: 475 }}>
          <div style={{ color: "rgba(255,255,255,.68)", fontSize: 20, fontWeight: 950, letterSpacing: 5, ...reveal(frame, 4, 20) }}>SAVE THIS RECRUITING PLAY</div>
          <div style={{ marginTop: 38, whiteSpace: "pre-line", fontSize: 103, lineHeight: 0.9, fontWeight: 950, letterSpacing: -6.8, ...reveal(frame, 9, 55) }}>{lesson.cta}</div>
          <div style={{ display: "inline-flex", marginTop: 68, padding: "25px 40px", borderRadius: 999, background: WHITE, color: INK, fontSize: 28, fontWeight: 950, transform: `scale(${pulse})` }}>BUILD FREE · DIAMONDPROFILE.APP</div>
          <div style={{ marginTop: 38, color: "rgba(255,255,255,.6)", fontSize: 18, lineHeight: 1.45, fontWeight: 700 }}>One organized place for film, stats, academics, contact information, and your story.</div>
        </div>
        <div style={{ position: "absolute", left: 62, right: 62, bottom: 70, color: "rgba(255,255,255,.42)", fontSize: 14, fontWeight: 700, letterSpacing: 1.1 }}>TOOLS FOR A CLEARER PROCESS · RECRUITING OUTCOMES ARE NEVER GUARANTEED</div>
        <Grain />
      </AbsoluteFill>
    </Scene>
  );
}

function Soundtrack({ accent }: { accent: string }) {
  return (
    <>
      <Audio src={staticFile("audio/diamond-profile-promo.mp3")} volume={(frame) => interpolate(frame, [0, 12, DURATION - 35, DURATION - 1], [0, 0.76, 0.76, 0], clamp)} />
      <AbsoluteFill style={{ pointerEvents: "none", boxShadow: `inset 0 0 0 2px ${accent}2a` }} />
    </>
  );
}

function EducationalVideo({ kind }: { kind: LessonKind }) {
  const lesson = lessons[kind];
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Soundtrack accent={lesson.accent} />
      <Sequence from={0} durationInFrames={125}><HookScene lesson={lesson} /></Sequence>
      <Sequence from={112} durationInFrames={250}><CoreScene lesson={lesson} /></Sequence>
      <Sequence from={350} durationInFrames={160}><ExampleScene lesson={lesson} /></Sequence>
      <Sequence from={495} durationInFrames={105}><CtaScene lesson={lesson} /></Sequence>
    </AbsoluteFill>
  );
}

export const RecruitingFirstMessage = () => <EducationalVideo kind="message" />;
export const RecruitingProfileAudit = () => <EducationalVideo kind="audit" />;
export const RecruitingFilmChecklist = () => <EducationalVideo kind="film" />;
export const RecruitingStayCurrent = () => <EducationalVideo kind="update" />;
export const RecruitingEasyToShare = () => <EducationalVideo kind="share" />;

export const educationalVideoConfig = { fps: FPS, durationInFrames: DURATION };
