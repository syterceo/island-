import { PauseIcon, PlayIcon, SkipForwardIcon, TargetIcon, XIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { Digits, formatClock, IconButton, ProgressRing, Rise, Swap, ui } from '../../ui/kit';

interface FocusData {
  phase: 'work' | 'break';
  /** 1 based round of work. */
  round: number;
  rounds: number;
  workMs: number;
  breakMs: number;
  endsAt: number;
  pausedMs: number | null;
}

type Update = ActivityApi<FocusData>['update'];

const COLOR = { work: '#ff6b57', break: '#30d158' } as const;
const LABEL = { work: 'Focus', break: 'Break' } as const;

const left = (data: FocusData, now: number) => Math.max(0, data.pausedMs ?? data.endsAt - now);
const length = (data: FocusData) => (data.phase === 'work' ? data.workMs : data.breakMs);

/** Moves to the next phase. Returns false when the last round has just finished. */
function advance(api: Pick<ActivityApi<FocusData>, 'update' | 'dismiss' | 'data'>): void {
  const { data } = api;
  if (data.phase === 'work' && data.round >= data.rounds) {
    api.dismiss();
    useIslandStore.getState().show('status', { tone: 'success', label: 'Focus session complete' });
    return;
  }
  api.update((prev) =>
    prev.phase === 'work'
      ? { phase: 'break', endsAt: Date.now() + prev.breakMs, pausedMs: null }
      : { phase: 'work', round: prev.round + 1, endsAt: Date.now() + prev.workMs, pausedMs: null },
  );
}

/** The ring aims at where it will be at the next tick and takes exactly that long to get there. */
function sweep(data: FocusData, now: number) {
  const running = data.pausedMs === null;
  return { value: left(data, running ? now + 1000 : now) / length(data), glide: running ? 1 : undefined };
}

function togglePause(update: Update) {
  update((data) =>
    data.pausedMs === null
      ? { pausedMs: Math.max(0, data.endsAt - Date.now()) }
      : { pausedMs: null, endsAt: Date.now() + data.pausedMs },
  );
}

function Compact({ data }: ActivityViewProps<FocusData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  return (
    <div className={ui.compact} style={{ gap: 8, padding: '0 13px 0 9px' }}>
      <ProgressRing {...sweep(data, now)} color="var(--island-tint)" />
      <Swap id={data.phase} className={ui.caption} style={{ color: 'var(--island-tint)' }}>
        <T>{LABEL[data.phase]}</T>
      </Swap>
      <span className={ui.grow} />
      <Digits value={formatClock(left(data, now), 'ceil')} />
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<FocusData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  return (
    <div className={ui.center}>
      <ProgressRing {...sweep(data, now)} color={COLOR[data.phase]} />
    </div>
  );
}

function Expanded({ data, update, dismiss }: ActivityViewProps<FocusData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  const paused = data.pausedMs !== null;
  return (
    <div className={ui.expanded} style={{ gap: 8, padding: '0 16px 0 22px' }}>
      <Rise i={0} className={ui.stack} style={{ gap: 6 }}>
        <span className={ui.row} style={{ gap: 10 }}>
          <Swap id={paused ? 'paused' : data.phase} className={ui.caption} style={{ color: 'var(--island-tint)' }}>
            <T>{paused ? 'Paused' : LABEL[data.phase]}</T>
          </Swap>
          <span className={ui.pips}>
            {Array.from({ length: data.rounds }, (_, index) => (
              <i key={index} data-on={index < data.round} />
            ))}
          </span>
        </span>
        <Digits className={ui.big} style={{ fontSize: 30 }} value={formatClock(left(data, now), 'ceil')} />
      </Rise>
      <span className={ui.grow} />
      <Rise i={1}>
        <IconButton label={paused ? 'Resume' : 'Pause'} tone="active" size={38} onClick={() => togglePause(update)}>
          <Swap id={paused ? 'play' : 'pause'} dy={0} fit={false}>
            {paused ? <PlayIcon size={17} weight="fill" /> : <PauseIcon size={17} weight="fill" />}
          </Swap>
        </IconButton>
      </Rise>
      <Rise i={2}>
        <IconButton label="Skip" size={38} onClick={() => advance({ data, update, dismiss })}>
          <SkipForwardIcon size={17} weight="fill" />
        </IconButton>
      </Rise>
      <Rise i={3}>
        <IconButton label="Stop" size={38} onClick={dismiss}>
          <XIcon size={16} weight="bold" />
        </IconButton>
      </Rise>
    </div>
  );
}

function Controller({ data, update, dismiss }: ActivityApi<FocusData>) {
  const now = useNow(1000, data.pausedMs === null, data.endsAt);
  const finished = left(data, now) === 0;
  useEffect(() => {
    if (finished) advance({ data, update, dismiss });
    // Runs once per phase end; the data it reads is the phase that just ended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);
  return null;
}

const session = (workMs: number, breakMs: number) => () => ({
  phase: 'work' as const,
  round: 1,
  rounds: 4,
  workMs,
  breakMs,
  endsAt: Date.now() + workMs,
  pausedMs: null,
});

export default defineLiveActivity<FocusData>({
  kind: 'focus',
  title: 'Focus timer',
  description: 'Pomodoro rounds: the island turns red for work and green for a break.',
  icon: TargetIcon,
  tint: (data) => COLOR[data.phase],
  defaultData: session(25 * 60_000, 5 * 60_000),
  compact: { size: { width: 166, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 88, radius: 30 }, Component: Expanded },
  Controller,
  onSwipe: (api) => advance(api),
  demo: {
    presets: [
      { label: '25 / 5 min', data: session(25 * 60_000, 5 * 60_000) },
      { label: 'Demo 8 / 5 s', data: session(8_000, 5_000) },
    ],
    controls: [{ type: 'action', label: 'Next phase', run: (api) => advance(api) }],
  },
});
