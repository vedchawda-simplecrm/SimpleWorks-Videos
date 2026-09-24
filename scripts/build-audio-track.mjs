/**
 * Builds the finished stereo soundtrack for a video.
 *
 * Audio is assembled here rather than with Remotion's <Audio> because this
 * Remotion (4.0.526) / Node 24 / Windows combination crashes on any RENDER
 * of a composition containing an audio asset. Scenes reference these tracks
 * through <PreviewAudio>, which plays them in Studio only; the renderer
 * never sees them and the track is muxed on afterwards.
 *
 *   node scripts/build-audio-track.mjs [video-id]
 *
 * Each video's cue sheet and scene layout live in scripts/video-config.mjs.
 * CUE FRAMES MIRROR THE SCENE TIMING CONSTANTS - if a scene's timing
 * changes, update the matching cue there.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { DEFAULT_VIDEO, FPS, SAMPLES, getVideo } from "./video-config.mjs";

const SR = 44100;
const OUT = path.join(process.cwd(), "public", "assets", "audio");
const DECODE_TMP = path.join(OUT, "_decoded.wav");
fs.mkdirSync(OUT, { recursive: true });

const video = getVideo(process.argv[2] || DEFAULT_VIDEO);
const secOf = (frame) => frame / FPS;

let seed = 20260921;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// --- synthesised effects -------------------------------------------------

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

// --- supplied samples ----------------------------------------------------

/** Decodes any supplied mp3 to stereo float arrays. */
const decodeMp3 = (file) => {
  const full = path.join(OUT, file);
  if (!fs.existsSync(full)) throw new Error(`audio file not found: ${full}`);
  execSync(
    `npx remotion ffmpeg -hide_banner -y -i "${full}" -ar ${SR} -ac 2 -c:a pcm_s16le "${DECODE_TMP}"`,
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
  const frames = Math.floor(len / 4);
  const L = new Float32Array(frames);
  const R = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    L[i] = b.readInt16LE(off + i * 4) / 32768;
    R[i] = b.readInt16LE(off + i * 4 + 2) / 32768;
  }
  fs.rmSync(DECODE_TMP, { force: true });
  return { L, R, frames };
};

/** Finds the non-silent span of a sample. */
const contentSpan = (sample, threshold = 0.02) => {
  const win = Math.floor(0.05 * SR);
  const level = (at) => {
    let sum = 0;
    for (let i = at; i < Math.min(at + win, sample.frames); i++) {
      sum += (sample.L[i] * sample.L[i] + sample.R[i] * sample.R[i]) / 2;
    }
    return Math.sqrt(sum / win);
  };
  let start = 0;
  while (start < sample.frames && level(start) < threshold) start += win;
  let end = sample.frames - win;
  while (end > start && level(end) < threshold) end -= win;
  return { start, end, length: end - start };
};

/** Trims leading silence and caps length, fading the tail. */
const sampleClip = (sample, maxSeconds, fadeOutSeconds) => {
  const { start } = contentSpan(sample, 0.01);
  const len = Math.min(Math.floor(maxSeconds * SR), sample.frames - start);
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

/** Cuts a run of typing from the recording, looping if the run is longer. */
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

// --- mix -----------------------------------------------------------------

const totalSeconds = video.totalFrames / FPS;
const n = Math.floor(totalSeconds * SR);
const L = new Float32Array(n);
const R = new Float32Array(n);

{
  const music = decodeMp3(video.music);
  const body = contentSpan(music);
  const startSample = Math.floor(secOf(video.musicStartFrame) * SR);
  const need = n - startSample;
  const xf = Math.floor(Math.min(0.35 * SR, body.length * 0.02));

  // Fill from the music's entry to the end, looping only if the source is
  // shorter than the stretch it has to cover.
  let pos = startSample;
  let first = true;
  while (pos < n) {
    for (let i = 0; i < body.length; i++) {
      const j = pos + i;
      if (j >= n) break;
      let g = 1;
      if (!first && i < xf) g = i / xf;
      if (i > body.length - xf) g = Math.min(g, (body.length - i) / xf);
      L[j] += music.L[body.start + i] * g;
      R[j] += music.R[body.start + i] * g;
    }
    pos += body.length - xf;
    first = false;
  }

  // Level the bed over the stretch it actually plays, kept low so the
  // effects stay clearly on top.
  let sum = 0;
  for (let i = startSample; i < n; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
  const rms = Math.sqrt(sum / need);
  const g = rms > 0 ? video.musicTargetRms / rms : 1;
  for (let i = startSample; i < n; i++) {
    L[i] *= g;
    R[i] *= g;
  }

  // Slow rise as it comes in, gentle fall at the very end.
  const fadeIn = Math.floor(video.musicFadeIn * SR);
  for (let i = 0; i < fadeIn; i++) {
    const j = startSample + i;
    if (j >= n) break;
    const e = (i / fadeIn) ** 2; // eased, so it creeps in rather than ramps
    L[j] *= e;
    R[j] *= e;
  }
  const fadeOut = Math.floor(video.musicFadeOut * SR);
  for (let i = 0; i < fadeOut; i++) {
    const e = i / fadeOut;
    L[n - 1 - i] *= e;
    R[n - 1 - i] *= e;
  }

  console.log(
    `music: enters at frame ${video.musicStartFrame} (${secOf(video.musicStartFrame).toFixed(1)}s), ${video.musicFadeIn}s fade-in, source ${(body.length / SR).toFixed(1)}s, gain x${g.toFixed(2)}`,
  );
}

const typingSample = decodeMp3(SAMPLES.typing);
const clickSample = decodeMp3(SAMPLES.click);
const successSample = decodeMp3(SAMPLES.success);

const bank = {
  // Real mouse click; impact sits ~10ms in after trimming, under a frame.
  click: sampleClip(clickSample, 0.25, 0.06),
  chime: chime(),
  step: stepTick(),
  // Supplied success sting, trimmed and softened so it sits with the bed.
  success: soften(sampleClip(successSample, 1.9, 0.9), 0.22),
};
for (const [name, spec] of Object.entries(video.typingRuns ?? {})) {
  bank[name] = typingFromSample(typingSample, spec.seconds, spec.from);
}

// Effects are lifted as a group so they sit clearly above the bed, and the
// sparse ones get extra because their energy is spread thinly across a
// window rather than concentrated in a hit.
const SFX_GAIN = 2.0;
const SOUND_GAIN = {
  success: 1.0,
  step: 1.9,
  click: 1.0,
  chime: 1.0,
};
// Typing runs are spread thinly over a window, so they need a lift the
// per-hit sounds do not. Matched by prefix so each video can name its own.
const gainFor = (sound) =>
  SOUND_GAIN[sound] ?? (sound.startsWith("typing") ? 1.35 : 1);

for (const cue of video.cues) {
  const src = bank[cue.sound];
  if (!src) throw new Error(`unknown sound: ${cue.sound}`);
  const off = Math.floor(secOf(cue.at) * SR);
  const g = cue.gain * SFX_GAIN * gainFor(cue.sound);
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
const fade = Math.floor(0.08 * SR);
for (let i = 0; i < fade; i++) {
  const g = i / fade;
  L[i] *= g;
  R[i] *= g;
  L[n - 1 - i] *= g;
  R[n - 1 - i] *= g;
}

// Soft-limit before normalising. Real keyboard transients are sharp; without
// this they alone would set the ceiling and the normaliser would pull the
// music and everything else down with them.
{
  const knee = 0.8;
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh(L[i] / knee) * knee;
    R[i] = Math.tanh(R[i] / knee) * knee;
  }
}

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
  const bytes = frames * 4;
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
for (const scene of video.scenes) {
  const start = Math.floor(secOf(scene.from) * SR);
  const len = Math.floor(secOf(scene.frames) * SR);
  writeWav(
    path.join(OUT, `audio-${scene.name}.wav`),
    L.slice(start, start + len),
    R.slice(start, start + len),
  );
}

writeWav(path.join(OUT, `${video.audioTrack}.wav`), L, R);
console.log(
  `${video.audioTrack}.wav  ${totalSeconds.toFixed(2)}s stereo  ${video.cues.length} cues  +${video.scenes.length} scene tracks`,
);
