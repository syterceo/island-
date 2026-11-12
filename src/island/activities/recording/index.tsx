import { RecordIcon, StopIcon } from '@phosphor-icons/react';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { useNow } from '../../hooks/useNow';
import { COMPACT_HEIGHT } from '../../metrics';
import { useIslandStore } from '../../store';
import type { ActivityViewProps } from '../../types';
import { cx, Digits, formatClock, IconButton, LiveDot, Rise, ui, Wave } from '../../ui/kit';

interface RecordingData {
  startedAt: number;
}

const RED = 'var(--island-negative)';

function Compact({ data }: ActivityViewProps<RecordingData>) {
  const now = useNow(500);
  return (
    <div className={ui.compact} style={{ padding: '0 13px 0 14px' }}>
      <LiveDot />
      <span className={ui.caption} style={{ color: RED }}>
        Rec
      </span>
      <span className={ui.grow} />
      <Digits value={formatClock(now - data.startedAt)} />
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <LiveDot />
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
    <div className={ui.expanded} style={{ gap: 14, padding: '0 16px 0 22px' }}>
      <Rise i={0} className={ui.stack} style={{ gap: 6 }}>
        <span className={ui.row} style={{ gap: 9 }}>
          <LiveDot size={8} />
          <span className={ui.caption} style={{ color: RED }}>
            <T>Recording screen</T>
          </span>
        </span>
        <Digits className={cx(ui.big)} style={{ fontSize: 28 }} value={formatClock(now - data.startedAt)} />
      </Rise>
      <span className={ui.grow} />
      <Rise i={1}>
        <Wave bars={14} height={24} color={RED} variant="line" />
      </Rise>
      <Rise i={2}>
        <IconButton label="Stop" tone="negative" size={42} onClick={stop}>
          <StopIcon size={18} weight="fill" />
        </IconButton>
      </Rise>
    </div>
  );
}

export default defineLiveActivity<RecordingData>({
  kind: 'recording',
  title: 'Screen recording',
  description: 'Elapsed time with a live level and a stop control.',
  icon: RecordIcon,
  tint: '#ff453a',
  defaultData: () => ({ startedAt: Date.now() }),
  compact: { size: { width: 132, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 340, height: 84, radius: 30 }, Component: Expanded },
});
