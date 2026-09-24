import { interpolate } from "remotion";
import { COL_LEFT, COL_WIDTH } from "./layout";
import { answers } from "./ryabotData";
import {
  BRAND_BLUE,
  CARD,
  CARD_BORDER,
  CARD_SHADOW,
  FONT,
  INK,
  INK_MUTED,
  SAFFRON,
} from "./theme";

export const CARD_TOP = 350;
export const CARD_HEIGHT = 152;
export const CARD_GAP = 20;

/**
 * The three answer cards. Shared between the answer shot, which staggers
 * them in, and the closing shot, which fades the same layout back out - so
 * the two agree on position without either drifting.
 */
export const AnswerCards: React.FC<{
  /** 0..1 per card, from the caller's own timing. */
  enterAt: (index: number) => number;
  /** Multiplies every card's opacity, for the fade-out. */
  opacity?: number;
}> = ({ enterAt, opacity = 1 }) => (
  <>
    {answers.map((answer, i) => {
      const enter = enterAt(i);
      const accent = answer.accent === "blue" ? BRAND_BLUE : SAFFRON;
      return (
        <div
          key={answer.title}
          style={{
            position: "absolute",
            left: COL_LEFT,
            top: CARD_TOP + i * (CARD_HEIGHT + CARD_GAP),
            width: COL_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: CARD,
            border: `1px solid ${CARD_BORDER}`,
            borderLeft: `5px solid ${accent}`,
            borderRadius: 22,
            boxShadow: CARD_SHADOW,
            padding: "26px 34px",
            boxSizing: "border-box",
            fontFamily: FONT,
            opacity:
              opacity *
              interpolate(enter, [0, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            transform: `translateX(${interpolate(enter, [0, 1], [-34, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 600, color: INK }}>
            {answer.title}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 27,
              fontWeight: 400,
              color: INK_MUTED,
            }}
          >
            {answer.body}
          </div>
        </div>
      );
    })}
  </>
);
