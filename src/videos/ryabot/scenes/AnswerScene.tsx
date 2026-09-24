import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PreviewAudio } from "../../../components/PreviewAudio";
import { AnswerCards } from "../AnswerCards";
import { QuestionCard } from "../QuestionCard";
import { RyabotCharacter } from "../RyabotCharacter";
import { RyabotStage } from "../RyabotStage";
import { ANSWER_FROM, CAMERA_ORIGIN, STAGE, cameraPush } from "../layout";
import { question } from "../ryabotData";

// 210 frames / 7s at 30fps. Opens on the meditating pose the previous shot
// ended on, so the Sequence boundary is invisible.
const POSE_BACK_START = 12;
const POSE_BACK_END = 34;
const LIFT_START = 8;
const LIFT_END = 40;
const CARDS_START = 44;
const CARD_STAGGER = 18;

export const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absFrame = ANSWER_FROM + frame;

  const blend = interpolate(frame, [POSE_BACK_START, POSE_BACK_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // The question shrinks up out of the way to make room for the answer.
  // It starts exactly where AskScene left it.
  const lift = interpolate(frame, [LIFT_START, LIFT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <RyabotStage>
      <PreviewAudio track="audio-RyabotAnswerScene" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraPush(absFrame)})`,
          transformOrigin: CAMERA_ORIGIN,
        }}
      >
        <RyabotCharacter
          absFrame={absFrame}
          blend={blend}
          cx={STAGE.cx}
          cy={STAGE.cy}
          size={STAGE.size}
          glow={1 + blend * 0.35}
        />

        <QuestionCard lift={lift}>{question}</QuestionCard>

        <AnswerCards
          enterAt={(i) =>
            spring({
              frame: frame - CARDS_START - i * CARD_STAGGER,
              fps,
              config: { damping: 200, stiffness: 120, mass: 0.7 },
            })
          }
        />
      </div>
    </RyabotStage>
  );
};
