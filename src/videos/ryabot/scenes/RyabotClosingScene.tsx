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
import { AnswerCards } from "../AnswerCards";
import { QuestionCard } from "../QuestionCard";
import { RyabotCharacter } from "../RyabotCharacter";
import { RyabotStage } from "../RyabotStage";
import {
  CAMERA_ORIGIN,
  CLOSING_FROM,
  STAGE,
  STAGE_CLOSE,
  cameraPush,
} from "../layout";
import { question } from "../ryabotData";
import { FONT, INK, INK_MUTED, SAFFRON } from "../theme";

// 120 frames / 4s at 30fps. The answer clears, the character walks into the
// middle and the spot signs off.
const CLEAR_END = 20;
const MOVE_START = 10;
const MOVE_END = 54;
const TAGLINE_START = 52;
const LOGO_START = 70;

export const RyabotClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absFrame = CLOSING_FROM + frame;

  const clear = interpolate(frame, [0, CLEAR_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const move = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const cx = interpolate(move, [0, 1], [STAGE.cx, STAGE_CLOSE.cx]);
  const cy = interpolate(move, [0, 1], [STAGE.cy, STAGE_CLOSE.cy]);
  const size = interpolate(move, [0, 1], [STAGE.size, STAGE_CLOSE.size]);

  const rise = (start: number) =>
    interpolate(
      spring({
        frame: frame - start,
        fps,
        config: { damping: 200, stiffness: 110, mass: 0.8 },
      }),
      [0, 1],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  const taglineIn = rise(TAGLINE_START);
  const logoIn = rise(LOGO_START);

  return (
    <RyabotStage>
      <PreviewAudio track="audio-RyabotClosingScene" />
      {/* The push is frozen at the value the answer shot ended on: pulling
          back out here would read as a zoom-out bounce. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraPush(CLOSING_FROM)})`,
          transformOrigin: CAMERA_ORIGIN,
        }}
      >
        <QuestionCard lift={1} opacity={clear}>
          {question}
        </QuestionCard>
        <AnswerCards enterAt={() => 1} opacity={clear} />

        <RyabotCharacter
          absFrame={absFrame}
          blend={0}
          cx={cx}
          cy={cy}
          size={size}
          glow={interpolate(move, [0, 1], [1, 1.25])}
        />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 738,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 92,
            lineHeight: 1,
            color: INK,
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [24, 0])}px)`,
          }}
        >
          Just <span style={{ color: SAFFRON }}>ask</span>.
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 866,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: logoIn,
            transform: `translateY(${interpolate(logoIn, [0, 1], [16, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: 0.4,
              color: INK_MUTED,
            }}
          >
            ryabot is built into
          </div>
          <Img
            src={staticFile("assets/svg/simplecrm-logo.svg")}
            style={{ width: 300, height: "auto" }}
          />
        </div>
      </div>
    </RyabotStage>
  );
};
