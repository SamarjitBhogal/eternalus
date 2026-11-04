import type { ScreenCrashHost, ScreenCrashIntent } from './handleScreenCrash.types';

/** The FATAL message of a screen crash outside a match (DEC-124 (b)). */
const SCREEN_CRASH_BODY = 'The screen stopped because of an error.';

/**
 * What the session does when `ErrorBoundary` caught a screen (ADR 0025 §5). In `match` it ends the
 * match as a loop crash does, with source `screen:<name>`. Elsewhere it reports the crash and
 * returns to the menu with `'screen-crashed'` through `crashToMenu`, outside the intent transition
 * table (DEC-149), so `pre-launch` too (DEC-141: the one way out of the reveal). `menu` has no move
 * to itself: it shows the reason again and goes back to `home`. React's
 * component stack, often the only clue in a built page, goes after the stack in the report.
 */
export function handleScreenCrash(intent: ScreenCrashIntent, host: ScreenCrashHost): void {
  const { componentStack } = intent;
  const stack = [
    intent.stack === '' ? null : intent.stack,
    componentStack === '' ? null : `Component stack:${componentStack}`,
  ].filter((part) => part !== null);
  const error = {
    message: intent.message,
    stack: stack.length === 0 ? null : stack.join('\n\n'),
    source: `screen:${intent.screen}`,
  };
  const errorText = `${intent.screen}: ${intent.message}`;
  if (host.phase === 'match') {
    host.crashMatch(error, { errorText, tick: host.matchTick, componentStack });
    return;
  }
  host.report(error, {
    body: SCREEN_CRASH_BODY,
    errorText,
    tick: null,
    seed: host.seed,
    cause: 'screen',
    componentStack,
  });
  if (host.phase === 'menu') {
    host.bus.emit('session-phase', { phase: 'menu', reason: 'screen-crashed' });
    host.bus.emit('menu-route', { route: 'home' });
    return;
  }
  host.crashToMenu('screen-crashed');
}
