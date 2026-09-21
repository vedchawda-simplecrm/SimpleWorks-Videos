import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND_BLUE,
  BRAND_BLUE_SOFT,
  COMPOSER_BORDER,
  COMPOSER_CHIP,
  COMPOSER_FILL,
  FONT,
  SCREEN_BG,
  SEND_CORAL,
  TEXT_ON_DARK,
  TEXT_ON_DARK_MUTED,
} from "../theme";
import { PreviewAudio } from "../components/PreviewAudio";

// Shot timing (30fps, 240 frames / 8s)
const STACK_IN = [10, 34] as const;
// Which card is in front, as a continuous value so the stack slides.
const ACTIVE_FRAMES = [0, 70, 92, 152, 174, 240];
const ACTIVE_VALUES = [0, 0, 1, 1, 2, 2];
const CAPTION_IN = 196;

const CARD_WIDTH = 1180;
const CARD_HEIGHT = 300;
const FRONT_LEFT = (1920 - CARD_WIDTH) / 2;
const FRONT_TOP = 420;

const CARDS = [
  {
    category: "Marketing",
    question:
      "Which leads from last month's campaign are still unqualified?",
  },
  {
    category: "Service",
    question: "Show me all open cases assigned to me, sorted by priority.",
  },
  {
    category: "Sales",
    question:
      "Show my active opportunities with amount, stage and expected close date.",
  },
];

const PromptCard: React.FC<{ question: string; dim: number }> = ({
  question,
  dim,
}) => (
  <div
    style={{
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      boxSizing: "border-box",
      padding: 40,
      borderRadius: 18,
      backgroundColor: COMPOSER_FILL,
      border: `1px solid ${COMPOSER_BORDER}`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: FONT,
    }}
  >
    {/* Cards behind are darkened rather than made transparent, so the
        stack never shows one card's text through another. */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        backgroundColor: SCREEN_BG,
        opacity: dim,
        zIndex: 2,
      }}
    />
    <div
      style={{
        fontSize: 36,
        lineHeight: 1.45,
        fontWeight: 400,
        color: "#ECECEC",
      }}
    >
      {question}
    </div>

    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ fontSize: 34, color: TEXT_ON_DARK_MUTED, marginRight: 24 }}>
        +
      </div>
      <div
        style={{
          padding: "8px 20px",
          borderRadius: 9,
          backgroundColor: COMPOSER_CHIP,
          color: TEXT_ON_DARK,
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Chat
      </div>
      <div
        style={{
          marginLeft: 18,
          fontSize: 24,
          fontWeight: 500,
          color: TEXT_ON_DARK_MUTED,
        }}
      >
        Cowork
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 24, fontWeight: 600, color: "#D8D8D8" }}>
        Sonnet 5
      </div>
      <div
        style={{
          marginLeft: 12,
          fontSize: 24,
          fontWeight: 500,
          color: TEXT_ON_DARK_MUTED,
        }}
      >
        Medium
      </div>
      <div
        style={{
          marginLeft: 26,
          width: 54,
          height: 54,
          borderRadius: 13,
          backgroundColor: SEND_CORAL,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        ↑
      </div>
    </div>
  </div>
);

export const OpportunityQuestionsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingProgress = spring({
    frame: frame - 4,
    fps,
    config: { damping: 200, stiffness: 110, mass: 0.8 },
  });
  const headingOpacity = interpolate(headingProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingRise = interpolate(headingProgress, [0, 1], [16, 0]);

  const stackOpacity = interpolate(frame, STACK_IN, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeProgress = interpolate(frame, ACTIVE_FRAMES, ACTIVE_VALUES, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const layers = CARDS.map((card, index) => {
    const depth = index - activeProgress;
    const behind = Math.max(depth, 0);
    const left = FRONT_LEFT + behind * 40;
    const top = FRONT_TOP + (depth >= 0 ? behind * 108 : depth * 150);
    const scale = 1 - behind * 0.045;
    const opacity =
      depth >= 0
        ? interpolate(depth, [2, 2.6], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(depth, [-0.85, 0], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
    const dim = interpolate(Math.max(depth, 0), [0, 1, 2], [0, 0.55, 0.74], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const badgeOpacity = interpolate(
      Math.abs(depth),
      [0, 0.45],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return { card, index, depth, left, top, scale, opacity, badgeOpacity, dim };
  }).sort((a, b) => b.depth - a.depth);

  return (
    <AbsoluteFill style={{ backgroundColor: SCREEN_BG }}>
      <PreviewAudio track="audio-OpportunityQuestionsScene" />
      {/* One tick as each new category is brought to the front */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 176,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 50,
          color: TEXT_ON_DARK,
          opacity: headingOpacity,
          transform: `translateY(${headingRise}px)`,
        }}
      >
        Ask more of your <span style={{ color: BRAND_BLUE_SOFT }}>SimpleCRM</span>{" "}
        data
      </div>

      <div style={{ opacity: stackOpacity }}>
        {layers.map(({ card, index, left, top, scale, opacity, badgeOpacity, dim }) => (
          <div key={index}>
            <div
              style={{
                position: "absolute",
                left,
                top,
                opacity,
                transform: `scale(${scale})`,
                transformOrigin: "left top",
              }}
            >
              <PromptCard question={card.question} dim={dim} />
            </div>

            <div
              style={{
                position: "absolute",
                left: left - 14,
                top: top - 74,
                display: "flex",
                alignItems: "center",
                gap: 16,
                height: 68,
                padding: "0 26",
                paddingLeft: 26,
                paddingRight: 26,
                borderRadius: 999,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
                opacity: badgeOpacity,
                transform: `scale(${scale})`,
                transformOrigin: "left top",
              }}
            >
              <Img
                src={staticFile("assets/svg/simplecrm-logo.svg")}
                style={{ height: 30, width: "auto" }}
              />
              <div style={{ width: 1, height: 30, backgroundColor: "#D5D9DE" }} />
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: 30,
                  color: BRAND_BLUE,
                }}
              >
                {card.category}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 950,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 28,
          color: TEXT_ON_DARK_MUTED,
          opacity: interpolate(frame, [CAPTION_IN, CAPTION_IN + 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Suggested questions for your connected CRM
      </div>
    </AbsoluteFill>
  );
};
