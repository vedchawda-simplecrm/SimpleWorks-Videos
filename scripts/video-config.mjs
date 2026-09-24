/**
 * Every video in this project, described in one place.
 *
 * Each entry owns its scene layout, its sound cue sheet and its music
 * settings, so adding a second video does not disturb the first. The scene
 * offsets here MUST match SCENE_LAYOUT in that video's master composition,
 * and the cue frames mirror the timing constants inside each scene.
 */

export const FPS = 30;

/** Sound effect sources shared by all videos. */
export const SAMPLES = {
  music: {
    simplecrmClaude:
      "alexguz-funk-amp-breakbeat-upbeat-advertising-happy-cook-541097.mp3",
  },
  typing: "virtualzero-keyboard-typing-fast-371229.mp3",
  click: "matthewvakaliuk73627-mouse-click-290204.mp3",
  success: "freesound_community-success-83493.mp3",
};

const INTRO = 0;
const CONNECTOR = 240;
const PROMPT = 435;
const INSIGHTS = 705;
const QUESTIONS = 1125;
const CLOSING = 1365;

// ryabot spot - must match src/videos/ryabot/layout.ts
const R_MEET = 0;
const R_ASK = 150;
const R_ANSWER = 330;
const R_CLOSING = 540;

export const VIDEOS = {
  "simplecrm-claude": {
    // Master composition id and the file name its export is written to.
    composition: "FullVideo",
    output: "full-video",
    // Name of the built soundtrack, without extension. Kept separate from
    // `output` because scenes reference it by name through <PreviewAudio>.
    audioTrack: "full-audio",
    totalFrames: 1485,
    music: SAMPLES.music.simplecrmClaude,
    // The bed stays out of the intro, then eases in and runs to the end.
    musicStartFrame: CONNECTOR,
    musicFadeIn: 3.5,
    musicFadeOut: 1.5,
    musicTargetRms: 0.015,
    scenes: [
      { name: "IntroScene", output: "intro-preview", from: INTRO, frames: 240 },
      {
        name: "ConnectorScene",
        output: "connector-preview",
        from: CONNECTOR,
        frames: 195,
      },
      {
        name: "OpportunityPromptScene",
        output: "OpportunityPromptScene",
        from: PROMPT,
        frames: 270,
      },
      {
        name: "OpportunityInsightsScene",
        output: "OpportunityInsightsScene",
        from: INSIGHTS,
        frames: 420,
      },
      {
        name: "OpportunityQuestionsScene",
        output: "OpportunityQuestionsScene",
        from: QUESTIONS,
        frames: 240,
      },
      { name: "ClosingScene", output: "ClosingScene", from: CLOSING, frames: 120 },
    ],
    // Typing runs are cut to the length of the shot they sit under.
    typingRuns: {
      typingIntro: { seconds: (42 - 6) / FPS, from: 0.35 },
      typingPrompt: { seconds: (132 - 30) / FPS, from: 2.6 },
    },
    cues: [
      // IntroScene: types 6-42, question rises 72, answer lands 96,
      // logos 154, MCP pill 194.
      { at: INTRO + 6, sound: "typingIntro", gain: 0.62 },
      // Starts 7 frames early because the sting peaks 0.25s in, so its
      // impact lands exactly on frame 96 where "Now it can!" pops.
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
    ],
    // Stretches with no cue scheduled, used to measure the bed on its own.
    quietWindows: [
      [13.0, 14.5],
      [24.5, 26.0],
      [30.0, 32.0],
      [35.0, 37.0],
      [44.0, 45.5],
    ],
    // Moments the checker verifies are audible over the bed.
    audibilityChecks: [
      ["typing (intro)", 10, 40],
      ["typing (prompt)", 495, 560],
      ["send click", 579, 584],
      ["tool step", 603, 610],
      ["answer chime", 673, 687],
      ["now it can (success)", 89, 140],
    ],
    musicSettledAt: 12.5,
  },

  // The ryabot spot. Separate cut, separate compositions, separate track.
  // NOTE: it currently borrows the other video's music bed because that is
  // the only cleared loop in the project - a calmer piece would suit the
  // character better.
  ryabot: {
    composition: "RyabotVideo",
    output: "ryabot-video",
    audioTrack: "ryabot-audio",
    totalFrames: 660,
    music: SAMPLES.music.simplecrmClaude,
    // Unlike the other cut, the bed runs from the first frame: there is no
    // silent title beat to protect.
    musicStartFrame: 0,
    musicFadeIn: 3,
    musicFadeOut: 2,
    musicTargetRms: 0.013,
    scenes: [
      { name: "RyabotMeetScene", output: "ryabot-meet", from: R_MEET, frames: 150 },
      { name: "RyabotAskScene", output: "ryabot-ask", from: R_ASK, frames: 180 },
      {
        name: "RyabotAnswerScene",
        output: "ryabot-answer",
        from: R_ANSWER,
        frames: 210,
      },
      {
        name: "RyabotClosingScene",
        output: "ryabot-closing",
        from: R_CLOSING,
        frames: 120,
      },
    ],
    typingRuns: {
      typingRyabot: { seconds: (88 - 16) / FPS, from: 1.2 },
    },
    cues: [
      // Meet: character arrives 4, logo 26, headline 38.
      { at: R_MEET + 6, sound: "chime", gain: 0.34 },

      // Ask: question types 16-88, pose settles 92.
      { at: R_ASK + 16, sound: "typingRyabot", gain: 0.5 },
      { at: R_ASK + 92, sound: "step", gain: 0.28 },

      // Answer: cards land 44, 62, 80.
      { at: R_ANSWER + 44, sound: "chime", gain: 0.42 },
      { at: R_ANSWER + 62, sound: "step", gain: 0.26 },
      { at: R_ANSWER + 80, sound: "step", gain: 0.26 },

      // Closing: tagline lands 52. The sting peaks 0.25s in, so it starts
      // 7 frames early for the impact to fall on the word.
      { at: R_CLOSING + 45, sound: "success", gain: 0.3 },
    ],
    quietWindows: [
      [2.0, 4.5],
      [9.5, 11.5],
      [15.5, 18.5],
      [20.5, 21.5],
    ],
    audibilityChecks: [
      ["typing", 170, 240],
      ["pose settle", 242, 254],
      ["first card", 374, 392],
      ["tagline", 585, 630],
    ],
    musicSettledAt: 3.5,
  },
};

export const getVideo = (id) => {
  const video = VIDEOS[id];
  if (!video) {
    throw new Error(
      `unknown video "${id}". Known: ${Object.keys(VIDEOS).join(", ")}`,
    );
  }
  return { id, ...video };
};

export const DEFAULT_VIDEO = "simplecrm-claude";
