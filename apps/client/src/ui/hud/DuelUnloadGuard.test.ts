// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { DuelUnloadGuard } from './DuelUnloadGuard';

const unload = (): Event => new Event('beforeunload', { cancelable: true });

describe('DuelUnloadGuard', () => {
  it('asks the browser to confirm leaving while armed', () => {
    const guard = new DuelUnloadGuard(window);
    guard.arm();
    const event = unload();

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    guard.disarm();
  });

  it('lets the page unload once disarmed', () => {
    const guard = new DuelUnloadGuard(window);
    guard.arm();
    guard.disarm();
    const event = unload();

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('is idempotent: arming twice adds one listener, disarming twice is harmless', () => {
    const target = new EventTarget();
    const guard = new DuelUnloadGuard(target);
    guard.arm();
    guard.arm();
    guard.disarm();
    guard.disarm();
    const event = unload();

    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
