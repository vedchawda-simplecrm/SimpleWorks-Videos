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
import { ClaudeLogo } from "../components/ClaudeLogo";
import {
  BRAND_BLUE,
  CANVAS_LIGHT,
  FONT,
  TEXT_DARK,
} from "../theme";
import { PreviewAudio } from "../components/PreviewAudio";

// Shot timing (30fps, 120 frames / 4s)
const HEADLINE_START = 5;
const LOGOS_START = 40;
const PLUS_START = 56;

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = spring({
    frame: frame - HEADLINE_START,
    fps,
    config: { damping: 200, stiffness: 100, mass: 0.9 },
  });
  const headlineOpacity = interpolate(headline, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineRise = interpolate(headline, [0, 1], [22, 0]);

  const logos = spring({
    frame: frame - LOGOS_START,
    fps,
    config: { damping: 200, stiffness: 110, mass: 0.8 },
  });
  const logosOpacity = interpolate(logos, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logosRise = interpolate(logos, [0, 1], [18, 0]);

  // The plus lands just after both logos have settled.
  const plusProgress = spring({
    frame: frame - PLUS_START,
    fps,
    config: { damping: 13, mass: 0.5, stiffness: 150 },
  });
  const plusOpacity = interpolate(plusProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const plusScale = interpolate(plusProgress, [0, 1], [0.4, 1]);

  // Carries the opening's language through to the close, but slower.
  const markRotation = Math.max(0, frame - LOGOS_START) * 1;

  const headlineScale = interpolate(frame, [HEADLINE_START, 120], [1, 1.012], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: CANVAS_LIGHT }}>
      <PreviewAudio track="audio-ClosingScene" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 322,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 72,
          color: TEXT_DARK,
          opacity: headlineOpacity,
          transform: `translateY(${headlineRise}px) scale(${headlineScale})`,
        }}
      >
        Your <span style={{ color: BRAND_BLUE }}>CRM data</span>. A clearer
        next move.
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 582,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 70,
          opacity: logosOpacity,
          transform: `translateY(${logosRise}px)`,
        }}
      >
        <Img
          src={staticFile("assets/svg/simplecrm-logo.svg")}
          style={{ width: 380, height: "auto" }}
        />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 72,
            lineHeight: 1,
            color: BRAND_BLUE,
            opacity: plusOpacity,
            transform: `scale(${plusScale})`,
          }}
        >
          +
        </div>
        <ClaudeLogo width={330} rotation={markRotation} />
      </div>
    </AbsoluteFill>
  );
};
