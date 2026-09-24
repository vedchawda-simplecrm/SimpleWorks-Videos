/**
 * Verifies the R-YaBot loader is genuinely seamless, and stays in frame.
 *
 *   node scripts/check-loader.mjs
 *
 * Checks the loop closes exactly, that its velocity matches across the seam
 * (a position match alone still shows as a hitch), that the intro hands over
 * to the idle at rest, and that no pose pushes the art off the canvas.
 */
import {
  ART_BOUNDS,
  BREATH_PERIOD,
  HEAD,
  PULSE_PERIOD,
  PULSE_R1,
  PULSE_RINGS,
  pulseFade,
  pulsePhase,
  ringsAt,
  IDLE_FRAMES,
  INTRO_FRAMES,
  LOADER_SIZE,
  ORIGIN_X,
  ORIGIN_Y,
  idlePose,
  introPose,
} from "../src/videos/ryabot/loader/pose.ts";

const KEYS = ["y", "scaleX", "scaleY", "rotate", "blend", "blur"];
const diff = (a, b) => Math.max(...KEYS.map((k) => Math.abs(a[k] - b[k])));

let bad = 0;
const check = (name, value, limit) => {
  const ok = value <= limit;
  if (!ok) bad++;
  console.log(
    `  ${name.padEnd(34)} ${value.toExponential(2).padStart(10)}  <= ${limit}  ${ok ? "ok" : "FAIL"}`,
  );
};

console.log(`idle loop: ${IDLE_FRAMES} frames (${BREATH_PERIOD / 30}s breath)`);
check("loop closes (f0 vs fP)", diff(idlePose(0), idlePose(BREATH_PERIOD)), 1e-12);

// Velocity across the seam: the step into frame 0 must match the step that
// would have continued past the end.
const vIn = diff(idlePose(BREATH_PERIOD - 1), idlePose(BREATH_PERIOD));
const vOut = diff(idlePose(0), idlePose(1));
check("velocity match across seam", Math.abs(vIn - vOut), 1e-9);

// No single frame inside the loop may jump more than the largest smooth step.
let maxStep = 0;
for (let f = 0; f < BREATH_PERIOD; f++) {
  maxStep = Math.max(maxStep, diff(idlePose(f), idlePose(f + 1)));
}
check("largest step inside loop (px)", maxStep, 0.75);

// The intro must arrive at the idle's starting pose.
check("intro lands on idle frame 0", diff(introPose(INTRO_FRAMES), idlePose(0)), 1e-9);
check("intro last frame -> idle f0", diff(introPose(INTRO_FRAMES - 1), idlePose(0)), 0.02);

// It must never drift back towards the standing art once seated.
let maxBlendDrop = 0;
for (let f = 1; f <= INTRO_FRAMES; f++) {
  maxBlendDrop = Math.max(maxBlendDrop, introPose(f - 1).blend - introPose(f).blend);
}
check("blend never reverses", maxBlendDrop, 1e-12);

// Nothing may leave the frame at any point. The standing art sits closest to
// the top edge, so lifting it for the intro is what crops the head first.
const edges = (pose) => {
  const art = pose.blend < 0.5 ? ART_BOUNDS.standing : ART_BOUNDS.meditating;
  const at = (v, origin, scale, shift) => origin + (v - origin) * scale + shift;
  return {
    top: at(art.top, ORIGIN_Y, pose.scaleY, pose.y),
    bottom: at(art.bottom, ORIGIN_Y, pose.scaleY, pose.y),
    left: at(art.left, ORIGIN_X, pose.scaleX, 0),
    right: at(art.right, ORIGIN_X, pose.scaleX, 0),
  };
};

const worst = { top: Infinity, bottom: Infinity, left: Infinity, right: Infinity };
const worstAt = { top: "", bottom: "", left: "", right: "" };
const consider = (pose, tag) => {
  const e = edges(pose);
  const margins = {
    top: e.top,
    bottom: LOADER_SIZE - e.bottom,
    left: e.left,
    right: LOADER_SIZE - e.right,
  };
  for (const k of Object.keys(margins)) {
    if (margins[k] < worst[k]) {
      worst[k] = margins[k];
      worstAt[k] = tag;
    }
  }
};
for (let f = 0; f <= INTRO_FRAMES; f++) consider(introPose(f), `intro ${f}`);
for (let f = 0; f < BREATH_PERIOD; f++) consider(idlePose(f), `idle ${f}`);

console.log("\nframing (clearance at the tightest frame):");
for (const k of ["top", "bottom", "left", "right"]) {
  const ok = worst[k] >= 2;
  if (!ok) bad++;
  console.log(
    `  ${k.padEnd(8)} ${worst[k].toFixed(1).padStart(7)}px  at ${worstAt[k].padEnd(11)} ${ok ? "ok" : "CROPPED"}`,
  );
}


// --- meditation pulses ---------------------------------------------------

/** Compares two ring sets as sets: which index holds which ring is not a
 *  visible property, and it rotates as the pattern repeats. */
const ringDiff = (a, b) => {
  const key = (r) => r.scale * 1000 + r.opacity;
  const x = [...a].sort((p, q) => key(p) - key(q));
  const y = [...b].sort((p, q) => key(p) - key(q));
  return Math.max(
    ...x.flatMap((r, i) => [
      Math.abs(r.scale - y[i].scale),
      Math.abs(r.opacity - y[i].opacity),
    ]),
  );
};

console.log("\npulses:");
check(
  "ring set closes over the loop",
  ringDiff(ringsAt(pulsePhase(0, false)), ringsAt(pulsePhase(BREATH_PERIOD, false))),
  1e-12,
);

// A ring is invisible at both ends of its life, so the instant it wraps
// round and starts again cannot show as a pop. Found by scanning rather
// than by deriving each ring's birth frame.
let maxWrapOpacity = 0;
for (let f = 0; f < PULSE_PERIOD; f++) {
  ringsAt(f).forEach((ring, k) => {
    const t = (((f / PULSE_PERIOD + k / PULSE_RINGS) % 1) + 1) % 1;
    if (Math.min(t, 1 - t) <= 1 / PULSE_PERIOD) {
      maxWrapOpacity = Math.max(maxWrapOpacity, ring.opacity);
    }
  });
}
check("ring opacity ~0 at wrap", maxWrapOpacity, 0.02);

// The pattern repeats every PERIOD / RINGS frames; that it does is what lets
// the 105-frame loop contain a whole number of pulses.
check(
  "pattern repeats every period/rings",
  ringDiff(ringsAt(0), ringsAt(PULSE_PERIOD / PULSE_RINGS)),
  1e-12,
);

check(
  "intro hands pulses over at rest",
  ringDiff(
    ringsAt(pulsePhase(INTRO_FRAMES, true), pulseFade(INTRO_FRAMES)),
    ringsAt(pulsePhase(0, false)),
  ),
  1e-12,
);

// Pulses must be gone while the character is still standing, or they give
// away the swap before it happens.
let maxStandingOpacity = 0;
for (let f = 0; f <= INTRO_FRAMES; f++) {
  if (introPose(f).blend > 0.5) continue;
  for (const ring of ringsAt(pulsePhase(f, true), pulseFade(f))) {
    maxStandingOpacity = Math.max(maxStandingOpacity, ring.opacity);
  }
}
check("no pulses while standing", maxStandingOpacity, 1e-12);

// Rings must not touch the frame edge: a circle clipped by the canvas reads
// as a square cut, not a pulse.
let ringWorst = Infinity;
let ringWorstAt = "";
for (let f = 0; f < BREATH_PERIOD; f++) {
  const pose = idlePose(f);
  const centreY = ORIGIN_Y + (HEAD.cy - ORIGIN_Y) * pose.scaleY + pose.y;
  for (const ring of ringsAt(pulsePhase(f, false))) {
    if (ring.opacity < 0.01) continue;
    const r = PULSE_R1 * ring.scale * pose.scaleY + 1;
    if (centreY - r < ringWorst) {
      ringWorst = centreY - r;
      ringWorstAt = "idle " + f;
    }
  }
}
const ringOk = ringWorst >= 2;
if (!ringOk) bad++;
console.log(
  "  " +
    "ring top clearance".padEnd(34) +
    " " +
    ringWorst.toFixed(1).padStart(10) +
    "px  at " +
    ringWorstAt +
    "  " +
    (ringOk ? "ok" : "CLIPPED"),
);

console.log(bad ? `\n${bad} check(s) FAILED` : "\nall checks passed");
process.exit(bad ? 1 : 0);
