import { COL_LEFT, COL_WIDTH } from "./layout";
import {
  BRAND_BLUE,
  CARD,
  CARD_BORDER,
  CARD_SHADOW,
  FONT,
  INK,
} from "./theme";

/** Where the card sits before the answer lifts it out of the way. */
export const QUESTION_TOP = 356;

/**
 * The asked question. Shared by the three shots that show it so its resting
 * position is defined once; the caller supplies the body (typed or whole)
 * and how far it has been lifted.
 */
export const QuestionCard: React.FC<{
  children: React.ReactNode;
  /** 0 = resting, 1 = shrunk up to the top of frame. */
  lift?: number;
  opacity?: number;
  labelOpacity?: number;
  translateY?: number;
}> = ({
  children,
  lift = 0,
  opacity = 1,
  labelOpacity = 1,
  translateY = 0,
}) => {
  // Shrinking the whole card would also narrow it, leaving the recap out of
  // line with the answer cards below. Widening by the inverse of the scale
  // keeps the rendered width fixed so only the type gets smaller.
  const scale = 1 - lift * 0.28;
  return (
  <div
    style={{
      position: "absolute",
      left: COL_LEFT,
      top: QUESTION_TOP,
      width: COL_WIDTH / scale,
      fontFamily: FONT,
      opacity,
      transform: `translateY(${translateY + lift * -206}px) scale(${scale})`,
      transformOrigin: "left top",
    }}
  >
    <div
      style={{
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: BRAND_BLUE,
        marginBottom: 18,
        opacity: labelOpacity * (1 - lift),
      }}
    >
      Ask in plain English
    </div>
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 26,
        boxShadow: CARD_SHADOW,
        padding: "36px 40px",
        fontSize: 42,
        fontWeight: 500,
        lineHeight: 1.35,
        color: INK,
        minHeight: 120,
      }}
    >
      {children}
    </div>
  </div>
  );
};
