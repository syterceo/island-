import { animate, AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { appOf } from '../apps';
import { fx, spring, tween } from '../motion/springs';
import { VIEW_STATE } from '../motion/variants';
import { useIslandStore } from '../store';
import type { WaveStyle } from '../types';
import css from './ui.module.css';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

const riseVariants = {
  [VIEW_STATE.initial]: () => ({ opacity: 0, y: fx.offset(10) }),
  [VIEW_STATE.enter]: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    // A tween lands exactly on its target, so the last frame of the entrance is the resting frame.
    transition: tween(0.42, { delay: 0.07 + index * 0.04 }),
  }),
};

/** Rises into place with the view swap. `i` staggers siblings. */
export function Rise({ i = 0, ...props }: HTMLMotionProps<'div'> & { i?: number }) {
  return <motion.div variants={riseVariants} custom={i} {...props} />;
}

interface SwapProps {
  /** Content identity. A new id crossfades to the new children. */
  id: string | number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Vertical travel in px. */
  dy?: number;
  /** Fill the available width and cut long text with an ellipsis. */
  truncate?: boolean;
  /** Which edge stays put while the width changes. */
  align?: 'start' | 'center' | 'end';
  /** Glide to the width of the new content. Off for contents of one fixed width. */
  fit?: boolean;
}

/**
 * Crossfades between contents in one grid cell. The cell glides to the width of the new content,
 * so neither the content nor its neighbours jump when the old content is removed.
 */
export function Swap({ id, children, className, style, dy = 6, truncate, align = 'start', fit = true }: SwapProps) {
  const box = useRef<HTMLSpanElement>(null);
  const item = useRef<HTMLSpanElement>(null);
  const measured = useRef<number | null>(null);
  const fitted = fit && !truncate;

  useLayoutEffect(() => {
    const container = box.current;
    const current = item.current;
    if (!fitted || !container || !current) return;
    const apply = () => {
      // offsetWidth ignores the transforms of the running view swap.
      const next = current.offsetWidth;
      if (next === measured.current) return;
      if (measured.current === null) container.style.width = `${next}px`;
      else animate(container, { width: next }, tween(0.3));
      measured.current = next;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(current);
    return () => observer.disconnect();
  }, [id, fitted]);

  return (
    <span ref={box} className={cx(css.swap, className)} data-fit={fitted} data-align={align} style={style}>
      <AnimatePresence initial={false}>
        <motion.span
          key={id}
          ref={item}
          className={cx(css.swapItem, truncate && css.truncate)}
          initial={{ opacity: 0, y: fx.offset(dy), filter: fx.blur(4) }}
          animate={{ opacity: 1, y: 0, filter: fx.blur(0), transition: tween(0.3) }}
          exit={{ opacity: 0, y: fx.offset(-dy), filter: fx.blur(4), transition: tween(0.16) }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Tabular number whose changing digits roll individually. */
export function Digits({ value, className, style }: { value: string; className?: string; style?: CSSProperties }) {
  const chars = value.split('');
  return (
    <span className={cx(css.digits, className)} style={style} aria-label={value}>
      {chars.map((char, index) => (
        // Keyed from the right, so the seconds keep their slot when a digit appears on the left.
        <Swap key={chars.length - index} id={char} dy={7} fit={false}>
          {char}
        </Swap>
      ))}
    </span>
  );
}

/** A steady dot with a halo that breathes. Nothing changes size, so it never looks unsettled. */
export function LiveDot({ color = 'var(--island-negative)', size = 10 }: { color?: string; size?: number }) {
  return <span className={css.live} style={{ width: size, height: size, color }} />;
}

/** Rounded square app icon. */
export function AppTile({ app, size = 22 }: { app: string; size?: number }) {
  const { color, ink, icon: AppIcon } = appOf(app);
  return (
    <span
      className={css.appTile}
      style={{ width: size, height: size, borderRadius: size * 0.3, background: color, color: ink }}
    >
      <AppIcon size={Math.round(size * 0.66)} weight="fill" />
    </span>
  );
}

const AVATAR_COLORS = ['#f47b67', '#5bb98c', '#e2a336', '#8e7cf0', '#3fa7d6', '#e06c9f'];

interface AvatarProps {
  name: string;
  size?: number;
  /** Shows the green voice ring. */
  speaking?: boolean;
  dimmed?: boolean;
}

export function Avatar({ name, size = 22, speaking = false, dimmed = false }: AvatarProps) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) + name.length) % AVATAR_COLORS.length];
  return (
    <span
      className={css.avatar}
      data-speaking={speaking}
      data-dimmed={dimmed}
      style={{ width: size, height: size, fontSize: size * 0.44, background: color }}
    >
      {name[0]}
    </span>
  );
}

interface RingProps {
  /** 0 to 1. */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}

export function ProgressRing({ value, size = 20, stroke = 3, color = 'var(--island-accent)', children }: RingProps) {
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <span className={css.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--island-fill-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={false}
          animate={{ strokeDashoffset: length * (1 - clamped) }}
          transition={spring('gentle', { visualDuration: 0.4 })}
        />
      </svg>
      {children && <span className={css.ringCenter}>{children}</span>}
    </span>
  );
}

/** Horizontal progress or level bar. */
export function Bar({ value, color, height = 4 }: { value: number; color?: string; height?: number }) {
  return (
    <span className={css.bar} style={{ height, borderRadius: height / 2 }}>
      <span
        className={css.barFill}
        style={{ transform: `scaleX(${Math.min(1, Math.max(0, value))})`, background: color, borderRadius: height / 2 }}
      />
    </span>
  );
}

const WAVE_SECONDS = [0.52, 0.38, 0.61, 0.44, 0.57, 0.36, 0.49, 0.66];

interface WaveProps {
  bars?: number;
  active?: boolean;
  color?: string;
  height?: number;
  /** Overrides the wave style from settings. */
  variant?: WaveStyle;
}

/** Audio level indicator. The style follows the island settings. */
export function Wave({ bars = 5, active = true, color, height = 16, variant }: WaveProps) {
  const waveStyle = useIslandStore((state) => state.settings.waveStyle);
  return (
    <span className={css.wave} data-style={variant ?? waveStyle} data-active={active} style={{ height, color }}>
      {Array.from({ length: bars }, (_, index) => (
        <i
          key={index}
          style={
            { '--d': `${WAVE_SECONDS[index % WAVE_SECONDS.length]}s`, '--o': `${-index * 0.19}s` } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

type Tone = 'neutral' | 'positive' | 'negative' | 'orange' | 'accent' | 'ghost' | 'active';

interface IconButtonProps {
  label: string;
  onClick?: () => void;
  tone?: Tone;
  size?: number;
  children: ReactNode;
}

export function IconButton({ label, onClick, tone = 'neutral', size = 40, children }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      className={css.iconButton}
      data-tone={tone}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
      whileTap={{ scale: fx.scale(0.92) }}
      transition={spring('snappy', { bounce: 0 })}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      {children}
    </motion.button>
  );
}

/** A check mark that draws itself inside a filled disc. */
export function DrawnMark({ kind = 'check', size = 18 }: { kind?: 'check' | 'cross'; size?: number }) {
  const color = kind === 'check' ? 'var(--island-positive)' : 'var(--island-negative)';
  const d = kind === 'check' ? 'M5.6 9.4l2.4 2.4 4.6-5.2' : 'M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6';
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={{ flex: 'none' }}>
      <motion.circle
        cx={9}
        cy={9}
        r={9}
        fill={color}
        initial={{ scale: fx.scale(0.4), opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={tween(0.3)}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#000"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={tween(0.32, { delay: 0.14 })}
      />
    </svg>
  );
}

/** Icon, level bar and percentage, shared by the volume and brightness alerts. */
export function LevelView({ level, icon }: { level: number; icon: ReactNode }) {
  const clamped = Math.min(1, Math.max(0, level));
  return (
    <div className={css.compact} style={{ gap: 10, padding: '0 14px 0 11px' }}>
      {icon}
      <span className={css.track}>
        <motion.span
          className={css.trackFill}
          initial={false}
          animate={{ scaleX: Math.max(0.03, clamped) }}
          transition={spring('snappy', { bounce: 0 })}
        />
      </span>
      <span className={css.levelNumber}>{Math.round(clamped * 100)}</span>
    </div>
  );
}

export function formatClock(ms: number, round: 'ceil' | 'floor' = 'floor'): string {
  const total = Math.max(0, Math[round](ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export { css as ui };
