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
import { PreviewAudio } from "../components/PreviewAudio";

const { fontFamily } = loadFont("normal", { weights: ["500", "600"] });

const BRAND_BLUE = "#1976D2";
const SCREEN_BG = "#151515";

// The screenshots are captured at ~1917x910 - fill the full 1920 width
// and center vertically; the tiny top/bottom sliver is the screenshot's
// own near-black background color, so the seam is invisible.
const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 911;
const DISPLAY_TOP = (1080 - DISPLAY_HEIGHT) / 2;

// Cursor / camera target points, hand-placed to line up with the UI
// elements in each screenshot (the "+" button, the Connectors row, the
// toggle), mapped into the fullscreen 1920x1080 canvas.
const POINT_PLUS = { x: 0.401 * DISPLAY_WIDTH, y: DISPLAY_TOP + 0.558 * DISPLAY_HEIGHT };
const POINT_CONNECTORS = { x: 0.443 * DISPLAY_WIDTH, y: DISPLAY_TOP + 0.806 * DISPLAY_HEIGHT };
const POINT_TOGGLE = { x: 0.656 * DISPLAY_WIDTH, y: DISPLAY_TOP + 0.74 * DISPLAY_HEIGHT };

// Timeline (30fps, 195 frames / 6.5s), no caption - fast cursor-driven
// click-through: cursor fades in at the "+" 8-16, clicks at 20
// (crossfade to menu-open 20-28), travels to Connectors 28-42, clicks at
// 48 (crossfade to submenu 48-56), travels to the toggle 56-70
// (crossfade to toggle-off 70-78), clicks at 86 (crossfade to
// toggle-on 86-94), success badge 96-110, hold to 165, exit 165-195.
const CLICK_PLUS = 20;
const CROSSFADE_TO_MENU = [20, 28] as const;
const CROSSFADE_TO_SUBMENU = [48, 56] as const;
const CROSSFADE_TO_TOGGLE_OFF = [70, 78] as const;
const CLICK_TOGGLE = 86;
const CROSSFADE_TO_TOGGLE_ON = [86, 94] as const;
const BADGE_START = 96;
const EXIT_START = 165;
const EXIT_END = 195;

const CLICK_PULSES = [CLICK_PLUS, 48, CLICK_TOGGLE];

// Camera scale over time: a single smooth, monotonic push-in that
// gently deepens as the cursor reaches each target (no back-and-forth
// zoom pumping), releasing back to the full overview once at the very
// end to reveal the finished "connected" state in context.
const CAMERA_FRAMES = [0, 10, 20, 42, 70, 96, 130, 195];
const CAMERA_SCALES = [1, 1, 1.18, 1.24, 1.32, 1.32, 1, 1];

export const ConnectorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cursorX = interpolate(
    frame,
    [0, 28, 42, 56, 70, EXIT_END],
    [
      POINT_PLUS.x,
      POINT_PLUS.x,
      POINT_CONNECTORS.x,
      POINT_CONNECTORS.x,
      POINT_TOGGLE.x,
      POINT_TOGGLE.x,
    ],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cursorY = interpolate(
    frame,
    [0, 28, 42, 56, 70, EXIT_END],
    [
      POINT_PLUS.y,
      POINT_PLUS.y,
      POINT_CONNECTORS.y,
      POINT_CONNECTORS.y,
      POINT_TOGGLE.y,
      POINT_TOGGLE.y,
    ],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cursorOpacity = interpolate(
    frame,
    [8, 16, 100, 112],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const cameraScale = interpolate(frame, CAMERA_FRAMES, CAMERA_SCALES, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const originXPercent = (cursorX / 1920) * 100;
  const originYPercent = (cursorY / 1080) * 100;

  const img1Opacity = interpolate(frame, CROSSFADE_TO_MENU, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const img2Opacity = interpolate(frame, CROSSFADE_TO_SUBMENU, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const img3Opacity = interpolate(frame, CROSSFADE_TO_TOGGLE_OFF, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const img4Opacity = interpolate(frame, CROSSFADE_TO_TOGGLE_ON, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeProgress = spring({
    frame: frame - BADGE_START,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 140 },
  });
  const badgeOpacity = interpolate(badgeProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeScale = interpolate(badgeProgress, [0, 1], [0.7, 1]);
  const badgeTranslateX = interpolate(badgeProgress, [0, 1], [-14, 0]);

  const exitOpacity = interpolate(frame, [EXIT_START, EXIT_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SCREEN_BG, opacity: exitOpacity }}>
      <PreviewAudio track="audio-ConnectorScene" />
      {/* Camera stage - everything inside zooms/pans together */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraScale})`,
          transformOrigin: `${originXPercent}% ${originYPercent}%`,
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
            src={staticFile("assets/images/claude-main-screen.png")}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <Img
            src={staticFile("assets/images/claude-main-screen-plus.png")}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: img1Opacity,
            }}
          />
          <Img
            src={staticFile(
              "assets/images/claude-main-screen-hover-connector.png",
            )}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: img2Opacity,
            }}
          />
          <Img
            src={staticFile(
              "assets/images/claude-main-screen-toggle-off.png",
            )}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: img3Opacity,
            }}
          />
          <Img
            src={staticFile(
              "assets/images/claude-main-screen-toggle-on.png",
            )}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: img4Opacity,
            }}
          />
        </div>

        {/* Click-pulse rings */}
        {CLICK_PULSES.map((pulseFrame) => {
          const local = frame - pulseFrame;
          if (local < 0 || local > 18) return null;
          const radius = interpolate(local, [0, 18], [8, 46]);
          const ringOpacity = interpolate(local, [0, 18], [0.85, 0]);
          return (
            <div
              key={pulseFrame}
              style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                width: radius * 2,
                height: radius * 2,
                marginLeft: -radius,
                marginTop: -radius,
                borderRadius: "50%",
                border: `2px solid ${BRAND_BLUE}`,
                opacity: ringOpacity,
              }}
            />
          );
        })}

        {/* Cursor */}
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            width: 22,
            height: 22,
            marginLeft: -11,
            marginTop: -11,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: `3px solid ${BRAND_BLUE}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            opacity: cursorOpacity,
          }}
        />

        {/* Connected success badge - floats in the empty space to the
            right of the toggle so it never overlaps other UI text */}
        <div
          style={{
            position: "absolute",
            left: POINT_TOGGLE.x + 90,
            top: POINT_TOGGLE.y,
            transform: `translate(0, -50%) translateX(${badgeTranslateX}px) scale(${badgeScale})`,
            opacity: badgeOpacity,
            backgroundColor: BRAND_BLUE,
            color: "#FFFFFF",
            fontFamily,
            fontWeight: 600,
            fontSize: 20,
            padding: "10px 20px",
            borderRadius: 24,
            whiteSpace: "nowrap",
            boxShadow: "0 12px 24px rgba(25,118,210,0.45)",
          }}
        >
          ✓ Connected
        </div>
      </div>
    </AbsoluteFill>
  );
};
