import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap, SessionPhase } from '../../bridge/events';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { handleScreenCrash } from './handleScreenCrash';
import type { ScreenCrashHost, ScreenCrashIntent } from './handleScreenCrash.types';

const INTENT: ScreenCrashIntent = {
  kind: 'report-screen-crash',
  screen: 'menu.settings',
  message: 'boom',
  stack: '',
  componentStack: 'in X',
};

function host(phase: SessionPhase) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const events: string[] = [];
  bus.on('session-phase', ({ phase: next, reason }) =>
    events.push(`phase ${next} ${String(reason)}`),
  );
  bus.on('menu-route', ({ route }) => events.push(`route ${route}`));
  const calls = {
    crashMatch: vi.fn<ScreenCrashHost['crashMatch']>(),
    report: vi.fn<ScreenCrashHost['report']>(),
    crashToMenu: vi.fn<ScreenCrashHost['crashToMenu']>(),
  };
  const value: ScreenCrashHost = {
    bus,
    phase,
    seed: 5,
    matchTick: 90,
    ...calls,
  };
  return { value, calls, events };
}

describe('handleScreenCrash', () => {
  it('ends a running match as a loop crash does, with source screen:<name> and the tick', () => {
    const { value, calls } = host('match');

    handleScreenCrash({ ...INTENT, screen: 'match' }, value);

    expect(calls.crashMatch).toHaveBeenCalledWith(
      { message: 'boom', stack: 'Component stack:in X', source: 'screen:match' },
      { errorText: 'match: boom', tick: 90, componentStack: 'in X' },
    );
    expect(calls.report).not.toHaveBeenCalled();
    expect(calls.crashToMenu).not.toHaveBeenCalled();
  });

  it('reports first, then returns to the menu with screen-crashed outside a match', () => {
    const { value, calls } = host('loading');

    handleScreenCrash({ ...INTENT, stack: 'at x' }, value);

    expect(calls.report).toHaveBeenCalledWith(
      { message: 'boom', stack: 'at x\n\nComponent stack:in X', source: 'screen:menu.settings' },
      {
        body: 'The screen stopped because of an error.',
        errorText: 'menu.settings: boom',
        tick: null,
        seed: 5,
        cause: 'screen',
        componentStack: 'in X',
      },
    );
    expect(calls.crashToMenu).toHaveBeenCalledWith('screen-crashed');
    expect(calls.report.mock.invocationCallOrder[0]).toBeLessThan(
      calls.crashToMenu.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('puts the component stack after the stack, alone when there is no stack, and leaves it out when empty', () => {
    const { value, calls } = host('loading');

    handleScreenCrash({ ...INTENT, stack: 'at x', componentStack: '' }, value);
    handleScreenCrash({ ...INTENT, stack: '', componentStack: '' }, value);

    expect(calls.report.mock.calls.map(([error]) => error.stack)).toEqual(['at x', null]);
  });

  it('shows the reason again and goes back home when the crash was in the menu', () => {
    const { value, calls, events } = host('menu');

    handleScreenCrash(INTENT, value);

    expect(calls.report).toHaveBeenCalledTimes(1);
    expect(calls.crashToMenu).not.toHaveBeenCalled();
    expect(events).toEqual(['phase menu screen-crashed', 'route home']);
  });

  it('reports first, then returns to the menu from the pre-launch reveal (DEC-141)', () => {
    const { value, calls, events } = host('pre-launch');

    handleScreenCrash({ ...INTENT, screen: 'pre-launch' }, value);

    expect(calls.report).toHaveBeenCalledTimes(1);
    expect(calls.crashToMenu).toHaveBeenCalledWith('screen-crashed');
    expect(events).toEqual([]);
  });
});
