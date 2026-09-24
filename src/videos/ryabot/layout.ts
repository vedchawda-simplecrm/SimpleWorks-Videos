/**
 * Shared geometry for the ryabot spot.
 *
 * The character holds one position across the first three scenes so the
 * Sequence boundaries are invisible; only the closing shot moves it. Scene
 * offsets are duplicated here so a scene can work out its absolute frame and
 * keep the idle float continuous across those boundaries.
 */
export const MEET_FROM = 0;
export const ASK_FROM = 150;
export const ANSWER_FROM = 330;
export const CLOSING_FROM = 540;
export const RYABOT_VIDEO_DURATION = 660;

/** Where the character sits for Meet / Ask / Answer. */
export const STAGE = { cx: 1400, cy: 540, size: 620 };
/** Where it settles for the closing shot. */
export const STAGE_CLOSE = { cx: 960, cy: 442, size: 540 };

/** The text column to the left of the character. */
export const COL_LEFT = 150;
export const COL_WIDTH = 830;

/**
 * One slow, monotonic push-in shared by Meet / Ask / Answer.
 *
 * It is a function of the MASTER frame rather than the scene frame, so the
 * camera does not snap back to 1.0 every time a Sequence hands over.
 */
export const cameraPush = (absFrame: number) =>
  1 + 0.035 * Math.min(1, Math.max(0, absFrame / CLOSING_FROM));

export const CAMERA_ORIGIN = "62% 50%";
