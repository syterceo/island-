import { SoccerBallIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { emitEffect } from '../../effects';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, Digits, LiveDot, Rise, Swap, ui } from '../../ui/kit';

interface Team {
  code: string;
  color: string;
  score: number;
}

interface MatchData {
  home: Team;
  away: Team;
  minute: number;
  /** Text of the latest event. */
  event: string;
}

const GREEN = '#30d158';
const SCORERS = ['Saka', 'Bellingham', 'Ødegaard', 'Vinícius'];

function goal(update: ActivityApi<MatchData>['update'], side: 'home' | 'away') {
  update((data) => ({
    [side]: { ...data[side], score: data[side].score + 1 },
    event: `${SCORERS[(data.home.score + data.away.score) % SCORERS.length]} ${data.minute}'`,
  }));
  emitEffect('bump');
}

function Crest({ team, size = 34 }: { team: Team; size?: number }) {
  return (
    <span className={ui.crest} style={{ width: size, height: size, borderRadius: size * 0.3, background: team.color }}>
      {team.code}
    </span>
  );
}

function Score({ data, size }: { data: MatchData; size: number }) {
  return (
    <span className={cx(ui.row, ui.num)} style={{ gap: size * 0.22, fontSize: size, fontWeight: 700, lineHeight: 1 }}>
      <Digits value={String(data.home.score)} />
      <span style={{ color: 'var(--island-fg-3)' }}>:</span>
      <Digits value={String(data.away.score)} />
    </span>
  );
}

function Compact({ data }: ActivityViewProps<MatchData>) {
  return (
    <div className={ui.compact} style={{ gap: 8, padding: '0 13px 0 12px' }}>
      <span className={ui.label}>{data.home.code}</span>
      <Score data={data} size={15} />
      <span className={ui.label}>{data.away.code}</span>
      <span className={ui.grow} />
      <LiveDot color={GREEN} size={7} />
      <span className={cx(ui.label, ui.num)} style={{ width: 24, textAlign: 'right', color: 'var(--island-fg-2)' }}>
        {data.minute}'
      </span>
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <SoccerBallIcon size={18} weight="fill" color={GREEN} />
    </div>
  );
}

function Expanded({ data }: ActivityViewProps<MatchData>) {
  return (
    <div className={ui.expanded} style={{ gap: 0, padding: '0 22px' }}>
      <Rise i={0} className={ui.row} style={{ gap: 10, flex: 1 }}>
        <Crest team={data.home} />
        <span className={ui.title}>{data.home.code}</span>
      </Rise>
      <Rise i={1} className={ui.stack} style={{ alignItems: 'center', gap: 7 }}>
        <Score data={data} size={30} />
        <span className={ui.row} style={{ gap: 7 }}>
          <LiveDot color={GREEN} size={6} />
          <span className={cx(ui.caption, ui.num)} style={{ color: GREEN }}>
            {data.minute}'
          </span>
        </span>
      </Rise>
      <Rise i={2} className={ui.row} style={{ gap: 10, flex: 1, justifyContent: 'flex-end' }}>
        <span className={ui.title}>{data.away.code}</span>
        <Crest team={data.away} />
      </Rise>
      <Rise i={3} style={{ position: 'absolute', right: 0, bottom: 11, left: 0, textAlign: 'center' }}>
        <Swap id={data.event} className={ui.sub} align="center">
          <span>
            <T>Goal</T> · {data.event}
          </span>
        </Swap>
      </Rise>
    </div>
  );
}

function Controller({ update }: ActivityApi<MatchData>) {
  useEffect(() => {
    const timer = setInterval(() => update((data) => ({ minute: Math.min(90, data.minute + 1) })), scaled(6000));
    return () => clearInterval(timer);
  }, [update]);
  return null;
}

export default defineLiveActivity<MatchData>({
  kind: 'match',
  title: 'Live match',
  description: 'A live score on the island. A goal rolls the digits and bumps the island.',
  icon: SoccerBallIcon,
  tint: GREEN,
  priority: -1,
  defaultData: {
    home: { code: 'ARS', color: '#e03a3e', score: 1 },
    away: { code: 'RMA', color: '#3b5bdb', score: 1 },
    minute: 67,
    event: "Saka 52'",
  },
  compact: { size: { width: 198, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 112, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    controls: [
      { type: 'action', label: 'Home goal', run: (api) => goal(api.update, 'home') },
      { type: 'action', label: 'Away goal', run: (api) => goal(api.update, 'away') },
    ],
  },
});
