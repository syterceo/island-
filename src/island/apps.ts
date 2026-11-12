import { CalendarBlankIcon, EnvelopeSimpleIcon, type Icon } from '@phosphor-icons/react';
import { BRAND, CHROME_PARTS } from './brands';

/** What is drawn on an app tile: brand path data in a 24 by 24 box, or a generic icon. */
export type AppGlyph = { paths: readonly { d: string; fill: string }[] } | { icon: Icon; fill: string };

/** An application whose status the island can show. */
export interface AppInfo {
  name: string;
  /** Brand colour: the tint of the island while the app is on it. */
  color: string;
  /** Tile background. */
  background: string;
  /** A circular tile instead of a rounded square, for logos that are a disc themselves. */
  round?: boolean;
  /** Glyph size relative to the tile. */
  scale: number;
  glyph: AppGlyph;
}

const mono = (d: string, fill: string): AppGlyph => ({ paths: [{ d, fill }] });

export const APPS = {
  discord: { name: 'Discord', color: '#5865f2', background: '#5865f2', scale: 0.64, glyph: mono(BRAND.discord, '#fff') },
  soundcloud: {
    name: 'SoundCloud',
    color: '#ff5500',
    background: '#ff5500',
    scale: 0.72,
    glyph: mono(BRAND.soundcloud, '#fff'),
  },
  spotify: { name: 'Spotify', color: '#1ed760', background: '#121212', scale: 0.7, glyph: mono(BRAND.spotify, '#1ed760') },
  youtube: { name: 'YouTube', color: '#ff0033', background: '#fff', scale: 0.7, glyph: mono(BRAND.youtube, '#ff0000') },
  // These three logos are discs with the mark cut out, so they fill a round white tile.
  telegram: {
    name: 'Telegram',
    color: '#2aabee',
    background: '#fff',
    round: true,
    scale: 1,
    glyph: mono(BRAND.telegram, '#2aabee'),
  },
  steam: { name: 'Steam', color: '#66c0f4', background: '#fff', round: true, scale: 1, glyph: mono(BRAND.steam, '#171a21') },
  chrome: {
    name: 'Chrome',
    color: '#fbbc05',
    background: '#fff',
    round: true,
    scale: 1,
    glyph: {
      paths: [
        { d: CHROME_PARTS[0], fill: '#ea4335' },
        { d: CHROME_PARTS[1], fill: '#34a853' },
        { d: CHROME_PARTS[2], fill: '#fbbc04' },
        { d: CHROME_PARTS[3], fill: '#4285f4' },
      ],
    },
  },
  meet: { name: 'Google Meet', color: '#00ac47', background: '#fff', scale: 0.66, glyph: mono(BRAND.meet, '#00897b') },
  windows: {
    name: 'Windows',
    color: '#4cc2ff',
    background: 'rgb(76 194 255 / 0.16)',
    scale: 0.54,
    glyph: mono(BRAND.windows, '#4cc2ff'),
  },
  mail: { name: 'Mail', color: '#3b9dff', background: '#3b9dff', scale: 0.66, glyph: { icon: EnvelopeSimpleIcon, fill: '#fff' } },
  calendar: {
    name: 'Calendar',
    color: '#ff5a52',
    background: '#ff5a52',
    scale: 0.66,
    glyph: { icon: CalendarBlankIcon, fill: '#fff' },
  },
} satisfies Record<string, AppInfo>;

export type AppId = keyof typeof APPS;

export const appOf = (id: string): AppInfo => APPS[id as AppId] ?? APPS.windows;
