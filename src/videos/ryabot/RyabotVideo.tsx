import { AbsoluteFill, Sequence } from "remotion";
import { InsideFullVideo, PreviewAudio } from "../../components/PreviewAudio";
import { MeetScene } from "./scenes/MeetScene";
import { AskScene } from "./scenes/AskScene";
import { AnswerScene } from "./scenes/AnswerScene";
import { RyabotClosingScene } from "./scenes/RyabotClosingScene";
import {
  ANSWER_FROM,
  ASK_FROM,
  CLOSING_FROM,
  MEET_FROM,
  RYABOT_VIDEO_DURATION,
} from "./layout";

/**
 * The ryabot spot: a separate cut from the SimpleCRM x Claude video, with
 * its own compositions, palette and soundtrack. Nothing here is referenced
 * by FullVideo.
 *
 * Master timeline, 30fps, 660 frames / 22s. The offsets must stay in step
 * with layout.ts, which the scenes read to keep the idle float and camera
 * push continuous across these boundaries.
 */
// ids are written out rather than derived from Component.name, which a
// production bundle is free to mangle. They match the scene names in
// scripts/video-config.mjs, which is how the export script finds each
// scene's slice of the soundtrack.
export const RYABOT_SCENE_LAYOUT = [
  { id: "RyabotMeetScene", from: MEET_FROM, duration: 150, Component: MeetScene },
  { id: "RyabotAskScene", from: ASK_FROM, duration: 180, Component: AskScene },
  {
    id: "RyabotAnswerScene",
    from: ANSWER_FROM,
    duration: 210,
    Component: AnswerScene,
  },
  {
    id: "RyabotClosingScene",
    from: CLOSING_FROM,
    duration: 120,
    Component: RyabotClosingScene,
  },
] as const;

export { RYABOT_VIDEO_DURATION };

export const RyabotVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }}>
    {/* One continuous track for the whole cut. Renders stay silent either
        way - the track is muxed on by scripts/export-video.mjs. */}
    <PreviewAudio track="ryabot-audio" always />

    <InsideFullVideo.Provider value={true}>
      {RYABOT_SCENE_LAYOUT.map(({ from, duration, Component }) => (
        <Sequence key={from} from={from} durationInFrames={duration}>
          <Component />
        </Sequence>
      ))}
    </InsideFullVideo.Provider>
  </AbsoluteFill>
);
