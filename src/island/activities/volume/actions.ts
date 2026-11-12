import { useIslandStore } from '../../store';

let level = 0.6;

/** Changes the volume by `delta` (0 to 1 scale) and shows the level. */
export function nudgeVolume(delta: number): void {
  level = Math.min(1, Math.max(0, Math.round((level + delta) * 100) / 100));
  useIslandStore.getState().show('volume', { level });
}
