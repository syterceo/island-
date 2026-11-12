import { Gallery } from './gallery/Gallery';
import { Playground } from './playground/Playground';
import { BareStage } from './stage/BareStage';

/**
 * Picks the surface from the query string:
 * - `?view=stage`   the island alone on a plain background, used by scripts/capture.mjs
 * - `?view=gallery` every activity side by side
 * - otherwise       the playground
 */
export function App() {
  const view = new URLSearchParams(window.location.search).get('view');
  if (view === 'stage') return <BareStage />;
  if (view === 'gallery') return <Gallery />;
  return <Playground />;
}
