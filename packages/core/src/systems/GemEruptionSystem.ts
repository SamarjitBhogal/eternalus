import type { DamagePipeline } from '../combat/DamagePipeline';
import { Capturable } from '../components/Capturable';
import { CathedralGemState } from '../components/CathedralGemState';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { CathedralGemDefinition } from '../content/structures/structures.types';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { DamageSource } from '../state/GameEvents.types';
import type { Vec2 } from '../utils/geometry.types';
import type { System, SystemContext } from './System.types';

/**
 * The gem eruption's blast (DEC-371 "BOSS guards" C): on its pass after `greater-boss-summoned`,
 * every unit (Legends, minions, camp mobs, defenders) standing in a capture zone that holds the
 * gem dies; the Cathedral's zone is the whole building (DEC-145). It runs with the other damage
 * systems, before progression and death, so the dead leave this tick, and before `SpawnSystem`,
 * so the Greater Boss appears after it. The blast is no team's: no kill credit or XP (until the
 * owner says otherwise). `CathedralGemSystem` removes the gem later in the same tick.
 */
export class GemEruptionSystem implements System {
  public readonly name = 'gem-eruption';
  private readonly source: DamageSource;
  /** Set by `greater-boss-summoned`; the next pass blasts. */
  private hasErupted = false;

  /**
   * @param state - The match whose events this system listens to.
   * @param damage - The match's one damage pipeline.
   * @param eruption - The blast's source id (`CATHEDRAL_GEM.eruption`).
   */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
    eruption: CathedralGemDefinition['eruption'],
  ) {
    this.source = { attackerId: null, kind: 'environment', definitionId: eruption.sourceId };
    state.events.on('greater-boss-summoned', () => {
      this.hasErupted = true;
    });
  }

  /** Blasts the zone around each gem once, on the pass after the eruption. */
  public update({ state }: SystemContext): void {
    if (!this.hasErupted) return;
    this.hasErupted = false;
    const gems: Vec2[] = [];
    state.entities.forEach((entity) => {
      const at = entity.findComponent(Transform)?.position;
      if (entity.findComponent(CathedralGemState) !== undefined && at !== undefined) gems.push(at);
    });
    for (const at of gems) this.blast(state, at);
  }

  private blast(state: GameState, at: Vec2): void {
    const zones: ZoneArea[] = [];
    state.entities.forEach((entity) => {
      const area = entity.findComponent(ZoneArea);
      if (area?.contains(at) === true && entity.findComponent(Capturable) !== undefined) {
        zones.push(area);
      }
    });
    const victims: { readonly id: string; readonly health: Health }[] = [];
    state.entities.forEach((entity) => {
      const position = entity.findComponent(Transform)?.position;
      const health = entity.findComponent(Health);
      if (
        entity instanceof Unit &&
        health !== undefined &&
        position !== undefined &&
        zones.some((zone) => zone.contains(position))
      ) {
        victims.push({ id: entity.id, health });
      }
    });
    for (const { id, health } of victims) {
      this.damage.apply(state, id, health.total, this.source);
    }
  }
}
