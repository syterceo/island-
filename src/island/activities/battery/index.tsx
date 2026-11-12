import { BatteryChargingIcon, LightningIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineTransient } from '../../define';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { spring } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { ui } from '../../ui/kit';

interface BatteryData {
  /** 0 to 1. */
  level: number;
  charging: boolean;
}

function View({ data }: ActivityViewProps<BatteryData>) {
  const low = !data.charging && data.level <= 0.2;
  const color = low ? 'var(--island-negative)' : 'var(--island-positive)';
  return (
    <div className={ui.compact} style={{ padding: '0 14px 0 13px' }}>
      <span className={ui.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {data.charging && <LightningIcon size={14} weight="fill" color={color} />}
        <T>{data.charging ? 'Charging' : low ? 'Low battery' : 'Battery'}</T>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, color }}>
        <span className={ui.label} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(data.level * 100)}%
        </span>
        <span className={ui.battery}>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0.08, data.level) }}
            transition={spring('gentle', { delay: 0.15 })}
          />
        </span>
      </span>
    </div>
  );
}

export default defineTransient<BatteryData>({
  kind: 'battery',
  title: 'Battery',
  description: 'Charging and low battery states with a level that fills in.',
  icon: BatteryChargingIcon,
  defaultData: { level: 0.64, charging: true },
  view: { size: { width: 216, height: COMPACT_HEIGHT }, Component: View },
  duration: 2400,
  demo: {
    presets: [
      { label: 'Charging', data: { level: 0.64, charging: true } },
      { label: 'Low battery', data: { level: 0.12, charging: false } },
    ],
  },
});
