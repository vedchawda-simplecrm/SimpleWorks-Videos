import { AbsoluteFill } from "remotion";
import { BRAND_BLUE, CREAM, CREAM_DEEP } from "./theme";

/**
 * The canvas every ryabot shot sits on. Kept in one place so the four
 * scenes share an identical background and cut together seamlessly.
 */
export const RyabotStage: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 1300px 900px at 72% 46%, ${CREAM} 0%, ${CREAM_DEEP} 100%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 900px 700px at 8% 92%, ${BRAND_BLUE}12 0%, ${BRAND_BLUE}00 70%)`,
      }}
    />
    {children}
  </AbsoluteFill>
);
