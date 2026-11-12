import {
  type ActivityApi,
  type ActivityDefinition,
  type ActivityInstance,
  DEFAULT_SETTINGS,
  type DemoControl,
  emitEffect,
  Island,
  type IslandSettings,
  listDefinitions,
  useIslandStore,
} from '@/island';
import {
  ArrowCounterClockwiseIcon,
  type Icon,
  PillIcon,
  PlayIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  WaveSineIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Field, Section, Segmented, Slider, Swatches, Toggle } from './controls';
import css from './playground.module.css';

const STORAGE_KEY = 'island.settings.v1';

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) useIslandStore.getState().setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
} catch {
  // A broken or blocked store just means defaults.
}
useIslandStore.subscribe((state, previous) => {
  if (state.settings === previous.settings) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    // Persistence is optional.
  }
});

const island = () => useIslandStore.getState();

type PageId = 'activities' | 'look' | 'motion' | 'behavior';
type StageBg = 'dark' | 'wallpaper' | 'light';

const PAGES: { id: PageId; label: string; icon: Icon }[] = [
  { id: 'activities', label: 'Activities', icon: SquaresFourIcon },
  { id: 'look', label: 'Island', icon: PillIcon },
  { id: 'motion', label: 'Motion', icon: WaveSineIcon },
  { id: 'behavior', label: 'Behavior', icon: SlidersHorizontalIcon },
];

const SCENES: { id: string; label: string; run: () => void }[] = [
  { id: 'idle', label: 'Idle', run: () => island().reset() },
  { id: 'timer', label: 'Timer', run: () => island().start('timer') },
  { id: 'music', label: 'Music', run: () => island().start('music') },
  {
    id: 'split',
    label: 'Split',
    run: () => {
      island().start('timer');
      island().start('music');
    },
  },
  {
    id: 'expanded',
    label: 'Expanded',
    run: () => {
      island().start('music');
      island().expand('music');
    },
  },
  { id: 'call', label: 'Call', run: () => island().start('call') },
  { id: 'voice', label: 'Dictation', run: () => island().start('voice') },
  { id: 'hub', label: 'Hub', run: () => island().expand() },
  { id: 'alert', label: 'Alert', run: () => island().show('notification') },
];

// Milliseconds after the previous step, then the step.
const TOUR: [number, () => void][] = [
  [0, () => island().reset()],
  [700, () => island().show('clipboard')],
  [2300, () => island().start('timer')],
  [1500, () => island().start('music')],
  [1600, () => island().expand('music')],
  [2400, () => island().collapse()],
  [1100, () => island().show('volume', { level: 0.35 })],
  [450, () => island().show('volume', { level: 0.6 })],
  [450, () => island().show('volume', { level: 0.85 })],
  [2200, () => island().start('call')],
  [2400, () => island().update('call', { state: 'active', answeredAt: Date.now() })],
  [200, () => island().collapse()],
  [2200, () => island().end('call')],
  [800, () => island().show('notification')],
  [4200, () => island().start('voice')],
  [600, () => island().expand('voice')],
  [8500, () => island().reset()],
];

function useTour() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [running, setRunning] = useState(false);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
  };
  const play = () => {
    stop();
    setRunning(true);
    let at = 0;
    const scale = island().settings.timeScale;
    TOUR.forEach(([wait, step], index) => {
      at += wait * Math.max(1, scale);
      timers.current.push(
        setTimeout(() => {
          step();
          if (index === TOUR.length - 1) setRunning(false);
        }, at),
      );
    });
  };
  useEffect(() => stop, []);
  return { running, play, stop };
}

function Stage({ bg, onBg }: { bg: StageBg; onBg: (bg: StageBg) => void }) {
  const [scene, setScene] = useState('idle');
  const tour = useTour();
  return (
    <div className={css.stage} data-bg={bg} data-island-stage>
      <Island />
      <div className={css.sceneBar}>
        {SCENES.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={scene === item.id && !tour.running}
            onClick={() => {
              tour.stop();
              island().reset();
              item.run();
              setScene(item.id);
            }}
          >
            {scene === item.id && !tour.running && (
              <motion.span
                layoutId="scene"
                className={css.sceneThumb}
                transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.18 }}
              />
            )}
            <span>{item.label}</span>
          </button>
        ))}
        <i />
        <button type="button" data-active={tour.running} onClick={tour.running ? tour.stop : tour.play}>
          <span className={css.tourLabel}>
            <PlayIcon size={11} weight="fill" /> {tour.running ? 'Stop' : 'Play tour'}
          </span>
        </button>
      </div>
      <div className={css.stageSide}>
        <span>Click the island. Drag a file onto the window.</span>
        <div className={css.bgSwitch}>
          {(['dark', 'wallpaper', 'light'] as const).map((value) => (
            <button
              key={value}
              type="button"
              title={`${value} backdrop`}
              aria-label={`${value} backdrop`}
              data-bg={value}
              data-active={bg === value}
              onClick={() => onBg(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function apiFor(instance: ActivityInstance): ActivityApi {
  return {
    id: instance.id,
    kind: instance.kind,
    data: instance.data,
    update: (patch) => island().update(instance.id, patch),
    dismiss: () => island().end(instance.id),
    expand: () => island().expand(instance.id),
    collapse: () => island().collapse(),
  };
}

function DemoControlRow({ control, instance }: { control: DemoControl<any>; instance: ActivityInstance }) {
  const set = (value: unknown) => {
    if (control.type !== 'action') island().update(instance.id, { [control.key]: value });
  };
  if (control.type === 'action') {
    return (
      <button type="button" className={css.chip} onClick={() => control.run(apiFor(instance))}>
        {control.label}
      </button>
    );
  }
  const value = instance.data[control.key];
  return (
    <label className={css.demoControl}>
      <span>{control.label}</span>
      {control.type === 'toggle' && <Toggle value={Boolean(value)} onChange={set} />}
      {control.type === 'range' && (
        <Slider value={Number(value)} min={control.min} max={control.max} step={control.step} onChange={set} />
      )}
      {control.type === 'text' && (
        <input
          className={css.textInput}
          value={String(value ?? '')}
          placeholder={control.placeholder}
          onChange={(event) => set(event.target.value)}
        />
      )}
      {control.type === 'select' && (
        <Segmented
          value={String(value)}
          options={control.options.map((option) => ({ label: option.label, value: String(option.value) }))}
          onChange={(next) => set(control.options.find((option) => String(option.value) === next)?.value)}
        />
      )}
    </label>
  );
}

function ActivityCard({ definition }: { definition: ActivityDefinition }) {
  const running = useIslandStore(
    (state) =>
      state.live.find((instance) => instance.kind === definition.kind) ??
      (state.transient?.kind === definition.kind ? state.transient : undefined),
  );
  const live = definition.type === 'live';
  const presets = definition.demo?.presets ?? [];
  const controls = definition.demo?.controls ?? [];
  const DefinitionIcon = definition.icon;

  const run = (data?: object | (() => object)) => {
    const resolved = typeof data === 'function' ? data() : data;
    if (live) island().start(definition.kind, resolved);
    else island().show(definition.kind, resolved);
  };

  return (
    <div className={css.card} data-running={Boolean(running)}>
      <div className={css.cardHead}>
        <span className={css.cardIcon}>
          <DefinitionIcon size={18} weight="fill" />
        </span>
        <div className={css.cardText}>
          <strong>{definition.title}</strong>
          <span>{definition.description}</span>
        </div>
      </div>
      <div className={css.cardActions}>
        {presets.length === 0 && (
          <button type="button" className={css.chip} data-primary onClick={() => run()}>
            {live ? 'Start' : 'Show'}
          </button>
        )}
        {presets.map((preset) => (
          <button key={preset.label} type="button" className={css.chip} data-primary onClick={() => run(preset.data)}>
            {preset.label}
          </button>
        ))}
        {live && running && (
          <>
            <button type="button" className={css.chip} onClick={() => island().toggle(running.id)}>
              Open / close
            </button>
            <button type="button" className={css.chip} onClick={() => island().end(running.id)}>
              End
            </button>
          </>
        )}
      </div>
      <AnimatePresence initial={false}>
        {running && controls.length > 0 && (
          <motion.div
            className={css.cardControls}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', visualDuration: 0.3, bounce: 0 }}
          >
            <div>
              {controls.map((control) => (
                <DemoControlRow key={control.label} control={control} instance={running} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivitiesPage() {
  const definitions = listDefinitions();
  return (
    <>
      <Section title="Live activities" hint="stay on the island until they end">
        <div className={css.cards}>
          {definitions
            .filter((definition) => definition.type === 'live')
            .map((definition) => (
              <ActivityCard key={definition.kind} definition={definition} />
            ))}
        </div>
      </Section>
      <Section title="Alerts" hint="take over for a moment, then leave">
        <div className={css.cards}>
          {definitions
            .filter((definition) => definition.type === 'transient')
            .map((definition) => (
              <ActivityCard key={definition.kind} definition={definition} />
            ))}
        </div>
      </Section>
      <Section title="Gestures">
        <div className={css.cardActions}>
          <button type="button" className={css.chip} onClick={() => emitEffect('bump')}>
            Bump
          </button>
          <button type="button" className={css.chip} onClick={() => emitEffect('shake')}>
            Shake
          </button>
          <button type="button" className={css.chip} onClick={() => island().toggle()}>
            Expand / collapse
          </button>
          <button type="button" className={css.chip} onClick={() => island().reset()}>
            End everything
          </button>
        </div>
      </Section>
    </>
  );
}

interface Settings {
  settings: IslandSettings;
  set: (patch: Partial<IslandSettings>) => void;
}

const SURFACES = [
  { label: 'Black', value: 'black', color: '#000' },
  { label: 'Graphite', value: 'graphite', color: '#2c2c31' },
  { label: 'Glass', value: 'glass', color: 'linear-gradient(135deg, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.12))' },
  { label: 'Light', value: 'light', color: '#f5f5f7' },
];

const ACCENTS = [
  { label: 'Follow text', value: 'fg', color: 'linear-gradient(135deg, #fff 50%, #8e8e93 50%)' },
  { label: 'Blue', value: '#6ea8ff', color: '#6ea8ff' },
  { label: 'Mint', value: '#63e6be', color: '#63e6be' },
  { label: 'Lilac', value: '#b79cff', color: '#b79cff' },
  { label: 'Pink', value: '#ff8fc7', color: '#ff8fc7' },
  { label: 'Amber', value: '#ffc061', color: '#ffc061' },
  { label: 'Coral', value: '#ff7a6b', color: '#ff7a6b' },
  { label: 'Sand', value: '#e2cfa9', color: '#e2cfa9' },
];

interface Look {
  name: string;
  stage: StageBg;
  patch: Partial<IslandSettings>;
  /** Pill and wave colours of the miniature. */
  preview: [string, string];
}

const LOOKS: Look[] = [
  {
    name: 'Classic',
    stage: 'dark',
    patch: { surface: 'black', accent: 'fg', waveStyle: 'bars', glow: false, outline: true, shadow: true },
    preview: ['#000', '#fff'],
  },
  {
    name: 'Drop',
    stage: 'dark',
    patch: { surface: 'black', accent: '#6ea8ff', waveStyle: 'bars', glow: true, outline: true, shadow: true },
    preview: ['#000', '#6ea8ff'],
  },
  {
    name: 'Contrast',
    stage: 'dark',
    patch: { surface: 'light', accent: 'fg', waveStyle: 'line', glow: false, outline: false, shadow: true },
    preview: ['#f5f5f7', '#0b0b0c'],
  },
  {
    name: 'Glass',
    stage: 'wallpaper',
    patch: { surface: 'glass', accent: '#b79cff', waveStyle: 'bars', glow: false, outline: true, shadow: true },
    preview: ['rgb(255 255 255 / 0.16)', '#b79cff'],
  },
  {
    name: 'Minimal',
    stage: 'dark',
    patch: { surface: 'graphite', accent: 'fg', waveStyle: 'dots', glow: false, outline: false, shadow: false },
    preview: ['#2c2c31', '#fff'],
  },
];

const percent = (value: number) => `${Math.round(value * 100)}%`;

function LookPage({ settings, set, onStage }: Settings & { onStage: (bg: StageBg) => void }) {
  return (
    <>
      <Section title="Ready styles">
        <div className={css.looks}>
          {LOOKS.map((look) => (
            <button
              key={look.name}
              type="button"
              className={css.look}
              data-active={Object.entries(look.patch).every(
                ([key, value]) => settings[key as keyof IslandSettings] === value,
              )}
              onClick={() => {
                set(look.patch);
                onStage(look.stage);
              }}
            >
              <span className={css.lookPill} style={{ background: look.preview[0], color: look.preview[1] }}>
                <b />
                <i />
                <i />
                <i />
                <i />
              </span>
              {look.name}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Look">
        <Field label="Surface" value={SURFACES.find((item) => item.value === settings.surface)?.label} stacked>
          <Swatches
            value={settings.surface}
            options={SURFACES}
            onChange={(value) => {
              set({ surface: value as IslandSettings['surface'] });
              if (value === 'glass') onStage('wallpaper');
            }}
          />
        </Field>
        <Field
          label="Accent"
          hint="Waves, progress and the dictation dot"
          value={ACCENTS.find((item) => item.value === settings.accent)?.label}
          stacked
        >
          <Swatches value={settings.accent} options={ACCENTS} onChange={(accent) => set({ accent })} />
        </Field>
        <Field label="Wave style">
          <Segmented
            value={settings.waveStyle}
            options={[
              { label: 'Bars', value: 'bars' },
              { label: 'Dots', value: 'dots' },
              { label: 'Line', value: 'line' },
            ]}
            onChange={(waveStyle) => set({ waveStyle })}
          />
        </Field>
        <Field label="Glow" hint="Accent halo while something is on the island">
          <Toggle value={settings.glow} onChange={(glow) => set({ glow })} />
        </Field>
        <Field label="Outline" hint="A hairline that separates the island from dark backgrounds">
          <Toggle value={settings.outline} onChange={(outline) => set({ outline })} />
        </Field>
        <Field label="Shadow">
          <Toggle value={settings.shadow} onChange={(shadow) => set({ shadow })} />
        </Field>
      </Section>
      <Section title="Shape">
        <Field label="Attachment" hint="Notch grows out of the screen edge, floating is a free pill">
          <Segmented
            value={settings.attachment}
            options={[
              { label: 'Notch', value: 'notch' },
              { label: 'Floating', value: 'floating' },
            ]}
            onChange={(attachment) => set({ attachment })}
          />
        </Field>
        <Field label="Size" value={percent(settings.scale)} stacked>
          <Slider value={settings.scale} min={0.8} max={1.4} step={0.05} onChange={(scale) => set({ scale })} />
        </Field>
        <Field label="Corner smoothing" value={percent(settings.cornerSmoothing)} stacked>
          <Slider
            value={settings.cornerSmoothing}
            min={0}
            max={1}
            step={0.05}
            onChange={(cornerSmoothing) => set({ cornerSmoothing })}
          />
        </Field>
      </Section>
    </>
  );
}

const FEELS: { name: string; hint: string; patch: Partial<IslandSettings> }[] = [
  { name: 'Smooth', hint: 'As designed', patch: { bounce: 1, timeScale: 1 } },
  { name: 'Snappy', hint: 'Quick, no overshoot', patch: { bounce: 0.3, timeScale: 0.75 } },
  { name: 'Bouncy', hint: 'Playful overshoot', patch: { bounce: 1.9, timeScale: 1.1 } },
  { name: 'Calm', hint: 'Slow and soft', patch: { bounce: 0.5, timeScale: 1.5 } },
];

function MotionPage({ settings, set }: Settings) {
  return (
    <>
      <Section title="Feel">
        <div className={css.looks}>
          {FEELS.map((feel) => (
            <button
              key={feel.name}
              type="button"
              className={css.look}
              data-active={settings.bounce === feel.patch.bounce && settings.timeScale === feel.patch.timeScale}
              onClick={() => {
                set(feel.patch);
                island().toggle();
              }}
            >
              <strong>{feel.name}</strong>
              <span>{feel.hint}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Tuning">
        <Field label="Bounce" hint="How far the shape overshoots before it settles" value={percent(settings.bounce)} stacked>
          <Slider value={settings.bounce} min={0} max={2.5} step={0.05} onChange={(bounce) => set({ bounce })} />
        </Field>
        <Field
          label="Duration"
          hint="Slow everything down to inspect a transition frame by frame"
          value={`${settings.timeScale.toFixed(2)}×`}
          stacked
        >
          <Slider value={settings.timeScale} min={0.5} max={6} step={0.05} onChange={(timeScale) => set({ timeScale })} />
        </Field>
        <Field label="Soft focus" hint="Content blurs while it swaps">
          <Toggle value={settings.contentBlur} onChange={(contentBlur) => set({ contentBlur })} />
        </Field>
        <Field label="Reduced motion" hint="Keeps fades, drops travel, scale and overshoot">
          <Segmented
            value={settings.reducedMotion}
            options={[
              { label: 'System', value: 'system' },
              { label: 'Always', value: 'always' },
              { label: 'Never', value: 'never' },
            ]}
            onChange={(reducedMotion) => set({ reducedMotion })}
          />
        </Field>
      </Section>
      <Section title="Text">
        <Field label="How words appear" hint="Used by dictation">
          <Segmented
            value={settings.textReveal}
            options={[
              { label: 'Letters', value: 'letters' },
              { label: 'Words', value: 'words' },
              { label: 'Smooth', value: 'smooth' },
            ]}
            onChange={(textReveal) => {
              set({ textReveal });
              island().start('voice', { phase: 'listening', words: 0, auto: true });
              island().expand('voice');
            }}
          />
        </Field>
      </Section>
    </>
  );
}

function BehaviorPage({ settings, set }: Settings) {
  return (
    <>
      <Section title="Interaction">
        <Field label="Open on" hint="Hover opens after a short rest and closes when the pointer leaves">
          <Segmented
            value={settings.expandTrigger}
            options={[
              { label: 'Click', value: 'click' },
              { label: 'Hover', value: 'hover' },
            ]}
            onChange={(expandTrigger) => set({ expandTrigger })}
          />
        </Field>
      </Section>
      <Section title="Settings">
        <Field label="Restore defaults" hint="Settings are saved in this browser">
          <button type="button" className={css.chip} onClick={() => set(DEFAULT_SETTINGS)}>
            <ArrowCounterClockwiseIcon size={13} weight="bold" /> Reset
          </button>
        </Field>
      </Section>
    </>
  );
}

export function Playground() {
  const [page, setPage] = useState<PageId>('activities');
  const [bg, setBg] = useState<StageBg>('dark');
  const settings = useIslandStore((state) => state.settings);
  const set = useIslandStore((state) => state.setSettings);

  return (
    <div className={css.app}>
      <nav className={css.sidebar}>
        <div className={css.brand}>
          <span />
          Island
        </div>
        {PAGES.map(({ id, label, icon: PageIcon }) => (
          <button key={id} type="button" data-active={page === id} onClick={() => setPage(id)}>
            {page === id && (
              <motion.span
                layoutId="nav"
                className={css.navThumb}
                transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.18 }}
              />
            )}
            <PageIcon size={17} />
            <span>{label}</span>
          </button>
        ))}
        <footer>Motion playground</footer>
      </nav>
      <main className={css.main}>
        <Stage bg={bg} onBg={setBg} />
        <div className={css.page}>
          <div key={page} className={css.pageInner}>
            {page === 'activities' && <ActivitiesPage />}
            {page === 'look' && <LookPage settings={settings} set={set} onStage={setBg} />}
            {page === 'motion' && <MotionPage settings={settings} set={set} />}
            {page === 'behavior' && <BehaviorPage settings={settings} set={set} />}
          </div>
        </div>
      </main>
    </div>
  );
}
