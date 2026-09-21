import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600"] });

export const FONT = fontFamily;

export const BRAND_BLUE = "#1976D2";
export const BRAND_BLUE_DEEP = "#12579B";
export const BRAND_BLUE_SOFT = "#5FA2E0";
export const BRAND_BLUE_PALE = "#E8F1FB";

export const CANVAS_LIGHT = "#FAFAFA";
export const SCREEN_BG = "#151515";
export const TEXT_DARK = "#1A1A1A";
export const TEXT_MUTED = "#5F6672";
export const HAIRLINE = "#E2E5EA";

// In-product (dark) surfaces, so the answer and charts read as part of
// Claude's UI rather than a separate light slide.
export const SIDEBAR_BG = "#1A1A1A";
export const SURFACE_DARK = "#1E1E1E";
export const SURFACE_RAISED = "#262626";
export const SURFACE_BORDER = "#2F2F2F";
export const TEXT_ON_DARK = "#F0F0F0";
export const TEXT_ON_DARK_MUTED = "#9BA1AA";
export const HAIRLINE_DARK = "#2C2C2C";

// Measured from public/assets/images/claude-main-screen.png and
// claude-prompt-send.png
export const COMPOSER_FILL = "#20201F";
export const COMPOSER_BORDER = "#4D4D4C";
export const COMPOSER_CHIP = "#303030";
export const SEND_CORAL = "#C6613F";

// The screenshots are 1917x910; they fill the full 1920 width and are
// centered vertically on the 1080 canvas.
export const SHOT_NATIVE_WIDTH = 1917;
export const SHOT_NATIVE_HEIGHT = 910;
export const DISPLAY_WIDTH = 1920;
export const DISPLAY_HEIGHT = 911;
export const DISPLAY_TOP = (1080 - DISPLAY_HEIGHT) / 2;

/** Map a screenshot-space x to canvas space. */
export const shotX = (x: number) => (x / SHOT_NATIVE_WIDTH) * DISPLAY_WIDTH;

/** Map a screenshot-space y to canvas space. */
export const shotY = (y: number) =>
  DISPLAY_TOP + (y / SHOT_NATIVE_HEIGHT) * DISPLAY_HEIGHT;

/**
 * In-UI chart card rect, shared so the end of OpportunityPromptScene and
 * the start of OpportunityInsightsScene line up exactly.
 */
export const CHART_CARD = { left: 260, top: 224, width: 1400, height: 578 };
export const CARD_PAD = 48;
