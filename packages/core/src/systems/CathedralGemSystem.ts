import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { CathedralGemState } from '../components/CathedralGemState';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { CathedralGemDefinition } from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/**
 * The Cathedral gem's rules (DEC-291, DEC-292, DEC-346). A hit on the gem (any blocked hit with an
 * attacker: a weapon, a projectile or an ability, all through the damage pipeline) lands the gem's
 * statuses on the hitter and lights the gem's glow. Walking by it strikes nobody: the gem blocks
 * movement instead (its plinth, `CathedralInteriorBuilder`; DEC-346). The statuses come from the
 * environment, as the gem is no team's: so friendly fire never blocks them and they hurt neutrals
 * too ("hurts any entity", DEC-292); a death by them is credited to the unit's last enemy damager
 * (`KillCredit`, DEC-346). Its holder follows the capture point it stands in. Bots and neutrals
 * never pick the gem as a target: perception sees units only, and a lane's objectives are
 * playable-team structures only (`LaneStructures`). Runs after `CaptureSystem`, so a change of
 * hands this tick shows this tick. When the gem erupts (`greater-boss-summoned`) it is removed
 * (`despawned`).
 */
export class CathedralGemSystem implements System {
  public readonly name = 'cathedral-gem';
  private readonly hits: { readonly gemId: EntityId; readonly attackerId: EntityId }[] = [];
  private readonly handovers: { readonly pointId: EntityId; readonly to: Team }[] = [];
  private readonly glowTicks: number;
  /** Set by `greater-boss-summoned`; the next pass removes the gem. */
  private hasErupted = false;

  /**
   * @param state - The match whose events this system listens to.
   * @param statuses - The match's one status applier.
   * @param loaded - The match's loaded status effects, for the glow status's length in ticks.
   * @param gem - What the gem lands and how long it glows (`CATHEDRAL_GEM`).
   */
  public constructor(
    state: GameState,
    private readonly statuses: StatusEffectApplier,
    loaded: Pick<ContentCatalogue<StatusEffectDefinition>, 'get'>,
    private readonly gem: CathedralGemDefinition,
  ) {
    // Looks up every id now, so a wrong one fails at match start, not at the first hit.
    for (const id of gem.statusIds) loaded.get(id);
    const { durationTicks } = loaded.get(gem.glow.statusId);
    if (durationTicks === null) {
      throw new Error(`The gem's glow status "${gem.glow.statusId}" must have a duration.`);
    }
    this.glowTicks = durationTicks + gem.glow.extraTicks;
    state.events.on('damage-blocked', ({ targetId, source }) => {
      const isGem = state.entities.get(targetId)?.findComponent(CathedralGemState) !== undefined;
      if (isGem && source.attackerId !== null && source.attackerId !== targetId) {
        this.hits.push({ gemId: targetId, attackerId: source.attackerId });
      }
    });
    state.events.on('capture-point-owner-changed', ({ pointId, to }) => {
      this.handovers.push({ pointId, to });
    });
    state.events.on('greater-boss-summoned', () => {
      this.hasErupted = true;
    });
  }

  /** Removes an erupted gem first, then ages each gem's glow, hands it over, then answers this tick's hits. */
  public update({ state }: SystemContext): void {
    if (this.hasErupted) {
      this.hasErupted = false;
      this.removeGems(state);
    }
    state.entities.forEach((entity) => {
      const gem = entity.findComponent(CathedralGemState);
      if (gem === undefined) return;
      gem.age();
      this.handOver(state, entity, gem);
    });
    for (const { gemId, attackerId } of this.hits) {
      const gem = state.entities.get(gemId)?.findComponent(CathedralGemState);
      if (gem !== undefined) this.strike(state, gem, attackerId);
    }
    this.hits.length = 0;
    this.handovers.length = 0;
  }

  private handOver(state: GameState, entity: Entity, gem: CathedralGemState): void {
    const at = entity.findComponent(Transform)?.position;
    for (const { pointId, to } of this.handovers) {
      const area = state.entities.get(pointId)?.findComponent(ZoneArea);
      if (at !== undefined && area?.contains(at) === true) gem.hold(to);
    }
  }

  /**
   * The gem erupts through the roof (12 §3, reference 04): removed (`despawned`) on this system's
   * pass after `greater-boss-summoned`, before it answers any touch, so it strikes no one after,
   * the Greater Boss included, who appears where it stood.
   */
  private removeGems(state: GameState): void {
    const gems: EntityId[] = [];
    state.entities.forEach((entity) => {
      if (entity.findComponent(CathedralGemState) !== undefined) gems.push(entity.id);
    });
    this.hits.length = 0;
    for (const entityId of gems) {
      state.entities.remove(entityId, 'despawned');
      state.events.emit('entity-removed', { entityId, cause: 'despawned' });
    }
  }
  private strike(state: GameState, gem: CathedralGemState, unitId: EntityId): void {
    for (const statusId of this.gem.statusIds) {
      this.statuses.apply(state, unitId, statusId, null);
    }
    gem.struck(this.glowTicks);
  }
}
