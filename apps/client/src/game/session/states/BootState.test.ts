import { describe, expect, it } from 'vitest';

import { FakeSessionContext } from '../../FakeSessionContext';
import { BootState } from './BootState';

describe('BootState', () => {
  it('publishes the catalogue, then the credits once, then loads the boot group', () => {
    const seen: string[] = [];
    const context = new FakeSessionContext(seen);
    context.bus.on('content-catalogue', () => seen.push('content-catalogue'));
    context.bus.on('credits', () => seen.push('credits'));

    new BootState().enter(context);

    expect(seen).toEqual(['content-catalogue', 'credits', 'loadAssets']);
    expect(context.calls.loadAssets[0]?.[0]).toEqual(['boot']);
  });

  it('opens the menu when the boot group is ready, or with load-failed on a load bug', () => {
    const context = new FakeSessionContext();
    new BootState().enter(context);
    const [, onReady, onFailed] = context.calls.loadAssets[0] ?? [];

    onReady?.();
    onFailed?.(new Error('loader bug'));

    expect(context.calls.transition).toEqual([['menu'], ['menu', 'load-failed']]);
  });

  it('cancels its load on exit', () => {
    const context = new FakeSessionContext();
    const state = new BootState();
    state.enter(context);

    state.exit();

    expect(context.cancelledLoads).toEqual([0]);
  });
});
