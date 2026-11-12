import {
  DiscordLogoIcon,
  HeadphonesIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  PhoneIcon,
  PhoneXIcon,
  SpeakerSlashIcon,
} from '@phosphor-icons/react';
import { useEffect } from 'react';
import { APPS } from '../../apps';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { AppTile, Avatar, cx, Digits, formatClock, IconButton, Rise, Swap, ui } from '../../ui/kit';

interface DiscordData {
  state: 'incoming' | 'voice';
  /** Who is calling while the state is `incoming`. */
  caller: string;
  channel: string;
  server: string;
  joinedAt: number;
  muted: boolean;
  deafened: boolean;
  /** Index into the member list of whoever is talking, or -1. */
  speaking: number;
}

const MEMBERS = ['Anna', 'Max', 'Kira', 'You'];
const YOU = MEMBERS.length - 1;

function join({ update, collapse }: Pick<ActivityApi<DiscordData>, 'update' | 'collapse'>) {
  update({ state: 'voice', joinedAt: Date.now() });
  collapse();
}

function leave(dismiss: () => void, label: string) {
  dismiss();
  useIslandStore.getState().show('status', { tone: 'info', label });
}

function Compact({ data }: ActivityViewProps<DiscordData>) {
  const now = useNow(1000, data.state === 'voice', data.joinedAt);
  if (data.state === 'incoming') {
    return (
      <div className={ui.compact} style={{ gap: 9, justifyContent: 'flex-start', padding: '0 13px 0 7px' }}>
        <AppTile app="discord" />
        <span className={ui.label}>
          {data.caller} <T>is calling</T>
        </span>
      </div>
    );
  }
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 12px 0 7px' }}>
      <AppTile app="discord" />
      <span className={ui.avatars}>
        {MEMBERS.slice(0, 3).map((name, index) => (
          <Avatar key={name} name={name} size={20} speaking={!data.deafened && data.speaking === index} />
        ))}
      </span>
      <span className={ui.grow} />
      <Digits className={ui.label} value={formatClock(now - data.joinedAt)} />
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <AppTile app="discord" size={20} />
    </div>
  );
}

function Incoming({ data, update, dismiss, collapse }: ActivityViewProps<DiscordData>) {
  return (
    <div className={ui.expanded} style={{ gap: 12, padding: '0 16px 0 16px' }}>
      <Rise i={0}>
        <Avatar name={data.caller} size={44} />
      </Rise>
      <Rise i={1} className={cx(ui.stack, ui.grow)}>
        <span className={ui.caption} style={{ color: 'var(--island-tint)' }}>
          <T>Discord call</T>
        </span>
        <span className={ui.title} style={{ fontSize: 17 }}>
          {data.caller}
        </span>
      </Rise>
      <Rise i={2}>
        <IconButton label="Decline" tone="negative" size={42} onClick={() => leave(dismiss, 'Call declined')}>
          <PhoneXIcon size={20} weight="fill" />
        </IconButton>
      </Rise>
      <Rise i={3}>
        <IconButton label="Accept" tone="positive" size={42} onClick={() => join({ update, collapse })}>
          <PhoneIcon size={20} weight="fill" />
        </IconButton>
      </Rise>
    </div>
  );
}

function Voice({ data, update, dismiss }: ActivityViewProps<DiscordData>) {
  const now = useNow(1000, true, data.joinedAt);
  return (
    <div className={ui.column} style={{ padding: '14px 16px 14px', gap: 0, justifyContent: 'space-between' }}>
      <Rise i={0} className={ui.row} style={{ gap: 10 }}>
        <AppTile app="discord" size={30} />
        <div className={cx(ui.stack, ui.grow)} style={{ gap: 0 }}>
          <span className={ui.title}>{data.channel}</span>
          <span className={ui.sub}>{data.server}</span>
        </div>
        <Digits className={cx(ui.label, ui.num)} style={{ color: 'var(--island-fg-2)' }} value={formatClock(now - data.joinedAt)} />
      </Rise>
      <Rise i={1} className={ui.row} style={{ gap: 14, padding: '0 3px' }}>
        {MEMBERS.map((name, index) => (
          <span key={name} className={ui.row} style={{ gap: 7 }}>
            <Avatar
              name={name}
              size={22}
              speaking={!data.deafened && data.speaking === index && !(index === YOU && data.muted)}
              dimmed={index === YOU && data.muted}
            />
            <span className={ui.sub} style={{ color: 'var(--island-fg)' }}>
              <T>{name}</T>
            </span>
          </span>
        ))}
      </Rise>
      <Rise i={2} className={ui.row} style={{ gap: 6 }}>
        <IconButton
          label={data.muted ? 'Unmute' : 'Mute'}
          tone={data.muted ? 'active' : 'neutral'}
          size={34}
          onClick={() => update((prev) => ({ muted: !prev.muted }))}
        >
          <Swap id={data.muted ? 'off' : 'on'} dy={0} fit={false}>
            {data.muted ? <MicrophoneSlashIcon size={16} weight="fill" /> : <MicrophoneIcon size={16} weight="fill" />}
          </Swap>
        </IconButton>
        <IconButton
          label={data.deafened ? 'Undeafen' : 'Deafen'}
          tone={data.deafened ? 'active' : 'neutral'}
          size={34}
          onClick={() => update((prev) => ({ deafened: !prev.deafened }))}
        >
          <Swap id={data.deafened ? 'off' : 'on'} dy={0} fit={false}>
            {data.deafened ? <SpeakerSlashIcon size={16} weight="fill" /> : <HeadphonesIcon size={16} weight="fill" />}
          </Swap>
        </IconButton>
        <span className={ui.grow} />
        <IconButton label="Leave" tone="negative" size={34} onClick={() => leave(dismiss, 'Left the voice channel')}>
          <PhoneDisconnectIcon size={17} weight="fill" />
        </IconButton>
      </Rise>
    </div>
  );
}

function Expanded(props: ActivityViewProps<DiscordData>) {
  return props.data.state === 'incoming' ? <Incoming {...props} /> : <Voice {...props} />;
}

function Controller({ data, update }: ActivityApi<DiscordData>) {
  const active = data.state === 'voice';
  // Somebody else starts or stops talking every so often.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      update({ speaking: Math.random() < 0.25 ? -1 : Math.floor(Math.random() * MEMBERS.length) });
    }, scaled(1500));
    return () => clearInterval(timer);
  }, [active, update]);
  return null;
}

const voice = () => ({ state: 'voice' as const, joinedAt: Date.now() - 754_000, speaking: 0 });

export default defineLiveActivity<DiscordData>({
  kind: 'discord',
  title: 'Discord',
  description: 'Incoming calls and voice channels: who is talking, mute, deafen and leave.',
  icon: DiscordLogoIcon,
  tint: APPS.discord.color,
  priority: 10,
  defaultData: () => ({
    state: 'incoming',
    caller: 'Anna',
    channel: 'General',
    server: 'Design Squad',
    joinedAt: Date.now(),
    muted: false,
    deafened: false,
    speaking: -1,
  }),
  compact: {
    size: (data) => ({ width: data.state === 'incoming' ? 188 : 196, height: COMPACT_HEIGHT }),
    Component: Compact,
  },
  minimal: Minimal,
  expanded: {
    size: (data) =>
      data.state === 'incoming' ? { width: 360, height: 76, radius: 30 } : { width: 400, height: 148, radius: 30 },
    Component: Expanded,
  },
  startExpanded: (data) => data.state === 'incoming',
  Controller,
  demo: {
    presets: [
      { label: 'Incoming call', data: () => ({ state: 'incoming' as const }) },
      { label: 'Voice channel', data: voice },
    ],
    controls: [
      { type: 'text', key: 'caller', label: 'Caller' },
      { type: 'toggle', key: 'muted', label: 'Muted' },
    ],
  },
});
