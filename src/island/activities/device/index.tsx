import { HeadphonesIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { fx, spring } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { ProgressRing, ui } from '../../ui/kit';

interface DeviceData {
  name: string;
  /** 0 to 1. */
  battery: number;
}

function View({ data }: ActivityViewProps<DeviceData>) {
  return (
    <div className={ui.compact} style={{ padding: '0 9px 0 11px' }}>
      <span className={ui.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <motion.span
          style={{ display: 'grid', flex: 'none' }}
          initial={{ rotate: fx.offset(-30), scale: fx.scale(0.6) }}
          animate={{ rotate: 0, scale: 1 }}
          transition={spring('bouncy', { delay: 0.08 })}
        >
          <HeadphonesIcon size={18} weight="fill" />
        </motion.span>
        <span className={ui.truncate}>{data.name}</span>
      </span>
      <ProgressRing value={data.battery} size={22} stroke={2.5} color="var(--island-positive)">
        <span style={{ fontSize: 8, fontWeight: 800 }}>{Math.round(data.battery * 100)}</span>
      </ProgressRing>
    </div>
  );
}

export default defineTransient<DeviceData>({
  kind: 'device',
  title: 'Device connected',
  description: 'Headphones or another device with its battery level.',
  icon: HeadphonesIcon,
  defaultData: { name: 'Headphones', battery: 0.86 },
  view: {
    size: (data) => ({ width: Math.min(300, 92 + data.name.length * 7.6), height: COMPACT_HEIGHT }),
    Component: View,
  },
  duration: 2600,
  demo: { controls: [{ type: 'text', key: 'name', label: 'Name' }] },
});
