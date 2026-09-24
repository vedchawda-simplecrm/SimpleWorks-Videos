import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PreviewAudio } from "../../../components/PreviewAudio";
import { RyabotCharacter } from "../RyabotCharacter";
import { RyabotStage } from "../RyabotStage";
import {
  CAMERA_ORIGIN,
  COL_LEFT,
  COL_WIDTH,
  MEET_FROM,
  STAGE,
  cameraPush,
} from "../layout";
import { FONT, INK, INK_MUTED, SAFFRON } from "../theme";

// 150 frames / 5s at 30fps.
const CHAR_START = 4;
const LOGO_START = 26;
const HEADLINE_START = 38;
const SUB_START = 56;
// The column clears before the cut, so the next shot opens on an empty
// left-hand side rather than the title snapping out of frame.
const CLEAR_START = 126;
const CLEAR_END = 148;

export const MeetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absFrame = MEET_FROM + frame;

  const rise = (start: number, stiffness = 110) =>
    spring({
      frame: frame - start,
      fps,
      config: { damping: 200, stiffness, mass: 0.8 },
    });

  const presence = rise(CHAR_START, 90);
  const logo = rise(LOGO_START);
  const headline = rise(HEADLINE_START);
  const sub = rise(SUB_START);

  const fade = (p: number) =>
    interpolate(p, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const clear = interpolate(frame, [CLEAR_START, CLEAR_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const push = cameraPush(absFrame);

  return (
    <RyabotStage>
      <PreviewAudio track="audio-RyabotMeetScene" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${push})`,
          transformOrigin: CAMERA_ORIGIN,
        }}
      >
        <RyabotCharacter
          absFrame={absFrame}
          blend={0}
          cx={STAGE.cx}
          cy={STAGE.cy}
          size={STAGE.size}
          presence={presence}
        />

        <div
          style={{
            position: "absolute",
            left: COL_LEFT,
            top: 322,
            width: COL_WIDTH,
            fontFamily: FONT,
            opacity: clear,
            transform: `translateY(${interpolate(clear, [0, 1], [-18, 0])}px)`,
          }}
        >
          <Img
            src={staticFile("assets/svg/simplecrm-logo.svg")}
            style={{
              width: 258,
              height: "auto",
              opacity: fade(logo),
              transform: `translateY(${interpolate(logo, [0, 1], [14, 0])}px)`,
            }}
          />

          <div
            style={{
              marginTop: 34,
              fontWeight: 600,
              fontSize: 96,
              lineHeight: 1.05,
              color: INK,
              opacity: fade(headline),
              transform: `translateY(${interpolate(headline, [0, 1], [26, 0])}px)`,
            }}
          >
            Meet <span style={{ color: SAFFRON }}>ryabot</span>
          </div>

          <div
            style={{
              marginTop: 26,
              fontWeight: 400,
              fontSize: 36,
              lineHeight: 1.4,
              color: INK_MUTED,
              opacity: fade(sub),
              transform: `translateY(${interpolate(sub, [0, 1], [18, 0])}px)`,
            }}
          >
            The assistant that lives inside your CRM.
          </div>
        </div>
      </div>
    </RyabotStage>
  );
};
