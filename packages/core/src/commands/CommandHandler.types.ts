import type { EntityFactory } from '../entities/EntityFactory';
import type { GameState } from '../state/GameState';
import type { Command, CommandRejectReason, CommandType } from './Command.types';

/** What a handler may touch while applying a command. */
export type CommandContext = {
  readonly state: GameState;
  readonly factory: EntityFactory;
};

/** Applies one kind of command. */
export interface CommandHandler<K extends CommandType> {
  /** Validates and applies `command`; returns why it was rejected, or `null` when applied. */
  handle(command: Command<K>, context: CommandContext): CommandRejectReason | null;
}

/** One handler per command type; a missing type does not compile. */
export type CommandHandlers = { readonly [K in CommandType]: CommandHandler<K> };
