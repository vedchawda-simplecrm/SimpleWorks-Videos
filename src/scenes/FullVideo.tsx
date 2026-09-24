import { AbsoluteFill, Sequence } from "remotion";
import { InsideFullVideo, PreviewAudio } from "../components/PreviewAudio";
import { IntroScene } from "./IntroScene";
import { ConnectorScene } from "./ConnectorScene";
import { OpportunityPromptScene } from "./OpportunityPromptScene";
import { OpportunityInsightsScene } from "./OpportunityInsightsScene";
import { OpportunityQuestionsScene } from "./OpportunityQuestionsScene";
import { ClosingScene } from "./ClosingScene";

// Master timeline (30fps, 1485 frames / 49.5s). Each scene is bounded by
// its own Sequence so nothing bleeds outside its shot.
export const SCENE_LAYOUT = [
  { from: 0, duration: 240, Component: IntroScene },
  { from: 240, duration: 195, Component: ConnectorScene },
  { from: 435, duration: 270, Component: OpportunityPromptScene },
  { from: 705, duration: 420, Component: OpportunityInsightsScene },
  { from: 1125, duration: 240, Component: OpportunityQuestionsScene },
  { from: 1365, duration: 120, Component: ClosingScene },
] as const;

export const FULL_VIDEO_DURATION = 1485;

export const FullVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000"
      }}
      from={-15}
    >
      {/* One continuous track for the whole cut, so the music never
          restarts at a scene boundary. The scenes' own per-scene tracks are
          suppressed by the context below. Renders stay silent either way -
          the track is muxed in by scripts/build-audio-track.mjs. */}
      <PreviewAudio track="full-audio" always />

      <InsideFullVideo.Provider value={true}>
        {SCENE_LAYOUT.map(({ from, duration, Component }) => (
          <Sequence key={from} from={from} durationInFrames={duration}>
            <Component />
          </Sequence>
        ))}
      </InsideFullVideo.Provider>
    </AbsoluteFill>
  );
};
