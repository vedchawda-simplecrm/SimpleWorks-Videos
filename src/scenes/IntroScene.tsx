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
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { ClaudeLogo } from "../components/ClaudeLogo";
import { PreviewAudio } from "../components/PreviewAudio";

const { fontFamily } = loadFont("normal", { weights: ["500", "600"] });

const BRAND_BLUE = "#1976D2";
const TEXT_DARK = "#1A1A1A";
const LINE_GRAY = "#D0D3D8";

// Timeline (30fps, 8s total): the question types itself out centred on
// screen, moves up to its slot, then "Now it can!" lands and the
// logo/connector animation plays underneath.
// Question types 6-52, shifts up 58-74, message 2 in 84, Claude enters
// 120-132, SimpleCRM enters 134-146, connector draws 148-166, MCP pill
// 166-178, hold everything until 215, exit fade 215-240.
const MESSAGE_1_START = 6;
const TYPE_END = 42;
// The question holds for about a second, then rises and clears.
const MESSAGE_1_SHIFT_START = 72;
const MESSAGE_1_SHIFT_END = 92;
// Only then does the answer land, centred, before it too moves up and the
// logo animation follows.
const MESSAGE_2_START = 96;
const MESSAGE_2_SHIFT_START = 128;
const MESSAGE_2_SHIFT_END = 148;
const CLAUDE_ENTER_START = 154;
const SIMPLECRM_ENTER_START = 166;
const LINE_START = 178;
const LINE_END = 194;
const PILL_START = 194;
const EXIT_START = 215;
const EXIT_END = 240;

// The question is composed of segments so the word "Claude" can be the
// real logo and "SimpleCRM" can carry the brand colour, while the whole
// line still types out character by character.
const Q_BEFORE = "What if ";
const Q_CLAUDE = "Claude";
const Q_MIDDLE = " could work with ";
const Q_BRAND = "SimpleCRM";
const Q_AFTER = "?";
const Q_LENGTH =
  Q_BEFORE.length +
  Q_CLAUDE.length +
  Q_MIDDLE.length +
  Q_BRAND.length +
  Q_AFTER.length;

const MESSAGE_1_TOP_CENTER = 50;
const MESSAGE_1_TOP_FINAL = 26;
const MESSAGE_2_TOP_CENTER = 50;
const MESSAGE_2_TOP_FINAL = 30;
const LOCKUP_TOP = 68;

const ENTER_DURATION = 12;

const useEntrance = (frame: number, start: number, duration = ENTER_DURATION) => {
  const local = frame - start;
  const progress = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: progress,
    translateY: interpolate(progress, [0, 1], [16, 0]),
  };
};

// Springy, non-linear entrance for text - gives a slight overshoot instead
// of a flat ease-out, so the copy feels like it has some weight to it.
const useTextEntrance = (frame: number, start: number, fps: number) => {
  const local = frame - start;
  const progress = spring({
    frame: local,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 120 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translateY: interpolate(progress, [0, 1], [26, 0]),
    scale: interpolate(progress, [0, 1], [0.9, 1]),
  };
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const simplecrm = useEntrance(frame, SIMPLECRM_ENTER_START);
  const claude = useEntrance(frame, CLAUDE_ENTER_START);

  const claudeFlowerRotation =
    Math.max(0, frame - CLAUDE_ENTER_START) * 3;

  const lineProgress = interpolate(frame, [LINE_START, LINE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  const pill = useEntrance(frame, PILL_START);
  const pillScale = interpolate(pill.opacity, [0, 1], [0.8, 1]);

  const message1 = useTextEntrance(frame, MESSAGE_1_START, fps);
  const message2 = useTextEntrance(frame, MESSAGE_2_START, fps);

  // The question types itself out; the Claude lockup stands in for the
  // word "Claude" and pops in when the typing reaches it.
  const typedChars = Math.round(
    interpolate(frame, [MESSAGE_1_START, TYPE_END], [0, Q_LENGTH], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    }),
  );
  const claudeWordProgress = interpolate(
    typedChars,
    [Q_BEFORE.length, Q_BEFORE.length + Q_CLAUDE.length],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const caretVisible =
    frame < MESSAGE_1_SHIFT_START && Math.floor(frame / 8) % 2 === 0;
  const questionMarkRotation = Math.max(0, frame - MESSAGE_1_START) * 2;
  // The question fades out as it rises, clearing the frame for the answer.
  const questionFade = interpolate(
    frame,
    [MESSAGE_1_SHIFT_START + 4, MESSAGE_1_SHIFT_END],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const message2Top = interpolate(
    frame,
    [MESSAGE_2_SHIFT_START, MESSAGE_2_SHIFT_END],
    [MESSAGE_2_TOP_CENTER, MESSAGE_2_TOP_FINAL],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const message1Top = interpolate(
    frame,
    [MESSAGE_1_SHIFT_START, MESSAGE_1_SHIFT_END],
    [MESSAGE_1_TOP_CENTER, MESSAGE_1_TOP_FINAL],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    },
  );

  const exitOpacity = interpolate(frame, [EXIT_START, EXIT_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(frame, [EXIT_START, EXIT_END], [1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAFA",
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      <PreviewAudio track="audio-IntroScene" />
      {/* Logo + connector lockup */}
      <div
        style={{
          position: "absolute",
          top: `${LOCKUP_TOP}%`,
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            opacity: claude.opacity,
            transform: `translateY(${claude.translateY}px)`,
          }}
        >
          <ClaudeLogo width={420} rotation={claudeFlowerRotation} />
        </div>

        <div
          style={{
            flex: 1,
            position: "relative",
            height: 2,
            margin: "0 40px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: 2,
              width: "100%",
              backgroundColor: LINE_GRAY,
              transform: `scaleX(${lineProgress})`,
              transformOrigin: "left center",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${pillScale})`,
              opacity: pill.opacity,
              backgroundColor: BRAND_BLUE,
              color: "#FFFFFF",
              fontFamily,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: 1.5,
              padding: "6px 16px",
              borderRadius: 16,
              whiteSpace: "nowrap",
            }}
          >
            MCP
          </div>
        </div>

        <div
          style={{
            opacity: simplecrm.opacity,
            transform: `translateY(${simplecrm.translateY}px)`,
          }}
        >
          <Img
            src={staticFile("assets/svg/simplecrm-logo.svg")}
            style={{ width: 420, height: "auto" }}
          />
        </div>
      </div>

      {/* Message 1 - starts centered on screen, then settles into its
          top slot before message 2 appears below it */}
      <div
        style={{
          position: "absolute",
          top: `${message1Top}%`,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(-50%) translateY(${message1.translateY}px) scale(${message1.scale})`,
          opacity: message1.opacity * questionFade,
          fontFamily,
          fontWeight: 500,
          fontSize: 48,
          color: TEXT_DARK,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 0,
          }}
        >
          <span style={{ whiteSpace: "pre" }}>
            {Q_BEFORE.slice(0, typedChars)}
          </span>
          {claudeWordProgress > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                margin: "0 2px",
                opacity: claudeWordProgress,
                transform: `scale(${0.88 + claudeWordProgress * 0.12})`,
                // Sits the lockup's wordmark on the text baseline (measured:
                // the logo rendered 8px low when centred).
                position: "relative",
                top: -4,
              }}
            >
              <ClaudeLogo width={228} rotation={questionMarkRotation} />
            </span>
          ) : null}
          <span style={{ whiteSpace: "pre" }}>
            {Q_MIDDLE.slice(
              0,
              Math.max(0, typedChars - Q_BEFORE.length - Q_CLAUDE.length),
            )}
          </span>
          <span style={{ color: BRAND_BLUE, fontWeight: 600 }}>
            {Q_BRAND.slice(
              0,
              Math.max(
                0,
                typedChars -
                  Q_BEFORE.length -
                  Q_CLAUDE.length -
                  Q_MIDDLE.length,
              ),
            )}
          </span>
          <span>
            {Q_AFTER.slice(0, Math.max(0, typedChars - (Q_LENGTH - 1)))}
          </span>
          <span
            style={{
              opacity: caretVisible ? 1 : 0,
              color: BRAND_BLUE,
              marginLeft: 2,
            }}
          >
            |
          </span>
        </span>
      </div>

      {/* Message 2 - fades in below message 1's final position */}
      <div
        style={{
          position: "absolute",
          top: `${message2Top}%`,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(-50%) translateY(${message2.translateY}px) scale(${message2.scale})`,
          opacity: message2.opacity,
          fontFamily,
          fontWeight: 600,
          fontSize: 80,
          color: BRAND_BLUE,
        }}
      >
        Now it can!
      </div>
    </AbsoluteFill>
  );
};
