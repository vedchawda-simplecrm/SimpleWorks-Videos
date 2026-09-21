import { AbsoluteFill } from "remotion";
import { ClaudeMark } from "./ClaudeLogo";
import {
  COMPOSER_BORDER,
  COMPOSER_CHIP,
  COMPOSER_FILL,
  FONT,
  SCREEN_BG,
  SEND_CORAL,
  TEXT_ON_DARK,
  TEXT_ON_DARK_MUTED,
} from "../theme";

export const SURFACE_COMPOSER = {
  left: 410,
  top: 852,
  width: 1100,
  height: 156,
};

/**
 * The minimum amount of Claude UI needed for the answer to read as being
 * inside the product: the dark page, the response attribution mark, and a
 * real composer - text field plus its toolbar - pinned at the bottom.
 */
export const ClaudeSurface: React.FC<{
  children?: React.ReactNode;
  markOpacity?: number;
  markRotation?: number;
  composerOpacity?: number;
}> = ({ children, markOpacity = 1, markRotation = 0, composerOpacity = 1 }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: SCREEN_BG }}>
      {children}

      <div
        style={{
          position: "absolute",
          left: 262,
          top: 150,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: markOpacity,
        }}
      >
        <ClaudeMark size={38} rotation={markRotation} />
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 26,
            color: TEXT_ON_DARK_MUTED,
          }}
        >
          Claude
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: SURFACE_COMPOSER.left,
          top: SURFACE_COMPOSER.top,
          width: SURFACE_COMPOSER.width,
          height: SURFACE_COMPOSER.height,
          boxSizing: "border-box",
          padding: "26px 28px 22px",
          borderRadius: 18,
          backgroundColor: COMPOSER_FILL,
          border: `1px solid ${COMPOSER_BORDER}`,
          opacity: composerOpacity,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 400, color: "#6B6B6B" }}>
          Reply to Claude…
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{ fontSize: 30, color: TEXT_ON_DARK_MUTED, marginRight: 22 }}
          >
            +
          </div>
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              backgroundColor: COMPOSER_CHIP,
              color: TEXT_ON_DARK,
              fontSize: 21,
              fontWeight: 600,
            }}
          >
            Chat
          </div>
          <div
            style={{
              marginLeft: 16,
              fontSize: 21,
              fontWeight: 500,
              color: TEXT_ON_DARK_MUTED,
            }}
          >
            Cowork
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 21, fontWeight: 600, color: "#D8D8D8" }}>
            Sonnet 5
          </div>
          <div
            style={{
              marginLeft: 10,
              fontSize: 21,
              fontWeight: 500,
              color: TEXT_ON_DARK_MUTED,
            }}
          >
            Medium
          </div>
          <div
            style={{
              marginLeft: 22,
              width: 44,
              height: 44,
              borderRadius: 11,
              backgroundColor: SEND_CORAL,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 23,
              fontWeight: 600,
            }}
          >
            ↑
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
