import {
  type ActivityApi,
  type ActivityDefinition,
  type ActivityInstance,
  DEFAULT_SETTINGS,
  type DemoControl,
  emitEffect,
  type IslandSettings,
  listDefinitions,
  useIslandStore,
} from '@/island';
import {
  ArrowCounterClockwiseIcon,
  type Icon,
  PillIcon,
  PlugsConnectedIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  WaveSineIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { AppsPage } from './AppsPage';
import { Field, Section, Segmented, Slider, Swatches, Toggle } from './controls';
import { LOOKS } from './looks';
import css from './playground.module.css';
import { Stage, type StageBg } from './Stage';

const STORAGE_KEY = 'island.settings.v2';

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

type PageId = 'apps' | 'activities' | 'look' | 'motion' | 'behavior';

const PAGES: { id: PageId; label: string; icon: Icon }[] = [
  { id: 'apps', label: 'Apps', icon: PlugsConnectedIcon },
  { id: 'activities', label: 'Activities', icon: SquaresFourIcon },
  { id: 'look', label: 'Island', icon: PillIcon },
  { id: 'motion', label: 'Motion', icon: WaveSineIcon },
  { id: 'behavior', label: 'Behavior', icon: SlidersHorizontalIcon },
];

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
  { label: 'Mica', value: 'mica', color: '#17171a' },
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
              <span
                className={css.lookPill}
                style={{ background: look.preview[0], color: look.preview[1], borderRadius: look.preview[2] }}
              >
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
        <Field label="Edge light" hint="A line of light along the bottom edge in the colour of the running app">
          <Toggle value={settings.edgeLight} onChange={(edgeLight) => set({ edgeLight })} />
        </Field>
        <Field label="Glow" hint="A halo around the island in the same colour">
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
        <Field label="Roundness" hint="From a tight tab to a full capsule" value={percent(settings.roundness)} stacked>
          <Slider value={settings.roundness} min={0} max={1} step={0.05} onChange={(roundness) => set({ roundness })} />
        </Field>
        <Field label="Attachment" hint="Docked grows out of the screen edge, floating hangs below it">
          <Segmented
            value={settings.attachment}
            options={[
              { label: 'Docked', value: 'notch' },
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
  const [page, setPage] = useState<PageId>('apps');
  const [bg, setBg] = useState<StageBg>('desktop');
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
            {page === 'apps' && <AppsPage />}
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
