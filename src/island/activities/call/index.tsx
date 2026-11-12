import { PhoneIcon, PhoneXIcon } from '@phosphor-icons/react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, Digits, formatClock, IconButton, Rise, Swap, ui, Wave } from '../../ui/kit';

interface CallData {
  name: string;
  state: 'incoming' | 'active';
  answeredAt: number;
}

const GREEN = 'var(--island-positive)';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

function answer({ update, collapse }: Pick<ActivityApi<CallData>, 'update' | 'collapse'>) {
  update({ state: 'active', answeredAt: Date.now() });
  collapse();
}

function hangUp(dismiss: () => void) {
  dismiss();
  useIslandStore.getState().show('status', { tone: 'info', label: 'Call ended' });
}

function Compact({ data }: ActivityViewProps<CallData>) {
  const now = useNow(500, data.state === 'active');
  const active = data.state === 'active';
  return (
    <div className={ui.compact} style={{ color: GREEN }}>
      <PhoneIcon size={18} weight="fill" className={active ? undefined : ui.wiggle} />
      <Swap id={data.state}>
        {active ? <Digits value={formatClock(now - data.answeredAt)} /> : <Wave bars={5} height={14} color={GREEN} />}
      </Swap>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<CallData>) {
  return (
    <div className={ui.center} style={{ color: GREEN }}>
      <PhoneIcon size={18} weight="fill" className={data.state === 'active' ? undefined : ui.wiggle} />
    </div>
  );
}

function Expanded({ data, update, dismiss, collapse }: ActivityViewProps<CallData>) {
  const now = useNow(500, data.state === 'active');
  const active = data.state === 'active';
  return (
    <div className={ui.expanded} style={{ padding: '0 20px 0 18px' }}>
      <Rise i={0}>
        <span
          className={ui.avatar}
          style={{ width: 50, height: 50, fontSize: 17, background: 'linear-gradient(135deg, #7f7fd5, #86a8e7 55%, #91eae4)' }}
        >
          {initials(data.name)}
        </span>
      </Rise>
      <Rise i={1} className={cx(ui.stack, ui.grow)}>
        <Swap id={data.state} className={ui.sub}>
          {active ? formatClock(now - data.answeredAt) : 'Incoming call'}
        </Swap>
        <span className={ui.title}>{data.name}</span>
      </Rise>
      <Rise i={2}>
        <IconButton label={active ? 'Hang up' : 'Decline'} tone="negative" size={48} onClick={() => hangUp(dismiss)}>
          <PhoneXIcon size={24} weight="fill" />
        </IconButton>
      </Rise>
      {!active && (
        <Rise i={3}>
          <IconButton label="Accept" tone="positive" size={48} onClick={() => answer({ update, collapse })}>
            <PhoneIcon size={24} weight="fill" />
          </IconButton>
        </Rise>
      )}
    </div>
  );
}

export default defineLiveActivity<CallData>({
  kind: 'call',
  title: 'Call',
  description: 'Incoming call that opens expanded, then a running call.',
  icon: PhoneIcon,
  priority: 10,
  defaultData: () => ({ name: 'Anna Petrova', state: 'incoming', answeredAt: Date.now() }),
  compact: { size: { width: 118, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 360, height: 88 }, Component: Expanded },
  startExpanded: (data) => data.state === 'incoming',
  demo: {
    presets: [
      { label: 'Incoming', data: () => ({ state: 'incoming' as const }) },
      { label: 'Active', data: () => ({ state: 'active' as const, answeredAt: Date.now() }) },
    ],
    controls: [
      { type: 'text', key: 'name', label: 'Caller' },
      { type: 'action', label: 'Accept', run: (api) => answer(api) },
    ],
  },
});
