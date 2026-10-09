import type { Command, CommandType } from './Command.types';
import type { CommandContext, CommandHandlers } from './CommandHandler.types';

/**
 * Dispatches `command` to the handler registered for its type. A rejected command never throws:
 * it is announced as `command-rejected` with the reason.
 */
export const applyCommand = <K extends CommandType>(
  command: Command<K>,
  handlers: CommandHandlers,
  context: CommandContext,
): void => {
  const reason = handlers[command.type].handle(command, context);
  if (reason !== null) {
    context.state.events.emit('command-rejected', { command, reason });
  }
};
