import type { IslandSettings } from '@/island';
import type { StageBg } from './Stage';

export interface Look {
  name: string;
  stage: StageBg;
  patch: Partial<IslandSettings>;
  /** Shape and wave colours of the miniature, and its corner radius. */
  preview: [surface: string, wave: string, radius: number];
}

export const LOOKS: Look[] = [
  {
    name: 'Signal',
    stage: 'desktop',
    patch: {
      surface: 'mica',
      accent: 'fg',
      roundness: 0.4,
      waveStyle: 'bars',
      edgeLight: true,
      glow: false,
      outline: true,
      shadow: true,
    },
    preview: ['#17171a', '#ff5500', 6],
  },
  {
    name: 'Neon',
    stage: 'dark',
    patch: {
      surface: 'black',
      accent: '#6ea8ff',
      roundness: 0.25,
      waveStyle: 'line',
      edgeLight: true,
      glow: true,
      outline: true,
      shadow: false,
    },
    preview: ['#000', '#6ea8ff', 4],
  },
  {
    name: 'Glass',
    stage: 'wallpaper',
    patch: {
      surface: 'glass',
      accent: 'fg',
      roundness: 0.55,
      waveStyle: 'bars',
      edgeLight: true,
      glow: false,
      outline: true,
      shadow: true,
    },
    preview: ['rgb(255 255 255 / 0.16)', '#fff', 7],
  },
  {
    name: 'Paper',
    stage: 'desktop',
    patch: {
      surface: 'light',
      accent: 'fg',
      roundness: 0.4,
      waveStyle: 'line',
      edgeLight: false,
      glow: false,
      outline: false,
      shadow: true,
    },
    preview: ['#f5f5f7', '#0b0b0c', 6],
  },
  {
    name: 'Capsule',
    stage: 'dark',
    patch: {
      surface: 'black',
      accent: 'fg',
      roundness: 1,
      waveStyle: 'dots',
      edgeLight: false,
      glow: false,
      outline: true,
      shadow: true,
    },
    preview: ['#000', '#fff', 10],
  },
];
