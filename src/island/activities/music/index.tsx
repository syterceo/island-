import { MusicNotesIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, type MouseEvent } from 'react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { fx, spring, tween } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { formatClock, IconButton, Rise, Swap, ui, Wave } from '../../ui/kit';

interface MusicData {
  index: number;
  playing: boolean;
  /** Playback position at `anchorAt`. */
  positionMs: number;
  anchorAt: number;
}

const TRACKS = [
  { title: 'Midnight City', artist: 'M83', durationMs: 244_000, colors: ['#ff5f6d', '#845ec2'] },
  { title: 'Nightcall', artist: 'Kavinsky', durationMs: 258_000, colors: ['#2af598', '#009efd'] },
  { title: 'Instant Crush', artist: 'Daft Punk', durationMs: 337_000, colors: ['#f6d365', '#fd7f6f'] },
  { title: 'Resonance', artist: 'Home', durationMs: 212_000, colors: ['#a18cd1', '#fbc2eb'] },
] as const;

type Update = ActivityApi<MusicData>['update'];

const trackOf = (data: MusicData) => TRACKS[data.index % TRACKS.length];

function position(data: MusicData, now: number): number {
  const elapsed = data.playing ? Math.max(0, now - data.anchorAt) : 0;
  return Math.min(trackOf(data).durationMs, data.positionMs + elapsed);
}

function toggle(update: Update) {
  update((data) =>
    data.playing
      ? { playing: false, positionMs: position(data, Date.now()) }
      : { playing: true, anchorAt: Date.now() },
  );
}

function skip(update: Update, step: number) {
  update((data) => ({
    index: (data.index + step + TRACKS.length) % TRACKS.length,
    positionMs: 0,
    anchorAt: Date.now(),
  }));
}

function Art({ data, size }: { data: MusicData; size: number }) {
  const [from, to] = trackOf(data).colors;
  return (
    <span className={ui.art} style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={data.index}
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          initial={{ opacity: 0, scale: fx.scale(1.25) }}
          animate={{ opacity: 1, scale: 1, transition: spring('content') }}
          exit={{ opacity: 0, transition: tween(0.3) }}
        >
          <MusicNotesIcon size={size * 0.5} weight="fill" />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Compact({ data }: ActivityViewProps<MusicData>) {
  return (
    <div className={ui.compact} style={{ padding: '0 13px 0 6px' }}>
      <Art data={data} size={24} />
      <Wave bars={5} height={15} active={data.playing} color={trackOf(data).colors[0]} />
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<MusicData>) {
  return (
    <div className={ui.center}>
      <Art data={data} size={22} />
    </div>
  );
}

function Expanded({ data, update }: ActivityViewProps<MusicData>) {
  const now = useNow(500, data.playing);
  const track = trackOf(data);
  const at = position(data, now);

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    update({ positionMs: ratio * track.durationMs, anchorAt: Date.now() });
  };

  return (
    <div className={ui.column} style={{ padding: '20px 22px 16px', gap: 14 }}>
      <Rise i={0} className={ui.row} style={{ gap: 14 }}>
        <Art data={data} size={58} />
        <div className={`${ui.stack} ${ui.grow}`}>
          <Swap id={data.index} className={ui.title} truncate>
            {track.title}
          </Swap>
          <Swap id={data.index} className={ui.sub} truncate>
            {track.artist}
          </Swap>
        </div>
        <Wave bars={6} height={22} active={data.playing} color={track.colors[0]} />
      </Rise>
      <Rise i={1} className={ui.row} style={{ gap: 10 }}>
        <span className={ui.time}>{formatClock(at)}</span>
        <div className={ui.scrub} onClick={seek}>
          <span className={ui.scrubFill} style={{ transform: `scaleX(${at / track.durationMs})` }} />
        </div>
        <span className={ui.time} style={{ textAlign: 'right' }}>
          -{formatClock(track.durationMs - at)}
        </span>
      </Rise>
      <Rise i={2} className={ui.row} style={{ justifyContent: 'center', gap: 22 }}>
        <IconButton label="Previous" tone="ghost" onClick={() => skip(update, -1)}>
          <SkipBackIcon size={24} weight="fill" />
        </IconButton>
        <IconButton label={data.playing ? 'Pause' : 'Play'} tone="ghost" size={46} onClick={() => toggle(update)}>
          <Swap id={data.playing ? 'pause' : 'play'} dy={0}>
            {data.playing ? <PauseIcon size={30} weight="fill" /> : <PlayIcon size={30} weight="fill" />}
          </Swap>
        </IconButton>
        <IconButton label="Next" tone="ghost" onClick={() => skip(update, 1)}>
          <SkipForwardIcon size={24} weight="fill" />
        </IconButton>
      </Rise>
    </div>
  );
}

function Controller({ data, update }: ActivityApi<MusicData>) {
  const now = useNow(500, data.playing);
  const ended = position(data, now) >= trackOf(data).durationMs;
  useEffect(() => {
    if (ended) skip(update, 1);
  }, [ended, update]);
  return null;
}

export default defineLiveActivity<MusicData>({
  kind: 'music',
  title: 'Music',
  description: 'Now playing with artwork, scrubber and transport controls.',
  icon: MusicNotesIcon,
  defaultData: () => ({ index: 0, playing: true, positionMs: 42_000, anchorAt: Date.now() }),
  compact: { size: { width: 148, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 192 }, Component: Expanded },
  Controller,
  demo: {
    controls: [
      { type: 'action', label: 'Play / pause', run: (api) => toggle(api.update) },
      { type: 'action', label: 'Next track', run: (api) => skip(api.update, 1) },
    ],
  },
});
