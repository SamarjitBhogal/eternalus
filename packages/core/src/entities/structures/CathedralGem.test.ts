import { afterEach, describe, expect, it, vi } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import type { DamageResult } from '../../combat/DamagePipeline.types';
import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import type { DuelOptions, RosterSlot } from '../../Simulation.types';
import { EntityStore } from '../../state/EntityStore';
import type { GameEventMap } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';

const SWORD = { attackerId: null, kind: 'weapon', definitionId: 'sword' } as const;

/** A generated three-lane match with no countdown, so units move from the first tick. */
const match = (roster: readonly RosterSlot[] = [], duel?: DuelOptions) => {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const map = new MapGenerator().generate(config, 1);
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config,
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map,
    // The map's objects, as the client passes them: the gem's plinth blocks movement (DEC-346).
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
    roster,
    ...(duel === undefined ? {} : { duel }),
  });
  const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
  const gem = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral-gem');
  if (feature === undefined || gem === undefined) throw new Error('No Cathedral gem');
  return { simulation, logger, config, feature, gem };
};

const steps = (simulation: Simulation, ticks: number) => {
  for (let tick = 0; tick < ticks; tick += 1) simulation.step();
};

/** Spawns one light Legend of class `kind` (a Warrior by default) `dx` from `at`; returns its id. */
const legendBeside = (
  simulation: Simulation,
  at: { x: number; y: number },
  dx: number,
  kind = 'warrior',
) => {
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind,
    definitionId: kind,
    team: 'light',
    at: { x: at.x + dx, y: at.y },
    count: 1,
  });
  simulation.step();
  const legend = simulation.snapshot().entities.find((entity) => entity.kind === kind);
  if (legend === undefined) throw new Error(`No ${kind}`);
  return legend.id;
};

const healthOf = (simulation: Simulation, id: string) =>
  simulation.snapshot().entities.find((entity) => entity.id === id)?.health ?? null;

describe('CathedralGem (07 §1, DISC-11, DEC-292)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is unbreakable from construction, before StructureSystem ever runs', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS);
    const gem = factory.create('cathedral-gem', 'cathedral', {
      position: { x: 0, y: 0 },
      team: 'neutral',
    });
    state.entities.add(gem);

    expect(gem.getComponent(Collider).isUnbreakable).toBe(true);
    expect(new DamagePipeline().apply(state, gem.id, 10_000, SWORD)).toEqual({
      applied: false,
      reason: 'blocked',
    });
    expect(gem.getComponent(Health).current).toBe(
      STRUCTURE_DEFINITIONS.get('cathedral').baseHealth,
    );
  });

  it('stands neutral at the Cathedral feature with its own body, held by nobody yet', () => {
    const { gem, feature } = match();

    expect(gem).toMatchObject({
      team: 'neutral',
      family: 'structure',
      transform: {
        x: feature.position.x,
        y: feature.position.y,
        radius: STRUCTURE_DEFINITIONS.get('cathedral').footprintRadius,
      },
      gem: { holder: 'neutral', glowTicksLeft: 0, glowHits: 0, ticksSinceHit: null },
    });
  });

  it('blocks a Legend’s swings and answers them with a stun and burn, the same way twice', () => {
    const run = () => {
      const { simulation, logger, config, feature, gem } = match();
      const warriorId = legendBeside(simulation, feature.position, -6);
      const setTarget = vi.spyOn(EntityStore.prototype, 'setAttackTarget');
      const apply = vi.spyOn(DamagePipeline.prototype, 'apply');
      const statuses: GameEventMap['status-applied'][] = [];
      simulation.on('status-applied', (event) => statuses.push(event));
      const before = healthOf(simulation, warriorId)?.current ?? 0;
      simulation.enqueueCommand({ type: 'attack-target', actorId: warriorId, targetId: gem.id });

      steps(simulation, 3 * config.tickRate);

      expect(setTarget).toHaveReturnedWith(true);
      const onGem = apply.mock.calls.flatMap(([, targetId], at): DamageResult[] => {
        const result = apply.mock.results[at];
        return targetId === gem.id && result?.type === 'return' ? [result.value] : [];
      });
      expect(onGem.length).toBeGreaterThan(1);
      expect(onGem.every((result) => !result.applied && result.reason === 'blocked')).toBe(true);
      expect(statuses).toContainEqual({
        entityId: warriorId,
        statusId: 'gem-shock',
        sourceId: null,
      });
      expect(statuses).toContainEqual({
        entityId: warriorId,
        statusId: 'gem-burn',
        sourceId: null,
      });
      expect(healthOf(simulation, warriorId)?.current).toBeLessThan(before);
      expect(healthOf(simulation, gem.id)).toEqual(gem.health);
      expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
      vi.restoreAllMocks();
      return simulation.hash();
    };

    expect(run()).toBe(run());
  });

  // DEC-292: "projectiles and abilities also apply", and a hit "by accident" strikes too. A held
  // attack (attack-aim) strikes the gem at its point as a click (attack-target) does, so core
  // needs no gem rule in attack-aim.
  it.each([
    ['warrior', -6, 'a held attack'],
    ['magus', -12, 'a held attack'],
    ['magus', -12, 'a click'],
    ['magus', -12, 'a stray shot aimed past it'],
  ] as const)('strikes a %s that hits it from %d m with %s', (kind, dx, how) => {
    const { simulation, config, feature, gem } = match();
    const hitterId = legendBeside(simulation, feature.position, dx, kind);
    const statuses: GameEventMap['status-applied'][] = [];
    simulation.on('status-applied', (event) => statuses.push(event));
    const past = how === 'a stray shot aimed past it' ? 20 : 0;
    simulation.enqueueCommand(
      how === 'a click'
        ? { type: 'attack-target', actorId: hitterId, targetId: gem.id }
        : {
            type: 'attack-aim',
            actorId: hitterId,
            aim: { x: feature.position.x + past, y: feature.position.y },
          },
    );

    steps(simulation, 3 * config.tickRate);

    expect(statuses).toContainEqual({ entityId: hitterId, statusId: 'gem-shock', sourceId: null });
    expect(healthOf(simulation, gem.id)).toEqual(gem.health);
  });

  it('stops a unit walking into it at its edge and never strikes it (DEC-346)', () => {
    const { simulation, config, feature, gem } = match();
    const warriorId = legendBeside(simulation, feature.position, -15);
    const statuses: GameEventMap['status-applied'][] = [];
    simulation.on('status-applied', (event) => statuses.push(event));
    simulation.enqueueCommand({ type: 'move', actorId: warriorId, direction: { x: 1, y: 0 } });

    steps(simulation, 3 * config.tickRate);

    const warrior = simulation.snapshot().entities.find(({ id }) => id === warriorId);
    const x = warrior?.transform?.x ?? Number.NaN;
    const reach = (gem.transform?.radius ?? 0) + (warrior?.transform?.radius ?? 0);
    expect(x).toBeLessThan(feature.position.x - (gem.transform?.radius ?? 0));
    expect(x).toBeGreaterThan(feature.position.x - reach - 1);
    expect(statuses.filter(({ statusId }) => statusId.startsWith('gem-'))).toEqual([]);
    expect(simulation.snapshot().entities.find(({ id }) => id === gem.id)?.gem?.ticksSinceHit).toBe(
      null,
    );
  });

  it('does nothing in a Duel, where the world round the arena is off (DEC-36)', () => {
    const { simulation, config, feature, gem } = match([], { killTarget: 10 });
    const statuses: GameEventMap['status-applied'][] = [];
    simulation.on('status-applied', (event) => statuses.push(event));
    const warriorId = legendBeside(simulation, feature.position, -6);
    simulation.enqueueCommand({ type: 'attack-target', actorId: warriorId, targetId: gem.id });

    steps(simulation, 2 * config.tickRate);

    expect(statuses.filter(({ statusId }) => statusId.startsWith('gem-'))).toEqual([]);
  });

  // Minions only: no bot Legend can be placed at the centre until `dev-set-controller` is
  // supported, so the match has none. Bots perceive through the same unit-only index.
  it('is never targeted by enemy minions fighting on it', () => {
    const setTarget = vi.spyOn(EntityStore.prototype, 'setAttackTarget');
    const { simulation, config, feature, gem } = match([]);
    for (const team of ['light', 'dark'] as const) {
      simulation.enqueueCommand({
        type: 'dev-spawn-mobs',
        team,
        definitionId: 'light-minion',
        count: 4,
        origin: { kind: 'point', at: feature.position },
      });
    }

    steps(simulation, 3 * config.tickRate);

    // The two hordes met on the gem and fought, so targets were chosen next to it.
    expect(setTarget.mock.calls.length).toBeGreaterThan(0);
    expect(setTarget.mock.calls.filter(([, targetId]) => targetId === gem.id)).toEqual([]);
  });
});
