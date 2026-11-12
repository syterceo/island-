import { useIslandStore } from '../../store';

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  /** 0 to 1. */
  progress: number;
}

export interface UploadData {
  /** Files are being dragged over the window. */
  dropping: boolean;
  files: UploadFile[];
}

export const UPLOAD_KIND = 'upload';

let sequence = 0;
let collapseTimer: ReturnType<typeof setTimeout> | undefined;

const store = () => useIslandStore.getState();
const current = () => store().live.find((instance) => instance.kind === UPLOAD_KIND);

/** Opens the drop target. */
export function beginDrop(): void {
  clearTimeout(collapseTimer);
  store().start(UPLOAD_KIND, { dropping: true });
  store().expand(UPLOAD_KIND);
}

/** The drag left the window without a drop. */
export function cancelDrop(): void {
  const instance = current();
  if (!instance) return;
  if ((instance.data as UploadData).files.length === 0) store().end(instance.id);
  else {
    store().update(instance.id, { dropping: false });
    store().collapse();
  }
}

/** Queues files, shows the list for a moment, then settles into the compact progress view. */
export function addFiles(files: { name: string; size: number }[]): void {
  const added = files.map((file) => {
    sequence += 1;
    return { ...file, id: `file-${sequence}`, progress: 0 };
  });
  const id = store().start(UPLOAD_KIND, { dropping: false });
  store().update(id, (data: UploadData) => ({ dropping: false, files: [...data.files, ...added] }));
  store().expand(id);
  clearTimeout(collapseTimer);
  collapseTimer = setTimeout(() => {
    if (store().expandedId === id) store().collapse();
  }, 1600);
}
