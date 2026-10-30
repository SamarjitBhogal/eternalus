import { Health } from '../components/Health';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';
import type { BuildingCollapse } from './MapDestructionSystem.types';

/** Collapses building contents through ordinary damage events before DeathSystem retires them. */
export class MapDestructionSystem implements System {
  public readonly name = 'map-destruction';
  private readonly pending: BuildingCollapse[] = [];

  /** Listens to typed lethal-hit events, retaining attribution for every destroyed object. */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      const object = state.worldObjects?.objectFor(entityId);
      if (object !== undefined && state.worldObjects?.contentsOf(object.id).length !== 0)
        this.pending.push({ buildingId: object.id, source: killer });
    });
  }

  /** Destruction never changes Health directly or silently removes a child entity. */
  public update({ state }: SystemContext): void {
    for (const collapse of this.pending.splice(0))
      for (const entityId of state.worldObjects?.contentsOf(collapse.buildingId) ?? []) {
        const health = state.entities.get(entityId)?.findComponent(Health);
        if (health !== undefined && !health.isDead)
          this.damage.apply(state, entityId, health.total, collapse.source);
      }
  }
}
