import { describe, expect, it } from 'vitest';

import { unitsWithWarriorKit } from './abilities/__fixtures__/casterState';
import { Health } from './components/Health';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import type { DefinitionSource } from './entities/EntityFactory.types';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import type { GameState } from './state/GameState';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { PlayableTeam } from './teams/teams.types';

/** The status ids on `team`'s human Legend now. */
const statusesOf = (sim: Simulation, team: PlayableTeam): readonly string[] => {
  const id = sim.humanLegendIdOf(team);
  const legend = sim.snapshot().entities.find((entity) => entity.id === id);
  return (legend?.statuses ?? []).map((status) => status.id);
};

describe('Simulation: a Legend spec’s passive (05 §7, DEC-330)', () => {
  const slotOf = (definitionId: string, specId: string): RosterSlot => ({
    pilot: 'human',
    team: 'dark',
    definitionId,
    role: 'rover',
    specId,
  });
  const build = (slot: RosterSlot) =>
    new Simulation({
      config: createDefaultGameConfig({ match: { playerTeam: 'dark' } }),
      seed: 5,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [slot],
    });

  it.each([
    ['magus', 'catalyst', ['erudition']],
    ['magus', 'oracle', ['erudition']],
    ['magus', 'necromancer', ['necromancy']],
    ['warrior', 'knight', []], // the Vanguard has no passive (DISC-38)
    ['sentinel', 'colossus', []], // Wrecking Run is movement numbers, not a status (DEC-307)
  ])('gives a %s %s its passive’s status on the first tick', (definitionId, specId, expected) => {
    const sim = build(slotOf(definitionId, specId));

    sim.step();

    expect(statusesOf(sim, 'dark')).toEqual(expected);
  });

  it('puts the passive on without a cast: no ability-cast, no aether, no cooldown', () => {
    const sim = build(slotOf('magus', 'necromancer'));
    const casts: string[] = [];
    sim.on('ability-cast', ({ abilityId }) => casts.push(abilityId));
    const id = sim.humanLegendIdOf('dark');
    const aetherOf = () =>
      sim.snapshot().entities.find((entity) => entity.id === id)?.aether?.current;
    const aether = aetherOf();

    sim.step();

    expect(statusesOf(sim, 'dark')).toEqual(['necromancy']);
    expect(casts).toEqual([]);
    expect(aetherOf()).toBe(aether);
    expect(sim.snapshot().player?.slots.map((slot) => slot.cooldownRemainingTicks)).toEqual(
      sim.snapshot().player?.slots.map(() => 0),
    );
  });

  it('gives a respawned Necromancer its passive’s status back on the tick after it returns (FR-051)', () => {
    const sim = build(slotOf('magus', 'necromancer'));
    const { state } = sim as unknown as { readonly state: GameState };
    const id = sim.humanLegendIdOf('dark') ?? '';
    let returnedAt: number | undefined;
    sim.on('legend-respawned', ({ entityId }) => {
      if (entityId === id) returnedAt = sim.tick;
    });
    sim.step();
    expect(statusesOf(sim, 'dark')).toContain('necromancy');
    // A lethal hit outside the damage pipeline, as in the RespawnSystem tests. Unlike those tests,
    // the full pipeline runs the invariants: this death has no killer, so it reports
    // `no-death-without-killer`. The default release config only reports it and goes on.
    const health = state.entities.get(id)?.getComponent(Health);
    health?.applyDamage(health.current);

    for (let tick = 0; tick < 2000 && returnedAt === undefined; tick += 1) sim.step();

    expect(returnedAt).toBeDefined();
    // RespawnSystem runs after AbilitySystem: back with no status, the passive due.
    expect(statusesOf(sim, 'dark')).not.toContain('necromancy');
    sim.step();
    expect(statusesOf(sim, 'dark')).toContain('necromancy');
  });
});

/** How far either side of the gem the Duel walker steps south to go round it (DEC-346). */
const ROUND_THE_GEM = 15;

describe('Simulation: a passive in a Duel (05 §7, DEC-330)', () => {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
  const map = new MapGenerator().generate(config, 7);
  const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
  // A Vanguard against a one-health Heretic: each hit is a kill and a round reset.
  const shipped = unitsWithWarriorKit();
  const content: DefinitionSource = {
    has: (id) => shipped.has(id),
    get: (id) => (id === 'magus' ? { ...shipped.get(id), baseHealth: 1 } : shipped.get(id)),
  };
  const ROSTER: readonly RosterSlot[] = [
    { pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover', specId: 'knight' },
    { pilot: 'human', team: 'dark', definitionId: 'magus', role: 'rover', specId: 'necromancer' },
  ];
  const build = () =>
    new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: ROSTER,
      duel: { killTarget: 3 },
      content,
    });

  const gemX = map.features.find((feature) => feature.kind === 'cathedral')?.position.x ?? 0;

  /**
   * Steps the Vanguard at the Heretic, hitting it, until the light team has `kills` kills. The gem
   * between the start points blocks movement (DEC-346), so near it the Vanguard also steps south
   * and slides round it, as `fightUntil` does in `Simulation.duel.test.ts`.
   */
  const killUntil = (sim: Simulation, kills: number, limit = 6000) => {
    const light = sim.humanLegendIdOf('light') ?? '';
    const dark = sim.humanLegendIdOf('dark') ?? '';
    for (let i = 0; i < limit && (sim.snapshot().match.duel?.kills.light ?? 0) < kills; i += 1) {
      const entities = sim.snapshot().entities;
      const at = (id: string) => entities.find((e) => e.id === id)?.transform ?? { x: 0, y: 0 };
      const from = at(light);
      const to = at(dark);
      sim.enqueueCommand({
        type: 'move',
        actorId: light,
        direction: {
          x: Math.sign(to.x - from.x),
          y: Math.abs(from.x - gemX) < ROUND_THE_GEM ? 1 : Math.sign(to.y - from.y),
        },
      });
      sim.enqueueCommand({ type: 'attack-target', actorId: light, targetId: dark });
      sim.step();
    }
  };

  it('takes the passive’s status off at the round reset and puts it back on the next tick', () => {
    const sim = build();
    const dark = sim.humanLegendIdOf('dark') ?? '';
    const log: string[] = [];
    sim.on('status-applied', ({ entityId, statusId }) => {
      if (entityId === dark) log.push(`${statusId} on`);
    });
    sim.on('status-expired', ({ entityId, statusId }) => {
      if (entityId === dark) log.push(`${statusId} off`);
    });

    killUntil(sim, 1); // the tick of the kill is the tick of the reset

    expect(statusesOf(sim, 'dark')).toEqual([]);

    sim.step();

    expect(statusesOf(sim, 'dark')).toEqual(['necromancy']);
    expect(log).toEqual(['necromancy on', 'necromancy off', 'necromancy on']);
  });

  it('replays to the same hashes from its setup and commands', () => {
    const sim = build();
    killUntil(sim, 2);

    expect(
      runReplay(
        sim.exportReplay(),
        (setup) => new Simulation({ ...setup, logger: new NullLogger(), content }),
      ).firstDivergence,
    ).toBeNull();
  });
});
