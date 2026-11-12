import { motion } from 'motion/react';
import { useId, type CSSProperties, type ReactNode } from 'react';
import css from './playground.module.css';

const SPRING = { type: 'spring', visualDuration: 0.28, bounce: 0.18 } as const;

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={css.section}>
      <header className={css.sectionHeader}>
        <span>{title}</span>
        <i />
        {hint && <em>{hint}</em>}
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
  return (
    <div className={css.field} data-stacked={stacked}>
      <div className={css.fieldText}>
        <div className={css.fieldLabel}>
          <span>{label}</span>
          {value !== undefined && <em>{value}</em>}
        </div>
        {hint && <div className={css.fieldHint}>{hint}</div>}
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
          <span>{option.label}</span>
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
  return (
    <div className={css.swatches}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.label}
          aria-label={option.label}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          <span style={{ background: option.color }} />
        </button>
      ))}
    </div>
  );
}
