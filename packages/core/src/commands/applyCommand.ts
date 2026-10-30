import type { Command, CommandType } from './Command.types';
import type { CommandContext, CommandHandlers } from './CommandHandler.types';

/**
 * Dispatches `command` to the handler registered for its type. A rejected command never throws:
 * it is announced as `command-rejected` with the reason. Once the match has ended
 * (`state.match.result` is set) no handler runs and the command is rejected as `'match-ended'`
 * (FR-002: no further commands are applied after it).
 */
export const applyCommand = <K extends CommandType>(
  command: Command<K>,
  handlers: CommandHandlers,
  context: CommandContext,
): void => {
  if (context.state.match.result !== null) {
    context.state.events.emit('command-rejected', { command, reason: 'match-ended' });
    return;
  }
  const reason = handlers[command.type].handle(command, context);
  if (reason !== null) {
    context.state.events.emit('command-rejected', { command, reason });
  }
};
