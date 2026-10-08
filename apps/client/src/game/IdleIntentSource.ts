import type { InputIntent } from '@eternalus/core';

import type { IntentSource } from './Match.types';

const IDLE: InputIntent = { move: { x: 0, y: 0 }, aim: null, triggered: [] };

/**
 * An intent source that never asks for anything: the player stands still. A placeholder until
 * the input session (keyboard and rebinding, session F) provides the real source.
 */
export class IdleIntentSource implements IntentSource {
  /** Always the idle intent. */
  public read(): InputIntent {
    return IDLE;
  }
}
