import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const red = "#ef4444";
const green = "#172018";
const white = "#f7f7f4";

function Fade({ children, start, end }: { children: React.ReactNode; start: number; end: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 14, end - 14, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity, width: "100%", height: "100%" }}>{children}</div>;
}

function Brand({ size = 140 }: { size?: number }) {
  return <Img src={staticFile("diamond-profile-logo.png")} style={{ width: size, height: size, objectFit: "contain" }} />;
}

export function MarketingVideo({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const side = vertical ? 74 : 120;
  const title = vertical ? 94 : 108;
  const imageScale = interpolate(frame, [0, 450], [1.04, 1.12], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: green, color: white, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={125}>
        <Fade start={0} end={125}>
          <AbsoluteFill>
            <Img src={staticFile("images/baseball-hero-no-people.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: vertical ? "66% center" : "center", transform: `scale(${imageScale})` }} />
            <AbsoluteFill style={{ background: vertical ? "linear-gradient(0deg, rgba(10,15,11,.96) 0%, rgba(10,15,11,.22) 70%)" : "linear-gradient(90deg, rgba(10,15,11,.96), rgba(10,15,11,.1))" }} />
            <div style={{ position: "absolute", left: side, right: side, top: vertical ? 110 : 80 }}><Brand size={vertical ? 180 : 140} /></div>
            <div style={{ position: "absolute", left: side, right: side, bottom: vertical ? 170 : 105 }}>
              <p style={{ margin: 0, color: "#fca5a5", fontSize: vertical ? 28 : 24, fontWeight: 800, letterSpacing: 3 }}>ONE LINK. YOUR WHOLE GAME.</p>
              <h1 style={{ margin: "22px 0 0", maxWidth: vertical ? 850 : 980, fontSize: title, lineHeight: .92, letterSpacing: 0 }}>Baseball player portfolio websites</h1>
            </div>
          </AbsoluteFill>
        </Fade>
      </Sequence>

      <Sequence from={110} durationInFrames={125}>
        <Fade start={0} end={125}>
          <AbsoluteFill style={{ background: white, color: "#171717", padding: side, justifyContent: "center" }}>
            <p style={{ color: red, fontSize: 26, fontWeight: 800, letterSpacing: 3, margin: 0 }}>EVERYTHING A COACH NEEDS</p>
            <h2 style={{ fontSize: vertical ? 88 : 92, lineHeight: .98, maxWidth: 1300, margin: "24px 0 60px" }}>Film, stats, academics, and contact details in one clean place.</h2>
            <div style={{ display: "grid", gridTemplateColumns: vertical ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: 12 }}>
              {[[0.347,"AVG"],[0.429,"OBP"],[0.518,"SLG"],[5,"HR"],[31,"RBI"],[14,"SB"]].map(([value,label], index) => {
                const scale = spring({ frame: frame - 130 - index * 4, fps, config: { damping: 16 } });
                return <div key={label} style={{ transform: `scale(${scale})`, background: green, color: white, borderRadius: 8, padding: vertical ? "34px 8px" : "28px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: vertical ? 42 : 40, fontWeight: 900 }}>{value}</div><div style={{ marginTop: 8, color: "rgba(255,255,255,.5)", fontSize: 17 }}>{label}</div>
                </div>;
              })}
            </div>
          </AbsoluteFill>
        </Fade>
      </Sequence>

      <Sequence from={220} durationInFrames={135}>
        <Fade start={0} end={135}>
          <AbsoluteFill style={{ background: green, padding: side, justifyContent: "center" }}>
            <p style={{ color: "#fca5a5", fontSize: 26, fontWeight: 800, letterSpacing: 3, margin: 0 }}>BUILD IT FROM YOUR PHONE</p>
            <h2 style={{ fontSize: vertical ? 88 : 92, lineHeight: .98, margin: "24px 0 58px", maxWidth: 1250 }}>From first photo to live portfolio in three simple steps.</h2>
            <div style={{ display: "grid", gridTemplateColumns: vertical ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
              {[["01","Add the basics"],["02","Upload film and photos"],["03","Preview and publish"]].map(([number,label], index) => {
                const x = interpolate(frame, [238 + index * 7, 260 + index * 7], [vertical ? 0 : 90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const opacity = interpolate(frame, [238 + index * 7, 255 + index * 7], [0,1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return <div key={number} style={{ transform: `translateX(${x}px)`, opacity, borderTop: "2px solid rgba(255,255,255,.7)", padding: vertical ? "26px 0" : "28px 0" }}>
                  <div style={{ color: "#fca5a5", fontSize: 22 }}>{number}</div><div style={{ marginTop: 16, fontSize: vertical ? 40 : 34, fontWeight: 800 }}>{label}</div>
                </div>;
              })}
            </div>
          </AbsoluteFill>
        </Fade>
      </Sequence>

      <Sequence from={340} durationInFrames={110}>
        <Fade start={0} end={110}>
          <AbsoluteFill style={{ background: red, padding: side, justifyContent: "center", alignItems: vertical ? "flex-start" : "center", textAlign: vertical ? "left" : "center" }}>
            <Brand size={vertical ? 190 : 150} />
            <h2 style={{ fontSize: vertical ? 104 : 110, lineHeight: .92, maxWidth: 1400, margin: "60px 0 28px" }}>Make your next introduction count.</h2>
            <p style={{ fontSize: vertical ? 38 : 32, margin: 0, opacity: .82 }}>Free, $15 Pro, or $25 Elite · Custom domain +$10</p>
            <div style={{ marginTop: 56, background: white, color: "#171717", borderRadius: 8, padding: "24px 38px", fontWeight: 900, fontSize: vertical ? 32 : 28 }}>START BUILDING TODAY</div>
          </AbsoluteFill>
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
}
