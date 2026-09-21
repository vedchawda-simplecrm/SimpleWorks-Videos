/**
 * Builds the finished stereo soundtrack for the video.
 *
 * Music is the supplied corporate bed; the effects are synthesised. Audio
 * is assembled here rather than with Remotion's <Audio> because this
 * Remotion (4.0.526) / Node 24 / Windows combination crashes on any RENDER
 * of a composition containing an audio asset. Scenes still reference these
 * tracks through <PreviewAudio>, which plays them in Studio only.
 *
 *   node scripts/build-audio-track.mjs
 *
 * CUE TIMINGS MIRROR THE SCENE CONSTANTS. If a scene's timing changes,
 * update the matching cue below.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SR = 44100;
const FPS = 30;
const TOTAL_FRAMES = 1485;
const OUT = path.join(process.cwd(), "public", "assets", "audio");
const MUSIC_MP3 = path.join(
  OUT,
  "sonican-cooking-background-music-loop-486763.mp3",
);
const MUSIC_PCM = path.join(OUT, "_music-decoded.wav");
fs.mkdirSync(OUT, { recursive: true });

let seed = 20260921;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const secOf = (frame) => frame / FPS;

// --- effects (mono) ------------------------------------------------------

/**
 * A key press modelled in three parts, which is what makes it read as a
 * keyboard rather than a thud: a crisp contact click, a short body
 * resonance underneath it, and a quieter release click as the key returns.
 */
const keyTick = (pitch = 1) => {
  const n = Math.floor(0.14 * SR);
  const out = new Float32Array(n);

  // Band-passed noise burst - bright enough to sound like contact.
  const addClick = (startSec, gain, brightness, decay) => {
    const start = Math.floor(startSec * SR);
    let lp1 = 0;
    let lp2 = 0;
    for (let i = 0; start + i < n; i++) {
      const t = i / SR;
      const noise = rand() * 2 - 1;
      lp1 += (noise - lp1) * brightness;
      lp2 += (lp1 - lp2) * 0.05;
      out[start + i] += (lp1 - lp2) * Math.exp(-t * decay) * gain;
    }
  };

  addClick(0, 0.5, 0.62, 400);

  // Body: a damped resonance that gives the key some weight.
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 85);
    out[i] +=
      (Math.sin(2 * Math.PI * 305 * pitch * t) * 0.5 +
        Math.sin(2 * Math.PI * 174 * pitch * t) * 0.32) *
      env *
      0.2;
  }

  // Release, a beat later and duller.
  addClick(0.052, 0.2, 0.45, 520);

  return out;
};

/**
 * An unhurried typing rhythm: roughly 5-8 keystrokes a second with a little
 * natural variation, rather than a machine-gun run.
 */
const typingRun = (seconds) => {
  const out = new Float32Array(Math.floor(seconds * SR));
  let t = 0.03;
  while (t < seconds - 0.1) {
    const tick = keyTick(0.9 + rand() * 0.25);
    const off = Math.floor(t * SR);
    const g = 0.62 + rand() * 0.2;
    for (let i = 0; i < tick.length; i++) {
      const j = off + i;
      if (j < out.length) out[j] += tick[i] * g;
    }
    // Occasionally pause a touch longer, the way real typing breathes.
    const pause = rand() < 0.18 ? 0.1 : 0;
    t += 0.155 + rand() * 0.1 + pause;
  }
  return out;
};

const uiClick = () => {
  const n = Math.floor(0.09 * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    lp += (rand() * 2 - 1 - lp) * 0.5;
    out[i] =
      lp * Math.exp(-t * 260) * 0.4 +
      Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 90) * 0.3 +
      Math.sin(2 * Math.PI * 1350 * t) * Math.exp(-t * 120) * 0.16;
  }
  return out;
};

const chime = () => {
  const n = Math.floor(1.1 * SR);
  const out = new Float32Array(n);
  const notes = [
    { f: 784, at: 0, g: 0.5 },
    { f: 1175, at: 0.11, g: 0.42 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const note of notes) {
      const lt = t - note.at;
      if (lt <= 0) continue;
      const env = Math.min(1, lt * 60) * Math.exp(-lt * 4.2);
      v +=
        (Math.sin(2 * Math.PI * note.f * lt) +
          0.28 * Math.sin(2 * Math.PI * note.f * 2 * lt)) *
        env *
        note.g;
    }
    out[i] = v * 0.34;
  }
  return out;
};

const stepTick = () => {
  const n = Math.floor(0.24 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 90) * Math.exp(-t * 13);
    out[i] =
      (Math.sin(2 * Math.PI * 1046 * t) * 0.5 +
        Math.sin(2 * Math.PI * 1568 * t) * 0.22) *
      env *
      0.3;
  }
  return out;
};

// --- music ---------------------------------------------------------------

const decodeMusic = () => {
  if (!fs.existsSync(MUSIC_MP3)) {
    throw new Error(`music track not found: ${MUSIC_MP3}`);
  }
  execSync(
    `npx remotion ffmpeg -hide_banner -y -i "${MUSIC_MP3}" -ar ${SR} -ac 2 -c:a pcm_s16le "${MUSIC_PCM}"`,
    { stdio: "ignore" },
  );
  const b = fs.readFileSync(MUSIC_PCM);
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
  const frames = Math.floor(len / 4); // stereo 16-bit
  const L = new Float32Array(frames);
  const R = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    L[i] = b.readInt16LE(off + i * 4) / 32768;
    R[i] = b.readInt16LE(off + i * 4 + 2) / 32768;
  }
  fs.rmSync(MUSIC_PCM, { force: true });
  return { L, R, frames };
};

// --- cue sheet -----------------------------------------------------------
// Scene offsets match SCENE_LAYOUT in src/scenes/FullVideo.tsx.
const INTRO = 0;
const CONNECTOR = 240;
const PROMPT = 435;
const INSIGHTS = 705;
const QUESTIONS = 1125;
const CLOSING = 1365;

const cues = [
  // IntroScene: types 6-42, question rises 72, answer lands 96,
  // logos 154, MCP pill 194.
  { at: INTRO + 6, sound: "typingIntro", gain: 0.45 },
  { at: INTRO + 96, sound: "chime", gain: 0.45 },
  { at: INTRO + 194, sound: "step", gain: 0.4 },

  // ConnectorScene: clicks at 20/48/86, connected badge 96.
  { at: CONNECTOR + 20, sound: "click", gain: 0.55 },
  { at: CONNECTOR + 48, sound: "click", gain: 0.55 },
  { at: CONNECTOR + 86, sound: "click", gain: 0.55 },
  { at: CONNECTOR + 96, sound: "chime", gain: 0.5 },

  // OpportunityPromptScene: types 30-132, send 144, view swap 178,
  // tool steps from 168 every 17, answer 238.
  { at: PROMPT + 30, sound: "typingPrompt", gain: 0.45 },
  { at: PROMPT + 144, sound: "click", gain: 0.6 },
  { at: PROMPT + 168, sound: "step", gain: 0.32 },
  { at: PROMPT + 185, sound: "step", gain: 0.32 },
  { at: PROMPT + 202, sound: "step", gain: 0.32 },
  { at: PROMPT + 219, sound: "step", gain: 0.32 },
  { at: PROMPT + 238, sound: "chime", gain: 0.5 },

  // OpportunityInsightsScene: tooltip 96, beat changes 180 and 330.
  { at: INSIGHTS + 96, sound: "step", gain: 0.26 },

  // OpportunityQuestionsScene: stack in 10, card changes 70 and 152.
  { at: QUESTIONS + 70, sound: "step", gain: 0.3 },
  { at: QUESTIONS + 152, sound: "step", gain: 0.3 },

  // ClosingScene: headline 5, plus lands 56.
  { at: CLOSING + 56, sound: "chime", gain: 0.5 },
];

// --- mix -----------------------------------------------------------------

const totalSeconds = TOTAL_FRAMES / FPS;
const n = Math.floor(totalSeconds * SR);
const L = new Float32Array(n);
const R = new Float32Array(n);

// Music, looped with a crossfade at the seam so the join is inaudible.
{
  const music = decodeMusic();

  // The supplied track fades out at the end. Looping the whole file would
  // replay that silence, so find the musical span first and loop only that.
  const win = Math.floor(0.05 * SR);
  const level = (at) => {
    let sum = 0;
    for (let i = at; i < Math.min(at + win, music.frames); i++) {
      sum += (music.L[i] * music.L[i] + music.R[i] * music.R[i]) / 2;
    }
    return Math.sqrt(sum / win);
  };
  const threshold = 0.02;
  let bodyStart = 0;
  while (bodyStart < music.frames && level(bodyStart) < threshold) {
    bodyStart += win;
  }
  let bodyEnd = music.frames - win;
  while (bodyEnd > bodyStart && level(bodyEnd) < threshold) {
    bodyEnd -= win;
  }
  const bodyLen = bodyEnd - bodyStart;
  console.log(
    `music body: ${(bodyStart / SR).toFixed(2)}s - ${(bodyEnd / SR).toFixed(2)}s (${(bodyLen / SR).toFixed(2)}s usable of ${(music.frames / SR).toFixed(2)}s)`,
  );

  // Crossfade proportional to the loop length: a long fade would smear a
  // short loop-designed track, but a short one still hides the seam.
  const xf = Math.floor(Math.min(1.5 * SR, bodyLen * 0.04));
  console.log(`loop crossfade: ${(xf / SR).toFixed(2)}s`);
  let pos = 0;
  let first = true;
  while (pos < n) {
    for (let i = 0; i < bodyLen; i++) {
      const j = pos + i;
      if (j >= n) break;
      let g = 1;
      if (!first && i < xf) g = i / xf;
      if (i > bodyLen - xf) g = Math.min(g, (bodyLen - i) / xf);
      L[j] += music.L[bodyStart + i] * g;
      R[j] += music.R[bodyStart + i] * g;
    }
    pos += bodyLen - xf;
    first = false;
  }

  // Set the bed's level before effects go on top. Kept deliberately low so
  // the typing, clicks and chimes stay clearly audible over it.
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
  const rms = Math.sqrt(sum / n);
  const target = 0.015;
  const g = rms > 0 ? target / rms : 1;
  for (let i = 0; i < n; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  // Fade the BED in and out - not the finished mix - so the opening
  // keystrokes and the closing chime are not swallowed by the fade.
  const musicFade = Math.floor(1.2 * SR);
  for (let i = 0; i < musicFade; i++) {
    const f = i / musicFade;
    L[i] *= f;
    R[i] *= f;
    L[n - 1 - i] *= f;
    R[n - 1 - i] *= f;
  }

  console.log(
    `music: ${(music.frames / SR).toFixed(1)}s looped to ${totalSeconds}s, gain x${g.toFixed(2)}`,
  );
}

const bank = {
  click: uiClick(),
  chime: chime(),
  step: stepTick(),
  typingIntro: typingRun((42 - 6) / FPS),
  typingPrompt: typingRun((132 - 30) / FPS),
};

// Effects are lifted as a group so they sit clearly above the bed, and the
// sparse ones - typing, ticks, transitions - get extra because their energy
// is spread thinly across a window rather than concentrated in a hit.
const SFX_GAIN = 2.0;
const SOUND_GAIN = {
  typingIntro: 3.4,
  typingPrompt: 3.4,
  step: 1.9,
  click: 1.0,
  chime: 1.0,
};

for (const cue of cues) {
  const src = bank[cue.sound];
  if (!src) throw new Error(`unknown sound: ${cue.sound}`);
  const off = Math.floor(secOf(cue.at) * SR);
  const g = cue.gain * SFX_GAIN * (SOUND_GAIN[cue.sound] ?? 1);
  for (let i = 0; i < src.length; i++) {
    const j = off + i;
    if (j >= 0 && j < n) {
      L[j] += src[i] * g;
      R[j] += src[i] * g;
    }
  }
}

// Very short top and tail on the finished mix, just to avoid edge clicks.
// The musical fade is applied to the bed above.
const fade = Math.floor(0.08 * SR);
for (let i = 0; i < fade; i++) {
  const g = i / fade;
  L[i] *= g;
  R[i] *= g;
  L[n - 1 - i] *= g;
  R[n - 1 - i] *= g;
}

// Lift to a normal listening level: peak just under -3dBFS.
{
  let peak = 0;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const gain = peak > 0 ? 0.72 / peak : 1;
  for (let i = 0; i < n; i++) {
    L[i] *= gain;
    R[i] *= gain;
  }
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
  console.log(
    `master gain x${gain.toFixed(2)} -> peak -2.9dBFS, rms ${(20 * Math.log10(Math.sqrt(sum / n))).toFixed(1)}dBFS`,
  );
}

const writeWav = (file, left, right) => {
  const frames = left.length;
  const bytes = frames * 4; // stereo 16-bit
  const buf = Buffer.alloc(44 + bytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + bytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(bytes, 40);
  for (let i = 0; i < frames; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  fs.writeFileSync(file, buf);
};

// Per-scene tracks, sliced out of the master so a scene preview sounds
// exactly like that stretch of the finished cut.
const SCENES = [
  { name: "IntroScene", from: INTRO, frames: 240 },
  { name: "ConnectorScene", from: CONNECTOR, frames: 195 },
  { name: "OpportunityPromptScene", from: PROMPT, frames: 270 },
  { name: "OpportunityInsightsScene", from: INSIGHTS, frames: 420 },
  { name: "OpportunityQuestionsScene", from: QUESTIONS, frames: 240 },
  { name: "ClosingScene", from: CLOSING, frames: 120 },
];
for (const scene of SCENES) {
  const start = Math.floor(secOf(scene.from) * SR);
  const len = Math.floor(secOf(scene.frames) * SR);
  writeWav(
    path.join(OUT, `audio-${scene.name}.wav`),
    L.slice(start, start + len),
    R.slice(start, start + len),
  );
}

writeWav(path.join(OUT, "full-audio.wav"), L, R);
console.log(
  `full-audio.wav  ${totalSeconds.toFixed(2)}s stereo  ${cues.length} cues  +${SCENES.length} scene tracks`,
);
