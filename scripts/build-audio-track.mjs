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
  "alexguz-funk-amp-breakbeat-upbeat-advertising-happy-cook-541097.mp3",
);
const TYPING_MP3 = path.join(
  OUT,
  "virtualzero-keyboard-typing-fast-371229.mp3",
);
const SUCCESS_MP3 = path.join(OUT, "freesound_community-success-83493.mp3");
const CLICK_MP3 = path.join(OUT, "matthewvakaliuk73627-mouse-click-290204.mp3");
const DECODE_TMP = path.join(OUT, "_decoded.wav");
fs.mkdirSync(OUT, { recursive: true });

let seed = 20260921;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const secOf = (frame) => frame / FPS;

// --- effects (mono) ------------------------------------------------------

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

/** Decodes any supplied mp3 to stereo float arrays. */
const decodeMp3 = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`audio file not found: ${file}`);
  }
  execSync(
    `npx remotion ffmpeg -hide_banner -y -i "${file}" -ar ${SR} -ac 2 -c:a pcm_s16le "${DECODE_TMP}"`,
    { stdio: "ignore" },
  );
  const b = fs.readFileSync(DECODE_TMP);
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
  fs.rmSync(DECODE_TMP, { force: true });
  return { L, R, frames };
};

/**
 * Trims leading silence from a supplied sample and caps its length, fading
 * the tail so a long ring-out does not spill into the next scene.
 */
const sampleClip = (sample, maxSeconds, fadeOutSeconds) => {
  const w = Math.floor(0.05 * SR);
  const level = (s) => {
    let x = 0;
    for (let i = s; i < Math.min(s + w, sample.frames); i++) {
      x += (sample.L[i] * sample.L[i] + sample.R[i] * sample.R[i]) / 2;
    }
    return Math.sqrt(x / w);
  };
  let start = 0;
  while (start < sample.frames && level(start) < 0.01) start += w;

  const len = Math.min(
    Math.floor(maxSeconds * SR),
    sample.frames - start,
  );
  const L = new Float32Array(len);
  const R = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    L[i] = sample.L[start + i];
    R[i] = sample.R[start + i];
  }
  const fade = Math.min(len, Math.floor(fadeOutSeconds * SR));
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[len - 1 - i] *= g;
    R[len - 1 - i] *= g;
  }
  return { L, R };
};

/**
 * Cuts a run of real keyboard typing out of the supplied sample, looping it
 * if the run is longer than the recording, with short fades so the in and
 * out points do not click.
 */
/** Rounds off the top end so a sample blends with the bed. */
const soften = (clip, amount) => {
  let l = 0;
  let r = 0;
  const L = new Float32Array(clip.L.length);
  const R = new Float32Array(clip.R.length);
  for (let i = 0; i < clip.L.length; i++) {
    l += (clip.L[i] - l) * amount;
    r += (clip.R[i] - r) * amount;
    L[i] = l;
    R[i] = r;
  }
  return { L, R };
};

const typingFromSample = (sample, seconds, startSec) => {
  const len = Math.floor(seconds * SR);
  const L = new Float32Array(len);
  const R = new Float32Array(len);
  const start = Math.floor(startSec * SR);
  for (let i = 0; i < len; i++) {
    const j = (start + i) % sample.frames;
    L[i] = sample.L[j];
    R[i] = sample.R[j];
  }
  const fade = Math.floor(0.035 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[i] *= g;
    R[i] *= g;
    L[len - 1 - i] *= g;
    R[len - 1 - i] *= g;
  }
  return { L, R };
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
  { at: INTRO + 6, sound: "typingIntro", gain: 0.62 },
  // Starts 7 frames early because the sting peaks 0.25s in, so its impact
  // lands exactly on frame 96 where "Now it can!" pops.
  { at: INTRO + 89, sound: "success", gain: 0.34 },
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

// Music enters only AFTER the intro, eases in slowly and stays low for the
// rest of the film. MUSIC_START_FRAME is the first frame it is heard.
const MUSIC_START_FRAME = CONNECTOR;
const MUSIC_FADE_IN = 3.5;
const MUSIC_FADE_OUT = 1.5;
{
  const music = decodeMp3(MUSIC_MP3);

  // Skip any silent head/tail on the source so the fade-in starts on music.
  const win = Math.floor(0.05 * SR);
  const level = (at) => {
    let sum = 0;
    for (let i = at; i < Math.min(at + win, music.frames); i++) {
      sum += (music.L[i] * music.L[i] + music.R[i] * music.R[i]) / 2;
    }
    return Math.sqrt(sum / win);
  };
  let bodyStart = 0;
  while (bodyStart < music.frames && level(bodyStart) < 0.02) bodyStart += win;
  let bodyEnd = music.frames - win;
  while (bodyEnd > bodyStart && level(bodyEnd) < 0.02) bodyEnd -= win;
  const bodyLen = bodyEnd - bodyStart;

  const startSample = Math.floor(secOf(MUSIC_START_FRAME) * SR);
  const need = n - startSample;
  const xf = Math.floor(Math.min(0.35 * SR, bodyLen * 0.02));

  // Fill from the intro's end to the end of the film, looping only if the
  // track is shorter than what is left to cover.
  let pos = startSample;
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

  // Level: measured over the stretch music actually plays, kept low so the
  // effects stay clearly on top.
  let sum = 0;
  for (let i = startSample; i < n; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
  const rms = Math.sqrt(sum / need);
  const target = 0.015;
  const g = rms > 0 ? target / rms : 1;
  for (let i = startSample; i < n; i++) {
    L[i] *= g;
    R[i] *= g;
  }

  // Slow rise as it comes in, gentle fall at the very end.
  const fadeIn = Math.floor(MUSIC_FADE_IN * SR);
  for (let i = 0; i < fadeIn; i++) {
    const j = startSample + i;
    if (j >= n) break;
    const e = (i / fadeIn) ** 2; // eased, so it creeps in rather than ramps
    L[j] *= e;
    R[j] *= e;
  }
  const fadeOut = Math.floor(MUSIC_FADE_OUT * SR);
  for (let i = 0; i < fadeOut; i++) {
    const e = i / fadeOut;
    L[n - 1 - i] *= e;
    R[n - 1 - i] *= e;
  }

  console.log(
    `music: enters at frame ${MUSIC_START_FRAME} (${secOf(MUSIC_START_FRAME).toFixed(1)}s), ${MUSIC_FADE_IN}s fade-in, source ${(bodyLen / SR).toFixed(1)}s, gain x${g.toFixed(2)}`,
  );
}

const typingSample = decodeMp3(TYPING_MP3);
const successSample = decodeMp3(SUCCESS_MP3);
const clickSample = decodeMp3(CLICK_MP3);
const bank = {
  // Real mouse click; impact sits ~10ms in after trimming, well under a frame.
  click: sampleClip(clickSample, 0.25, 0.06),
  chime: chime(),
  step: stepTick(),
  // Supplied success sting, trimmed so its tail clears the scene.
  success: soften(sampleClip(successSample, 1.9, 0.9), 0.22),
  // Two different stretches of the recording so the shots do not repeat.
  typingIntro: typingFromSample(typingSample, (42 - 6) / FPS, 0.35),
  typingPrompt: typingFromSample(typingSample, (132 - 30) / FPS, 2.6),
};

// Effects are lifted as a group so they sit clearly above the bed, and the
// sparse ones - typing, ticks, transitions - get extra because their energy
// is spread thinly across a window rather than concentrated in a hit.
const SFX_GAIN = 2.0;
const SOUND_GAIN = {
  success: 1.0,
  typingIntro: 1.35,
  typingPrompt: 1.35,
  step: 1.9,
  click: 1.0,
  chime: 1.0,
};

for (const cue of cues) {
  const src = bank[cue.sound];
  if (!src) throw new Error(`unknown sound: ${cue.sound}`);
  const off = Math.floor(secOf(cue.at) * SR);
  const g = cue.gain * SFX_GAIN * (SOUND_GAIN[cue.sound] ?? 1);
  const stereo = !(src instanceof Float32Array);
  const srcL = stereo ? src.L : src;
  const srcR = stereo ? src.R : src;
  for (let i = 0; i < srcL.length; i++) {
    const j = off + i;
    if (j >= 0 && j < n) {
      L[j] += srcL[i] * g;
      R[j] += srcR[i] * g;
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

// Soft-limit before normalising. The real keyboard sample has sharp
// transients; without this they alone would set the ceiling and the
// normaliser would pull the music and everything else down with it.
{
  const knee = 0.8;
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh(L[i] / knee) * knee;
    R[i] = Math.tanh(R[i] / knee) * knee;
  }
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
