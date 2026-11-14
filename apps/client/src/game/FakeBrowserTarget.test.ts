import { describe, expect, it, vi } from 'vitest';

import { FakeBrowserTarget } from './FakeBrowserTarget';

describe('FakeBrowserTarget', () => {
  it('counts listeners per type and in total, one per listener as EventTarget keeps them', () => {
    const target = new FakeBrowserTarget();
    const onResize = vi.fn();
    const onBlur = vi.fn();

    target.addEventListener('resize', onResize);
    target.addEventListener('resize', onResize);
    target.addEventListener('blur', onBlur);
    target.dispatchEvent(new Event('resize'));

    expect(onResize).toHaveBeenCalledTimes(1);
    expect(target.listenerCount('resize')).toBe(1);
    expect(target.listenerCount()).toBe(2);

    target.removeEventListener('resize', onResize);
    target.removeEventListener('blur', onBlur);
    target.removeEventListener('wheel', onBlur);
    expect(target.listenerCount()).toBe(0);
  });

  it('queues animation frames until they run or are cancelled', () => {
    const target = new FakeBrowserTarget();
    const first = vi.fn();
    const second = vi.fn();

    target.requestAnimationFrame(first);
    expect(target.pendingFrames).toBe(1);
    const handle = target.requestAnimationFrame(second);
    target.cancelAnimationFrame(handle);
    expect(target.pendingFrames).toBe(1);

    target.runFrame(16);
    expect(first).toHaveBeenCalledWith(16);
    expect(second).not.toHaveBeenCalled();
    expect(target.pendingFrames).toBe(0);
  });

  it('keeps a frame requested while running for the next run', () => {
    const target = new FakeBrowserTarget();
    const loop = vi.fn(() => {
      target.requestAnimationFrame(loop);
    });
    target.requestAnimationFrame(loop);

    target.runFrame(1);
    expect(loop).toHaveBeenCalledTimes(1);
    expect(target.pendingFrames).toBe(1);
  });
});
