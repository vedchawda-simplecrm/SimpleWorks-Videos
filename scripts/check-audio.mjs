/**
 * Verifies the built soundtrack against everything we care about:
 * continuity (no gaps), headroom, stereo, and that each effect is audible
 * over the music bed.
 *
 *   node scripts/check-audio.mjs
 */
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const FPS = 30;
const file = path.join(process.cwd(), "public", "assets", "audio", "full-audio.wav");
const b = fs.readFileSync(file);

let p = 12;
let off = 0;
let len = 0;
while (p < b.length - 8) {
  const id = b.toString("ascii", p, p + 4);
  const size = b.readUInt32LE(p + 4);
  if (id === "data") {
    off = p + 8;
    len = size;
    break;
  }
  p += 8 + size + (size % 2);
}
const channels = b.readUInt16LE(22);
const frames = len / (2 * channels);
const L = (i) => b.readInt16LE(off + i * 2 * channels) / 32768;
const R = (i) =>
  channels === 2 ? b.readInt16LE(off + i * 2 * channels + 2) / 32768 : L(i);
const rms = (a, z) => {
  let s = 0;
  for (let i = a; i < z; i++) s += (L(i) ** 2 + R(i) ** 2) / 2;
  return Math.sqrt(s / (z - a));
};
const at = (t) => Math.floor(t * SR);
const frameAt = (f) => at(f / FPS);

console.log(`duration ${(frames / SR).toFixed(2)}s  channels ${channels}`);

let peak = 0;
let width = 0;
for (let i = 0; i < frames; i++) {
  peak = Math.max(peak, Math.abs(L(i)), Math.abs(R(i)));
  width += Math.abs(L(i) - R(i));
}
console.log(
  `peak ${(20 * Math.log10(peak)).toFixed(1)}dBFS   rms ${(20 * Math.log10(rms(0, frames))).toFixed(1)}dBFS   stereo width ${(width / frames).toFixed(4)}`,
);

// Continuity: no near-silent stretch outside the top/tail fades.
const win = Math.floor(0.1 * SR);
const quiet = [];
for (let s = at(1.5); s < frames - at(1.5) - win; s += win) {
  if (rms(s, s + win) < 0.004) quiet.push((s / SR).toFixed(2));
}
console.log(
  `continuity: ${quiet.length ? `GAPS at ${quiet.join(", ")}` : "no gaps"}`,
);

// Effects should sit clearly above the bed. Music-only windows are stretches
// with no cue scheduled; effect windows are taken around each cue.
const musicOnly =
  [
    [3.6, 4.6],
    [10.5, 11.5],
    [28.0, 29.0],
    [40.0, 41.0],
  ]
    .map(([a, z]) => rms(at(a), at(z)))
    .reduce((x, y) => x + y) / 4;

const over = (a, z) => {
  const total = rms(a, z);
  const alone = Math.sqrt(Math.max(0, total * total - musicOnly * musicOnly));
  return alone / musicOnly;
};

// Short clicks carry little RMS but are plainly audible, so transients are
// judged on peak against the music's own peak instead.
const musicPeak = (() => {
  let p = 0;
  for (const [a, z] of [
    [3.6, 4.6],
    [10.5, 11.5],
    [28.0, 29.0],
    [40.0, 41.0],
  ]) {
    for (let i = at(a); i < at(z); i++) {
      p = Math.max(p, Math.abs(L(i)), Math.abs(R(i)));
    }
  }
  return p;
})();

const peakOver = (a, z) => {
  let p = 0;
  for (let i = a; i < z; i++) p = Math.max(p, Math.abs(L(i)), Math.abs(R(i)));
  return p / musicPeak;
};

const checks = [
  ["typing (intro)", frameAt(10), frameAt(40)],
  ["typing (prompt)", frameAt(495), frameAt(560)],
  ["send click", frameAt(579), frameAt(584)],
  ["tool step", frameAt(603), frameAt(610)],
  ["answer chime", frameAt(673), frameAt(687)],
];
console.log(
  `music-only rms ${musicOnly.toFixed(4)}  peak ${musicPeak.toFixed(3)}`,
);
for (const [name, a, z] of checks) {
  const ratio = over(a, z);
  const pk = peakOver(a, z);
  // Whichever measure is stronger reflects how present the sound really is.
  const best = Math.max(ratio, pk);
  const verdict = best >= 1.4 ? "ok" : best >= 1.0 ? "thin" : "BURIED";
  console.log(
    `  ${name.padEnd(18)} rms ${ratio.toFixed(2)}x  peak ${pk.toFixed(2)}x  ${verdict}`,
  );
}
