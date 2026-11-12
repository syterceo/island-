import { DownloadSimpleIcon, PauseIcon, PlayIcon, XIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { appOf, type AppId } from '../../apps';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { AppTile, Bar, cx, IconButton, Rise, Swap, ui } from '../../ui/kit';

interface DownloadData {
  app: AppId;
  name: string;
  /** Megabytes. */
  size: number;
  /** Megabytes per second. */
  speed: number;
  /** 0 to 1. */
  progress: number;
  paused: boolean;
}

const megabytes = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)} GB` : `${Math.round(value)} MB`);
const percent = (data: DownloadData) => `${Math.round(data.progress * 100)}%`;

function Compact({ data }: ActivityViewProps<DownloadData>) {
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 12px 0 7px' }}>
      <AppTile app={data.app} />
      <Bar value={data.progress} color="var(--island-tint)" />
      <span className={cx(ui.label, ui.num)} style={{ width: 36, textAlign: 'right' }}>
        {percent(data)}
      </span>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<DownloadData>) {
  return (
    <div className={ui.center}>
      <AppTile app={data.app} size={20} />
    </div>
  );
}

function Expanded({ data, update, dismiss }: ActivityViewProps<DownloadData>) {
  return (
    <div className={ui.column} style={{ padding: '16px 16px 18px', gap: 0, justifyContent: 'space-between' }}>
      <Rise i={0} className={ui.row} style={{ gap: 11 }}>
        <AppTile app={data.app} size={34} />
        <div className={cx(ui.stack, ui.grow)}>
          <span className={ui.title}>{data.name}</span>
          <span className={cx(ui.sub, ui.num)}>
            {megabytes(data.size * data.progress)} <T>of</T> {megabytes(data.size)}
            {' · '}
            {data.paused ? <T>Paused</T> : `${data.speed.toFixed(1)} MB/s`}
          </span>
        </div>
        <IconButton label={data.paused ? 'Resume' : 'Pause'} size={34} onClick={() => update((prev) => ({ paused: !prev.paused }))}>
          <Swap id={data.paused ? 'play' : 'pause'} dy={0} fit={false}>
            {data.paused ? <PlayIcon size={15} weight="fill" /> : <PauseIcon size={15} weight="fill" />}
          </Swap>
        </IconButton>
        <IconButton label="Cancel" size={34} onClick={dismiss}>
          <XIcon size={15} weight="bold" />
        </IconButton>
      </Rise>
      <Rise i={1} className={ui.row} style={{ gap: 10 }}>
        <Bar value={data.progress} color="var(--island-tint)" height={6} />
        <span className={cx(ui.label, ui.num)} style={{ width: 38, textAlign: 'right' }}>
          {percent(data)}
        </span>
      </Rise>
    </div>
  );
}

function Controller({ data, update, dismiss }: ActivityApi<DownloadData>) {
  const { paused, name } = data;
  const done = data.progress >= 1;

  useEffect(() => {
    if (paused || done) return;
    const timer = setInterval(() => {
      update((prev) => {
        const speed = Math.max(1, prev.speed + (Math.random() - 0.5) * 3);
        return { speed, progress: Math.min(1, prev.progress + (speed * 0.4 * 6) / prev.size) };
      });
    }, scaled(400));
    return () => clearInterval(timer);
  }, [paused, done, update]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      dismiss();
      useIslandStore.getState().show('status', { tone: 'success', label: `${name} downloaded` });
    }, scaled(600));
    return () => clearTimeout(timer);
  }, [done, dismiss, name]);

  return null;
}

export default defineLiveActivity<DownloadData>({
  kind: 'download',
  title: 'Download',
  description: 'A browser or Steam download with speed, pause and cancel.',
  icon: DownloadSimpleIcon,
  tint: (data) => appOf(data.app).color,
  defaultData: { app: 'chrome', name: 'figma-setup.exe', size: 142, speed: 9.4, progress: 0.08, paused: false },
  compact: { size: { width: 172, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 104, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    presets: [
      { label: 'Chrome', data: { app: 'chrome', name: 'figma-setup.exe', size: 142, progress: 0.08, paused: false } },
      { label: 'Steam', data: { app: 'steam', name: 'Hades II', size: 1800, speed: 24, progress: 0.52, paused: false } },
    ],
    controls: [{ type: 'toggle', key: 'paused', label: 'Paused' }],
  },
});
