import { RecordIcon, StopIcon } from '@phosphor-icons/react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityViewProps } from '../../types';
import { cx, Digits, formatClock, IconButton, Rise, ui, Wave } from '../../ui/kit';

interface RecordingData {
  startedAt: number;
}

const RED = 'var(--island-negative)';

const Dot = ({ size = 10 }: { size?: number }) => (
  <span className={cx(ui.dot, ui.pulse)} style={{ width: size, height: size, color: RED }} />
);

function Compact({ data }: ActivityViewProps<RecordingData>) {
  const now = useNow(500);
  return (
    <div className={ui.compact} style={{ padding: '0 12px 0 13px' }}>
      <Dot />
      <Digits value={formatClock(now - data.startedAt)} />
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <Dot />
    </div>
  );
}

function Expanded({ data, dismiss }: ActivityViewProps<RecordingData>) {
  const now = useNow(500);
  const stop = () => {
    dismiss();
    useIslandStore.getState().show('status', { tone: 'success', label: 'Recording saved' });
  };
  return (
    <div className={ui.expanded}>
      <Rise i={0} className={ui.stack}>
        <span className={ui.sub} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot size={8} /> Screen recording
        </span>
        <Digits className={ui.big} value={formatClock(now - data.startedAt)} />
      </Rise>
      <span className={ui.grow} />
      <Rise i={1}>
        <Wave bars={12} height={26} color={RED} variant="line" />
      </Rise>
      <Rise i={2}>
        <IconButton label="Stop" tone="negative" size={48} onClick={stop}>
          <StopIcon size={20} weight="fill" />
        </IconButton>
      </Rise>
    </div>
  );
}

export default defineLiveActivity<RecordingData>({
  kind: 'recording',
  title: 'Screen Recording',
  description: 'Elapsed time with a live level and a stop control.',
  icon: RecordIcon,
  defaultData: () => ({ startedAt: Date.now() }),
  compact: { size: { width: 104, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 340, height: 92 }, Component: Expanded },
});
