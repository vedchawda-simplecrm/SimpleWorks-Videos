import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PreviewAudio } from "../../../components/PreviewAudio";
import { RyabotCharacter } from "../RyabotCharacter";
import { RyabotStage } from "../RyabotStage";
import { ASK_FROM, CAMERA_ORIGIN, STAGE, cameraPush } from "../layout";
import { QuestionCard } from "../QuestionCard";
import { question } from "../ryabotData";
import { FONT, INK_MUTED, SAFFRON } from "../theme";

// 180 frames / 6s at 30fps.
const CARD_START = 6;
const TYPE_START = 16;
const TYPE_END = 88;
const POSE_START = 92;
const POSE_END = 116;
const THINK_LABEL = 104;

export const AskScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absFrame = ASK_FROM + frame;

  const card = spring({
    frame: frame - CARD_START,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.7 },
  });
  const cardOpacity = interpolate(card, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typed at a steady, human rate rather than eased, so it does not appear
  // to speed up and stall.
  const chars = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, question.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = question.slice(0, chars);
  const typing = frame >= TYPE_START && frame < TYPE_END;
  const caret = typing && Math.floor(frame / 8) % 2 === 0;

  // The character settles into the meditating pose once the question lands.
  const blend = interpolate(frame, [POSE_START, POSE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const label = interpolate(frame, [THINK_LABEL, THINK_LABEL + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calm rings breathing outward while it thinks.
  const rings = [0, 1, 2].map((k) => {
    const t = ((frame - POSE_START) / 60 + k / 3) % 1;
    if (frame < POSE_START) return { t: 0, on: false };
    return { t, on: true };
  });

  const push = cameraPush(absFrame);

  return (
    <RyabotStage>
      <PreviewAudio track="audio-RyabotAskScene" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${push})`,
          transformOrigin: CAMERA_ORIGIN,
        }}
      >
        {rings.map(({ t, on }, k) =>
          on ? (
            <div
              key={k}
              style={{
                position: "absolute",
                left: STAGE.cx - STAGE.size * 0.5,
                top: STAGE.cy - STAGE.size * 0.5,
                width: STAGE.size,
                height: STAGE.size,
                borderRadius: "50%",
                border: `2px solid ${SAFFRON}`,
                opacity: interpolate(t, [0, 0.15, 1], [0, 0.3, 0]) * blend,
                transform: `scale(${interpolate(t, [0, 1], [0.78, 1.32])})`,
              }}
            />
          ) : null,
        )}

        <RyabotCharacter
          absFrame={absFrame}
          blend={blend}
          cx={STAGE.cx}
          cy={STAGE.cy}
          size={STAGE.size}
          glow={1 + blend * 0.35}
        />

        <QuestionCard
          opacity={cardOpacity}
          translateY={interpolate(card, [0, 1], [22, 0])}
        >
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 42,
              marginLeft: 4,
              verticalAlign: "-7px",
              backgroundColor: SAFFRON,
              opacity: caret ? 1 : 0,
            }}
          />
        </QuestionCard>

        <div
          style={{
            position: "absolute",
            left: STAGE.cx - 260,
            top: STAGE.cy + STAGE.size * 0.5,
            width: 520,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 500,
            color: INK_MUTED,
            opacity: label,
          }}
        >
          <span>ryabot is thinking</span>
          <span style={{ display: "flex", gap: 7, paddingBottom: 4 }}>
            {[0, 1, 2].map((k) => (
              <span
                key={k}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: SAFFRON,
                  opacity: interpolate(
                    (frame - THINK_LABEL + k * 6) % 30,
                    [0, 8, 16, 30],
                    [0.25, 1, 0.25, 0.25],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  ),
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </RyabotStage>
  );
};
