import { Composition } from "remotion";
import { MarketingVideo } from "./MarketingVideo";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="DiamondPortfolio-Landscape"
        component={MarketingVideo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ vertical: false }}
      />
      <Composition
        id="DiamondPortfolio-Vertical"
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
