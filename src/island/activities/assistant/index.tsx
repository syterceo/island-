import { CopyIcon, SparkleIcon, StopIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { T, useLanguage } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { fx, scaled, tween } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, DrawnMark, IconButton, Rise, Swap, ui } from '../../ui/kit';

type Phase = 'thinking' | 'writing' | 'done';

interface AssistantData {
  phase: Phase;
  /** Words of the answer written so far. */
  words: number;
}

const VIOLET = '#b79cff';

const TEXT = {
  en: {
    prompt: 'Summarize the design review notes',
    answer:
      'Three decisions were made. The island docks to the top edge, every app tints it with its own colour, and the Windows build ships after the animation pass.',
  },
  ru: {
    prompt: 'Кратко перескажи заметки с дизайн-ревью',
    answer:
      'Принято три решения. Остров крепится к верхнему краю, каждое приложение окрашивает его в свой цвет, а сборка для Windows выходит после доводки анимаций.',
  },
};

const LABEL: Record<Phase, string> = { thinking: 'Thinking', writing: 'Writing', done: 'Answer ready' };

function Indicator({ phase }: { phase: Phase }) {
  return (
    <Swap id={phase === 'done' ? 'done' : 'busy'} dy={0} fit={false}>
      <span style={{ display: 'grid', placeItems: 'center', width: 18, height: 18 }}>
        {phase === 'done' ? <DrawnMark /> : <SparkleIcon size={18} weight="fill" color={VIOLET} />}
      </span>
    </Swap>
  );
}

function Compact({ data }: ActivityViewProps<AssistantData>) {
  return (
    <div className={ui.compact} style={{ gap: 9, justifyContent: 'flex-start', padding: '0 14px 0 11px' }}>
      <Indicator phase={data.phase} />
      <Swap id={data.phase} className={ui.label}>
        <span className={data.phase === 'done' ? undefined : ui.shimmer}>
          <T>{LABEL[data.phase]}</T>
        </span>
      </Swap>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<AssistantData>) {
  return (
    <div className={ui.center}>
      <Indicator phase={data.phase} />
    </div>
  );
}

function Expanded({ data, dismiss }: ActivityViewProps<AssistantData>) {
  const text = TEXT[useLanguage()];
  const words = text.answer.split(' ');
  const done = data.phase === 'done';
  const copy = () => {
    navigator.clipboard?.writeText(text.answer).catch(() => undefined);
    dismiss();
    useIslandStore.getState().show('clipboard', { label: 'Copied' });
  };
  return (
    <div className={ui.column} style={{ padding: '14px 14px 14px 18px', gap: 8 }}>
      <Rise i={0} className={ui.row} style={{ gap: 9 }}>
        <Indicator phase={data.phase} />
        <div className={cx(ui.stack, ui.grow)} style={{ gap: 0 }}>
          <Swap id={data.phase} className={ui.caption} style={{ color: 'var(--island-tint)' }}>
            <T>{LABEL[data.phase]}</T>
          </Swap>
          <span className={ui.sub}>{text.prompt}</span>
        </div>
        <IconButton label={done ? 'Copy answer' : 'Stop'} size={32} onClick={done ? copy : dismiss}>
          <Swap id={done ? 'copy' : 'stop'} dy={0} fit={false}>
            {done ? <CopyIcon size={15} weight="fill" /> : <StopIcon size={14} weight="fill" />}
          </Swap>
        </IconButton>
      </Rise>
      <Rise i={1} className={ui.answer}>
        {words.slice(0, data.words).map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, filter: fx.blur(4) }}
            animate={{ opacity: 1, filter: fx.blur(0) }}
            transition={tween(0.35)}
          >
            {word}{' '}
          </motion.span>
        ))}
        {!done && <i className={ui.caret} />}
      </Rise>
    </div>
  );
}

function Controller({ data, update, dismiss }: ActivityApi<AssistantData>) {
  const { phase, words } = data;
  const total = TEXT[useLanguage()].answer.split(' ').length;

  useEffect(() => {
    if (phase === 'thinking') {
      const timer = setTimeout(() => update({ phase: 'writing' }), scaled(1800));
      return () => clearTimeout(timer);
    }
    if (phase === 'writing') {
      const timer = setTimeout(
        () => update(words + 1 >= total ? { words: total, phase: 'done' } : { words: words + 1 }),
        scaled(110),
      );
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(dismiss, scaled(9000));
    return () => clearTimeout(timer);
  }, [phase, words, total, update, dismiss]);

  return null;
}

export default defineLiveActivity<AssistantData>({
  kind: 'assistant',
  title: 'AI assistant',
  description: 'Shows that a model is thinking, streams the answer, then says it is ready.',
  icon: SparkleIcon,
  tint: VIOLET,
  priority: 3,
  defaultData: { phase: 'thinking', words: 0 },
  compact: { size: { width: 168, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 400, height: 152, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    presets: [
      { label: 'Ask', data: { phase: 'thinking', words: 0 } },
      { label: 'Answer ready', data: { phase: 'done', words: 99 } },
    ],
  },
});
