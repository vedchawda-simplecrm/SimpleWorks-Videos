/**
 * R-YaBot AI-processing loader - drop-in React component.
 *
 * Dependency-free: a few divs, two <img> tags and the generated stylesheet.
 * All motion is CSS, so it keeps running on the compositor while the main
 * thread is busy waiting on the AI response - which is exactly when a loader
 * must not stutter.
 *
 *   import { RyabotLoader } from "./RyabotLoader";
 *   import "./ryabot-loader.css";
 *
 *   {isThinking && <RyabotLoader size={96} />}
 *
 * Mount it when the request starts and unmount it when the answer arrives.
 * Keep it mounted for the whole wait: remounting replays the settle.
 */
import * as React from "react";

/** Must match PULSE_RINGS in the generated stylesheet. */
const RINGS = 3;

export type RyabotLoaderProps = {
  /** Rendered size in px. The art is square. */
  size?: number;
  /**
   * Play the one-shot standing-to-meditation settle first (3.9s). Leave it
   * off for short waits, where the settle would be most of the wait.
   */
  withIntro?: boolean;
  /** Announced to assistive tech; also the title on hover. */
  label?: string;
  standingSrc?: string;
  meditatingSrc?: string;
  className?: string;
};

export const RyabotLoader: React.FC<RyabotLoaderProps> = ({
  size = 128,
  withIntro = false,
  label = "Thinking…",
  standingSrc = "/assets/ryabot-default.png",
  meditatingSrc = "/assets/ryabot-thinking.png",
  className,
}) => (
  <div
    className={[
      "ryabot-loader",
      withIntro ? "ryabot-loader--intro" : "ryabot-loader--idle",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    style={{ ["--ryabot-size" as string]: `${size}px` }}
    role="status"
    aria-live="polite"
    aria-label={label}
    title={label}
  >
    <div className="ryabot-loader__body">
      {/* Before the images, so the head occludes each ring as it is born. */}
      <div className="ryabot-loader__pulses" aria-hidden="true">
        {Array.from({ length: RINGS }, (_, k) => (
          <div key={k} className="ryabot-loader__ring" />
        ))}
      </div>
      <img
        className="ryabot-loader__pose ryabot-loader__pose--standing"
        src={standingSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="ryabot-loader__pose ryabot-loader__pose--meditating"
        src={meditatingSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </div>
  </div>
);
