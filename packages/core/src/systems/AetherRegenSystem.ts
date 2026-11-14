import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { AetherAuraSource, AetherRegenDefinition } from '../content/abilities/aetherRegen';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import { isPlayableTeam } from '../teams/playableTeams';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { AETHER_REGEN_QUANTUM } from './AetherRegenSystem.constants';
import type { Aura } from './AetherRegenSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Refills every `Aether` pool each tick (DEC-201): `perSecondAtBase` × max / base per second, so a
 * full refill takes the same time at every level, times 1 + the aura bonus; never above max.
 * Runs after `AbilitySystem`, so a cast spends before the tick's regeneration (plan arch call 13).
 *
 * Aura bonus: a Legend within `auraRadius` of a live allied aura structure gets that aura's bonus.
 * An aura with `scalesWithShareOf` gives `auraBonus` × standing / spawned of that kind on its team
 * (the Stronghold by its BuffTowers, DEC-201 (4)); with none spawned it gives nothing. Inside
 * several allied auras the Legend gets the largest bonus; bonuses never add up.
 *
 * Each tick's amount is rounded down to a multiple of `AETHER_REGEN_QUANTUM` (2^-16), so the pool
 * holds only exact binary fractions and repeated additions never drift: two runs, on any engine,
 * hold the same bits, and 35 aether is reached on the same tick everywhere.
 */
export class AetherRegenSystem implements System {
  public readonly name = 'aether-regen';

  /** The kinds some aura scales by: the only ones counted. */
  private readonly scaledKinds: ReadonlySet<string>;

  /**
   * @param rules - The rate and the auras (`content/abilities/aetherRegen.ts`).
   * @param tickRate - Ticks per second (`GameConfig.tickRate`).
   */
  public constructor(
    private readonly rules: AetherRegenDefinition,
    private readonly tickRate: number,
  ) {
    this.scaledKinds = new Set(
      rules.auras.flatMap(({ scalesWithShareOf }) =>
        scalesWithShareOf === null ? [] : [scalesWithShareOf],
      ),
    );
  }

  /** Refills every pool that is not full. */
  public update({ state }: SystemContext): void {
    const refilling: { readonly entity: Entity; readonly aether: Aether }[] = [];
    state.entities.forEach((entity) => {
      const aether = entity.findComponent(Aether);
      if (aether !== undefined && aether.current < aether.max) {
        refilling.push({ entity, aether });
      }
    });
    if (refilling.length === 0) {
      return;
    }
    const auras = this.aurasOf(state);
    for (const { entity, aether } of refilling) {
      const multiplier = 1 + this.bonusFor(entity, auras);
      const perTick =
        (this.rules.perSecondAtBase * aether.max * multiplier) / (aether.base * this.tickRate);
      aether.restore(Math.floor(perTick / AETHER_REGEN_QUANTUM) * AETHER_REGEN_QUANTUM);
    }
  }

  /** Every live aura structure with the bonus it gives now. */
  private aurasOf(state: GameState): Aura[] {
    const found: {
      readonly source: AetherAuraSource;
      readonly team: Team;
      readonly position: Vec2;
    }[] = [];
    /** Standing structures per `team:kind`, for the scaled auras. */
    const standing = new Map<string, number>();
    state.entities.forEach((entity) => {
      const team = entity.findComponent(TeamMembership)?.team;
      const transform = entity.findComponent(Transform);
      if (
        team === undefined ||
        transform === undefined ||
        entity.findComponent(Health)?.isDead !== false
      ) {
        return;
      }
      if (this.scaledKinds.has(entity.kind)) {
        const key = `${team}:${entity.kind}`;
        standing.set(key, (standing.get(key) ?? 0) + 1);
      }
      const source = this.rules.auras.find(({ structureKind }) => structureKind === entity.kind);
      if (source !== undefined) {
        found.push({ source, team, position: transform.position });
      }
    });
    return found.map(({ source, team, position }) => ({
      team,
      position,
      bonus:
        source.scalesWithShareOf === null
          ? this.rules.auraBonus
          : this.rules.auraBonus *
            AetherRegenSystem.shareStanding(state, team, source.scalesWithShareOf, standing),
    }));
  }

  /**
   * The share of `team`'s `kind` structures still standing: standing / spawned, where spawned is
   * those standing plus those the match indexed at start that have fallen
   * (`LaneStructures.lostCount`). 0 when the team never had one.
   */
  private static shareStanding(
    state: GameState,
    team: Team,
    kind: string,
    standing: ReadonlyMap<string, number>,
  ): number {
    const alive = standing.get(`${team}:${kind}`) ?? 0;
    const lost = isPlayableTeam(team)
      ? state.laneStructures.lostCount(team, kind, state.entities)
      : 0;
    const spawned = alive + lost;
    return spawned === 0 ? 0 : alive / spawned;
  }

  /** The largest bonus among the allied auras `entity` stands in; 0 outside them all. */
  private bonusFor(entity: Entity, auras: readonly Aura[]): number {
    const team = entity.findComponent(TeamMembership)?.team;
    const position = entity.findComponent(Transform)?.position;
    if (team === undefined || position === undefined) {
      return 0;
    }
    const reach = this.rules.auraRadius * this.rules.auraRadius;
    let best = 0;
    for (const aura of auras) {
      const dx = aura.position.x - position.x;
      const dy = aura.position.y - position.y;
      if (aura.team === team && dx * dx + dy * dy <= reach) {
        best = Math.max(best, aura.bonus);
      }
    }
    return best;
  }
}
