/**
 * Exports a composition WITH sound.
 *
 * Remotion's own render (including the Render button in Studio) always
 * produces a silent file here: this Remotion/Node/Windows combination
 * crashes on any composition containing an audio asset, so <PreviewAudio>
 * deliberately renders nothing outside Studio. This script renders the
 * video and muxes the prebuilt soundtrack onto it.
 *
 *   node scripts/export-video.mjs                        -> out/full-video.mp4
 *   node scripts/export-video.mjs IntroScene             -> out/intro-preview.mp4
 *   node scripts/export-video.mjs --fps60
 *   node scripts/export-video.mjs --all
 *   node scripts/export-video.mjs --video ryabot         -> out/ryabot-video.mp4
 *   node scripts/export-video.mjs --video ryabot --all
 *
 * What each video contains is declared in scripts/video-config.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { DEFAULT_VIDEO, getVideo } from "./video-config.mjs";

const ROOT = process.cwd();
const AUDIO = path.join(ROOT, "public", "assets", "audio");
const OUT = path.join(ROOT, "out");
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const fps60 = args.includes("--fps60");
const all = args.includes("--all");
const videoFlag = args.indexOf("--video");
const videoId = videoFlag === -1 ? DEFAULT_VIDEO : args[videoFlag + 1];
const named = args.filter(
  (a, i) => !a.startsWith("--") && i !== videoFlag + 1,
);

const video = getVideo(videoId);

// The master plus one entry per scene, so a scene can be exported on its own
// with exactly the stretch of soundtrack that plays under it.
const COMPOSITIONS = {
  [video.composition]: { audio: video.audioTrack, file: video.output },
  ...Object.fromEntries(
    video.scenes.map((scene) => [
      scene.name,
      { audio: `audio-${scene.name}`, file: scene.output },
    ]),
  ),
};

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const quiet = (cmd) => execSync(cmd, { stdio: "ignore" });

// Always rebuild the soundtrack so it cannot drift from the scenes.
console.log(`→ building soundtrack for "${video.id}"`);
run(`node "${path.join(ROOT, "scripts", "build-audio-track.mjs")}" ${video.id}`);

const targets = all
  ? Object.keys(COMPOSITIONS)
  : named.length
    ? named
    : [video.composition];

for (const id of targets) {
  const spec = COMPOSITIONS[id];
  if (!spec) {
    throw new Error(
      `"${id}" is not part of video "${video.id}". Known: ${Object.keys(COMPOSITIONS).join(", ")}`,
    );
  }
  const audio = path.join(AUDIO, `${spec.audio}.wav`);
  if (!fs.existsSync(audio)) throw new Error(`missing audio track: ${audio}`);

  const silent = path.join(OUT, `_${spec.file}-silent.mp4`);
  const final = path.join(OUT, `${spec.file}.mp4`);

  console.log(`\n→ rendering ${id}`);
  run(`npx remotion render ${id} "${silent}"`);

  console.log(`→ adding sound`);
  if (fps60) {
    const out60 = path.join(OUT, `${spec.file}-60fps.mp4`);
    quiet(
      `npx remotion ffmpeg -hide_banner -y -i "${silent}" -i "${audio}" -r 60 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${out60}"`,
    );
    console.log(`   ${path.relative(ROOT, out60)}`);
  }
  quiet(
    `npx remotion ffmpeg -hide_banner -y -i "${silent}" -i "${audio}" -c:v copy -c:a aac -b:a 192k -shortest "${final}"`,
  );
  fs.rmSync(silent, { force: true });

  // Confirm the track actually made it in.
  const probe = execSync(
    `npx remotion ffmpeg -hide_banner -i "${final}" 2>&1 || true`,
    { encoding: "utf8", shell: true },
  );
  const hasAudio = /Audio:/.test(probe);
  const duration = (probe.match(/Duration: ([0-9:.]+)/) || [])[1];
  console.log(
    `   ${path.relative(ROOT, final)}  ${duration}  audio: ${hasAudio ? "yes" : "NO"}`,
  );
  if (!hasAudio) throw new Error(`export produced no audio track: ${final}`);
}

console.log("\ndone");
