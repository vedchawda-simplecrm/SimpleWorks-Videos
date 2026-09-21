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

const { fontFamily } = loadFont("normal", { weights: ["500", "600"] });

const BRAND_BLUE = "#1976D2";
const TEXT_DARK = "#1A1A1A";
const LINE_GRAY = "#D0D3D8";

// Timeline (30fps, 8s total): message copy plays first and stays on
// screen, then the logo/connector animation plays underneath it.
// Message 1 in 8-38 (settles centered on screen), then holds briefly and
// moves up to its final slot 45-60, message 2 in 68-98 (~1s pause after
// message 1 settles up top, then stays alongside it), SimpleCRM enters
// 108-120, Claude enters 122-134, connector draws 136-154, MCP pill
// 154-166, hold everything until 215, exit fade 215-240.
const MESSAGE_1_START = 8;
const MESSAGE_1_SHIFT_START = 45;
const MESSAGE_1_SHIFT_END = 60;
const MESSAGE_2_START = 68;
const CLAUDE_ENTER_START = 108;
const SIMPLECRM_ENTER_START = 122;
const LINE_START = 136;
const LINE_END = 154;
const PILL_START = 154;
const EXIT_START = 215;
const EXIT_END = 240;

const MESSAGE_1_TOP_CENTER = 50;
const MESSAGE_1_TOP_FINAL = 24;
const MESSAGE_2_TOP = 36;
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
          opacity: message1.opacity,
          fontFamily,
          fontWeight: 500,
          fontSize: 48,
          color: TEXT_DARK,
        }}
      >
        What if Claude could work with SimpleCRM?
      </div>

      {/* Message 2 - fades in below message 1's final position */}
      <div
        style={{
          position: "absolute",
          top: `${MESSAGE_2_TOP}%`,
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
