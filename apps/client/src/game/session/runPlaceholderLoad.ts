import type { AssetGroup } from '../../bridge/events';
import type { SessionContext } from '../SessionController.types';
import { PLACEHOLDER_LOAD_MS } from './sessionTiming.constants';

// ponytail: no assets exist yet, so a "load" is one fake item finishing after PLACEHOLDER_LOAD_MS.
// Upgrade path: the ResourceController's group load publishes real loading-progress instead.
/**
 * Publishes `loading-progress` for `group` (loading, then ready) and calls `onReady` when done.
 * @returns A function that cancels the load.
 */
export function runPlaceholderLoad(
  context: SessionContext,
  group: AssetGroup,
  onReady: () => void,
): () => void {
  const publish = (loaded: number, status: 'loading' | 'ready'): void => {
    context.bus.emit('loading-progress', {
      group,
      loaded,
      total: 1,
      bytesLoaded: 0,
      bytesTotal: 0,
      status,
    });
  };
  publish(0, 'loading');
  return context.clock.schedule(() => {
    publish(1, 'ready');
    onReady();
  }, PLACEHOLDER_LOAD_MS);
}
