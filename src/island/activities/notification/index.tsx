import { BellIcon } from '@phosphor-icons/react';
import { appOf, type AppId } from '../../apps';
import { defineTransient } from '../../define';
import type { ActivityViewProps } from '../../types';
import { AppTile, cx, ui } from '../../ui/kit';

interface NotificationData {
  app: AppId;
  title: string;
  body: string;
}

function View({ data }: ActivityViewProps<NotificationData>) {
  return (
    <div className={ui.expanded} style={{ gap: 12, padding: '0 16px 0 13px' }}>
      <AppTile app={data.app} size={38} />
      <div className={cx(ui.stack, ui.grow)}>
        <span className={ui.row} style={{ gap: 8 }}>
          <span className={cx(ui.title, ui.grow)}>{data.title}</span>
          <span className={ui.caption} style={{ color: 'var(--island-tint)' }}>
            {appOf(data.app).name}
          </span>
        </span>
        <span className={ui.sub}>{data.body}</span>
      </div>
    </div>
  );
}

const PRESETS: Record<string, NotificationData> = {
  telegram: { app: 'telegram', title: 'Anna Petrova', body: 'The new animations look great. Ship it?' },
  discord: { app: 'discord', title: '#design-review', body: 'Max: pushed the new island build, take a look' },
  steam: { app: 'steam', title: 'Kira is now playing', body: 'Hades II · Join game' },
  mail: { app: 'mail', title: 'Weekly report', body: 'Your dictation stats for this week are ready' },
};

export default defineTransient<NotificationData>({
  kind: 'notification',
  title: 'Notification',
  description: 'A banner from an app, tinted with its colour. Hover to hold it, click to dismiss.',
  icon: BellIcon,
  tint: (data) => appOf(data.app).color,
  defaultData: PRESETS.telegram,
  view: { size: { width: 372, height: 64, radius: 28 }, Component: View },
  duration: 3600,
  coalesce: false,
  demo: {
    presets: [
      { label: 'Telegram', data: PRESETS.telegram },
      { label: 'Discord', data: PRESETS.discord },
      { label: 'Steam', data: PRESETS.steam },
      { label: 'Mail', data: PRESETS.mail },
    ],
  },
});
