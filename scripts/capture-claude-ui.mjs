/**
 * Captures the real Claude composer states used by OpportunityPromptScene.
 *
 * Uses a dedicated Playwright profile under artifacts/pw-profile so the
 * user's own Chrome profile and credentials are never touched. The first
 * run opens a visible browser and waits for a manual sign-in; the session
 * then persists for later runs.
 *
 *   node scripts/capture-claude-ui.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PROFILE_DIR = path.join(ROOT, "artifacts", "pw-profile");
const OUT_DIR = path.join(ROOT, "artifacts", "opportunity-demo", "captures");

const QUESTION =
  "Show my team's open opportunities expected to close this month in SimpleCRM. Chart pipeline value by sales stage and owner, then list the three largest deals with their owners and expected close dates.";

fs.mkdirSync(PROFILE_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const log = (...a) =>
  console.log(new Date().toISOString().slice(11, 19), ...a);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  args: ["--window-size=1936,1160", "--window-position=0,0"],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());

log("Opening claude.ai …");
await page.goto("https://claude.ai/new", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});

log("Waiting for the composer. IF A LOGIN SCREEN IS SHOWING, SIGN IN NOW.");
const composer = page.locator('div[contenteditable="true"]').first();
await composer.waitFor({ state: "visible", timeout: 420000 });
log("Composer is visible - signed in.");

await page.waitForTimeout(3000);

const shot = async (name) => {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file });
  log("saved", name);
};

await shot("claude-connected-empty.png");

const composerBox = await composer.boundingBox();
log("composer box:", JSON.stringify(composerBox));

// Type the question exactly as the scene does.
await composer.click();
await page.keyboard.type(QUESTION, { delay: 6 });
await page.waitForTimeout(1500);
await shot("claude-prompt-ready.png");

const composerBoxTyped = await composer.boundingBox();
log("composer box after typing:", JSON.stringify(composerBoxTyped));

// Discover every button that is currently on screen, so the real Send
// control can be identified rather than guessed.
const buttons = [];
for (const b of await page.locator("button").all()) {
  const box = await b.boundingBox().catch(() => null);
  if (!box || box.width === 0 || box.height === 0) continue;
  buttons.push({
    ariaLabel: await b.getAttribute("aria-label").catch(() => null),
    dataTestId: await b.getAttribute("data-testid").catch(() => null),
    type: await b.getAttribute("type").catch(() => null),
    text: ((await b.innerText().catch(() => "")) || "").trim().slice(0, 48),
    box,
  });
}

fs.writeFileSync(
  path.join(OUT_DIR, "ui-geometry.json"),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      viewport: page.viewportSize(),
      composerBoxEmpty: composerBox,
      composerBoxTyped,
      question: QUESTION,
      buttons,
    },
    null,
    2,
  ),
);
log("saved ui-geometry.json with", buttons.length, "visible buttons");

for (const b of buttons) {
  if (
    (b.ariaLabel && /send/i.test(b.ariaLabel)) ||
    (b.dataTestId && /send/i.test(b.dataTestId))
  ) {
    log("LIKELY SEND BUTTON:", JSON.stringify(b));
  }
}

await ctx.close();
log("done");
