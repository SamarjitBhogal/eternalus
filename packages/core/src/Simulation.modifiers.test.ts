import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { LIGHT_MINION } from './content/mobs/lightMinion';
import { ENRAGING_STRUCTURES, MINION_STRENGTH } from './content/mobs/minionModifiers';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { PlayableTeam, Team } from './teams/teams.types';

type LaneEvent = {
  readonly tick: number;
  readonly team: Team;
  readonly lane: string;
  readonly memberIds: readonly string[];
};

/**
 * A plain match on the two-lane map, recording each `enraged` stack applied, each lane structure
 * lost (with its team's horde members on the lane at that moment) and each horde spawned.
 */
const siege = () => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig(),
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
  });
  const enraged: { readonly tick: number; readonly entityId: string }[] = [];
  simulation.on('status-applied', ({ entityId, statusId }) => {
    if (statusId === 'enraged') {
      enraged.push({ tick: simulation.tick, entityId });
    }
  });
  const losses: (LaneEvent & { readonly kind: string; readonly team: PlayableTeam })[] = [];
  simulation.on('structure-destroyed', ({ kind, team, lane }) => {
    if (lane !== null && (team === 'light' || team === 'dark')) {
      // StructureSystem runs before EnragedSystem: these are the members it enrages this tick.
      const memberIds = simulation
        .snapshot()
        .hordes.filter((horde) => horde.team === team && horde.lane === lane)
        .flatMap((horde) => horde.memberIds);
      losses.push({ tick: simulation.tick, kind, team, lane, memberIds });
    }
  });
  const spawned: LaneEvent[] = [];
  simulation.on('horde-spawned', ({ team, lane, memberIds }) => {
    spawned.push({ tick: simulation.tick, team, lane, memberIds });
  });
  const stepUntil = (isDone: () => boolean, seconds: number) => {
    while (!isDone() && simulation.tick < seconds * 30) {
      simulation.step();
    }
  };
  const stacksAt = (tick: number, entityId: string) =>
    enraged.filter((stack) => stack.tick === tick && stack.entityId === entityId).length;
  const enragedAt = (tick: number) =>
    enraged.filter((stack) => stack.tick === tick).map(({ entityId }) => entityId);
  return { simulation, logger, losses, spawned, stepUntil, stacksAt, enragedAt };
};

/**
 * A match whose light opening hordes form up at their own end of the lanes, with a dark Warrior
 * waiting there for them, so every light minion hit lands close to home.
 */
const ambush = () => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 600 } }),
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
  });
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'dark',
    at: { x: 18, y: 24 },
    count: 1,
  });
  const minionHits: number[] = [];
  simulation.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
    // The killing blow is cut to the target's last health, so it says nothing about strength.
    const isKillingBlow = () =>
      simulation.snapshot().entities.find(({ id }) => id === targetId)?.health?.current === 0;
    if (source.definitionId === LIGHT_MINION.id && !isKillingBlow()) {
      minionHits.push(amount + absorbed);
    }
  });
  return { simulation, logger, minionHits };
};

describe('Simulation with the minion modifiers (minion plan M5a)', () => {
  it('lets minions near home hit harder than base, through the damage pipeline', () => {
    const { simulation, logger, minionHits } = ambush();

    for (let tick = 0; tick < 300; tick += 1) {
      simulation.step();
    }

    expect(minionHits.length).toBeGreaterThan(0);
    const base = LIGHT_MINION.attack.damage;
    expect(minionHits.every((hit) => hit > base && hit <= base * MINION_STRENGTH.max)).toBe(true);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('enrages the lane of a tower lost in play, and the next horde there (MS-16, DISC-24)', () => {
    const { simulation, logger, losses, spawned, stepUntil, stacksAt, enragedAt } = siege();

    stepUntil(() => losses.length > 0, 300);
    const [loss] = losses;
    if (loss === undefined) {
      throw new Error('no lane structure fell in the first 300 s');
    }
    expect(ENRAGING_STRUCTURES).toContain(loss.kind);
    expect(loss.memberIds.length).toBeGreaterThan(0);
    // One stack for each of the team's minions on that lane, and for no one else.
    expect([...enragedAt(loss.tick)].sort()).toEqual([...loss.memberIds].sort());
    // The count MinionStrengthStep reads to move DISC-24's point for the enemy's hordes there.
    expect(simulation.snapshot().teams[loss.team].towersLostByLane).toEqual({ [loss.lane]: 1 });

    const isNext = ({ tick, team, lane }: LaneEvent) =>
      tick > loss.tick && team === loss.team && lane === loss.lane;
    stepUntil(() => spawned.some(isNext), 400);
    const next = spawned.find(isNext);
    if (next === undefined) {
      throw new Error(`no ${loss.team} horde spawned on ${loss.lane} after the loss`);
    }
    const lost = simulation.snapshot().teams[loss.team].towersLostByLane[loss.lane] ?? 0;
    expect(next.memberIds.map((id) => stacksAt(next.tick, id))).toEqual(
      next.memberIds.map(() => lost),
    );
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('gives the same hash for the same seed with the modifiers live', () => {
    const hashes = [1, 2].map(() => {
      const { simulation } = ambush();
      for (let tick = 0; tick < 300; tick += 1) {
        simulation.step();
      }
      return simulation.hash();
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
