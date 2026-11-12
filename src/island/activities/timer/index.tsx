import { PauseIcon, PlayIcon, TimerIcon, XIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { Digits, formatClock, IconButton, ProgressRing, Rise, Swap, ui } from '../../ui/kit';

interface TimerData {
  durationMs: number;
  /** Wall clock time at which the countdown reaches zero while running. */
  endsAt: number;
  /** Remaining time captured at pause, or null while running. */
  pausedMs: number | null;
}

const ORANGE = 'var(--island-orange)';

function remainingMs(data: TimerData, now: number): number {
  return Math.max(0, data.pausedMs ?? data.endsAt - now);
}

function fraction(data: TimerData, now: number): number {
  return data.durationMs > 0 ? remainingMs(data, now) / data.durationMs : 0;
}

/** The ring aims at where it will be at the next tick and takes exactly that long to get there. */
function sweep(data: TimerData, now: number) {
  const running = data.pausedMs === null;
  return { value: fraction(data, running ? now + 1000 : now), glide: running ? 1 : undefined };
}

function togglePause(api: Pick<ActivityApi<TimerData>, 'update'>) {
  api.update((data) =>
    data.pausedMs === null
      ? { pausedMs: Math.max(0, data.endsAt - Date.now()) }
      : { pausedMs: null, endsAt: Date.now() + data.pausedMs },
  );
}

function Compact({ data }: ActivityViewProps<TimerData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  return (
    <div className={ui.compact} style={{ color: ORANGE }}>
      <ProgressRing {...sweep(data, now)} color={ORANGE} />
      <Digits value={formatClock(remainingMs(data, now), 'ceil')} />
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<TimerData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  return (
    <div className={ui.center}>
      <ProgressRing {...sweep(data, now)} color={ORANGE} />
    </div>
  );
}

function Expanded({ data, update, dismiss }: ActivityViewProps<TimerData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  const paused = data.pausedMs !== null;
  return (
    <div className={ui.expanded}>
      <Rise i={0}>
        <IconButton label={paused ? 'Resume' : 'Pause'} tone="orange" size={48} onClick={() => togglePause({ update })}>
          <Swap id={paused ? 'play' : 'pause'} dy={0}>
            {paused ? <PlayIcon size={22} weight="fill" /> : <PauseIcon size={22} weight="fill" />}
          </Swap>
        </IconButton>
      </Rise>
      <Rise i={1}>
        <IconButton label="Cancel" size={48} onClick={dismiss}>
          <XIcon size={22} weight="bold" />
        </IconButton>
      </Rise>
      <span className={ui.grow} />
      <Rise i={2} className={ui.sub} style={{ color: ORANGE }}>
        <Swap id={paused ? 'paused' : 'timer'} align="end">
          <T>{paused ? 'Paused' : 'Timer'}</T>
        </Swap>
      </Rise>
      <Rise i={3} style={{ color: ORANGE }}>
        <Digits className={ui.big} value={formatClock(remainingMs(data, now), 'ceil')} />
      </Rise>
    </div>
  );
}

function Controller({ data, dismiss }: ActivityApi<TimerData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  const finished = remainingMs(data, now) === 0;
  useEffect(() => {
    if (!finished) return;
    dismiss();
    useIslandStore.getState().show('status', { tone: 'success', label: 'Timer finished' });
  }, [finished, dismiss]);
  return null;
}

const preset = (ms: number) => () => ({ durationMs: ms, endsAt: Date.now() + ms, pausedMs: null });

export default defineLiveActivity<TimerData>({
  kind: 'timer',
  title: 'Timer',
  description: 'Countdown with a progress ring, pause and cancel.',
  icon: TimerIcon,
  tint: '#ff9f0a',
  defaultData: preset(5 * 60_000),
  compact: { size: { width: 126, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 340, height: 92 }, Component: Expanded },
  Controller,
  demo: {
    presets: [
      { label: '5 min', data: preset(300_000) },
      { label: '10 sec', data: preset(10_000) },
    ],
    controls: [{ type: 'action', label: 'Pause / resume', run: togglePause }],
  },
});
