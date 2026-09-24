import { Composition } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { ConnectorScene } from "./scenes/ConnectorScene";
import { OpportunityPromptScene } from "./scenes/OpportunityPromptScene";
import { OpportunityInsightsScene } from "./scenes/OpportunityInsightsScene";
import { OpportunityQuestionsScene } from "./scenes/OpportunityQuestionsScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { FullVideo, FULL_VIDEO_DURATION } from "./scenes/FullVideo";
import { RyabotVideo, RYABOT_SCENE_LAYOUT, RYABOT_VIDEO_DURATION } from "./videos/ryabot/RyabotVideo";
import {
  RyabotLoaderFull,
  RyabotLoaderIdle,
  RyabotLoaderIntro,
} from "./videos/ryabot/loader/RyabotLoader";
import {
  FULL_FRAMES,
  IDLE_FRAMES,
  INTRO_FRAMES,
  LOADER_SIZE,
} from "./videos/ryabot/loader/pose";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_IN_FRAMES = FPS * 8;
export const CONNECTOR_DURATION_IN_FRAMES = 195;
export const PROMPT_DURATION_IN_FRAMES = 270;
export const INSIGHTS_DURATION_IN_FRAMES = 420;
export const QUESTIONS_DURATION_IN_FRAMES = 240;
export const CLOSING_DURATION_IN_FRAMES = 120;

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="IntroScene"
        component={IntroScene}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ConnectorScene"
        component={ConnectorScene}
        durationInFrames={CONNECTOR_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="OpportunityPromptScene"
        component={OpportunityPromptScene}
        durationInFrames={PROMPT_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="OpportunityInsightsScene"
        component={OpportunityInsightsScene}
        durationInFrames={INSIGHTS_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="OpportunityQuestionsScene"
        component={OpportunityQuestionsScene}
        durationInFrames={QUESTIONS_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ClosingScene"
        component={ClosingScene}
        durationInFrames={CLOSING_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* R-YaBot AI-processing loader. Square, transparent background,
          rendered with an alpha codec - see npm run loader:webm. */}
      <Composition
        id="RyabotLoaderIntro"
        component={RyabotLoaderIntro}
        durationInFrames={INTRO_FRAMES}
        fps={FPS}
        width={LOADER_SIZE}
        height={LOADER_SIZE}
      />
      <Composition
        id="RyabotLoaderIdle"
        component={RyabotLoaderIdle}
        durationInFrames={IDLE_FRAMES}
        fps={FPS}
        width={LOADER_SIZE}
        height={LOADER_SIZE}
      />
      <Composition
        id="RyabotLoaderFull"
        component={RyabotLoaderFull}
        durationInFrames={FULL_FRAMES}
        fps={FPS}
        width={LOADER_SIZE}
        height={LOADER_SIZE}
      />

      {/* The ryabot spot - a separate cut, not part of FullVideo. */}
      {RYABOT_SCENE_LAYOUT.map(({ id, duration, Component }) => (
        <Composition
          key={id}
          id={id}
          component={Component}
          durationInFrames={duration}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
      <Composition
        id="RyabotVideo"
        component={RyabotVideo}
        durationInFrames={RYABOT_VIDEO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="FullVideo"
        component={FullVideo}
        durationInFrames={FULL_VIDEO_DURATION}
        fps={30}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
