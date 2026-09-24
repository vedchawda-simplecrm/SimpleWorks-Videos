import { useEffect, useRef, useState } from "react";

export type RyabotLoadingOptions = {
  /**
   * Wait this long before showing anything. A list that comes back from
   * cache in 80ms should show no loader at all: a spinner that appears and
   * vanishes reads as a glitch and makes the app feel less responsive, not
   * more.
   */
  delay?: number;
  /**
   * Once shown, stay up at least this long. Without it, a response arriving
   * just after the delay makes the loader flash for a few frames.
   */
  minVisible?: number;
};

/**
 * Turns a raw `isLoading` flag into "should the loader actually be on
 * screen", which is not the same question when load times vary.
 *
 * Returns a single boolean; the timing rules are the whole point.
 */
export const useRyabotLoading = (
  loading: boolean,
  { delay = 250, minVisible = 700 }: RyabotLoadingOptions = {},
): boolean => {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (loading) {
      // Already up: nothing to schedule, and do not restart the clock.
      if (visible) return;
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!visible) return;
    const remaining = minVisible - (Date.now() - shownAt.current);
    if (remaining <= 0) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timer);
  }, [loading, visible, delay, minVisible]);

  return visible;
};
