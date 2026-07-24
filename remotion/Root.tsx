import { Composition } from "remotion";
import { MarketingVideo, marketingVideoConfig } from "./MarketingVideo";
import { MetaAdFirstLook, MetaAdOneLink, MetaAdThreeDesigns, metaAdConfig } from "./MetaAds";
import {
  RecruitingEasyToShare,
  RecruitingFilmChecklist,
  RecruitingFirstMessage,
  RecruitingProfileAudit,
  RecruitingStayCurrent,
  educationalVideoConfig,
} from "./EducationalVideos";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="DiamondProfile-Landscape"
        component={MarketingVideo}
        durationInFrames={marketingVideoConfig.durationInFrames}
        fps={marketingVideoConfig.fps}
        width={1920}
        height={1080}
        defaultProps={{ vertical: false }}
      />
      <Composition
        id="DiamondProfile-Vertical"
        component={MarketingVideo}
        durationInFrames={marketingVideoConfig.durationInFrames}
        fps={marketingVideoConfig.fps}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
      <Composition
        id="MetaAd-FirstLook"
        component={MetaAdFirstLook}
        durationInFrames={metaAdConfig.durationInFrames}
        fps={metaAdConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="MetaAd-OneLink"
        component={MetaAdOneLink}
        durationInFrames={metaAdConfig.durationInFrames}
        fps={metaAdConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="MetaAd-ThreeDesigns"
        component={MetaAdThreeDesigns}
        durationInFrames={metaAdConfig.durationInFrames}
        fps={metaAdConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="Recruiting-FirstMessage"
        component={RecruitingFirstMessage}
        durationInFrames={educationalVideoConfig.durationInFrames}
        fps={educationalVideoConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="Recruiting-ProfileAudit"
        component={RecruitingProfileAudit}
        durationInFrames={educationalVideoConfig.durationInFrames}
        fps={educationalVideoConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="Recruiting-FilmChecklist"
        component={RecruitingFilmChecklist}
        durationInFrames={educationalVideoConfig.durationInFrames}
        fps={educationalVideoConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="Recruiting-StayCurrent"
        component={RecruitingStayCurrent}
        durationInFrames={educationalVideoConfig.durationInFrames}
        fps={educationalVideoConfig.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="Recruiting-EasyToShare"
        component={RecruitingEasyToShare}
        durationInFrames={educationalVideoConfig.durationInFrames}
        fps={educationalVideoConfig.fps}
        width={1080}
        height={1920}
      />
    </>
  );
}
