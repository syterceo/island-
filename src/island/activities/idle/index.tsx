import {
  BellSlashIcon,
  BluetoothIcon,
  CircleIcon,
  ClipboardTextIcon,
  type Icon,
  MicrophoneIcon,
  MoonStarsIcon,
  MusicNotesIcon,
  NotePencilIcon,
  RecordIcon,
  TargetIcon,
  TimerIcon,
  UploadSimpleIcon,
  WifiHighIcon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineLiveActivity } from '../../define';
import { IDLE_ID, IDLE_KIND } from '../../definitions';
import { useNow } from '../../hooks/useNow';
import { T, useLanguage } from '../../i18n';
import { IDLE_SIZE } from '../../metrics';
import { fx, spring } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityViewProps } from '../../types';
import { Digits, Rise, ui } from '../../ui/kit';

/*
 * The idle activity is always present underneath everything else. Its compact view is the
 * resting island (empty), its expanded view is the hub: a clock, quick settings and a launcher.
 * Its data holds the quick settings, which outlive `reset`.
 */

export interface HubData {
  wifi: boolean;
  bluetooth: boolean;
  /** Do not disturb: interruptive alerts are suppressed. */
  dnd: boolean;
  night: boolean;
}

function IdleCompact() {
  return null;
}

const start = (kind: string, open = false) => () => {
  const store = useIslandStore.getState();
  store.start(kind);
  if (open) store.expand(kind);
};

const TOGGLES: { key: keyof HubData; label: string; icon: Icon }[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: WifiHighIcon },
  { key: 'bluetooth', label: 'Bluetooth', icon: BluetoothIcon },
  { key: 'dnd', label: 'Quiet', icon: BellSlashIcon },
  { key: 'night', label: 'Night', icon: MoonStarsIcon },
];

const ACTIONS: { label: string; icon: Icon; color: string; run: () => void }[] = [
  { label: 'Timer', icon: TimerIcon, color: 'var(--island-orange)', run: start('timer') },
  { label: 'Focus', icon: TargetIcon, color: '#ff6b57', run: start('focus') },
  { label: 'Music', icon: MusicNotesIcon, color: '#ff5500', run: start('music', true) },
  { label: 'Note', icon: NotePencilIcon, color: 'var(--island-warning)', run: start('notes', true) },
  { label: 'Dictate', icon: MicrophoneIcon, color: 'var(--island-accent)', run: start('voice', true) },
  { label: 'Clips', icon: ClipboardTextIcon, color: '#6ea8ff', run: start('clips', true) },
  { label: 'Record', icon: RecordIcon, color: 'var(--island-negative)', run: start('recording') },
  {
    label: 'Upload',
    icon: UploadSimpleIcon,
    color: 'var(--island-positive)',
    run: () => useIslandStore.getState().start('upload', { dropping: true }),
  },
];

function Hub({ data }: ActivityViewProps<HubData>) {
  const language = useLanguage();
  const now = new Date(useNow(5000));
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' });
  const tap = { whileTap: { scale: fx.scale(0.94) }, transition: spring('snappy', { bounce: 0 }) };
  return (
    <div className={ui.expanded} style={{ gap: 16, padding: '14px 14px 14px 22px' }}>
      <Rise i={0} className={ui.stack} style={{ gap: 8, width: 116, flex: 'none' }}>
        <Digits className={ui.big} style={{ fontSize: 38 }} value={time} />
        <span className={ui.sub} style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>
          {date}
        </span>
      </Rise>
      <div className={`${ui.stack} ${ui.grow}`} style={{ gap: 8, height: '100%' }}>
        <Rise i={1} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {TOGGLES.map(({ key, label, icon: ToggleIcon }) => (
            <motion.button
              key={key}
              type="button"
              className={ui.hubToggle}
              data-on={data[key]}
              aria-pressed={data[key]}
              {...tap}
              onClick={(event) => {
                event.stopPropagation();
                useIslandStore.getState().update(IDLE_ID, (prev: HubData) => ({ [key]: !prev[key] }));
              }}
            >
              <ToggleIcon size={15} weight="fill" />
              <T>{label}</T>
            </motion.button>
          ))}
        </Rise>
        <div
          className={ui.grow}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '1fr', gap: 8 }}
        >
          {ACTIONS.map(({ label, icon: ActionIcon, color, run }, index) => (
            <Rise key={label} i={2 + index * 0.4}>
              <motion.button type="button" className={ui.hubTile} {...tap} onClick={run}>
                <ActionIcon size={19} weight="fill" color={color} />
                <T>{label}</T>
              </motion.button>
            </Rise>
          ))}
        </div>
      </div>
    </div>
  );
}

export default defineLiveActivity<HubData>({
  kind: IDLE_KIND,
  title: 'Idle',
  icon: CircleIcon,
  defaultData: { wifi: true, bluetooth: true, dnd: false, night: false },
  compact: { size: (_data, { attachment }) => IDLE_SIZE[attachment], Component: IdleCompact },
  minimal: IdleCompact,
  expanded: { size: { width: 524, height: 194, radius: 32 }, Component: Hub },
});
