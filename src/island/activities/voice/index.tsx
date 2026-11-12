import { CircleNotchIcon, MicrophoneIcon, WarningIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { emitEffect } from '../../effects';
import { COMPACT_HEIGHT } from '../../metrics';
import { fx, scaled, spring, tween } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps, TextReveal } from '../../types';
import { cx, DrawnMark, Rise, Swap, ui, Wave } from '../../ui/kit';

type Phase = 'listening' | 'transcribing' | 'done' | 'error';

interface VoiceData {
  phase: Phase;
  /** Words recognised so far. */
  words: number;
  /** Walk through the phases on its own. */
  auto: boolean;
}

const WORDS =
  'Remind me to send the design review notes to the team before lunch tomorrow and book the small meeting room for three'.split(
    ' ',
  );

const LABEL: Record<Phase, string> = {
  listening: 'Listening',
  transcribing: 'Transcribing',
  done: 'Inserted',
  error: 'No microphone',
};

const NEXT: Record<Phase, Phase> = {
  listening: 'transcribing',
  transcribing: 'done',
  done: 'listening',
  error: 'listening',
};

function Indicator({ phase }: { phase: Phase }) {
  return (
    <Swap id={phase} dy={0}>
      <span style={{ display: 'grid', placeItems: 'center', width: 18, height: 18 }}>
        {phase === 'listening' && <span className={cx(ui.dot, ui.pulse)} style={{ color: 'var(--island-accent)' }} />}
        {phase === 'transcribing' && <CircleNotchIcon size={18} weight="bold" className={ui.spin} />}
        {phase === 'done' && <DrawnMark />}
        {phase === 'error' && <WarningIcon size={18} weight="fill" color="var(--island-negative)" />}
      </span>
    </Swap>
  );
}

function Compact({ data }: ActivityViewProps<VoiceData>) {
  return (
    <div className={ui.compact} style={{ padding: '0 13px 0 11px' }}>
      <Indicator phase={data.phase} />
      <Swap id={data.phase} className={ui.label}>
        {data.phase === 'listening' ? (
          <Wave bars={8} height={16} />
        ) : (
          <span className={data.phase === 'transcribing' ? ui.shimmer : undefined}>{LABEL[data.phase]}</span>
        )}
      </Swap>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<VoiceData>) {
  return (
    <div className={ui.center}>
      <Indicator phase={data.phase} />
    </div>
  );
}

function Word({ text, reveal }: { text: string; reveal: TextReveal }) {
  if (reveal === 'letters') {
    return (
      <>
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: fx.offset(5) }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring('snappy', { delay: index * 0.022 })}
          >
            {char}
          </motion.span>
        ))}
        <span> </span>
      </>
    );
  }
  return (
    <motion.span
      initial={reveal === 'smooth' ? { opacity: 0 } : { opacity: 0, y: fx.offset(6), filter: fx.blur(4) }}
      animate={{ opacity: 1, y: 0, filter: fx.blur(0) }}
      transition={reveal === 'smooth' ? tween(0.6) : spring('content')}
    >
      {text}{' '}
    </motion.span>
  );
}

function Expanded({ data }: ActivityViewProps<VoiceData>) {
  const reveal = useIslandStore((state) => state.settings.textReveal);
  return (
    <div className={ui.column} style={{ padding: '16px 22px 16px', gap: 10 }}>
      <Rise i={0} className={ui.row} style={{ gap: 8, height: 22 }}>
        <Indicator phase={data.phase} />
        <Swap id={data.phase} className={ui.sub}>
          <span className={data.phase === 'transcribing' ? ui.shimmer : undefined}>{LABEL[data.phase]}</span>
        </Swap>
        <span className={ui.grow} />
        <Wave bars={14} height={20} active={data.phase === 'listening'} />
      </Rise>
      <Rise i={1} className={ui.transcript}>
        {data.words === 0 && <span style={{ color: 'var(--island-fg-3)' }}>Start speaking…</span>}
        {WORDS.slice(0, data.words).map((word, index) => (
          <Word key={index} text={word} reveal={reveal} />
        ))}
      </Rise>
    </div>
  );
}

function Controller({ data, update, dismiss }: ActivityApi<VoiceData>) {
  const { phase, words, auto } = data;

  useEffect(() => {
    if (phase === 'error') emitEffect('shake');
  }, [phase]);

  useEffect(() => {
    if (phase === 'listening' && words < WORDS.length) {
      const timer = setTimeout(() => update({ words: words + 1 }), scaled(170 + (words % 4) * 70));
      return () => clearTimeout(timer);
    }
    if (!auto) return;
    const waits: Record<Phase, number> = { listening: 500, transcribing: 1500, done: 1500, error: 2600 };
    const timer = setTimeout(() => {
      if (phase === 'done' || phase === 'error') dismiss();
      else update({ phase: NEXT[phase] });
    }, scaled(waits[phase]));
    return () => clearTimeout(timer);
  }, [phase, words, auto, update, dismiss]);

  return null;
}

export default defineLiveActivity<VoiceData>({
  kind: 'voice',
  title: 'Dictation',
  description: 'Listens, transcribes and inserts text. The reveal style is a setting.',
  icon: MicrophoneIcon,
  priority: 5,
  defaultData: { phase: 'listening', words: 0, auto: true },
  compact: { size: { width: 132, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 136 }, Component: Expanded },
  demo: {
    presets: [
      { label: 'Dictate', data: { phase: 'listening', words: 0, auto: true } },
      { label: 'Hold state', data: { phase: 'listening', words: 0, auto: false } },
      { label: 'Error', data: { phase: 'error', words: 0, auto: true } },
    ],
    controls: [
      {
        type: 'select',
        key: 'phase',
        label: 'Phase',
        options: [
          { label: 'Listening', value: 'listening' },
          { label: 'Transcribing', value: 'transcribing' },
          { label: 'Done', value: 'done' },
          { label: 'Error', value: 'error' },
        ],
      },
      { type: 'toggle', key: 'auto', label: 'Advance automatically' },
    ],
  },
  Controller,
});
