import { type Logger, makeLogRecord } from '@eternalus/core';

/** The scope of uncaught throws (ADR 0025 §6). */
const WINDOW_SCOPE = 'client.window';

/** What the listeners need of the page's `window`. */
type ErrorEventTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

const messageOf = (thrown: unknown): string =>
  thrown instanceof Error ? thrown.message : String(thrown);

function logThrow(logger: Logger, body: string, thrown: unknown): void {
  const stack = thrown instanceof Error ? (thrown.stack ?? null) : null;
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
    const message =
      thrown instanceof Error || !('message' in event) ? messageOf(thrown) : String(event.message);
    logThrow(logger, `Uncaught error: ${message}`, thrown);
  };
  const onRejection = (event: Event): void => {
    const reason = 'reason' in event ? event.reason : undefined;
    logThrow(logger, `Unhandled rejection: ${messageOf(reason)}`, reason);
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
