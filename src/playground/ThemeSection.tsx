import { type IslandSettings, T, useT } from '@/island';
import { DownloadSimpleIcon, ImageIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { useState, type ChangeEvent } from 'react';
import { Field, Section } from './controls';
import css from './playground.module.css';
import type { StageState } from './Stage';
import { buildTheme, downloadTheme, parseTheme } from './theme';

interface Props {
  settings: IslandSettings;
  set: (patch: Partial<IslandSettings>) => void;
  stage: StageState;
  onStage: (stage: StageState) => void;
}

const HEX = /^#[0-9a-f]{6}$/i;

function ColorInput({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const title = useT()(label);
  return (
    <input
      type="color"
      className={css.colorInput}
      title={title}
      aria-label={title}
      value={HEX.test(value) ? value : '#ffffff'}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** Your own colours and backdrop, and saving the whole look to a file. */
export function ThemeSection({ settings, set, stage, onStage }: Props) {
  const [problem, setProblem] = useState(false);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onStage({ ...stage, bg: 'custom', image: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const importTheme = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const theme = parseTheme(await file.text());
    setProblem(theme === null);
    if (!theme) return;
    set(theme.settings);
    onStage(theme.stage);
  };

  return (
    <Section title="Your theme" hint="make it yours and share it as a file">
      <Field label="Island colour" hint="Text turns dark on its own when the colour is light">
        <ColorInput
          label="Island colour"
          value={settings.surface === 'custom' ? settings.surfaceColor : '#17171a'}
          onChange={(surfaceColor) => set({ surface: 'custom', surfaceColor })}
        />
      </Field>
      <Field label="Accent colour" hint="Any colour, not only the ready ones">
        <ColorInput
          label="Accent colour"
          value={settings.accent === 'fg' ? '#ffffff' : settings.accent}
          onChange={(accent) => set({ accent })}
        />
      </Field>
      <Field label="Backdrop" hint="A colour or your own wallpaper behind the island">
        <label className={css.chip}>
          <ImageIcon size={13} weight="fill" /> <T>Choose image</T>
          <input type="file" accept="image/*" hidden onChange={chooseImage} />
        </label>
        <ColorInput
          label="Backdrop"
          value={stage.color}
          onChange={(color) => onStage({ bg: 'custom', color, image: null })}
        />
      </Field>
      <Field
        label="Theme file"
        hint={problem ? 'That file is not an island theme' : 'Everything on this page plus the backdrop, in one file'}
      >
        <button type="button" className={css.chip} onClick={() => downloadTheme(buildTheme(settings, stage))}>
          <DownloadSimpleIcon size={13} weight="bold" /> <T>Export</T>
        </button>
        <label className={css.chip}>
          <UploadSimpleIcon size={13} weight="bold" /> <T>Import</T>
          <input type="file" accept="application/json,.json" hidden onChange={importTheme} />
        </label>
      </Field>
    </Section>
  );
}
