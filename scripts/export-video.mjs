/**
 * Exports a composition WITH sound.
 *
 * Remotion's own render (including the Render button in Studio) always
 * produces a silent file here: this Remotion/Node/Windows combination
 * crashes on any composition containing an audio asset, so <PreviewAudio>
 * deliberately renders nothing outside Studio. This script renders the
 * video and muxes the prebuilt soundtrack onto it.
 *
 *   node scripts/export-video.mjs                  -> out/full-video.mp4
 *   node scripts/export-video.mjs IntroScene       -> out/IntroScene.mp4
 *   node scripts/export-video.mjs FullVideo --fps60
 *   node scripts/export-video.mjs --all
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const AUDIO = path.join(ROOT, "public", "assets", "audio");
const OUT = path.join(ROOT, "out");
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const fps60 = args.includes("--fps60");
const all = args.includes("--all");
const named = args.filter((a) => !a.startsWith("--"));

const COMPOSITIONS = {
  FullVideo: { audio: "full-audio", file: "full-video" },
  IntroScene: { audio: "audio-IntroScene", file: "intro-preview" },
  ConnectorScene: { audio: "audio-ConnectorScene", file: "connector-preview" },
  OpportunityPromptScene: {
    audio: "audio-OpportunityPromptScene",
    file: "OpportunityPromptScene",
  },
  OpportunityInsightsScene: {
    audio: "audio-OpportunityInsightsScene",
    file: "OpportunityInsightsScene",
  },
  OpportunityQuestionsScene: {
    audio: "audio-OpportunityQuestionsScene",
    file: "OpportunityQuestionsScene",
  },
  ClosingScene: { audio: "audio-ClosingScene", file: "ClosingScene" },
};

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const quiet = (cmd) => execSync(cmd, { stdio: "ignore" });

// Always rebuild the soundtrack so it cannot drift from the scenes.
console.log("→ building soundtrack");
run(`node "${path.join(ROOT, "scripts", "build-audio-track.mjs")}"`);

const targets = all
  ? Object.keys(COMPOSITIONS)
  : named.length
    ? named
    : ["FullVideo"];

for (const id of targets) {
  const spec = COMPOSITIONS[id];
  if (!spec) {
    throw new Error(
      `unknown composition "${id}". Known: ${Object.keys(COMPOSITIONS).join(", ")}`,
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
