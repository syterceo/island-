import { ScissorsIcon } from '@phosphor-icons/react';
import { APPS } from '../../apps';
import { defineTransient } from '../../define';
import type { ActivityViewProps } from '../../types';
import { cx, ui } from '../../ui/kit';

interface ScreenshotData {
  title: string;
  detail: string;
}

function View({ data }: ActivityViewProps<ScreenshotData>) {
  return (
    <div className={ui.expanded} style={{ gap: 12, padding: '0 16px 0 10px' }}>
      <span className={ui.thumb} style={{ width: 64, height: 42 }} />
      <div className={cx(ui.stack, ui.grow)}>
        <span className={ui.title}>{data.title}</span>
        <span className={ui.sub}>{data.detail}</span>
      </div>
      <ScissorsIcon size={18} weight="fill" color="var(--island-fg-3)" />
    </div>
  );
}

export default defineTransient<ScreenshotData>({
  kind: 'screenshot',
  title: 'Screenshot',
  description: 'Confirms a capture from Win + Shift + S with a preview.',
  icon: ScissorsIcon,
  tint: APPS.windows.color,
  defaultData: { title: 'Screenshot saved', detail: 'Copied to clipboard · Pictures' },
  view: { size: { width: 320, height: 62, radius: 28 }, Component: View },
  duration: 2800,
});
