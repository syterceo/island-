import { motion } from 'motion/react';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { useT } from '@/island';
import css from './playground.module.css';

const SPRING = { type: 'spring', visualDuration: 0.28, bounce: 0.18 } as const;

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const t = useT();
  return (
    <section className={css.section}>
      <header className={css.sectionHeader}>
        <span>{t(title)}</span>
        <i />
        {hint && <em>{t(hint)}</em>}
      </header>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  /** Shown at the right of the label row, for controls that sit below it. */
  value?: string;
  children: ReactNode;
  stacked?: boolean;
}

export function Field({ label, hint, value, children, stacked }: FieldProps) {
  const t = useT();
  return (
    <div className={css.field} data-stacked={stacked}>
      <div className={css.fieldText}>
        <div className={css.fieldLabel}>
          <span>{t(label)}</span>
          {value !== undefined && <em>{t(value)}</em>}
        </div>
        {hint && <div className={css.fieldHint}>{t(hint)}</div>}
      </div>
      <div className={css.fieldControl}>{children}</div>
    </div>
  );
}

interface SegmentedProps<T extends string | number> {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ value, options, onChange }: SegmentedProps<T>) {
  const id = useId();
  const t = useT();
  return (
    <div className={css.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.value === value && <motion.span layoutId={id} className={css.segmentedThumb} transition={SPRING} />}
          <span>{t(option.label)}</span>
        </button>
      ))}
    </div>
  );
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Slider({ value, min, max, step = 0.01, onChange }: SliderProps) {
  const ratio = (value - min) / (max - min);
  return (
    <input
      className={css.slider}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ '--ratio': ratio } as CSSProperties}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={css.toggle}
      data-on={value}
      onClick={() => onChange(!value)}
    >
      <motion.span initial={false} animate={{ x: value ? 16 : 0 }} transition={SPRING} />
    </button>
  );
}

interface SwatchesProps {
  value: string;
  options: { label: string; value: string; color: string }[];
  onChange: (value: string) => void;
}

export function Swatches({ value, options, onChange }: SwatchesProps) {
  const t = useT();
  return (
    <div className={css.swatches}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={t(option.label)}
          aria-label={t(option.label)}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          <span style={{ background: option.color }} />
        </button>
      ))}
    </div>
  );
}
