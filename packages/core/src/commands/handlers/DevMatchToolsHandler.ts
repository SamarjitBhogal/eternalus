import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/** Applies replayable debug commands for the local player and match. */
export class DevMatchToolsHandler implements CommandHandler<
  'dev-teleport' | 'dev-level-up' | 'dev-destroy-buildings' | 'dev-end-match'
> {
  /** Validates the action and routes it through the corresponding gameplay path. */
  public handle(
    command: Command<'dev-teleport' | 'dev-level-up' | 'dev-destroy-buildings' | 'dev-end-match'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    if (command.type === 'dev-end-match') {
      state.events.emit('dev-match-end-requested', { outcome: command.outcome });
      return null;
    }
    if (command.type === 'dev-destroy-buildings') {
      state.events.emit('dev-building-destruction-requested', null);
      return null;
    }
    const entityId = state.match.humanLegendId;
    const legend = entityId === null ? undefined : state.entities.get(entityId);
    if (legend === undefined || !state.entities.isAlive(legend.id)) return 'unknown-entity';
    if (command.type === 'dev-level-up') {
      state.events.emit('dev-level-up-requested', { entityId: legend.id });
      return null;
    }
    const transform = legend.getComponent(Transform);
    const { x, y } = command.to;
    const map = state.world?.definition;
    const radius = transform.radius;
    if (
      map === undefined ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < radius ||
      y < radius ||
      x > map.width - radius ||
      y > map.height - radius ||
      state.world?.grid.isWalkableAt(x, y) !== true
    )
      return 'invalid-position';
    state.entities.clearAttackTarget(legend.id);
    legend.getComponent(Movement).stop();
    transform.moveTo(command.to);
    return null;
  }
}
