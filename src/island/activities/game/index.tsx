import { GameControllerIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { Bar, cx, formatClock, Rise, ui } from '../../ui/kit';

interface GameData {
  title: string;
  fps: number;
  /** GPU temperature in °C. */
  temp: number;
  /** Milliseconds. */
  ping: number;
  startedAt: number;
}

const GREEN = '#7ee787';
const AMBER = '#e2a336';
const RED = '#ff6b57';

const fpsColor = (fps: number) => (fps >= 90 ? GREEN : fps >= 50 ? AMBER : RED);
const tempColor = (temp: number) => (temp < 70 ? GREEN : temp < 82 ? AMBER : RED);
const pingColor = (ping: number) => (ping < 50 ? GREEN : ping < 100 ? AMBER : RED);

function Compact({ data }: ActivityViewProps<GameData>) {
  return (
    <div className={ui.compact} style={{ gap: 0, padding: '0 14px 0 10px' }}>
      <GameControllerIcon size={18} weight="fill" color={GREEN} />
      <span className={ui.row} style={{ gap: 5 }}>
        <span className={cx(ui.label, ui.num)} style={{ width: 28, textAlign: 'right', color: fpsColor(data.fps) }}>
          {data.fps}
        </span>
        <span className={ui.caption}>FPS</span>
      </span>
      <span className={cx(ui.label, ui.num)} style={{ width: 30, textAlign: 'right', color: tempColor(data.temp) }}>
        {data.temp}°
      </span>
      <span className={ui.row} style={{ gap: 4 }}>
        <span className={cx(ui.label, ui.num)} style={{ width: 22, textAlign: 'right' }}>
          {data.ping}
        </span>
        <span className={ui.caption}>
          <T>ms</T>
        </span>
      </span>
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <GameControllerIcon size={18} weight="fill" color={GREEN} />
    </div>
  );
}

function Meter({ label, value, color, fill }: { label: string; value: string; color: string; fill: number }) {
  return (
    <div className={cx(ui.stack, ui.grow)} style={{ gap: 6 }}>
      <span className={ui.caption}>
        <T>{label}</T>
      </span>
      <span className={cx(ui.big, ui.num)} style={{ fontSize: 24, color }}>
        {value}
      </span>
      <span style={{ display: 'flex' }}>
        <Bar value={fill} color={color} />
      </span>
    </div>
  );
}

function Expanded({ data }: ActivityViewProps<GameData>) {
  const now = useNow(1000);
  return (
    <div className={ui.column} style={{ padding: '14px 22px 16px', gap: 12 }}>
      <Rise i={0} className={ui.row} style={{ gap: 9 }}>
        <GameControllerIcon size={18} weight="fill" color={GREEN} />
        <span className={cx(ui.title, ui.grow)}>{data.title}</span>
        <span className={cx(ui.sub, ui.num)}>{formatClock(now - data.startedAt)}</span>
      </Rise>
      <Rise i={1} className={ui.row} style={{ gap: 20, alignItems: 'flex-start' }}>
        <Meter label="FPS" value={String(data.fps)} color={fpsColor(data.fps)} fill={data.fps / 165} />
        <Meter label="GPU" value={`${data.temp}°`} color={tempColor(data.temp)} fill={data.temp / 95} />
        <Meter label="Ping" value={String(data.ping)} color={pingColor(data.ping)} fill={data.ping / 150} />
      </Rise>
    </div>
  );
}

const drift = (value: number, spread: number, low: number, high: number) =>
  Math.round(Math.min(high, Math.max(low, value + (Math.random() - 0.5) * spread)));

function Controller({ update }: ActivityApi<GameData>) {
  useEffect(() => {
    const timer = setInterval(() => {
      update((data) => ({
        fps: drift(data.fps, 24, 38, 165),
        temp: drift(data.temp, 4, 52, 88),
        ping: drift(data.ping, 14, 12, 99),
      }));
    }, scaled(1200));
    return () => clearInterval(timer);
  }, [update]);
  return null;
}

export default defineLiveActivity<GameData>({
  kind: 'game',
  title: 'Game mode',
  description: 'Frame rate, GPU temperature, ping and session time while you play.',
  icon: GameControllerIcon,
  tint: GREEN,
  defaultData: () => ({ title: 'Hades II', fps: 144, temp: 64, ping: 24, startedAt: Date.now() - 47 * 60_000 }),
  compact: { size: { width: 224, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 132, radius: 30 }, Component: Expanded },
  Controller,
});
