import { SunIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { spring } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { LevelView } from '../../ui/kit';

interface BrightnessData {
  /** 0 to 1. */
  level: number;
}

function View({ data }: ActivityViewProps<BrightnessData>) {
  return (
    <LevelView
      level={data.level}
      icon={
        // The sun turns and grows with the level.
        <motion.span
          style={{ display: 'grid', flex: 'none' }}
          initial={false}
          animate={{ rotate: data.level * 120, scale: 0.8 + data.level * 0.25 }}
          transition={spring('snappy')}
        >
          <SunIcon size={18} weight="fill" color="var(--island-warning)" />
        </motion.span>
      }
    />
  );
}

export default defineTransient<BrightnessData>({
  kind: 'brightness',
  title: 'Brightness',
  description: 'Display brightness with a sun that turns as the level changes.',
  icon: SunIcon,
  defaultData: { level: 0.7 },
  view: { size: { width: 228, height: COMPACT_HEIGHT }, Component: View },
  duration: 1600,
  demo: {
    presets: [
      { label: '25%', data: { level: 0.25 } },
      { label: '90%', data: { level: 0.9 } },
    ],
    controls: [{ type: 'range', key: 'level', label: 'Level', min: 0, max: 1, step: 0.05 }],
  },
});
