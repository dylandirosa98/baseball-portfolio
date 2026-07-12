import { Composition } from "remotion";
import { MarketingVideo } from "./MarketingVideo";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="DiamondProfile-Landscape"
        component={MarketingVideo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ vertical: false }}
      />
      <Composition
        id="DiamondProfile-Vertical"
        component={MarketingVideo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
    </>
  );
}
