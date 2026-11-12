import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { APPS } from '../../apps';
import { defineLiveActivity } from '../../define';
import { emitEffect } from '../../effects';
import { useNow } from '../../hooks/useNow';
import { T, useLanguage } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { AppTile, Avatar, cx, Digits, formatClock, IconButton, Rise, Swap, TextButton, ui } from '../../ui/kit';

interface MeetingData {
  title: string;
  startsAt: number;
  minutes: number;
  people: string[];
}

const hhmm = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

function Countdown({ data }: { data: MeetingData }) {
  const now = useNow(1000, true, data.startsAt);
  const left = data.startsAt - now;
  return (
    <Swap id={left > 0 ? 'soon' : 'now'} className={ui.label} align="end" style={{ color: 'var(--island-tint)' }}>
      {left > 0 ? <Digits value={formatClock(left, 'ceil')} /> : <T>Now</T>}
    </Swap>
  );
}

function Compact({ data }: ActivityViewProps<MeetingData>) {
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 13px 0 7px' }}>
      <AppTile app="calendar" />
      <span className={cx(ui.label, ui.truncate, ui.grow)}>
        <T>{data.title}</T>
      </span>
      <Countdown data={data} />
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <AppTile app="calendar" size={20} />
    </div>
  );
}

function Expanded({ data, dismiss }: ActivityViewProps<MeetingData>) {
  const language = useLanguage();
  const start = new Date(data.startsAt);
  const join = () => {
    dismiss();
    useIslandStore.getState().show('status', { tone: 'success', label: 'Joined the meeting' });
  };
  return (
    <div className={ui.expanded} style={{ gap: 14, padding: '0 16px 0 16px' }}>
      <Rise i={0} className={ui.dayTile}>
        <span className={ui.caption} style={{ color: 'var(--island-tint)' }}>
          {start.toLocaleDateString(language, { month: 'short' }).replace('.', '')}
        </span>
        <b>{start.getDate()}</b>
      </Rise>
      <Rise i={1} className={cx(ui.stack, ui.grow)} style={{ gap: 4 }}>
        <span className={ui.title} style={{ fontSize: 17 }}>
          <T>{data.title}</T>
        </span>
        <span className={cx(ui.sub, ui.num)}>
          {hhmm(data.startsAt)} – {hhmm(data.startsAt + data.minutes * 60_000)} · {APPS.meet.name}
        </span>
        <span className={ui.row} style={{ gap: 8, marginTop: 4 }}>
          <span className={ui.avatars}>
            {data.people.map((name) => (
              <Avatar key={name} name={name} size={20} />
            ))}
          </span>
          <Countdown data={data} />
        </span>
      </Rise>
      <Rise i={2}>
        <TextButton tone="positive" onClick={join}>
          Join
        </TextButton>
      </Rise>
      <Rise i={3}>
        <IconButton label="Dismiss" size={34} onClick={dismiss}>
          <XIcon size={15} weight="bold" />
        </IconButton>
      </Rise>
    </div>
  );
}

function Controller({ data }: ActivityApi<MeetingData>) {
  const now = useNow(1000, true, data.startsAt);
  const started = now >= data.startsAt;
  useEffect(() => {
    if (started) emitEffect('bump');
  }, [started]);
  return null;
}

const startingIn = (ms: number) => () => ({ startsAt: Date.now() + ms });

export default defineLiveActivity<MeetingData>({
  kind: 'meeting',
  title: 'Meeting',
  description: 'The next calendar event with a countdown and a Join button.',
  icon: CalendarBlankIcon,
  tint: APPS.calendar.color,
  priority: 4,
  defaultData: () => ({
    title: 'Design review',
    startsAt: Date.now() + 10 * 60_000,
    minutes: 30,
    people: ['Anna', 'Max', 'Kira'],
  }),
  compact: { size: { width: 222, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 420, height: 96, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    presets: [
      { label: 'In 10 minutes', data: startingIn(10 * 60_000) },
      { label: 'In 10 seconds', data: startingIn(10_000) },
    ],
    controls: [{ type: 'text', key: 'title', label: 'Title' }],
  },
});
