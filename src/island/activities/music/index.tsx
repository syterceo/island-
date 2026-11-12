import { MusicNotesIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, type MouseEvent } from 'react';
import { appOf, type AppId } from '../../apps';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { fx, tween } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { AppTile, cx, formatClock, IconButton, Rise, Swap, ui, Wave } from '../../ui/kit';

interface MusicData {
  /** The app the audio comes from. */
  source: AppId;
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
    <span className={ui.art} style={{ width: size, height: size, borderRadius: Math.round(size * 0.14) }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={data.index}
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          initial={{ opacity: 0, scale: fx.scale(1.15) }}
          animate={{ opacity: 1, scale: 1, transition: tween(0.45) }}
          exit={{ opacity: 0, transition: tween(0.3) }}
        >
          <MusicNotesIcon size={size * 0.36} weight="fill" />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Compact({ data }: ActivityViewProps<MusicData>) {
  const track = trackOf(data);
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 13px 0 7px' }}>
      <AppTile app={data.source} />
      <Swap id={data.index} className={cx(ui.label, ui.grow)} truncate>
        {track.title}
        <span style={{ color: 'var(--island-fg-3)' }}> · {track.artist}</span>
      </Swap>
      <Wave bars={4} height={14} active={data.playing} color="var(--island-tint)" />
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<MusicData>) {
  return (
    <div className={ui.center}>
      <AppTile app={data.source} size={20} />
    </div>
  );
}

function Expanded({ data, update }: ActivityViewProps<MusicData>) {
  const now = useNow(500, data.playing, data.anchorAt - data.positionMs);
  const track = trackOf(data);
  const at = position(data, now);

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    update({ positionMs: ratio * track.durationMs, anchorAt: Date.now() });
  };

  return (
    <div className={ui.expanded} style={{ gap: 16, padding: 14 }}>
      <Rise i={0} style={{ position: 'relative', flex: 'none' }}>
        <Art data={data} size={120} />
        <span style={{ position: 'absolute', left: 8, bottom: 8 }}>
          <AppTile app={data.source} size={24} />
        </span>
      </Rise>
      <div className={cx(ui.stack, ui.grow)} style={{ gap: 0, height: '100%', padding: '2px 4px 0 0' }}>
        <Rise i={1} className={ui.stack}>
          <span className={ui.caption} style={{ color: 'var(--island-tint)' }}>
            <T>Playing on</T> {appOf(data.source).name}
          </span>
          <Swap id={data.index} className={ui.title} style={{ fontSize: 17, marginTop: 3 }} truncate>
            {track.title}
          </Swap>
          <Swap id={data.index} className={ui.sub} truncate>
            {track.artist}
          </Swap>
        </Rise>
        <span className={ui.grow} />
        <Rise i={2} className={ui.row} style={{ gap: 9 }}>
          <span className={ui.time}>{formatClock(at)}</span>
          <div className={ui.scrub} data-no-gesture onClick={seek}>
            <span
              className={ui.scrubFill}
              style={{ transform: `scaleX(${at / track.durationMs})`, background: 'var(--island-tint)' }}
            />
          </div>
          <span className={ui.time} style={{ textAlign: 'right' }}>
            {formatClock(track.durationMs)}
          </span>
        </Rise>
        <Rise i={3} className={ui.row} style={{ gap: 6, marginTop: 10 }}>
          <IconButton label="Previous" size={34} onClick={() => skip(update, -1)}>
            <SkipBackIcon size={16} weight="fill" />
          </IconButton>
          <IconButton label={data.playing ? 'Pause' : 'Play'} tone="active" size={34} onClick={() => toggle(update)}>
            <Swap id={data.playing ? 'pause' : 'play'} dy={0} fit={false}>
              {data.playing ? <PauseIcon size={16} weight="fill" /> : <PlayIcon size={16} weight="fill" />}
            </Swap>
          </IconButton>
          <IconButton label="Next" size={34} onClick={() => skip(update, 1)}>
            <SkipForwardIcon size={16} weight="fill" />
          </IconButton>
          <span className={ui.grow} />
          <Wave bars={7} height={20} active={data.playing} color="var(--island-tint)" />
        </Rise>
      </div>
    </div>
  );
}

function Controller({ data, update }: ActivityApi<MusicData>) {
  const now = useNow(500, data.playing, data.anchorAt - data.positionMs);
  const ended = position(data, now) >= trackOf(data).durationMs;
  useEffect(() => {
    if (ended) skip(update, 1);
  }, [ended, update]);
  return null;
}

const from = (source: AppId, index: number) => () => ({
  source,
  index,
  playing: true,
  positionMs: 42_000,
  anchorAt: Date.now(),
});

export default defineLiveActivity<MusicData>({
  kind: 'music',
  title: 'Now playing',
  description: 'Music from any player. The island takes the colour of the app it comes from.',
  icon: MusicNotesIcon,
  tint: (data) => appOf(data.source).color,
  defaultData: from('soundcloud', 0),
  compact: { size: { width: 236, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 420, height: 148, radius: 30 }, Component: Expanded },
  Controller,
  onSwipe: (api, direction) => skip(api.update, direction),
  demo: {
    presets: [
      { label: 'SoundCloud', data: from('soundcloud', 0) },
      { label: 'Spotify', data: from('spotify', 1) },
      { label: 'YouTube', data: from('youtube', 2) },
    ],
    controls: [
      { type: 'action', label: 'Play / pause', run: (api) => toggle(api.update) },
      { type: 'action', label: 'Next track', run: (api) => skip(api.update, 1) },
    ],
  },
});
