import { type Logger, makeLogRecord } from '@eternalus/core';

import { reportedErrorOf } from './reportedErrorOf';

/** The scope of uncaught throws (ADR 0025 §6). */
const WINDOW_SCOPE = 'client.window';

/** What the listeners need of the page's `window`. */
type ErrorEventTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

function logThrow(logger: Logger, body: string, stack: string | null): void {
  logger.log(makeLogRecord('ERROR', WINDOW_SCOPE, body, { attributes: { stack } }));
}

/**
 * Logs ERROR `client.window` for every `error` and `unhandledrejection` the window sees: throws
 * that neither an error boundary nor the game loop catches, from event handlers and async code
 * (ADR 0025 §6). The body names the message, so the reporter's dedupe keeps different throws
 * apart; the stack goes in `attributes.stack`.
 * @returns Removes both listeners.
 */
export function logWindowErrors(target: ErrorEventTarget, logger: Logger): () => void {
  const onError = (event: Event): void => {
    const thrown = 'error' in event ? event.error : undefined;
    const { message, stack } = reportedErrorOf(thrown, WINDOW_SCOPE);
    const text = thrown instanceof Error || !('message' in event) ? message : String(event.message);
    logThrow(logger, `Uncaught error: ${text}`, stack);
  };
  const onRejection = (event: Event): void => {
    const reason = 'reason' in event ? event.reason : undefined;
    const { message, stack } = reportedErrorOf(reason, WINDOW_SCOPE);
    logThrow(logger, `Unhandled rejection: ${message}`, stack);
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
