import { useEffect } from 'react';
import { addFiles, beginDrop, cancelDrop } from '../activities/upload/actions';

const hasFiles = (event: DragEvent) =>
  Boolean(event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files'));

/** Files dragged over the window open the upload drop target; dropping them starts the upload. */
export function useFileDrop(): void {
  useEffect(() => {
    // dragenter and dragleave fire for every element crossed, so count them.
    let depth = 0;

    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      if (depth === 1) beginDrop();
    };
    const onOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) cancelDrop();
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      const files = Array.from(event.dataTransfer?.files ?? []).map((file) => ({ name: file.name, size: file.size }));
      if (files.length > 0) addFiles(files);
      else cancelDrop();
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);
}
