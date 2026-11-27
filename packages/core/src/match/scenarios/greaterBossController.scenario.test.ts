import { beforeAll, describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { GREATER_BOSS_PROFILE } from '../../content/ai/bosses/greaterBoss';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
import { GUARD_LEASH } from '../../content/structures/guardLeash';
import type { Simulation } from '../../Simulation';
import type { Vec2 } from '../../utils/geometry.types';
import { TickRate } from '../../utils/TickRate';
import {
  BOSS,
  match,
  positionOf,
  spawnWarrior,
  stateOf,
  stepTo,
  theBoss,
  toughen,
} from './__fixtures__/greaterBossMatch';

const PROFILE = GREATER_BOSS_PROFILE;
const [SLAM, SWEEP, , BEAM] = PROFILE.moves;
/** The moves the boss may use only once it is hurt (DEC-417). */
const HURT_MOVES: readonly string[] = PROFILE.hurtPhase.moveIds;
/** The moves of the brain's crowd branch (DEC-371 E7). */
const CROWD_MOVES: readonly string[] = PROFILE.brain.crowd.moveIds;
/** Each move of the profile by id, for checking a landing against its own numbers. */
const MOVES = new Map<string, (typeof PROFILE.moves)[number]>(
  PROFILE.moves.map((move) => [move.id, move]),
);
/** The move `id` of the profile; throws on an unknown id. */
const moveOf = (id: string | undefined): (typeof PROFILE.moves)[number] => {
  const move = MOVES.get(id ?? '');
  if (move === undefined) throw new Error(`No move ${String(id)}`);
  return move;
};
const ZONE = GUARD_LEASH.greaterBossZone;
/** Seconds to ticks at the tick rate the matches run with. */
const ticks = (seconds: number): number =>
  new TickRate(createDefaultGameConfig().tickRate).toTicks(seconds);
/** How long each recorded run follows the boss after it spawns. */
const RUN_SECONDS = 20;

/** What one run saw, tick by tick, from the boss's spawn on. */
type Recording = {
  readonly bossId: string;
  readonly spawnTick: number;
  readonly entrances: number[];
  readonly telegraphs: number[];
  /** At each telegraph: how many Warriors stood within the brain's crowd radius of the boss. */
  readonly crowds: number[];
  readonly landings: number[];
  /** The move of each landing, in the same order. */
  readonly landed: string[];
  /** The boss's FSM state after each tick, from the spawn tick on. */
  readonly states: { readonly tick: number; readonly fsm: string }[];
  /** The boss's distance from the zone's centre after each tick. */
  readonly fromCentre: number[];
  /** The boss's position after each tick. */
  readonly path: Vec2[];
  /** Every roam point the controller picked (its memory), measured from the zone's centre. */
  readonly roamGaps: number[];
  /** Every hit the boss dealt: tick, target, amount. */
  readonly hits: { readonly tick: number; readonly targetId: string; readonly amount: number }[];
  /** Every phase change of the boss: tick, new phase, and its health share at that moment. */
  readonly phaseChanges: {
    readonly tick: number;
    readonly to: string;
    readonly healthShare: number;
  }[];
  readonly hash: number;
};

/**
 * Runs the 20 s plan to the boss's spawn and `RUN_SECONDS` past it. `each` runs after every step
 * from the spawn on (to move Legends about); `isQuiet` removes every non-neutral unit that walks
 * into the zone, so the boss has no target.
 */
const record = (
  setUp: (simulation: Simulation, centre: Vec2) => void,
  {
    isQuiet = false,
    each = () => undefined,
    seed = 1,
  }: {
    readonly isQuiet?: boolean;
    readonly each?: (simulation: Simulation, bossId: string) => void;
    readonly seed?: number;
  } = {},
): Recording => {
  const { simulation, spawnTick, feature } = match(20, seed);
  const centre = feature.position;
  const entrances: number[] = [];
  const telegraphs: number[] = [];
  const crowds: number[] = [];
  const landings: number[] = [];
  const landed: string[] = [];
  const hits: Recording['hits'] = [];
  const phaseChanges: Recording['phaseChanges'] = [];
  simulation.on('boss-entrance', () => entrances.push(simulation.tick));
  simulation.on('boss-telegraph', ({ bossId: boss }) => {
    telegraphs.push(simulation.tick);
    const warriors = simulation.snapshot().entities.filter(({ kind }) => kind === 'warrior');
    crowds.push(
      warriors.filter(({ id }) => gapBetween(simulation, boss, id) <= PROFILE.brain.crowdRadius)
        .length,
    );
  });
  simulation.on('boss-move-executed', ({ move }) => {
    landings.push(simulation.tick);
    landed.push(move);
  });
  stepTo(simulation, spawnTick + 1);
  const bossId = theBoss(simulation).id;
  simulation.on('damage-applied', ({ targetId, amount, source }) => {
    if (source.attackerId === bossId) hits.push({ tick: simulation.tick, targetId, amount });
  });
  simulation.on('boss-phase-changed', ({ to }) => {
    const healthShare = stateOf(simulation).entities.healthFractionOf(bossId) ?? NaN;
    phaseChanges.push({ tick: simulation.tick, to, healthShare });
  });
  const states: Recording['states'] = [];
  const fromCentre: number[] = [];
  const path: Vec2[] = [];
  const roamGaps: number[] = [];
  const look = (): void => {
    const at = positionOf(simulation, bossId);
    if (at === null) return;
    path.push(at);
    const memory = stateOf(simulation).ai.get(bossId)?.memory;
    if (typeof memory?.roamX === 'number' && typeof memory.roamY === 'number') {
      roamGaps.push(Math.hypot(memory.roamX - centre.x, memory.roamY - centre.y));
    }
    fromCentre.push(Math.hypot(at.x - centre.x, at.y - centre.y));
    const fsm = stateOf(simulation).ai.get(bossId)?.memory.fsm;
    states.push({ tick: simulation.tick, fsm: typeof fsm === 'string' ? fsm : 'none' });
  };
  look();
  setUp(simulation, centre);
  while (simulation.tick < spawnTick + 1 + ticks(RUN_SECONDS)) {
    if (isQuiet) {
      for (const unit of simulation.snapshot().entities) {
        const at = unit.transform;
        if (
          unit.team !== 'neutral' &&
          at != null &&
          Math.hypot(at.x - centre.x, at.y - centre.y) <= ZONE + 2
        ) {
          simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: unit.id });
        }
      }
    }
    simulation.step();
    each(simulation, bossId);
    look();
  }
  return {
    bossId,
    spawnTick,
    entrances,
    telegraphs,
    crowds,
    landings,
    landed,
    states,
    fromCentre,
    path,
    roamGaps,
    hits,
    phaseChanges,
    hash: simulation.hash(),
  };
};

/** Where the Warriors of a fight stand around the boss: west, north, south. */
const AROUND: readonly Vec2[] = [
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/**
 * A fight: `count` Light Warriors (at most three) inside the slam's reach of the boss, replaced as
 * they die, so it keeps striking. None of them hurts the boss; `isHurt` puts the boss in its hurt
 * phase through the developer command (DEC-417) as the Warriors arrive.
 */
const fight = (seed = 1, count = 2, isHurt = false): Recording => {
  const gap = SLAM.radius - 0.5;
  const spot = (centre: Vec2): Vec2 => ({ x: centre.x - gap, y: centre.y });
  let centreSeen: Vec2 = { x: 0, y: 0 };
  return record(
    (simulation, centre) => {
      centreSeen = centre;
      for (const { x, y } of AROUND.slice(0, count)) {
        spawnWarrior(simulation, { x: centre.x + x * gap, y: centre.y + y * gap });
      }
      if (isHurt) {
        const entityId = theBoss(simulation).id;
        simulation.enqueueCommand({ type: 'dev-set-boss-phase', entityId, phase: 'hurt' });
      }
    },
    {
      seed,
      each: (simulation) => {
        const alive = simulation.snapshot().entities.filter(({ kind }) => kind === 'warrior');
        if (alive.length < count) {
          simulation.enqueueCommand({
            type: 'dev-spawn',
            kind: 'warrior',
            definitionId: 'warrior',
            team: 'light',
            at: spot(centreSeen),
            count: 1,
          });
        }
      },
    },
  );
};

/** How much each of the punisher's scripted hits deals: half the boss's health in about 11 s. */
const PUNISH_HIT = 60;
/**
 * Punish: Warrior A stands inside the slam's reach and hits the boss every tick (a scripted hit
 * through the damage pipeline); Warrior B stands nearer, a quarter turn off A's line. Neither dies.
 */
const punish = () => {
  let attackerId = '';
  let nearerId = '';
  /** Each Warrior's distance from the boss when it telegraphs its first move. */
  let firstGaps = { attacker: NaN, nearer: NaN };
  const run = record(
    (simulation, centre) => {
      attackerId = spawnWarrior(simulation, { x: centre.x - (SLAM.radius - 0.5), y: centre.y });
      nearerId = spawnWarrior(simulation, { x: centre.x, y: centre.y + 3.1 });
      toughen(simulation, attackerId);
      toughen(simulation, nearerId);
      const bossId = theBoss(simulation).id;
      simulation.on('boss-telegraph', () => {
        if (!Number.isNaN(firstGaps.attacker)) return;
        firstGaps = {
          attacker: gapBetween(simulation, bossId, attackerId),
          nearer: gapBetween(simulation, bossId, nearerId),
        };
      });
    },
    {
      each: (simulation, bossId) => {
        new DamagePipeline().apply(stateOf(simulation), bossId, PUNISH_HIT, {
          attackerId,
          kind: 'weapon',
          definitionId: 'raptor-talons',
        });
      },
    },
  );
  return { ...run, attackerId, nearerId, firstGaps };
};

/** A Legend out of melee range: one Light Warrior 12 m from the boss, inside the zone. */
const outOfMelee = () => {
  let legendId = '';
  const run = record((simulation, centre) => {
    legendId = spawnWarrior(simulation, { x: centre.x - 12, y: centre.y });
  });
  return { ...run, legendId };
};

/** The distance between two entities; `NaN` when either is gone. */
const gapBetween = (simulation: Simulation, from: string, to: string): number => {
  const [a, b] = [positionOf(simulation, from), positionOf(simulation, to)];
  return a === null || b === null ? NaN : Math.hypot(b.x - a.x, b.y - a.y);
};

/** Every unit that a landing of one of `moves` struck, each once. */
const struckBy = (run: Recording, moves: readonly string[]): Set<string> => {
  const ticks = run.landings.filter((_, at) => moves.includes(run.landed[at] ?? ''));
  return new Set(
    run.hits.filter(({ tick }) => ticks.includes(tick)).map(({ targetId }) => targetId),
  );
};

/** The FSM states in order, each run of one state once. */
const transitions = (states: Recording['states']): string[] =>
  states.map(({ fsm }) => fsm).filter((fsm, at, all) => at === 0 || all[at - 1] !== fsm);

const ALLOWED_NEXT: Readonly<Record<string, string>> = {
  none: 'entrance',
  entrance: 'roam',
  roam: 'telegraph',
  telegraph: 'execute',
  execute: 'recover',
  recover: 'roam',
};

describe('the Greater Boss on BossController: roam and slam (scenario, 11 §4.6)', () => {
  let quiet: Recording;
  let fought: Recording;
  /** Three Warriors around a hurt boss: the wide sweep opens only once it is hurt (DEC-417). */
  let hurtCrowd: Recording;

  beforeAll(() => {
    quiet = record(() => undefined, { isQuiet: true });
    fought = fight();
    hurtCrowd = fight(1, 3, true);
  }, 240_000);

  it('roams when it has no target: never idle longer than one roam cadence, and never attacks', () => {
    const roaming = quiet.states.filter(({ fsm }) => fsm === 'roam').length;
    let still = 0;
    let longestStill = 0;
    quiet.path.forEach((at, index) => {
      const before = quiet.path[index - 1];
      const isRoaming = quiet.states[index]?.fsm === 'roam';
      still = isRoaming && before?.x === at.x && before.y === at.y ? still + 1 : 0;
      longestStill = Math.max(longestStill, still);
    });

    expect(roaming).toBeGreaterThan(ticks(RUN_SECONDS) / 2);
    expect(longestStill).toBeLessThanOrEqual(ticks(PROFILE.roamSeconds));
    expect(quiet.telegraphs).toEqual([]);
    expect(quiet.landings).toEqual([]);
    expect(quiet.hits).toEqual([]);
    // It walks somewhere: more than a roam arrival from where it spawned.
    const [start] = quiet.path;
    const reach = Math.max(
      ...quiet.path.map((at) => Math.hypot(at.x - (start?.x ?? 0), at.y - (start?.y ?? 0))),
    );
    expect(reach).toBeGreaterThan(PROFILE.roamArrivalRadius);
  });

  it('goes roam → telegraph → execute → recover → roam, in that order only', () => {
    const order = transitions(fought.states);

    expect(order.filter((fsm) => fsm === 'execute').length).toBeGreaterThan(1);
    order.slice(1).forEach((fsm, at) => {
      const from = order[at] ?? 'none';
      expect({ from, to: fsm }).toEqual({ from, to: ALLOWED_NEXT[from] });
    });
  });

  it('telegraphs every move exactly its telegraphSeconds before it lands', () => {
    expect(fought.landings.length).toBeGreaterThan(1);
    expect(fought.telegraphs.length - fought.landings.length).toBeLessThanOrEqual(1);
    fought.landings.forEach((landing, at) => {
      const move = moveOf(fought.landed[at]);
      expect(landing - (fought.telegraphs[at] ?? NaN)).toBe(ticks(move.telegraphSeconds));
    });
  });

  it('warns half a second before each sweep lands (DEC-371 E9)', () => {
    const sweeps = [fought, hurtCrowd]
      .flatMap((run) =>
        run.landings.map((landing, at) => ({
          id: run.landed[at],
          warning: landing - (run.telegraphs[at] ?? NaN),
        })),
      )
      .filter(({ id }) => id === 'greater-boss-sweep' || id === 'greater-boss-wide-sweep');

    expect(new Set(sweeps.map(({ id }) => id))).toEqual(
      new Set(['greater-boss-sweep', 'greater-boss-wide-sweep']),
    );
    for (const { warning } of sweeps) expect(warning).toBe(ticks(0.5));
  });

  it("hits for the landed move's damage, only on landing ticks", () => {
    const struck = new Set<string>();
    expect(fought.hits.length).toBeGreaterThan(0);
    for (const { tick, targetId, amount } of fought.hits) {
      const move = moveOf(fought.landed[fought.landings.indexOf(tick)]);
      const damage = 'damage' in move ? move.damage : 0;
      // A target's first hit takes the full damage; a later one may only take what is left.
      expect({ isFirst: !struck.has(targetId), amount }).toEqual({
        isFirst: !struck.has(targetId),
        amount: struck.has(targetId) ? Math.min(amount, damage) : damage,
      });
      struck.add(targetId);
    }
  });

  it('starts no move and takes no step while it recovers', () => {
    fought.landings.forEach((landing, index) => {
      const { recoverSeconds } = moveOf(fought.landed[index]);
      const recoverEnd = landing + ticks(recoverSeconds);
      // A landing whose recovery runs past the end of the recording cannot be checked whole.
      if (recoverEnd > (fought.states.at(-1)?.tick ?? 0)) return;
      const recovering = fought.states.filter(({ tick }) => tick >= landing && tick < recoverEnd);

      expect(fought.telegraphs.filter((tick) => tick > landing && tick < recoverEnd)).toEqual([]);
      expect(recovering).toHaveLength(ticks(recoverSeconds));
      // Still standing from the telegraph: it neither roams nor starts the next move.
      expect(recovering.filter(({ fsm }) => fsm === 'roam' || fsm === 'none')).toEqual([]);
      // It stands: a Warrior spawning against it may nudge it, but it walks nowhere.
      const at = fought.states.findIndex(({ tick }) => tick === landing);
      // Two entries on: entry `at` is labelled with the landing tick but recorded before it, and a
      // charge's dash is the step after the landing, not a walk.
      const window = fought.path.slice(at + 2, at + ticks(recoverSeconds));
      const drift = Math.max(
        ...window.map((point) =>
          Math.hypot(point.x - (window[0]?.x ?? 0), point.y - (window[0]?.y ?? 0)),
        ),
      );
      expect(drift).toBeLessThan(0.1);
    });
  });

  it("respects each move's cooldown between two of its landings", () => {
    const last = new Map<string, number>();
    fought.landings.forEach((landing, at) => {
      const move = moveOf(fought.landed[at]);
      expect(landing - (last.get(move.id) ?? -Infinity)).toBeGreaterThanOrEqual(
        ticks(move.cooldownSeconds),
      );
      last.set(move.id, landing);
    });
  });

  it('lands no wide sweep and no charge while it is healthy (DEC-417)', () => {
    expect(fought.phaseChanges).toEqual([]);
    expect(fought.landed.length).toBeGreaterThan(1);
    expect(fought.landed.filter((move) => HURT_MOVES.includes(move))).toEqual([]);
  });

  it('never leaves the zone, roaming or fighting', () => {
    // Every roam point lies inside the zone, the margin in from its edge (11 §4.6).
    expect(quiet.roamGaps.length).toBeGreaterThan(0);
    expect(Math.max(...quiet.roamGaps)).toBeLessThanOrEqual(ZONE - PROFILE.zoneMargin);
    expect(Math.max(...quiet.fromCentre)).toBeLessThanOrEqual(ZONE);
    expect(Math.max(...fought.fromCentre)).toBeLessThanOrEqual(ZONE);
  });

  it('gives the same hash for the same seed', () => {
    expect(fight().hash).toBe(fought.hash);
  }, 120_000);
});

describe('the Greater Boss slam lands where the boss stands (scenario)', () => {
  it('spares a Legend that leaves the area during the telegraph', () => {
    let warriorId = '';
    let hasLeft = false;
    const run = record(
      (simulation, centre) => {
        warriorId = spawnWarrior(simulation, { x: centre.x - (SLAM.radius - 0.5), y: centre.y });
        simulation.on('boss-telegraph', () => {
          if (hasLeft) return;
          hasLeft = true;
          simulation.enqueueCommand({
            type: 'move',
            actorId: warriorId,
            direction: { x: -1, y: 0 },
          });
        });
      },
      {
        each: (simulation, bossId) => {
          const boss = positionOf(simulation, bossId);
          const warrior = positionOf(simulation, warriorId);
          // Out of the slam's reach for good: stop well inside the zone, then stand.
          if (
            hasLeft &&
            boss !== null &&
            warrior !== null &&
            Math.hypot(warrior.x - boss.x, warrior.y - boss.y) > SLAM.radius + 2
          ) {
            simulation.enqueueCommand({ type: 'stop', actorId: warriorId });
          }
        },
      },
    );
    const firstLanding = run.landings[0];

    expect(firstLanding).toBeDefined();
    expect(run.hits.filter(({ tick }) => tick === firstLanding)).toEqual([]);
  }, 120_000);

  it('ignores a Legend that drew a move at its edge once it stands past it, and stays in', () => {
    let warriorId = '';
    let hasRun = false;
    let outsideTick = Infinity;
    let centreSeen: Vec2 = { x: 0, y: 0 };
    const run = record(
      (simulation, centre) => {
        centreSeen = centre;
        warriorId = spawnWarrior(simulation, { x: centre.x - (ZONE - 2), y: centre.y });
        // It outlives the boss's hits, so it stays where a boss that saw past its zone could
        // reach it.
        toughen(simulation, warriorId);
        // The boss's beam reaches the zone's edge from where it stands (DEC-371 E7), so its first
        // move needs no walk: the Legend runs out of the zone at that first telegraph.
        simulation.on('boss-telegraph', () => {
          if (hasRun) return;
          hasRun = true;
          simulation.enqueueCommand({
            type: 'move',
            actorId: warriorId,
            direction: { x: -1, y: 0 },
          });
        });
      },
      {
        // Then it stands just past the edge, inside the beam's reach of a boss near the centre.
        each: (simulation) => {
          const at = positionOf(simulation, warriorId);
          if (outsideTick !== Infinity || at === null) return;
          if (Math.hypot(at.x - centreSeen.x, at.y - centreSeen.y) > ZONE + 2) {
            outsideTick = simulation.tick;
            simulation.enqueueCommand({ type: 'stop', actorId: warriorId });
          }
        },
      },
    );

    expect(hasRun).toBe(true);
    expect(outsideTick).toBeLessThan(Infinity);
    // No move at the Legend past the edge: only units inside the zone are targets.
    expect(run.telegraphs.filter((tick) => tick > outsideTick)).toEqual([]);
    // It roamed far once the Legend had gone, but never past the zone's edge.
    expect(Math.max(...run.fromCentre)).toBeGreaterThan(ZONE / 2);
    expect(Math.max(...run.fromCentre)).toBeLessThanOrEqual(ZONE);
  }, 120_000);

  it('leaves every other mob on its own controller (no MiniBoss on this branch yet)', () => {
    const onBoss = MOB_DEFINITIONS.all()
      .filter((definition) => 'controller' in definition && definition.controller === 'boss')
      .map(({ id }) => id);

    expect(onBoss).toEqual([BOSS.id]);
  });
});

describe('the Greater Boss entrance roar (scenario, reference 04)', () => {
  let run: Recording;

  beforeAll(() => {
    run = fight(2);
  }, 120_000);

  it('emits boss-entrance exactly once, on the spawn tick', () => {
    expect(run.entrances).toEqual([run.spawnTick]);
  });

  it('has no gameplay effect: no hit and no step during the roar', () => {
    const roarEnd = run.spawnTick + ticks(PROFILE.entranceSeconds);
    const [start] = run.path;

    expect(run.hits.filter(({ tick }) => tick < roarEnd)).toEqual([]);
    const duringRoar = run.path.filter(
      (_, index) => (run.states[index]?.tick ?? Infinity) < roarEnd,
    );
    expect(duringRoar.length).toBeGreaterThan(0);
    expect(duringRoar.every((at) => at.x === start?.x && at.y === start.y)).toBe(true);
  });

  it('starts the roam loop only once the roar is over', () => {
    const roarEnd = run.spawnTick + ticks(PROFILE.entranceSeconds);
    const firstRoam = run.states.find(({ fsm }) => fsm === 'roam')?.tick;

    expect(transitions(run.states).slice(0, 3)).toEqual(['none', 'entrance', 'roam']);
    expect(firstRoam).toBeGreaterThanOrEqual(roarEnd);
    expect(run.telegraphs.every((tick) => tick > roarEnd)).toBe(true);
  });

  it('gives the same hash for the same seed', () => {
    expect(fight(2).hash).toBe(run.hash);
  }, 120_000);
});

describe('the Greater Boss brain picks its move for the situation (scenario, DEC-371 E7, DEC-417)', () => {
  let crowded: Recording;
  let outOfMeleeRun: ReturnType<typeof outOfMelee>;
  let punished: ReturnType<typeof punish>;

  beforeAll(() => {
    crowded = fight(1, 3);
    outOfMeleeRun = outOfMelee();
    punished = punish();
  }, 240_000);

  it('sweeps a crowd in melee, and never beams it while the crowd stands', () => {
    // The knockbacks push the Warriors out of reach later in the run; a beam at them then is the
    // far branch (DEC-371 E7), so only the moves picked amid the crowd count here.
    const amidCrowd = crowded.landed.filter(
      (_, at) => (crowded.crowds[at] ?? 0) >= PROFILE.brain.crowdCount,
    );

    expect(amidCrowd).toContain(SWEEP.id);
    expect(amidCrowd).not.toContain(BEAM.id);
    expect(amidCrowd.filter((id) => !CROWD_MOVES.includes(id))).toEqual([]);
  });

  it('opens on a Legend out of melee range with the beam, aimed at it', () => {
    expect(outOfMeleeRun.landed[0]).toBe(BEAM.id);
    expect(struckBy(outOfMeleeRun, [BEAM.id])).toEqual(new Set([outOfMeleeRun.legendId]));
  });

  it('beams the top damage dealer, never the unit that stands nearer', () => {
    expect(punished.firstGaps.nearer).toBeLessThan(punished.firstGaps.attacker);
    expect(punished.landed).toContain(BEAM.id);
    expect(struckBy(punished, [BEAM.id])).toEqual(new Set([punished.attackerId]));
  });

  it('turns hurt once, on its first tick below half health, and only then lands a hurt move', () => {
    const [change, ...more] = punished.phaseChanges;
    const hurtLandings = punished.landings.filter((_, at) =>
      HURT_MOVES.includes(punished.landed[at] ?? ''),
    );

    expect(more).toEqual([]);
    expect(change?.to).toBe('hurt');
    expect(change?.healthShare).toBeLessThan(PROFILE.hurtPhase.healthShare);
    // One scripted hit lands between two ticks: the phase turns before the next one.
    expect(change?.healthShare).toBeGreaterThanOrEqual(
      PROFILE.hurtPhase.healthShare - PUNISH_HIT / BOSS.baseHealth,
    );
    expect(hurtLandings.length).toBeGreaterThan(0);
    expect(Math.min(...hurtLandings)).toBeGreaterThan(change?.tick ?? Infinity);
  });

  it('gives the same hash for the same seed', () => {
    expect(punish().hash).toBe(punished.hash);
  }, 120_000);
});
