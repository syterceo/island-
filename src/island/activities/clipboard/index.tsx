import { CopyIcon } from '@phosphor-icons/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import type { ActivityViewProps } from '../../types';
import { DrawnMark, ui } from '../../ui/kit';

interface ClipboardData {
  label: string;
}

function View({ data }: ActivityViewProps<ClipboardData>) {
  return (
    <div className={ui.compact} style={{ justifyContent: 'center' }}>
      <DrawnMark />
      <span className={ui.label}>{data.label}</span>
    </div>
  );
}

export default defineTransient<ClipboardData>({
  kind: 'clipboard',
  title: 'Clipboard',
  description: 'Confirms that something was copied, with a check that draws itself.',
  icon: CopyIcon,
  defaultData: { label: 'Copied' },
  view: {
    size: (data) => ({ width: Math.min(300, 62 + data.label.length * 7.6), height: COMPACT_HEIGHT }),
    Component: View,
  },
  duration: 1800,
  demo: {
    presets: [
      { label: 'Copied', data: { label: 'Copied' } },
      { label: 'Link copied', data: { label: 'Link copied to clipboard' } },
    ],
    controls: [{ type: 'text', key: 'label', label: 'Label' }],
  },
});
