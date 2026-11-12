import { DEFAULT_SETTINGS, type IslandSettings } from '@/island';
import { DEFAULT_STAGE, type StageBg, type StageState } from './Stage';

/** A look that can be saved to a file and loaded again: island settings plus the backdrop. */
export interface ThemeFile {
  island: 'theme';
  version: 1;
  settings: Partial<IslandSettings>;
  stage: StageState;
}

// Preferences of the person, not of the look.
const PERSONAL: (keyof IslandSettings)[] = ['language', 'timeScale', 'reducedMotion', 'expandTrigger'];

const BACKDROPS: StageBg[] = ['desktop', 'dark', 'wallpaper', 'light', 'custom'];

export function buildTheme(settings: IslandSettings, stage: StageState): ThemeFile {
  const look = Object.fromEntries(
    Object.entries(settings).filter(([key]) => !PERSONAL.includes(key as keyof IslandSettings)),
  );
  return { island: 'theme', version: 1, settings: look, stage };
}

export function downloadTheme(theme: ThemeFile): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'island-theme.json';
  link.click();
  URL.revokeObjectURL(url);
}

/** Reads a theme file, keeping only known settings of the right type. Null when it is not a theme. */
export function parseTheme(text: string): ThemeFile | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const file = raw as Record<string, unknown>;
  if (file.island !== 'theme' || typeof file.settings !== 'object' || file.settings === null) return null;

  const defaults = DEFAULT_SETTINGS as unknown as Record<string, unknown>;
  const settings = Object.fromEntries(
    Object.entries(file.settings).filter(
      ([key, value]) =>
        key in defaults && typeof value === typeof defaults[key] && !PERSONAL.includes(key as keyof IslandSettings),
    ),
  ) as Partial<IslandSettings>;

  const given = (typeof file.stage === 'object' && file.stage !== null ? file.stage : {}) as Record<string, unknown>;
  const stage: StageState = {
    bg: BACKDROPS.includes(given.bg as StageBg) ? (given.bg as StageBg) : DEFAULT_STAGE.bg,
    color: typeof given.color === 'string' && /^#[0-9a-f]{6}$/i.test(given.color) ? given.color : DEFAULT_STAGE.color,
    image: typeof given.image === 'string' && given.image.startsWith('data:image/') ? given.image : null,
  };
  return { island: 'theme', version: 1, settings, stage };
}
