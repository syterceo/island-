import { SpeakerHighIcon, SpeakerLowIcon, SpeakerXIcon } from '@phosphor-icons/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import type { ActivityViewProps } from '../../types';
import { LevelView, Swap } from '../../ui/kit';

interface VolumeData {
  /** 0 to 1. */
  level: number;
}

function View({ data }: ActivityViewProps<VolumeData>) {
  const state = data.level <= 0.01 ? 'mute' : data.level < 0.5 ? 'low' : 'high';
  const Glyph = state === 'mute' ? SpeakerXIcon : state === 'low' ? SpeakerLowIcon : SpeakerHighIcon;
  return (
    <LevelView
      level={data.level}
      icon={
        <Swap id={state} dy={0}>
          <Glyph size={18} weight="fill" />
        </Swap>
      }
    />
  );
}

export default defineTransient<VolumeData>({
  kind: 'volume',
  title: 'Volume',
  description: 'Level that updates in place: showing it again moves the bar.',
  icon: SpeakerHighIcon,
  defaultData: { level: 0.6 },
  view: { size: { width: 228, height: COMPACT_HEIGHT }, Component: View },
  duration: 1600,
  demo: {
    presets: [
      { label: '30%', data: { level: 0.3 } },
      { label: '80%', data: { level: 0.8 } },
      { label: 'Mute', data: { level: 0 } },
    ],
    controls: [{ type: 'range', key: 'level', label: 'Level', min: 0, max: 1, step: 0.05 }],
  },
});
