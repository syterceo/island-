import { useEffect, useState } from 'react';

/**
 * Current wall clock time, refreshed every `intervalMs`. Derive countdowns, elapsed times and
 * playback positions from timestamps in activity data plus this value instead of storing ticks.
 *
 * Updates land on multiples of the interval counted from `anchor`. Pass the timestamp the
 * display is measured from (a start or an end time) and its seconds change exactly when they
 * should, one second apart. A free running interval drifts against the clock and makes
 * the digits tick unevenly.
 */
export function useNow(intervalMs = 1000, enabled = true, anchor = 0): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const phase = (((Date.now() - anchor) % intervalMs) + intervalMs) % intervalMs;
      // A few milliseconds past the boundary, so the value has certainly changed.
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, intervalMs - phase + 4);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [intervalMs, enabled, anchor]);

  return now;
}
