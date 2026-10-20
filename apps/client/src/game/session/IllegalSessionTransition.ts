import type { SessionPhase } from '../../bridge/events';

/** A phase change outside `SESSION_TRANSITIONS`: a bug in a state, not a session state. */
export class IllegalSessionTransition extends Error {
  /** Names both phases in the message. */
  public constructor(from: SessionPhase, to: SessionPhase) {
    super(`Illegal session transition: ${from} → ${to}`);
    this.name = 'IllegalSessionTransition';
  }
}
