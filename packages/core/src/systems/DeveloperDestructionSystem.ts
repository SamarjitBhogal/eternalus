import type { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Structure } from '../entities/structures/Structure';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/** Applies a developer destruction request before the normal structure and death passes. */
export class DeveloperDestructionSystem implements System {
  public readonly name = 'developer-destruction';
  private isRequested = false;

  /** Listens for the replayable building destruction command. */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
  ) {
    state.events.on('dev-building-destruction-requested', () => {
      this.isRequested = true;
    });
  }

  /** Destroys structures and building bodies without targeting natural scenery. */
  public update({ state }: SystemContext): void {
    if (!this.isRequested) return;
    this.isRequested = false;
    state.entities.forEach((entity) => {
      const kind = entity.findComponent(MapObjectBody)?.object.kind;
      if (
        !(entity instanceof Structure) &&
        (kind === undefined || kind === 'tree' || kind === 'rock' || kind === 'terrain')
      )
        return;
      const health = entity.findComponent(Health);
      if (health === undefined || health.isDead) return;
      this.damage.apply(state, entity.id, health.total, {
        kind: 'environment',
        attackerId: null,
        definitionId: 'dev-destroy-buildings',
      });
    });
  }
}
