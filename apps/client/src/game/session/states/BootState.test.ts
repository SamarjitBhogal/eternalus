import { describe, expect, it, vi } from 'vitest';

import { spyContext } from '../../testSessionDeps';
import { BootState } from './BootState';

describe('BootState', () => {
  it('publishes the catalogue, then the credits once, then loads the boot group', () => {
    const context = spyContext();
    const seen: string[] = [];
    context.bus.on('content-catalogue', () => seen.push('content-catalogue'));
    context.bus.on('credits', () => seen.push('credits'));
    context.loadAssets.mockImplementation(() => {
      seen.push('loadAssets');
      return () => undefined;
    });

    new BootState().enter(context);

    expect(seen).toEqual(['content-catalogue', 'credits', 'loadAssets']);
    expect(context.loadAssets.mock.calls[0]?.[0]).toEqual(['boot']);
  });

  it('opens the menu when the boot group is ready, or with load-failed on a load bug', () => {
    const context = spyContext();
    new BootState().enter(context);
    const [, onReady, onFailed] = context.loadAssets.mock.calls[0] ?? [];

    onReady?.();
    onFailed?.(new Error('loader bug'));

    expect(context.transition.mock.calls).toEqual([['menu'], ['menu', 'load-failed']]);
  });

  it('cancels its load on exit', () => {
    const context = spyContext();
    const cancel = vi.fn();
    context.loadAssets.mockReturnValue(cancel);
    const state = new BootState();
    state.enter(context);

    state.exit();

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
