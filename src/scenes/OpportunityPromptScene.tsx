import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  BRAND_BLUE,
  BRAND_BLUE_SOFT,
  CARD_PAD,
  CHART_CARD,
  COMPOSER_FILL,
  DISPLAY_HEIGHT,
  DISPLAY_TOP,
  DISPLAY_WIDTH,
  FONT,
  SCREEN_BG,
  SURFACE_BORDER,
  SURFACE_DARK,
  TEXT_ON_DARK_MUTED,
  shotX,
  shotY,
} from "../theme";
import { ClaudeSurface } from "../components/ClaudeSurface";
import { StageBarsChart } from "../components/StageBarsChart";
import {
  OPPORTUNITY_QUESTION,
  formatCurrency,
  opportunityData,
} from "../data/opportunityData";
import { PreviewAudio } from "../components/PreviewAudio";

// Shot timing (30fps, 270 frames / 9s)
const FADE_IN_END = 30;
const TYPE_START = 30;
const TYPE_END = 132;
const CURSOR_MOVE_START = 118;
const SEND_CLICK = 144;
const SUBMIT = 148;
// After submit the view changes - like the product does - rather than the
// camera pulling back off the composer.
const VIEW_SWAP = [150, 170] as const;
const CONVERSATION_IN = [158, 176] as const;
// Tool-use steps, revealed one after another while Claude works.
const THINKING_STEPS = [
  "Calling the SimpleCRM connector…",
  "Reading open opportunities for this month…",
  "Aggregating pipeline by stage and owner…",
  "Preparing charts…",
];
const STEP_START = 168;
const STEP_GAP = 17;
const THINKING_OUT = [234, 246] as const;
const ANSWER_START = 238;
const DURATION = 270;

// Composer geometry, pixel-measured from claude-prompt-send.png (1917x908):
// composer box x 740-1539, y 408-592; interior fill #20201F; the real Send
// button is the coral control at x 1491-1528, y 544-582.
const MASK_LEFT = shotX(742);
const MASK_TOP = shotY(412);
const MASK_WIDTH = shotX(1537) - MASK_LEFT;
const MASK_HEIGHT = shotY(528) - MASK_TOP;
const TEXT_LEFT = shotX(760);
const TEXT_TOP = shotY(424);
const TEXT_WIDTH = shotX(1520) - TEXT_LEFT;
const SEND_POINT = { x: shotX(1510), y: shotY(563) };
// Claude only shows Send once there is text, so the real button is covered
// until typing starts.
const SEND_COVER = {
  left: shotX(1486),
  top: shotY(538),
  width: shotX(1534) - shotX(1486),
  height: shotY(588) - shotY(538),
};
const COMPOSER_CENTER = {
  x: (shotX(740) + shotX(1539)) / 2,
  y: (shotY(408) + shotY(592)) / 2,
};

// Camera: one continuous push toward the composer, centred in frame. It
// never reverses - the plate simply hands over to the conversation view.
const CAMERA_FRAMES = [0, FADE_IN_END, 120, DURATION];
const CAMERA_SCALES = [1, 1, 1.72, 1.8];
const CAMERA_CENTERING = [0, 0, 1, 1];

export const OpportunityPromptScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, FADE_IN_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const typedChars = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, OPPORTUNITY_QUESTION.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    }),
  );
  const typedText = OPPORTUNITY_QUESTION.slice(0, typedChars);
  const caretVisible = frame < SUBMIT && Math.floor(frame / 8) % 2 === 0;
  const sendCoverOpacity = interpolate(
    frame,
    [TYPE_START + 4, TYPE_START + 14, SUBMIT, SUBMIT + 6],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // The composer empties the moment the message is sent.
  const composerTextOpacity = interpolate(frame, [SUBMIT, SUBMIT + 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cameraScale = interpolate(frame, CAMERA_FRAMES, CAMERA_SCALES, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const centering = interpolate(frame, CAMERA_FRAMES, CAMERA_CENTERING, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const centerShiftX = (960 - COMPOSER_CENTER.x) * centering;
  const centerShiftY = (540 - COMPOSER_CENTER.y) * centering;

  // The home-screen plate hands over to the conversation view.
  const plateOpacity = interpolate(frame, VIEW_SWAP, [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const conversationOpacity = interpolate(
    frame,
    [CONVERSATION_IN[0], CONVERSATION_IN[1]],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const cursorX = interpolate(
    frame,
    [CURSOR_MOVE_START, SEND_CLICK],
    [shotX(1240), SEND_POINT.x],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const cursorY = interpolate(
    frame,
    [CURSOR_MOVE_START, SEND_CLICK],
    [shotY(680), SEND_POINT.y],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const cursorOpacity = interpolate(
    frame,
    [CURSOR_MOVE_START - 12, CURSOR_MOVE_START, SEND_CLICK + 8, SEND_CLICK + 18],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pulseLocal = frame - SEND_CLICK;
  const showPulse = pulseLocal >= 0 && pulseLocal <= 18;
  const pulseRadius = interpolate(pulseLocal, [0, 18], [8, 44], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseOpacity = interpolate(pulseLocal, [0, 18], [0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Thinking state: steps appear one after another. The step in progress
  // shimmers; finished steps settle with a tick.
  const thinkingOpacity = interpolate(
    frame,
    [THINKING_OUT[0], THINKING_OUT[1]],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const markRotation = Math.max(0, frame - VIEW_SWAP[0]) * 2.2;

  // The chart is drawn exactly once, here, and is already complete when
  // OpportunityInsightsScene picks it up - so it must finish before this
  // scene ends rather than trailing off on a spring.
  const answerProgress = interpolate(frame, [ANSWER_START + 4, 264], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const answerOpacity = interpolate(
    frame,
    [ANSWER_START, ANSWER_START + 14],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: SCREEN_BG }}>
      <PreviewAudio track="audio-OpportunityPromptScene" />

      {/* Home-screen plate */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: fadeIn * plateOpacity,
          transform: `translate(${centerShiftX}px, ${centerShiftY}px) scale(${cameraScale})`,
          transformOrigin: `${(COMPOSER_CENTER.x / 1920) * 100}% ${(COMPOSER_CENTER.y / 1080) * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: DISPLAY_TOP,
            width: DISPLAY_WIDTH,
            height: DISPLAY_HEIGHT,
          }}
        >
          <Img
            src={staticFile("assets/images/claude-prompt-send.png")}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        </div>

        {/* Mask the real typed text, then retype it so it can animate */}
        <div
          style={{
            position: "absolute",
            left: MASK_LEFT,
            top: MASK_TOP,
            width: MASK_WIDTH,
            height: MASK_HEIGHT,
            backgroundColor: COMPOSER_FILL,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SEND_COVER.left,
            top: SEND_COVER.top,
            width: SEND_COVER.width,
            height: SEND_COVER.height,
            backgroundColor: COMPOSER_FILL,
            opacity: sendCoverOpacity,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: TEXT_LEFT,
            top: TEXT_TOP,
            width: TEXT_WIDTH,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 19,
            lineHeight: "28px",
            color: "#ECECEC",
            opacity: composerTextOpacity,
          }}
        >
          {typedText}
          <span
            style={{
              opacity: caretVisible && typedChars > 0 ? 1 : 0,
              color: BRAND_BLUE,
            }}
          >
            |
          </span>
        </div>

        {showPulse ? (
          <div
            style={{
              position: "absolute",
              left: cursorX - pulseRadius,
              top: cursorY - pulseRadius,
              width: pulseRadius * 2,
              height: pulseRadius * 2,
              borderRadius: "50%",
              border: `2px solid ${BRAND_BLUE}`,
              opacity: pulseOpacity,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: cursorX - 11,
            top: cursorY - 11,
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: `3px solid ${BRAND_BLUE}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            opacity: cursorOpacity,
          }}
        />
      </div>

      {/* Conversation view - the thinking state, then the answer */}
      <AbsoluteFill style={{ opacity: conversationOpacity }}>
        <ClaudeSurface composerOpacity={0.9} markRotation={markRotation}>
          <div
            style={{
              position: "absolute",
              left: CHART_CARD.left + 2,
              top: CHART_CARD.top + 18,
              opacity: thinkingOpacity,
            }}
          >
            {THINKING_STEPS.map((step, index) => {
              const appear = STEP_START + index * STEP_GAP;
              const done = appear + STEP_GAP;
              const stepOpacity = interpolate(
                frame,
                [appear, appear + 10],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const rise = interpolate(frame, [appear, appear + 10], [10, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              const isDone = frame >= done;
              const sweep = ((frame - appear) * 2.6) % 170;
              const shimmer = `linear-gradient(100deg, #7C8390 0%, #7C8390 ${sweep - 24}%, #FFFFFF ${sweep}%, #7C8390 ${sweep + 24}%, #7C8390 100%)`;
              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 20,
                    opacity: stepOpacity,
                    transform: `translateY(${rise}px)`,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      fontSize: 26,
                      fontWeight: 600,
                      color: isDone ? BRAND_BLUE_SOFT : TEXT_ON_DARK_MUTED,
                    }}
                  >
                    {isDone ? "✓" : "•"}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontWeight: 500,
                      fontSize: 32,
                      ...(isDone
                        ? { color: TEXT_ON_DARK_MUTED }
                        : {
                            backgroundImage: shimmer,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                          }),
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ opacity: answerOpacity }}>
            <div
              style={{
                position: "absolute",
                left: CHART_CARD.left,
                top: CHART_CARD.top,
                width: CHART_CARD.width,
                height: CHART_CARD.height,
                borderRadius: 18,
                backgroundColor: SURFACE_DARK,
                border: `1px solid ${SURFACE_BORDER}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: CHART_CARD.left + CARD_PAD,
                top: CHART_CARD.top + CARD_PAD + 4,
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 28,
                color: TEXT_ON_DARK_MUTED,
              }}
            >
              Open pipeline by stage · {opportunityData.openOpportunityCount}{" "}
              opportunities ·{" "}
              {formatCurrency(opportunityData.totalPipelineValue)} ·{" "}
              {opportunityData.periodLabel}
            </div>
            <StageBarsChart
              barProgress={() => answerProgress}
              labelOpacity={() => answerProgress}
            />
          </div>
        </ClaudeSurface>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
