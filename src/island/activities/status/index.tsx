import { CheckCircleIcon, InfoIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineTransient } from '../../define';
import { T, translate } from '../../i18n';
import { emitEffect } from '../../effects';
import { COMPACT_HEIGHT } from '../../metrics';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { DrawnMark, ui } from '../../ui/kit';

interface StatusData {
  tone: 'success' | 'error' | 'info';
  label: string;
}

function View({ data }: ActivityViewProps<StatusData>) {
  return (
    <div className={ui.compact} style={{ justifyContent: 'center' }}>
      {data.tone === 'info' ? (
        <InfoIcon size={18} weight="fill" color="var(--island-fg-2)" />
      ) : (
        <DrawnMark kind={data.tone === 'error' ? 'cross' : 'check'} />
      )}
      <span className={ui.label}>
        <T>{data.label}</T>
      </span>
    </div>
  );
}

function Controller({ data }: ActivityApi<StatusData>) {
  const { tone } = data;
  useEffect(() => {
    if (tone === 'error') emitEffect('shake');
  }, [tone]);
  return null;
}

/** The general purpose result alert. Other activities show it when they finish. */
export default defineTransient<StatusData>({
  kind: 'status',
  title: 'Status',
  description: 'Success, error and info results. An error shakes the island.',
  icon: CheckCircleIcon,
  defaultData: { tone: 'success', label: 'Done' },
  view: {
    size: (data) => ({ width: Math.min(320, 62 + translate(data.label).length * 7.6), height: COMPACT_HEIGHT }),
    Component: View,
  },
  duration: 2000,
  coalesce: false,
  Controller,
  demo: {
    presets: [
      { label: 'Success', data: { tone: 'success', label: 'Saved' } },
      { label: 'Error', data: { tone: 'error', label: 'Could not connect' } },
      { label: 'Info', data: { tone: 'info', label: 'Focus mode is on' } },
    ],
  },
});
