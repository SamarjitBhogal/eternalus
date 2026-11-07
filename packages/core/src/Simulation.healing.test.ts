import { describe, expect, it } from 'vitest';

import { Footprint } from './components/Footprint';
import { Health } from './components/Health';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NORMAL_BOT } from './content/ai/difficulties/normal';
import { OUT_OF_COMBAT_HEALING } from './content/healing/outOfCombatHealing';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { GameState } from './state/GameState';

const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 10, legendsPerTeam: 6 } });
const TICK_RATE = CONFIG.tickRate;

const laners = (team: 'light' | 'dark', count: number): RosterSlot[] =>
  Array.from({ length: count }, () => ({
    team,
    definitionId: 'warrior',
    role: 'laner',
    difficulty: NORMAL_BOT.id,
  }));

const match = () =>
  new Simulation({
    config: CONFIG,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
    roster: [...laners('light', 4), ...laners('dark', 4)],
  });

describe('Simulation with out-of-combat healing (DEC-188)', () => {
  it('heals a bot that retreated hurt back to the rejoin line, and it fights again', () => {
    const simulation = match();
    const retreatedAt = new Map<string, number>();
    const rejoinedAt = new Map<string, number>();
    let fightsAfterRejoin = 0;
    simulation.on('damage-applied', ({ source }) => {
      if (source.attackerId !== null && rejoinedAt.has(source.attackerId)) {
        fightsAfterRejoin += 1;
      }
    });

    for (let tick = 0; tick < 150 * TICK_RATE; tick += 1) {
      simulation.step();
      for (const { id, kind, health } of simulation.snapshot().entities) {
        if (kind !== 'warrior' || health === null) continue;
        const fraction = health.current / health.max;
        if (fraction < NORMAL_BOT.retreatHealthFraction && !retreatedAt.has(id)) {
          retreatedAt.set(id, tick);
        }
        if (
          retreatedAt.has(id) &&
          !rejoinedAt.has(id) &&
          fraction >= NORMAL_BOT.rejoinHealthFraction
        ) {
          rejoinedAt.set(id, tick);
        }
      }
    }

    expect(retreatedAt.size).toBeGreaterThan(0);
    expect(rejoinedAt.size).toBeGreaterThan(0);
    for (const [id, tick] of rejoinedAt) {
      // Nobody heals before the out-of-combat delay.
      expect(tick - (retreatedAt.get(id) ?? 0)).toBeGreaterThanOrEqual(
        OUT_OF_COMBAT_HEALING.delaySeconds * TICK_RATE,
      );
    }
    expect(fightsAfterRejoin).toBeGreaterThan(0);
  });

  it("heals a hurt unit in its own team's fort box at the fort-box rate (generated map, DEC-215 (4))", () => {
    const map = new MapGenerator().generate(CONFIG, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    // No `TEST_DEBUG_CONFIG`: its invariants over the whole generated map cost about 20 s here.
    const simulation = new Simulation({
      config: CONFIG,
      seed: 1,
      logger: new MemoryLogger(),
      map,
      mapObjects,
    });
    const { state } = simulation as unknown as { readonly state: GameState };
    const towers: { id: string; box: Footprint['bounds'] }[] = [];
    state.entities.forEach((entity) => {
      const box = entity.findComponent(Footprint)?.bounds;
      if (entity.kind === 'spawner-tower' && state.entities.teamOf(entity.id) === 'light' && box) {
        towers.push({ id: entity.id, box });
      }
    });
    const fort = towers[0]?.box;
    if (fort === undefined) throw new Error('no light spawner tower with a fort footprint');
    // One metre into the fort's west gateway, a gap in its walls.
    const spot = { x: fort.x + 1, y: fort.y + fort.height / 2 };
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'light',
      at: spot,
      count: 1,
    });
    const delay = OUT_OF_COMBAT_HEALING.delaySeconds * TICK_RATE;
    while (state.tick < delay) simulation.step();
    let health: Health | undefined;
    state.entities.forEach((entity) => {
      if (entity.definitionId === 'training-dummy') health = entity.getComponent(Health);
    });
    if (health === undefined) throw new Error('no training dummy');
    health.applyDamage(health.max / 2);
    const before = health.current;

    simulation.step();

    const fortBonus = OUT_OF_COMBAT_HEALING.structureBonuses['spawner-tower']?.fractionPerSecond;
    const rate = OUT_OF_COMBAT_HEALING.healthFractionPerSecond + (fortBonus ?? 0);
    expect(fortBonus).toBeGreaterThan(0);
    expect(health.current - before).toBeCloseTo((health.max * rate) / TICK_RATE, 9);
  });

  it('plays out the same way twice: same seed, same hash', () => {
    const hashes = [1, 2].map(() => {
      const simulation = match();
      for (let tick = 0; tick < 100 * TICK_RATE; tick += 1) {
        simulation.step();
      }
      return simulation.hash();
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
