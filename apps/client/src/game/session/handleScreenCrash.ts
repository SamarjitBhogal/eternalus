import type { ScreenCrashHost, ScreenCrashIntent } from './handleScreenCrash.types';

/** The FATAL message of a screen crash outside a match (DEC-124 (b)). */
const SCREEN_CRASH_BODY = 'The screen stopped because of an error.';

/**
 * What the session does when `ErrorBoundary` caught a screen (ADR 0025 §5). In `match` it ends the
 * match as a loop crash does, with source `screen:<name>`. Elsewhere it reports the crash and
 * returns to the menu with `'screen-crashed'`. A phase with no move to the menu stays: `menu`
 * shows the reason again and goes back to `home`; `pre-launch` keeps only the popup.
 */
export function handleScreenCrash(intent: ScreenCrashIntent, host: ScreenCrashHost): void {
  const error = {
    message: intent.message,
    stack: intent.stack === '' ? null : intent.stack,
    source: `screen:${intent.screen}`,
  };
  if (host.phase === 'match') {
    host.crashMatch(error, `${intent.screen}: ${intent.message}`, host.matchTick);
    return;
  }
  host.report(error, {
    body: SCREEN_CRASH_BODY,
    errorText: `${intent.screen}: ${intent.message}`,
    tick: null,
    seed: host.seed,
  });
  if (host.canReturnToMenu()) {
    host.transitionToMenu('screen-crashed');
  } else if (host.phase === 'menu') {
    host.bus.emit('session-phase', { phase: 'menu', reason: 'screen-crashed' });
    host.bus.emit('menu-route', { route: 'home' });
  }
}
