import {
  DiscordLogoIcon,
  EnvelopeSimpleIcon,
  GoogleChromeLogoIcon,
  type Icon,
  SoundcloudLogoIcon,
  SpotifyLogoIcon,
  SteamLogoIcon,
  TelegramLogoIcon,
  WindowsLogoIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';

/** An application whose status the island can show. */
export interface AppInfo {
  name: string;
  /** Brand colour: the tile background and the tint of the island while the app is on it. */
  color: string;
  /** Glyph colour on the tile. */
  ink: string;
  icon: Icon;
}

export const APPS = {
  discord: { name: 'Discord', color: '#5865f2', ink: '#fff', icon: DiscordLogoIcon },
  soundcloud: { name: 'SoundCloud', color: '#ff5500', ink: '#fff', icon: SoundcloudLogoIcon },
  spotify: { name: 'Spotify', color: '#1ed760', ink: '#0b0b0c', icon: SpotifyLogoIcon },
  youtube: { name: 'YouTube', color: '#ff0033', ink: '#fff', icon: YoutubeLogoIcon },
  telegram: { name: 'Telegram', color: '#2aabee', ink: '#fff', icon: TelegramLogoIcon },
  steam: { name: 'Steam', color: '#66c0f4', ink: '#0b1620', icon: SteamLogoIcon },
  chrome: { name: 'Chrome', color: '#fbbc05', ink: '#0b0b0c', icon: GoogleChromeLogoIcon },
  mail: { name: 'Mail', color: '#3b9dff', ink: '#fff', icon: EnvelopeSimpleIcon },
  windows: { name: 'Windows', color: '#4cc2ff', ink: '#06202e', icon: WindowsLogoIcon },
} satisfies Record<string, AppInfo>;

export type AppId = keyof typeof APPS;

export const appOf = (id: string): AppInfo => APPS[id as AppId] ?? APPS.windows;
