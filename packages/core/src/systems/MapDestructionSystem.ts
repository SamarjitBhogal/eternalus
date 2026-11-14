import { Health } from '../components/Health';
import type { DamagePipeline } from '../combat/DamagePipeline';
import { StructureRuins } from '../state/StructureRuins';
import type { System, SystemContext } from './System.types';
import type { BuildingCollapse, MapDestructionOptions } from './MapDestructionSystem.types';

/**
 * Owns what a destroyed map object does (07 §8): a destroyed building collapses its contents
 * through ordinary damage events before DeathSystem retires them; a retired object reopens its
 * grid cells and marks the lane flow fields over them dirty; a fallen lane tower's fort becomes
 * ruins (`StructureRuins`, DEC-217 (12)). Each effect is a listener on the typed events.
 */
export class MapDestructionSystem implements System {
  public readonly name = 'map-destruction';
  private readonly pending: BuildingCollapse[] = [];
  private readonly damage: DamagePipeline;

  /** Listens to typed lethal-hit events, retaining attribution for every destroyed object. */
  public constructor({ state, damage, flowFields, ruinWall }: MapDestructionOptions) {
    this.damage = damage;
    const objects = state.worldObjects;
    const ruins =
      objects === undefined ? undefined : new StructureRuins(objects, state.entities, ruinWall);
    state.events.on('entity-died', ({ entityId, killer }) => {
      ruins?.died(entityId, killer.attackerId);
      const object = objects?.objectFor(entityId);
      if (object !== undefined && objects?.contentsOf(object.id).length !== 0)
        this.pending.push({ buildingId: object.id, source: killer });
    });
    state.events.on('entity-removed', ({ entityId }) => {
      if (ruins === undefined) return;
      // The grid reopens with or without flow fields: A* reads it too (07 §10).
      for (const object of ruins.fallen(entityId)) {
        if (!object.isBlocking) continue;
        const cells = state.world?.reopen(object) ?? [];
        flowFields?.markDirty(cells);
      }
      ruins.removed(entityId);
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
