import { CpuIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { APPS } from '../../apps';
import { defineLiveActivity } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { Bar, cx, Rise, ui } from '../../ui/kit';

interface SystemData {
  /** Each 0 to 1. */
  cpu: number;
  gpu: number;
  ram: number;
}

const METERS = [
  { key: 'cpu', label: 'CPU', color: '#4cc2ff' },
  { key: 'gpu', label: 'GPU', color: '#7ee787' },
  { key: 'ram', label: 'RAM', color: '#e2a336' },
] as const;

const percent = (value: number) => `${Math.round(value * 100)}%`;

function Compact({ data }: ActivityViewProps<SystemData>) {
  return (
    <div className={ui.compact} style={{ gap: 0, padding: '0 14px 0 12px' }}>
      {METERS.map((meter) => (
        <span key={meter.key} className={ui.row} style={{ gap: 5 }}>
          <span className={ui.caption} style={{ color: meter.color }}>
            {meter.label}
          </span>
          <span className={cx(ui.label, ui.num)} style={{ width: 31 }}>
            {percent(data[meter.key])}
          </span>
        </span>
      ))}
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <CpuIcon size={18} weight="fill" color={APPS.windows.color} />
    </div>
  );
}

function Expanded({ data }: ActivityViewProps<SystemData>) {
  return (
    <div className={ui.expanded} style={{ gap: 20, padding: '0 22px' }}>
      {METERS.map((meter, index) => (
        <Rise key={meter.key} i={index} className={cx(ui.stack, ui.grow)} style={{ gap: 7 }}>
          <span className={ui.caption} style={{ color: meter.color }}>
            {meter.label}
          </span>
          <span className={cx(ui.big, ui.num)} style={{ fontSize: 26 }}>
            {percent(data[meter.key])}
          </span>
          <span style={{ display: 'flex' }}>
            <Bar value={data[meter.key]} color={meter.color} />
          </span>
        </Rise>
      ))}
    </div>
  );
}

const drift = (value: number, spread: number) => Math.min(0.97, Math.max(0.04, value + (Math.random() - 0.5) * spread));

function Controller({ update }: ActivityApi<SystemData>) {
  useEffect(() => {
    const timer = setInterval(() => {
      update((prev) => ({ cpu: drift(prev.cpu, 0.22), gpu: drift(prev.gpu, 0.16), ram: drift(prev.ram, 0.04) }));
    }, scaled(1400));
    return () => clearInterval(timer);
  }, [update]);
  return null;
}

export default defineLiveActivity<SystemData>({
  kind: 'system',
  title: 'System monitor',
  description: 'Processor, graphics and memory load, pinned while something heavy runs.',
  icon: CpuIcon,
  tint: APPS.windows.color,
  priority: -1,
  defaultData: { cpu: 0.34, gpu: 0.61, ram: 0.48 },
  compact: { size: { width: 252, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 108, radius: 30 }, Component: Expanded },
  Controller,
});
