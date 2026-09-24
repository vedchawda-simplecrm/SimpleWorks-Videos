/**
 * The R-YaBot loader's motion, as pure maths.
 *
 * Kept out of the component so the seamlessness can be reasoned about (and
 * asserted in check-loader.mjs) rather than eyeballed: every idle term is
 * built from sin(2*pi*f/BREATH_PERIOD), so frame 0 and frame BREATH_PERIOD
 * are identical to the last bit, and every term is exactly zero at frame 0.
 * That zero is also where the intro ends, which is what makes intro -> idle
 * invisible.
 *
 * WHAT THIS CANNOT DO: the source art is two flat PNGs, so limbs, eyelids,
 * beads and earrings cannot articulate. The standing-to-meditation change is
 * a weighted cross-dissolve under a downward settle, blurred at the swap.
 */
export const FPS = 30;
export const LOADER_SIZE = 512;

/** 0.4s still, ~3.0s settling, 0.5s coming to rest. */
export const HOLD = 12;
export const TRANSITION = 90;
export const SETTLE = 15;
export const INTRO_FRAMES = HOLD + TRANSITION + SETTLE; // 117 / 3.9s

/** One breath. The idle loop is exactly this long, so it cuts to itself. */
export const BREATH_PERIOD = 105; // 3.5s
export const IDLE_FRAMES = BREATH_PERIOD;

/** Intro plus three breaths, for previewing the whole behaviour. */
export const FULL_FRAMES = INTRO_FRAMES + BREATH_PERIOD * 3;

export type Pose = {
  /** Vertical offset in output pixels, negative is up. */
  y: number;
  scaleX: number;
  scaleY: number;
  /** Degrees. */
  rotate: number;
  /** 0 = standing art, 1 = meditating art. */
  blend: number;
  /** Blur in px, used only to hide the cross-dissolve. */
  blur: number;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Content bounds of the two PNGs, in art space (before CHAR_SCALE), measured
 * by scanning for the first row/column with alpha > 24. Every transform here
 * must keep the character inside the frame, and check-loader.mjs asserts it.
 */
export const ART_BOUNDS = {
  standing: { top: 23.7, bottom: 484.6, left: 78.0, right: 433.6 },
  meditating: { top: 23.3, bottom: 468.7, left: 104.1, right: 404.6 },
};

/** Where the body is transformed from: roughly where it meets the ground. */
export const ORIGIN_X = 0.5 * LOADER_SIZE;
export const ORIGIN_Y = 0.88 * LOADER_SIZE;

/**
 * The art is drawn smaller than the canvas, to leave room for the pulses.
 *
 * At full size the ears reach 150px from the head centre while the canvas
 * allowed only a ~145px radius, so a ring could never clear the silhouette:
 * it showed as a hairline arc over the scalp instead of a travelling pulse.
 * Backing the art off buys the halo somewhere to go.
 */
const CHAR_SCALE = 0.76;

/**
 * Everything sits this far down the frame at rest. Chosen so the meditating
 * art ends up with equal margins top and bottom.
 */
const BASE_Y = -39;

/** Where the standing pose sits before it lowers: higher and a touch larger. */
const STAND_Y = -16;
const STAND_SCALE = 1.03;
/** Where in the move the art swaps, and over how much of it. */
const SWAP_AT = 0.44;
const SWAP_SPAN = 0.16;
/** How far past rest the body dips before settling back up. */
const DIP_Y = 5;
const DIP_SCALE = 0.995;

/**
 * The meditation idle. Every term is a harmonic of one period, so the loop
 * is seamless by construction rather than by a matched first/last frame.
 */
export const idlePose = (frame: number): Pose => {
  const p = (2 * Math.PI * frame) / BREATH_PERIOD;
  const breath = Math.sin(p);
  return {
    // Two harmonics, so the float does not read as a single mechanical sine.
    // Both vanish at p = 0, which keeps the loop exact.
    y: BASE_Y - (5 * breath + 1.4 * Math.sin(2 * p)),
    // The chest widens a little less than it rises, about a planted seat.
    scaleX: CHAR_SCALE * (1 - 0.004 * breath),
    scaleY: CHAR_SCALE * (1 + 0.009 * breath),
    rotate: 0.28 * breath,
    blend: 1,
    blur: 0,
  };
};

/** The one-shot standing-to-meditation settle. */
export const introPose = (frame: number): Pose => {
  if (frame < HOLD) {
    return {
      y: BASE_Y + STAND_Y,
      scaleX: CHAR_SCALE * STAND_SCALE,
      scaleY: CHAR_SCALE * STAND_SCALE,
      rotate: 0,
      blend: 0,
      blur: 0,
    };
  }

  if (frame < HOLD + TRANSITION) {
    const t = (frame - HOLD) / TRANSITION;
    const q = easeInOut(clamp01(t));

    // Two flat images held at half opacity read as a double exposure - two
    // sets of arms, half-open eyes - so the swap is short and buried under a
    // blur rather than spread across the move. The body keeps travelling
    // underneath it, which is what sells the change of pose.
    const raw = clamp01((t - SWAP_AT) / SWAP_SPAN);
    const cover = Math.sin(Math.PI * raw);
    return {
      // An extra dip under the blur, back to zero by the time it clears, so
      // there is real movement at the moment the pose changes.
      y: BASE_Y + mix(STAND_Y, DIP_Y, q) + 4 * cover,
      scaleX: CHAR_SCALE * mix(STAND_SCALE, DIP_SCALE, q),
      scaleY: CHAR_SCALE * (mix(STAND_SCALE, DIP_SCALE, q) - 0.006 * cover),
      rotate: 0,
      blend: easeInOut(raw),
      blur: 5 * cover,
    };
  }

  // Comes to rest on exactly the idle's frame 0, so the hand-off is
  // invisible. Do not change these end values without changing idlePose.
  const q = easeOut(clamp01((frame - HOLD - TRANSITION) / SETTLE));
  return {
    y: BASE_Y + mix(DIP_Y, 0, q),
    scaleX: CHAR_SCALE * mix(DIP_SCALE, 1, q),
    scaleY: CHAR_SCALE * mix(DIP_SCALE, 1, q),
    rotate: 0,
    blend: 1,
    blur: 0,
  };
};

/** Intro followed by the idle, looping for as long as the frame range runs. */
export const fullPose = (frame: number): Pose =>
  frame < INTRO_FRAMES
    ? introPose(frame)
    : idlePose((frame - INTRO_FRAMES) % BREATH_PERIOD);

// --- meditation pulses ---------------------------------------------------

/**
 * Head geometry in art space, measured by scanning the meditating PNG: the
 * widest row in the upper body is the ear line, the narrowest row below it
 * is the neck.
 */
export const HEAD = { cx: 254.4, cy: 145.8, radius: 122.5 };
/** How far the ears stick out past the skull. The ring is hidden until here. */
export const EAR_HALF_WIDTH = 150.3;

export const PULSE_RINGS = 3;
/**
 * One ring's whole life is one breath, and three of them sit a third of a
 * cycle apart - so the pattern repeats every BREATH_PERIOD / 3 frames and
 * the idle loop, being three of those, still closes exactly.
 */
export const PULSE_PERIOD = BREATH_PERIOD;
/**
 * Art-space radii. A ring is born inside the skull so it emerges from behind
 * the head rather than popping into existence, and it travels well past the
 * ears so the whole circle is visible and clearly moving before it fades.
 */
export const PULSE_R0 = 110;
export const PULSE_R1 = 214;
/** Peak ring opacity, and the stroke in art-space px. */
export const PULSE_PEAK = 0.5;
export const PULSE_STROKE = 3;
/** The un-scaled ring element is drawn at full size and scaled down. */
export const RING_BOX = PULSE_R1 * 2;

export type Ring = { scale: number; opacity: number };

/** Fades a ring fully in and out over the first and last 6% of its life. */
const ends = (t: number) => clamp01(t / 0.06) * clamp01((1 - t) / 0.06);

/**
 * The ring phase.
 *
 * Negative through the intro so that the final intro frame lands on the
 * idle's frame 0 - the same trick the body transform uses, for the same
 * reason.
 */
export const pulsePhase = (frame: number, inIntro: boolean) =>
  inIntro ? frame - INTRO_FRAMES : frame;

/** Pulses are absent while standing and are fully in by the time it rests. */
export const pulseFade = (frame: number) =>
  clamp01((frame - (HOLD + TRANSITION)) / SETTLE);

/**
 * The rings at a given phase. Opacity is zero at both ends of a ring's life,
 * so the moment one wraps around to start again is invisible.
 */
export const ringsAt = (phase: number, fade = 1): Ring[] => {
  const rings: Ring[] = [];
  for (let k = 0; k < PULSE_RINGS; k++) {
    let t = (phase / PULSE_PERIOD + k / PULSE_RINGS) % 1;
    if (t < 0) t += 1;
    // Eases out, the way a ripple slows as it spreads.
    const radius = PULSE_R0 + (PULSE_R1 - PULSE_R0) * (1 - (1 - t) ** 2);
    rings.push({
      scale: radius / PULSE_R1,
      // A broad curve rather than a narrow one, so the ring is at full
      // strength across the stretch where it is actually clear of the head.
      // The envelope forces it to exactly zero at both ends: sin^0.8 alone
      // still leaves ~0.024 on the first frame of a ring's life, which is a
      // pop at the moment one wraps round and starts again.
      opacity: PULSE_PEAK * Math.sin(Math.PI * t) ** 0.8 * ends(t) * fade,
    });
  }
  return rings;
};
