import { ClipboardTextIcon, CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { tween } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, IconButton, Rise, Swap, ui } from '../../ui/kit';

interface Clip {
  id: number;
  text: string;
}

interface ClipsData {
  items: Clip[];
}

const MAX_CLIPS = 5;
const BLUE = '#6ea8ff';

let sequence = 100;

/** Puts `text` at the top of the history, without duplicates. */
function remember(update: ActivityApi<ClipsData>['update'], text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  sequence += 1;
  const id = sequence;
  update((data) => ({
    items: [{ id, text: trimmed }, ...data.items.filter((item) => item.text !== trimmed)].slice(0, MAX_CLIPS),
  }));
}

function paste(update: ActivityApi<ClipsData>['update'], clip: Clip) {
  // Clipboard access can be denied; the island still confirms the choice.
  navigator.clipboard?.writeText(clip.text).catch(() => undefined);
  update((data) => ({ items: [clip, ...data.items.filter((item) => item.id !== clip.id)] }));
  useIslandStore.getState().show('clipboard', { label: 'Copied' });
}

function Compact({ data }: ActivityViewProps<ClipsData>) {
  const latest = data.items[0];
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 13px 0 10px' }}>
      <ClipboardTextIcon size={18} weight="fill" color={BLUE} style={{ flex: 'none' }} />
      <Swap id={latest?.id ?? 'empty'} className={cx(ui.label, ui.grow)} truncate>
        {latest ? latest.text : <T>Clipboard is empty</T>}
      </Swap>
      <span className={cx(ui.caption, ui.num)}>{data.items.length}</span>
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <ClipboardTextIcon size={18} weight="fill" color={BLUE} />
    </div>
  );
}

function Expanded({ data, update }: ActivityViewProps<ClipsData>) {
  return (
    <div className={ui.column} style={{ padding: '14px 16px 12px', gap: 10 }}>
      <Rise i={0} className={ui.row} style={{ gap: 8, padding: '0 2px 0 4px' }}>
        <ClipboardTextIcon size={18} weight="fill" color={BLUE} />
        <span className={cx(ui.title, ui.grow)}>
          <T>Clipboard</T>
        </span>
        <IconButton label="Clear history" tone="ghost" size={28} onClick={() => update({ items: [] })}>
          <TrashIcon size={15} weight="fill" />
        </IconButton>
      </Rise>
      <Rise i={1} className={ui.noteList}>
        {data.items.length === 0 && (
          <span className={ui.sub} style={{ display: 'block', padding: '6px 6px' }}>
            <T>Copy something and it will appear here</T>
          </span>
        )}
        <AnimatePresence initial={false}>
          {data.items.map((clip) => (
            <motion.div
              key={clip.id}
             
              className={ui.note}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={tween(0.3)}
            >
              <button type="button" className={ui.clipRow} onClick={() => paste(update, clip)}>
                <span>{clip.text}</span>
                <CopyIcon size={14} weight="fill" color="var(--island-fg-3)" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </Rise>
    </div>
  );
}

function Controller({ update }: ActivityApi<ClipsData>) {
  // Anything copied on the page lands in the history.
  useEffect(() => {
    const onCopy = () => remember(update, document.getSelection()?.toString() ?? '');
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [update]);
  return null;
}

const SAMPLES = ['#5865F2', 'npm run dev', 'The quick brown fox jumps over the lazy dog'];

export default defineLiveActivity<ClipsData>({
  kind: 'clips',
  title: 'Clipboard history',
  description: 'The last five things you copied. Click one to copy it again.',
  icon: ClipboardTextIcon,
  tint: BLUE,
  priority: -1,
  defaultData: () => ({
    items: [
      { id: 3, text: 'https://github.com/syterceo/island-' },
      { id: 2, text: 'hello@island.app' },
      { id: 1, text: 'Ship the island build on Friday' },
    ],
  }),
  compact: { size: { width: 232, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 232, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    controls: [
      {
        type: 'action',
        label: 'Copy a sample',
        run: (api) => remember(api.update, SAMPLES[api.data.items.length % SAMPLES.length]),
      },
    ],
  },
});
