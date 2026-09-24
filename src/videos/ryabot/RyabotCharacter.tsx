import { Img, interpolate, staticFile } from "remotion";
import { SAFFRON } from "./theme";

/**
 * The character, with its two supplied poses cross-faded.
 *
 * Both PNGs are square and framed alike, so blending them in the same box
 * reads as the character settling into meditation rather than as a cut.
 * `absFrame` is the frame on the MASTER timeline, not the scene, so the idle
 * float does not jump when one Sequence hands over to the next.
 */
export const RyabotCharacter: React.FC<{
  absFrame: number;
  /** 0 = welcoming pose, 1 = meditating pose. */
  blend: number;
  cx: number;
  cy: number;
  size: number;
  /** 0 = absent, 1 = fully present. Drives the entrance. */
  presence?: number;
  /** Strength of the warm halo behind the character. */
  glow?: number;
}> = ({ absFrame, blend, cx, cy, size, presence = 1, glow = 1 }) => {
  // A slow breath, plus a slightly faster bob, so the idle never looks like
  // a single sine wave.
  const float =
    Math.sin(absFrame / 34) * 7 + Math.sin(absFrame / 21 + 1.2) * 2.5;
  const scale = interpolate(presence, [0, 1], [0.86, 1]);
  const box = {
    position: "absolute" as const,
    left: cx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
  };

  return (
    <>
      <div
        style={{
          ...box,
          left: cx - size * 0.82,
          top: cy - size * 0.82,
          width: size * 1.64,
          height: size * 1.64,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(240,138,30,0.20) 0%, rgba(240,138,30,0.08) 42%, rgba(240,138,30,0) 68%)`,
          opacity: glow * presence,
          transform: `translateY(${float * 0.5}px) scale(${interpolate(presence, [0, 1], [0.8, 1])})`,
        }}
      />
      <div
        style={{
          ...box,
          opacity: presence,
          transform: `translateY(${float}px) scale(${scale})`,
        }}
      >
        <Img
          src={staticFile("assets/images/ryabot-default.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 1 - blend,
          }}
        />
        <Img
          src={staticFile("assets/images/ryabot-thinking.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: blend,
          }}
        />
      </div>
      {/* Grounds the character so it does not look pasted onto the canvas. */}
      <div
        style={{
          position: "absolute",
          left: cx - size * 0.33,
          top: cy + size * 0.40,
          width: size * 0.66,
          height: size * 0.075,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${SAFFRON}22 0%, ${SAFFRON}00 70%)`,
          opacity: presence * 0.9,
        }}
      />
    </>
  );
};
