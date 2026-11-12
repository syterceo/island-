import { APPS, type AppId, AppTile, T, useIslandStore } from '@/island';
import { Section } from './controls';
import css from './playground.module.css';

const island = () => useIslandStore.getState();

const play = (source: AppId, index: number) => () =>
  island().start('music', { source, index, playing: true, positionMs: 42_000, anchorAt: Date.now() });

const notify = (app: AppId, title: string, body: string) => () => island().show('notification', { app, title, body });

interface Integration {
  app: AppId;
  hint: string;
  actions: [label: string, run: () => void][];
}

const INTEGRATIONS: Integration[] = [
  {
    app: 'discord',
    hint: 'Calls, voice channels and mentions',
    actions: [
      [
        'Incoming call',
        () => {
          island().start('discord', { state: 'incoming' });
          island().expand('discord');
        },
      ],
      ['Join voice', () => island().start('discord', { state: 'voice', joinedAt: Date.now(), speaking: 0 })],
      ['Mention', notify('discord', '#design-review', 'Max: pushed the new island build, take a look')],
      [
        'Three in a row',
        () => {
          notify('telegram', 'Anna Petrova', 'The new animations look great. Ship it?')();
          setTimeout(notify('discord', '#design-review', 'Max: pushed the new island build, take a look'), 900);
          setTimeout(notify('steam', 'Kira is now playing', 'Hades II · Join game'), 1800);
        },
      ],
      ['Leave', () => island().end('discord')],
    ],
  },
  {
    app: 'soundcloud',
    hint: 'Whatever plays in the browser tab or the app',
    actions: [
      ['Play', play('soundcloud', 0)],
      ['Next track', () => island().update('music', (data: { index: number }) => ({ index: data.index + 1, positionMs: 0, anchorAt: Date.now() }))],
      ['Stop', () => island().end('music')],
    ],
  },
  { app: 'spotify', hint: 'Desktop app playback', actions: [['Play', play('spotify', 1)]] },
  {
    app: 'calendar',
    hint: 'Upcoming meetings',
    actions: [
      ['Meeting in 10 min', () => island().start('meeting', { startsAt: Date.now() + 10 * 60_000 })],
      ['Starting now', () => island().start('meeting', { startsAt: Date.now() + 8_000 })],
    ],
  },
  { app: 'youtube', hint: 'Video and music in the browser', actions: [['Play', play('youtube', 2)]] },
  {
    app: 'telegram',
    hint: 'New messages',
    actions: [['Message', notify('telegram', 'Anna Petrova', 'The new animations look great. Ship it?')]],
  },
  {
    app: 'steam',
    hint: 'Downloads and friends',
    actions: [
      ['Game download', () => island().start('download', { app: 'steam', name: 'Hades II', size: 1800, speed: 24, progress: 0.52, paused: false })],
      ['Friend playing', notify('steam', 'Kira is now playing', 'Hades II · Join game')],
    ],
  },
  {
    app: 'chrome',
    hint: 'File downloads',
    actions: [
      ['Download', () => island().start('download', { app: 'chrome', name: 'figma-setup.exe', size: 142, speed: 9.4, progress: 0.08, paused: false })],
    ],
  },
  {
    app: 'windows',
    hint: 'System events',
    actions: [
      ['Screenshot', () => island().show('screenshot')],
      ['Switch layout', () => island().show('language')],
      ['Caps Lock', () => island().show('keylock')],
      ['Wi-Fi', () => island().show('device', { type: 'wifi', name: 'Home 5G', battery: null })],
      ['Windows Hello', () => island().show('unlock')],
      ['System monitor', () => island().start('system')],
    ],
  },
];

export function AppsPage() {
  return (
    <Section title="Connected apps" hint="each app tints the island with its own colour">
      <div className={css.cards}>
        {INTEGRATIONS.map(({ app, hint, actions }) => {
          const { name } = APPS[app];
          return (
            <div key={app} className={css.card}>
              <div className={css.cardHead}>
                <AppTile app={app} size={34} />
                <div className={css.cardText}>
                  <strong>{name}</strong>
                  <span>
                    <T>{hint}</T>
                  </span>
                </div>
              </div>
              <div className={css.cardActions}>
                {actions.map(([label, run]) => (
                  <button key={label} type="button" className={css.chip} data-primary onClick={run}>
                    <T>{label}</T>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className={css.note}>
        <T>These events are simulated. In the Windows app, music comes from the system media session and the rest from notifications and each app.</T>
      </p>
    </Section>
  );
}
