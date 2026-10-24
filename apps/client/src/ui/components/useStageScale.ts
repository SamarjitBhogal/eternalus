import { useSyncExternalStore } from 'react';

import { fitStageScale } from './stageScale';

function subscribe(onResize: () => void): () => void {
  window.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
  };
}

const windowScale = (): number => fitStageScale(window.innerWidth, window.innerHeight);

/** A server render has no window: the artboard renders at its own size. */
const serverScale = (): number => 1;

/**
 * `fitStageScale` of the window, updated on every resize; 1 during a server render. The selection
 * screens fill the window, so the window is the stage the artboard is fitted into.
 */
export function useStageScale(): number {
  return useSyncExternalStore(subscribe, windowScale, serverScale);
}
