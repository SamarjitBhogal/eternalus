import { describe, expect, it } from 'vitest';

import type { BridgeEventMap, LoadingProgress } from '../../bridge/events';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { placeholderCatalogue } from '../content/placeholderCatalogue';
import { FakeSessionClock } from '../engine/time/FakeSessionClock';
import type { SessionContext } from '../SessionController.types';
import { runPlaceholderLoad } from './runPlaceholderLoad';
import { PLACEHOLDER_LOAD_MS } from './sessionTiming.constants';

function context() {
  const bus = new TypedEventBus<BridgeEventMap>();
  const clock = new FakeSessionClock();
  const progress: LoadingProgress[] = [];
  bus.on('loading-progress', (event) => progress.push(event));
  const ctx: SessionContext = {
    bus,
    clock,
    catalogue: placeholderCatalogue.load(),
    transition: () => undefined,
    newMatchSetup: () => undefined,
    repeatMatchSetup: () => undefined,
    clearMatchSetup: () => undefined,
  };
  return { ctx, clock, progress };
}

describe('runPlaceholderLoad', () => {
  it('reports loading, then ready after the placeholder time, then calls onReady once', () => {
    const { ctx, clock, progress } = context();
    let readyCount = 0;
    runPlaceholderLoad(ctx, 'match', () => {
      readyCount += 1;
    });
    expect(progress.map((p) => [p.group, p.status, p.loaded])).toEqual([['match', 'loading', 0]]);
    clock.advance(PLACEHOLDER_LOAD_MS);
    expect(progress.map((p) => p.status)).toEqual(['loading', 'ready']);
    expect(readyCount).toBe(1);
  });

  it('never finishes once cancelled', () => {
    const { ctx, clock, progress } = context();
    let readyCount = 0;
    const cancel = runPlaceholderLoad(ctx, 'selection', () => {
      readyCount += 1;
    });
    cancel();
    clock.advance(PLACEHOLDER_LOAD_MS * 2);
    expect(progress).toHaveLength(1);
    expect(readyCount).toBe(0);
  });
});
