import { BellIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { appOf, type AppId } from '../../apps';
import { defineTransient } from '../../define';
import { T } from '../../i18n';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { AppTile, cx, IconButton, Swap, ui } from '../../ui/kit';

interface Banner {
  app: AppId;
  title: string;
  body: string;
}

interface NotificationData extends Banner {
  /** Earlier banners that arrived while this alert was on screen, oldest first. */
  stack: Banner[];
  /** Which banner is shown, counted from the oldest. Null is the newest. */
  page: number | null;
}

const MAX_STACK = 4;

const all = (data: NotificationData): Banner[] => [...data.stack, data];
const pageOf = (data: NotificationData) => Math.min(data.page ?? data.stack.length, data.stack.length);

function flip(update: ActivityApi<NotificationData>['update'], step: number) {
  update((data) => ({ page: Math.min(data.stack.length, Math.max(0, pageOf(data) + step)) }));
}

function View({ data, update }: ActivityViewProps<NotificationData>) {
  const banners = all(data);
  const page = pageOf(data);
  const banner = banners[page];
  return (
    <div className={ui.expanded} style={{ gap: 12, padding: '0 12px 0 13px' }}>
      <Swap id={`${page}-${banner.app}`} dy={0} fit={false}>
        <AppTile app={banner.app} size={38} />
      </Swap>
      <Swap id={`${page}-${banner.title}`} className={ui.grow} truncate>
        <span className={ui.stack}>
          <span className={ui.row} style={{ gap: 8 }}>
            <span className={cx(ui.title, ui.grow)}>
              <T>{banner.title}</T>
            </span>
            <span className={ui.caption}>{appOf(banner.app).name}</span>
          </span>
          <span className={ui.sub}>
            <T>{banner.body}</T>
          </span>
        </span>
      </Swap>
      {/* Several notifications share one banner: the counter says which one is shown. */}
      {banners.length > 1 && (
        <span className={ui.row} style={{ gap: 2, flex: 'none' }}>
          <IconButton label="Earlier" tone="ghost" size={24} onClick={() => flip(update, -1)}>
            <CaretLeftIcon size={12} weight="bold" />
          </IconButton>
          <span className={cx(ui.caption, ui.num)}>
            {page + 1}/{banners.length}
          </span>
          <IconButton label="Later" tone="ghost" size={24} onClick={() => flip(update, 1)}>
            <CaretRightIcon size={12} weight="bold" />
          </IconButton>
        </span>
      )}
    </div>
  );
}

const PRESETS: Record<string, Banner> = {
  telegram: { app: 'telegram', title: 'Anna Petrova', body: 'The new animations look great. Ship it?' },
  discord: { app: 'discord', title: '#design-review', body: 'Max: pushed the new island build, take a look' },
  steam: { app: 'steam', title: 'Kira is now playing', body: 'Hades II · Join game' },
  mail: { app: 'mail', title: 'Weekly report', body: 'Your dictation stats for this week are ready' },
};

export default defineTransient<NotificationData>({
  kind: 'notification',
  title: 'Notification',
  description: 'Banners from apps. Several in a row are counted and can be flipped through or swiped.',
  icon: BellIcon,
  tint: (data) => appOf(all(data)[pageOf(data)].app).color,
  defaultData: { ...PRESETS.telegram, stack: [], page: null },
  view: { size: { width: 384, height: 64, radius: 28 }, Component: View },
  duration: 4200,
  interruptive: true,
  // A new banner is shown and the one it replaces is kept behind it.
  merge: (current, incoming) => ({
    ...incoming,
    stack: [...current.stack, { app: current.app, title: current.title, body: current.body }].slice(-MAX_STACK),
    page: null,
  }),
  onSwipe: (api, direction) => flip(api.update, -direction),
  demo: {
    presets: [
      { label: 'Telegram', data: PRESETS.telegram },
      { label: 'Discord', data: PRESETS.discord },
      { label: 'Steam', data: PRESETS.steam },
      { label: 'Mail', data: PRESETS.mail },
    ],
  },
});
