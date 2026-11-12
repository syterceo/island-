import { BellIcon, CalendarBlankIcon, ChatCircleIcon, EnvelopeSimpleIcon, type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineTransient } from '../../define';
import { fx, spring } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { ui } from '../../ui/kit';

type App = 'message' | 'mail' | 'calendar';

interface NotificationData {
  app: App;
  title: string;
  body: string;
}

const APPS: Record<App, { icon: Icon; background: string }> = {
  message: { icon: ChatCircleIcon, background: 'linear-gradient(160deg, #5df27c, #1eb341)' },
  mail: { icon: EnvelopeSimpleIcon, background: 'linear-gradient(160deg, #57b7ff, #1c6dff)' },
  calendar: { icon: CalendarBlankIcon, background: 'linear-gradient(160deg, #ff7a70, #f0362a)' },
};

function View({ data }: ActivityViewProps<NotificationData>) {
  const app = APPS[data.app] ?? APPS.message;
  const AppIcon = app.icon;
  return (
    <div className={ui.expanded} style={{ gap: 12, padding: '0 20px 0 14px' }}>
      <motion.span
        className={ui.tile}
        style={{ width: 40, height: 40, borderRadius: 12, background: app.background }}
        initial={{ scale: fx.scale(0.5), rotate: fx.offset(-18) }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring('bouncy', { delay: 0.08 })}
      >
        <AppIcon size={22} weight="fill" />
      </motion.span>
      <div className={`${ui.stack} ${ui.grow}`}>
        <span className={ui.title}>{data.title}</span>
        <span className={ui.sub}>{data.body}</span>
      </div>
      <span className={ui.sub} style={{ color: 'var(--island-fg-3)', flex: 'none' }}>
        now
      </span>
    </div>
  );
}

const PRESETS: Record<App, NotificationData> = {
  message: { app: 'message', title: 'Anna Petrova', body: 'The new animations look great. Ship it?' },
  mail: { app: 'mail', title: 'Weekly report', body: 'Your dictation stats for this week are ready' },
  calendar: { app: 'calendar', title: 'Design review', body: 'Starts in 10 minutes · Meeting room 3' },
};

export default defineTransient<NotificationData>({
  kind: 'notification',
  title: 'Notification',
  description: 'A two line banner from an app. Hover to hold it, click to dismiss.',
  icon: BellIcon,
  defaultData: PRESETS.message,
  view: { size: { width: 360, height: 68, radius: 28 }, Component: View },
  duration: 3600,
  coalesce: false,
  demo: {
    presets: [
      { label: 'Message', data: PRESETS.message },
      { label: 'Mail', data: PRESETS.mail },
      { label: 'Calendar', data: PRESETS.calendar },
    ],
  },
});
