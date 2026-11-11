import type { GameState } from '../state/GameState';
import { REPORTED_COMMANDS, REPORTED_EVENTS } from './InvariantRunner.constants';
import type { LogContext } from './Logger.types';

/**
 * What led up to this moment of `state`: the last `REPORTED_COMMANDS` applied commands (players'
 * and bots') and the last `REPORTED_EVENTS` events, oldest first, copied out of their ring
 * buffers (architecture 15 §5). The one place a report's context is cut; it only reads `state`.
 */
export const recentContext = (state: GameState): LogContext => ({
  recentCommands: state.recentCommands().slice(-REPORTED_COMMANDS),
  recentEvents: state.events.recentEvents().slice(-REPORTED_EVENTS),
});
