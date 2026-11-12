import {
  CircleIcon,
  MicrophoneIcon,
  MusicNotesIcon,
  NotePencilIcon,
  RecordIcon,
  TimerIcon,
  UploadSimpleIcon,
  type Icon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineLiveActivity } from '../../define';
import { IDLE_KIND } from '../../definitions';
import { useNow } from '../../hooks/useNow';
import { IDLE_SIZE } from '../../metrics';
import { fx, spring } from '../../motion/springs';
import { useIslandStore } from '../../store';
import { Digits, Rise, ui } from '../../ui/kit';

/*
 * The idle activity is always present underneath everything else. Its compact view is the
 * resting island (empty), its expanded view is the hub: a clock and a launcher.
 */

function IdleCompact() {
  return null;
}

const start = (kind: string, open = false) => () => {
  const store = useIslandStore.getState();
  store.start(kind);
  if (open) store.expand(kind);
};

const ACTIONS: { label: string; icon: Icon; color: string; run: () => void }[] = [
  { label: 'Timer', icon: TimerIcon, color: 'var(--island-orange)', run: start('timer') },
  { label: 'Music', icon: MusicNotesIcon, color: '#ff5f6d', run: start('music', true) },
  { label: 'Note', icon: NotePencilIcon, color: 'var(--island-warning)', run: start('notes', true) },
  { label: 'Dictate', icon: MicrophoneIcon, color: 'var(--island-accent)', run: start('voice', true) },
  { label: 'Record', icon: RecordIcon, color: 'var(--island-negative)', run: start('recording') },
  {
    label: 'Upload',
    icon: UploadSimpleIcon,
    color: 'var(--island-positive)',
    run: () => useIslandStore.getState().start('upload', { dropping: true }),
  },
];

function Hub() {
  const now = new Date(useNow(5000));
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className={ui.expanded} style={{ gap: 18, padding: '16px 16px 16px 24px' }}>
      <Rise i={0} className={ui.stack} style={{ gap: 8, width: 132, flex: 'none' }}>
        <Digits className={ui.big} style={{ fontSize: 40 }} value={time} />
        <span className={ui.sub} style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>
          {date}
        </span>
      </Rise>
      <div
        className={ui.grow}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8, height: '100%' }}
      >
        {ACTIONS.map(({ label, icon: ActionIcon, color, run }, index) => (
          <Rise key={label} i={1 + index * 0.6}>
            <motion.button
              type="button"
              className={ui.hubTile}
              whileTap={{ scale: fx.scale(0.93) }}
              transition={spring('snappy')}
              onClick={run}
            >
              <ActionIcon size={20} weight="fill" color={color} />
              {label}
            </motion.button>
          </Rise>
        ))}
      </div>
    </div>
  );
}

export default defineLiveActivity<Record<string, never>>({
  kind: IDLE_KIND,
  title: 'Idle',
  icon: CircleIcon,
  defaultData: {},
  compact: { size: (_data, { attachment }) => IDLE_SIZE[attachment], Component: IdleCompact },
  minimal: IdleCompact,
  expanded: { size: { width: 420, height: 164 }, Component: Hub },
});
