import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import {
  BREATH_PERIOD,
  HEAD,
  INTRO_FRAMES,
  Pose,
  PULSE_STROKE,
  RING_BOX,
  Ring,
  fullPose,
  idlePose,
  introPose,
  pulseFade,
  pulsePhase,
  ringsAt,
} from "./pose";

/**
 * R-YaBot as an AI-processing loader.
 *
 * Renders on a transparent background - there is deliberately no fill, so an
 * alpha codec (VP9 / yuva420p) or a PNG sequence carries the cut-out
 * straight into the CRM UI.
 *
 * The camera never moves: every transform below is on the character, about
 * a point near where it meets the ground, so it settles and breathes
 * without drifting or changing framing.
 */
const SEAT_ORIGIN = "50% 88%";
const RING_COLOR = "#F08A1E";

/**
 * Pulses sit inside the same transformed wrapper as the art, so they stay
 * locked to the head as it floats, and before the images, so the head
 * occludes them and each ring reads as coming out from behind it.
 */
const Pulses: React.FC<{ rings: Ring[] }> = ({ rings }) => (
  <>
    {rings.map((ring, k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: HEAD.cx - RING_BOX / 2,
          top: HEAD.cy - RING_BOX / 2,
          width: RING_BOX,
          height: RING_BOX,
          borderRadius: "50%",
          border: `${PULSE_STROKE}px solid ${RING_COLOR}`,
          opacity: ring.opacity,
          transform: `scale(${ring.scale})`,
          willChange: "transform, opacity",
        }}
      />
    ))}
  </>
);

const Body: React.FC<{ pose: Pose; rings: Ring[] }> = ({ pose, rings }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translateY(${pose.y}px) scale(${pose.scaleX}, ${pose.scaleY}) rotate(${pose.rotate}deg)`,
      transformOrigin: SEAT_ORIGIN,
      filter: pose.blur > 0.02 ? `blur(${pose.blur.toFixed(2)}px)` : undefined,
      willChange: "transform",
    }}
  >
    <Pulses rings={rings} />
    <Img
      src={staticFile("assets/images/ryabot-default.png")}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 1 - pose.blend,
      }}
    />
    <Img
      src={staticFile("assets/images/ryabot-thinking.png")}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: pose.blend,
      }}
    />
  </div>
);

/** The one-shot settle into meditation. Plays once, when the loader starts. */
export const RyabotLoaderIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill from={-5}>
      <Body
        pose={introPose(frame)}
        rings={ringsAt(pulsePhase(frame, true), pulseFade(frame))}
      />
    </AbsoluteFill>
  );
};

/**
 * The looping asset. Its length is exactly one breath, so it can be set to
 * loop forever with no cut, and it never returns to the standing pose.
 */
export const RyabotLoaderIdle: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Body pose={idlePose(frame)} rings={ringsAt(pulsePhase(frame, false))} />
    </AbsoluteFill>
  );
};

/** Intro then idle, for checking the hand-off between the two. */
export const RyabotLoaderFull: React.FC = () => {
  const frame = useCurrentFrame();
  const inIntro = frame < INTRO_FRAMES;
  const local = inIntro ? frame : (frame - INTRO_FRAMES) % BREATH_PERIOD;
  return (
    <AbsoluteFill>
      <Body
        pose={fullPose(frame)}
        rings={ringsAt(
          pulsePhase(local, inIntro),
          inIntro ? pulseFade(local) : 1,
        )}
      />
    </AbsoluteFill>
  );
};
