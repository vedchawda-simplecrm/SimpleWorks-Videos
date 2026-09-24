import * as React from "react";
import { useEffect, useState } from "react";
import { RyabotLoader } from "./RyabotLoader";
import { useRyabotLoading } from "./useRyabotLoading";

/**
 * The loader wired up for a real screen: list views, filter re-runs, and
 * anything else whose duration is not known in advance.
 *
 *   <div style={{ position: "relative" }}>
 *     <RyabotLoading loading={isFetching} overlay caption="Loading records" />
 *     <DataTable rows={rows} />
 *   </div>
 *
 * The settle plays once and then R-YaBot simply stays meditating for as long
 * as `loading` is true - the idle is an infinite CSS loop, so there is no
 * duration to guess at and nothing to keep in sync with the request.
 */
export type RyabotLoadingProps = {
  loading: boolean;
  size?: number;
  /** Announced to assistive tech. */
  label?: string;
  /** Optional line under the character, e.g. "Loading opportunities". */
  caption?: string;
  /**
   * When the standing-to-meditation settle plays.
   *
   * "once"   - the first time the loader appears (default). Re-applying a
   *            filter goes straight to the meditation pose, which is what
   *            you want: a 3.9s settle on every filter change reads as the
   *            app being slower than it is.
   * "always" - replay it on every appearance.
   * "never"  - meditation pose only.
   */
  intro?: "once" | "always" | "never";
  delay?: number;
  minVisible?: number;
  /** Fill and centre over the nearest positioned ancestor. */
  overlay?: boolean;
  standingSrc?: string;
  meditatingSrc?: string;
  className?: string;
};

export const RyabotLoading: React.FC<RyabotLoadingProps> = ({
  loading,
  size = 112,
  label = "Loading",
  caption,
  intro = "once",
  delay,
  minVisible,
  overlay = false,
  standingSrc,
  meditatingSrc,
  className,
}) => {
  const visible = useRyabotLoading(loading, { delay, minVisible });

  // `run` is null until the loader has been needed once. Mounting it lazily
  // is what makes "once" work: the settle is a CSS animation that starts on
  // mount, so a loader mounted-but-hidden at page load would play its settle
  // where nobody could see it, and every real load would then open on the
  // meditation pose.
  const [run, setRun] = useState<number | null>(null);
  useEffect(() => {
    if (!visible) return;
    setRun((r) => (r === null ? 0 : intro === "always" ? r + 1 : r));
  }, [visible, intro]);

  if (run === null) return null;

  return (
    <div
      className={[
        "ryabot-loading",
        overlay ? "ryabot-loading--overlay" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
    >
      {/* Remounting is what replays the settle, so the key only changes when
          the caller asked for that. */}
      <RyabotLoader
        key={intro === "always" ? run : "ryabot"}
        size={size}
        withIntro={intro !== "never"}
        label={label}
        standingSrc={standingSrc}
        meditatingSrc={meditatingSrc}
      />
      {caption ? <span className="ryabot-loading__caption">{caption}</span> : null}
    </div>
  );
};
