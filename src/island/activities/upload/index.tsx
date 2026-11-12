import { ArrowDownIcon, CloudArrowUpIcon, FileIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import { useIslandStore } from '../../store';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, DrawnMark, ProgressRing, Rise, Swap, ui } from '../../ui/kit';
import { addFiles, type UploadData, type UploadFile } from './actions';

function total(files: UploadFile[]): number {
  const size = files.reduce((sum, file) => sum + file.size, 0);
  if (size === 0) return files.length > 0 ? 1 : 0;
  return files.reduce((sum, file) => sum + file.size * file.progress, 0) / size;
}

function bytes(size: number): string {
  if (size >= 1e9) return `${(size / 1e9).toFixed(1)} GB`;
  if (size >= 1e6) return `${(size / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1e3))} KB`;
}

const count = (files: UploadFile[]) => `${files.length} ${files.length === 1 ? 'file' : 'files'}`;

function Compact({ data }: ActivityViewProps<UploadData>) {
  const progress = total(data.files);
  return (
    <div className={ui.compact} style={{ padding: '0 13px 0 8px' }}>
      <ProgressRing value={progress}>
        <ArrowDownIcon size={9} weight="bold" style={{ transform: 'rotate(180deg)' }} />
      </ProgressRing>
      <span className={ui.label} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<UploadData>) {
  return (
    <div className={ui.center}>
      <ProgressRing value={total(data.files)} />
    </div>
  );
}

function DropTarget() {
  return (
    <div className={ui.dropTarget}>
      <svg aria-hidden>
        <rect x="1" y="1" rx="19" style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }} />
      </svg>
      <CloudArrowUpIcon size={30} weight="fill" className={ui.bob} />
      Drop to upload
    </div>
  );
}

function FileList({ files }: { files: UploadFile[] }) {
  const shown = files.slice(-3);
  return (
    <>
      <div className={ui.row} style={{ gap: 8 }}>
        <span className={ui.title}>Uploading {count(files)}</span>
        <span className={ui.grow} />
        <span className={ui.sub} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(total(files) * 100)}%
        </span>
      </div>
      {shown.map((file) => (
        <div key={file.id} className={ui.stack} style={{ gap: 5 }}>
          <div className={ui.fileRow}>
            <FileIcon size={15} weight="fill" style={{ flex: 'none', color: 'var(--island-fg-2)' }} />
            <span className={cx(ui.truncate, ui.grow)}>{file.name}</span>
            <Swap id={file.progress >= 1 ? 'done' : 'size'} className={ui.sub}>
              {file.progress >= 1 ? <DrawnMark size={15} /> : bytes(file.size)}
            </Swap>
          </div>
          <div className={ui.bar}>
            <span className={ui.barFill} style={{ transform: `scaleX(${file.progress})` }} />
          </div>
        </div>
      ))}
    </>
  );
}

function Expanded({ data }: ActivityViewProps<UploadData>) {
  return (
    <Rise className={ui.column} style={{ padding: '16px 20px 18px', gap: 11 }}>
      {data.dropping || data.files.length === 0 ? <DropTarget /> : <FileList files={data.files} />}
    </Rise>
  );
}

function Controller({ data, update, dismiss }: ActivityApi<UploadData>) {
  const pending = data.files.some((file) => file.progress < 1);
  const finished = data.files.length > 0 && !pending && !data.dropping;
  const label = `${count(data.files)} uploaded`;

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      update((prev) => ({
        files: prev.files.map((file) => {
          if (file.progress >= 1) return file;
          // Larger files move more slowly, with a floor so a huge one still finishes.
          const step = Math.max(0.012, Math.min(0.09, 2.4e5 / Math.max(file.size, 1))) * (0.6 + Math.random());
          return { ...file, progress: Math.min(1, file.progress + step) };
        }),
      }));
    }, scaled(130));
    return () => clearInterval(timer);
  }, [pending, update]);

  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => {
      dismiss();
      useIslandStore.getState().show('status', { tone: 'success', label });
    }, scaled(650));
    return () => clearTimeout(timer);
  }, [finished, dismiss, label]);

  return null;
}

const SAMPLE_FILES = [
  { name: 'Island cover v3.fig', size: 18_400_000 },
  { name: 'demo-recording.mp4', size: 46_900_000 },
  { name: 'notes.txt', size: 12_000 },
];

export default defineLiveActivity<UploadData>({
  kind: 'upload',
  title: 'File upload',
  description: 'Drag files onto the window: the island opens a drop target, then tracks progress.',
  icon: CloudArrowUpIcon,
  defaultData: { dropping: false, files: [] },
  compact: { size: { width: 104, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 360, height: 180 }, Component: Expanded },
  startExpanded: (data) => data.dropping,
  Controller,
  demo: {
    presets: [
      { label: 'Drop target', data: { dropping: true, files: [] } },
      {
        label: 'Upload 3 files',
        data: () => ({
          dropping: false,
          files: SAMPLE_FILES.map((file, index) => ({ ...file, id: `sample-${Date.now()}-${index}`, progress: 0 })),
        }),
      },
    ],
    controls: [{ type: 'action', label: 'Add files', run: () => addFiles(SAMPLE_FILES) }],
  },
});
