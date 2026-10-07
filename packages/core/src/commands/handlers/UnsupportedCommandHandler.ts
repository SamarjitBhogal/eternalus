import type { CommandType } from '../Command.types';
import type { CommandHandler } from '../CommandHandler.types';

/**
 * Rejects a command whose behaviour does not exist yet (movement, combat, abilities and
 * controllers arrive with their systems). Replace its registry line with the real handler.
 */
export class UnsupportedCommandHandler implements CommandHandler<CommandType> {
  /** Always rejects with `not-supported`. */
  public handle(): 'not-supported' {
    return 'not-supported';
  }
}
