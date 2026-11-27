import { MapObjectBody } from '../components/MapObjectBody';
import { Progression } from '../components/Progression';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import { LEGEND_KINDS } from '../content/legends/legendKinds';
import type { MapObjectKind } from '../content/maps/mapObjects.types';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * A Legend's weapon hits grow with its level (DEC-380 (2), architecture 05 §13): the hit is
 * multiplied by the attacker's `Progression.potency` at its class's `basicAttackPerLevel`, or at
 * the lower `basicAttackPerLevelOnStructures` when the target is a structure (DEC-405). Only
 * `weapon` hits scale here: an ability's amount is already scaled at cast (05 §13), and a status
 * tick, a structure's own shot or the environment has no level. A mob, or an attacker no longer
 * in the store, deals its hit unchanged.
 *
 * @remarks ponytail: the level is read when the hit lands, so a projectile that lands after its
 * shooter died deals ×1, and one that lands after a level-up uses the new level. Carry the level
 * on `DamageSource` (or `DamageHit`) at fire time if ranged weapons need it exact.
 */
export class BasicAttackLevelStep implements DamageStep {
  public readonly name = 'basic-attack-level';

  /**
   * @param units - The match's unit definitions (the same source as `ProgressionSystem`); a Legend
   * class's `levelScaling` is read from it.
   * @param structureMapObjectKinds - The map-object kinds that count as structures
   * (`STRUCTURE_MAP_OBJECT_KINDS`): a wall, turret, gate, fort or palace is an obstacle entity
   * with a `MapObjectBody`, not a `structure` entity.
   */
  public constructor(
    private readonly units: Pick<ContentCatalogue<EntityDefinitionBase>, 'has' | 'get'>,
    private readonly structureMapObjectKinds: ReadonlySet<MapObjectKind>,
  ) {}

  /** Returns a Legend's weapon hit × its basic-attack potency, any other hit unchanged. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    if (source.kind !== 'weapon' || source.attackerId === null) {
      return amount;
    }
    const attacker = state.entities.get(source.attackerId);
    const progression = attacker?.findComponent(Progression);
    if (
      attacker === undefined ||
      progression === undefined ||
      !this.units.has(attacker.definitionId)
    ) {
      return amount;
    }
    const definition = this.units.get(attacker.definitionId);
    if (!LEGEND_KINDS.has(definition)) {
      return amount;
    }
    const scaling = definition.levelScaling;
    const perLevel = this.isStructure(targetId, state)
      ? scaling.basicAttackPerLevelOnStructures
      : scaling.basicAttackPerLevel;
    return amount * progression.potency({ perLevel });
  }

  /** A `structure` entity, or a map object of a kind in `structureMapObjectKinds`. */
  private isStructure(targetId: string, state: GameState): boolean {
    const target = state.entities.get(targetId);
    const kind = target?.findComponent(MapObjectBody)?.object.kind;
    return (
      target?.family === 'structure' ||
      (kind !== undefined && this.structureMapObjectKinds.has(kind))
    );
  }
}
