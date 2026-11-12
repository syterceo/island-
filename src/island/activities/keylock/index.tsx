import { ArrowFatUpIcon, KeyboardIcon } from '@phosphor-icons/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import type { ActivityViewProps } from '../../types';
import { Swap, ui } from '../../ui/kit';

interface KeyLockData {
  key: string;
  on: boolean;
}

function View({ data }: ActivityViewProps<KeyLockData>) {
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 13px 0 8px' }}>
      <span className={ui.keycap} data-on={data.on}>
        <ArrowFatUpIcon size={13} weight="fill" />
      </span>
      <span className={`${ui.label} ${ui.grow}`}>{data.key}</span>
      <Swap id={data.on ? 'on' : 'off'} className={ui.label} align="end" style={{ color: 'var(--island-fg-2)' }}>
        {data.on ? 'On' : 'Off'}
      </Swap>
    </div>
  );
}

export default defineTransient<KeyLockData>({
  kind: 'keylock',
  title: 'Caps Lock',
  description: 'Tells you when Caps Lock or Num Lock turns on or off.',
  icon: KeyboardIcon,
  defaultData: { key: 'Caps Lock', on: true },
  view: { size: { width: 164, height: COMPACT_HEIGHT }, Component: View },
  duration: 1400,
  demo: {
    presets: [
      { label: 'Caps on', data: { key: 'Caps Lock', on: true } },
      { label: 'Caps off', data: { key: 'Caps Lock', on: false } },
      { label: 'Num Lock', data: { key: 'Num Lock', on: true } },
    ],
  },
});
