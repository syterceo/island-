import { NotePencilIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { defineLiveActivity } from '../../define';
import { emitEffect } from '../../effects';
import { COMPACT_HEIGHT } from '../../metrics';
import { spring, tween } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { IconButton, Rise, Swap, ui } from '../../ui/kit';

interface Note {
  id: number;
  text: string;
}

interface NotesData {
  notes: Note[];
}

const YELLOW = 'var(--island-warning)';

function addNote(update: ActivityApi<NotesData>['update'], text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  update((data) => ({ notes: [{ id: Date.now(), text: trimmed }, ...data.notes] }));
  emitEffect('bump');
}

function Compact({ data }: ActivityViewProps<NotesData>) {
  const latest = data.notes[0];
  return (
    <div className={ui.compact} style={{ justifyContent: 'flex-start', padding: '0 14px 0 10px' }}>
      <NotePencilIcon size={18} weight="fill" color={YELLOW} style={{ flex: 'none' }} />
      <Swap id={latest?.id ?? 'empty'} className={`${ui.label} ${ui.grow}`} truncate>
        {latest?.text ?? 'No notes yet'}
      </Swap>
    </div>
  );
}

function Minimal() {
  return (
    <div className={ui.center}>
      <NotePencilIcon size={18} weight="fill" color={YELLOW} />
    </div>
  );
}

function Expanded({ data, update }: ActivityViewProps<NotesData>) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    addNote(update, draft);
    setDraft('');
  };
  return (
    <div className={ui.column} style={{ padding: '16px 18px 16px', gap: 10 }}>
      <Rise i={0} className={ui.row} style={{ gap: 8, padding: '0 4px' }}>
        <NotePencilIcon size={18} weight="fill" color={YELLOW} />
        <span className={ui.title}>Notes</span>
        <span className={ui.grow} />
        <Swap id={data.notes.length} className={ui.sub}>
          {data.notes.length}
        </Swap>
      </Rise>
      <Rise i={1} className={ui.noteList}>
        <AnimatePresence initial={false}>
          {data.notes.map((note) => (
            <motion.div
              key={note.id}
              className={ui.note}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: spring('content') }}
              exit={{ height: 0, opacity: 0, transition: tween(0.2) }}
            >
              <div className={ui.noteInner}>
                <span>{note.text}</span>
                <IconButton
                  label="Delete note"
                  tone="ghost"
                  size={24}
                  onClick={() => update((prev) => ({ notes: prev.notes.filter((item) => item.id !== note.id) }))}
                >
                  <XIcon size={12} weight="bold" />
                </IconButton>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Rise>
      <Rise i={2} className={ui.row} style={{ gap: 8 }}>
        <input
          className={ui.input}
          value={draft}
          placeholder="Write a note and press Enter"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <IconButton label="Add note" tone="accent" size={36} onClick={submit}>
          <PlusIcon size={16} weight="bold" />
        </IconButton>
      </Rise>
    </div>
  );
}

const SAMPLES = ['Call the studio about the new cover', 'Ship the island build on Friday', 'Buy coffee beans'];

export default defineLiveActivity<NotesData>({
  kind: 'notes',
  title: 'Notes',
  description: 'Pinned notes. Type in the expanded view; new notes slide into the list.',
  icon: NotePencilIcon,
  defaultData: () => ({
    notes: [
      { id: 2, text: 'Ship the island build on Friday' },
      { id: 1, text: 'Ask Anna for the new icon set' },
    ],
  }),
  compact: { size: { width: 216, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 360, height: 224 }, Component: Expanded },
  demo: {
    controls: [
      {
        type: 'action',
        label: 'Add a sample note',
        run: (api) => addNote(api.update, SAMPLES[api.data.notes.length % SAMPLES.length]),
      },
    ],
  },
});
