import { describe, expect, it } from 'vitest';

import { Abilities } from '../components/Abilities';
import type { CastInProgress } from '../components/Abilities.types';
import { Aether } from '../components/Aether';
import { Capturable } from '../components/Capturable';
import { CathedralGemState } from '../components/CathedralGemState';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Loadout } from '../components/Loadout';
import { Movement } from '../components/Movement';
import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { CombatClock } from '../components/CombatClock';
import { LastEnemyHit } from '../components/LastEnemyHit';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { INITIAL_FACING } from '../components/Transform.constants';
import { Veterancy } from '../components/Veterancy';
import { Vision } from '../components/Vision';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { CAPTURE_POINT } from '../content/zones/capturePoint';
import { Entity } from '../entities/Entity';
import { CapturePoint } from '../entities/zones/CapturePoint';
import { SeededRandom } from '../utils/SeededRandom';
import { fnv1a } from '../utils/fnv1a';
import { GameState } from './GameState';
import type { Horde } from './Horde.types';
import type { MatchState } from './MatchState.types';
import { StateHasher } from './StateHasher';

class Soldier extends Entity {
  public readonly kind = 'soldier';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 3, y: 4 }, 0.5));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership('light'));
    this.addComponent(new Movement({ maxSpeed: 2, acceleration: 0.5, mass: 1 }));
  }
}

class Champion extends Entity {
  public readonly kind = 'champion';
  public readonly family = 'legend';

  public constructor(
    id: string,
    private readonly team: 'light' | 'dark',
  ) {
    super(id, 'champion-definition');
  }

  protected installComponents(): void {
    this.addComponent(new TeamMembership(this.team));
  }
}

/** The attack both of a scout's test weapons carry; the hash reads which one is in hand, not its numbers. */
const SCOUT_ATTACK = { strategy: 'melee', damage: 1, reach: 1, interval: 1 } as const;

class Scout extends Entity {
  public readonly kind = 'scout';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Health(100));
    this.addComponent(new Movement({ maxSpeed: 2, acceleration: 0.5, mass: 1 }));
    this.addComponent(new Collider({ kind: 'circle', radius: 0.5 }, 'unit'));
    this.addComponent(new Vision(10));
    this.addComponent(new Aether(50));
    this.addComponent(new Progression('test'));
    this.addComponent(
      new Loadout(
        { weaponId: 'test-talons', attacks: { basic: SCOUT_ATTACK } },
        { weaponId: 'test-bow', attacks: { basic: SCOUT_ATTACK } },
      ),
    );
  }
}

/** A unit with momentum (as the Sentinel's Wrecking Run, DEC-307), which keeps the walls it touched. */
class Runner extends Entity {
  public readonly kind = 'runner';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 3, y: 4 }, 0.5));
    this.addComponent(
      new Movement({
        maxSpeed: 2,
        acceleration: 0.5,
        mass: 1,
        momentum: { walkSpeed: 1, rampDuration: 10, grip: 0.5 },
      }),
    );
  }
}

class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // No components: every component field hashes as null.
  }
}

/** The attack a test shot carries; the hash reads its impact kind, not its numbers. */
const SHOT_ATTACK = {
  strategy: 'ranged-projectile',
  damage: 1,
  reach: 1,
  interval: 1,
  projectile: { projectileId: 'magus-bolt', falloff: null },
} as const;

const stateWithSoldier = (seed = 1): { state: GameState; soldier: Soldier } => {
  const state = new GameState(createDefaultGameConfig(), seed);
  const soldier = new Soldier('entity-1', 'soldier-definition');
  soldier.spawn({});
  state.entities.add(soldier);
  return { state, soldier };
};

describe('StateHasher', () => {
  const hasher = new StateHasher();

  it('hashes equal states equal', () => {
    expect(hasher.hash(stateWithSoldier().state)).toBe(hasher.hash(stateWithSoldier().state));
  });

  it('is a pure read: hashing twice gives the same value', () => {
    const { state } = stateWithSoldier();
    expect(hasher.hash(state)).toBe(hasher.hash(state));
  });

  it.each<[string, (state: GameState, soldier: Soldier) => void]>([
    [
      'the tick',
      (state) => {
        state.advanceTick();
      },
    ],
    ['the RNG state', (state) => state.rng.nextFloat()],
    [
      'a position by one ulp',
      (_, soldier) => {
        soldier.getComponent(Transform).moveBy({ x: 4e-16, y: 0 });
      },
    ],
    ['health', (_, soldier) => soldier.getComponent(Health).applyDamage(1)],
    ['a team', (_, soldier) => soldier.getComponent(TeamMembership).setTeam('dark')],
    [
      'a velocity the client never sees',
      (_, soldier) => {
        soldier.getComponent(Movement).accelerateToward({ x: 1, y: 0 });
      },
    ],
    ['an entity removal', (state) => state.entities.remove('entity-1', 'died')],
  ])('changes when %s changes', (_, change) => {
    const { state, soldier } = stateWithSoldier();
    const before = hasher.hash(state);
    change(state, soldier);
    expect(hasher.hash(state)).not.toBe(before);
  });

  it('changes when a collider turns unbreakable', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const wall = new Soldier('entity-1', 'soldier');
    wall.spawn({});
    const collider = new Collider({ kind: 'circle', radius: 1 }, 'structure', true);
    wall.addComponent(collider);
    state.entities.add(wall);
    const before = hasher.hash(state);

    collider.setUnbreakable(true);

    expect(hasher.hash(state)).not.toBe(before);
  });

  it('hashes an ability bar only once a slot leaves its initial state, then each slot field', () => {
    const { state, soldier } = stateWithSoldier();
    const before = hasher.hash(state);
    const bar = new Abilities({
      abilities: ['slam', 'rip-and-tear', 'shield-wall'],
      ultimate: 'berserk',
    });
    soldier.addComponent(bar);
    // A fresh bar (a match where nobody cast) hashes as before: the golden replays stay valid.
    expect(hasher.hash(state)).toBe(before);

    const hashes = new Set<number>([before]);
    bar.slot('ability-1')?.queue({ point: { x: 1, y: 1 }, targetId: null });
    hashes.add(hasher.hash(state));
    bar.slot('ability-1')?.takePending();
    bar.slot('ability-1')?.recordCast(0, 480);
    hashes.add(hasher.hash(state));
    const ultimate = bar.slot('ability-4');
    if (ultimate !== undefined) ultimate.charge = 0.5;
    hashes.add(hasher.hash(state));

    expect(hashes.size).toBe(4);
  });

  it('hashes the granted slot while it holds an ability, and the ability it holds', () => {
    const { state, soldier } = stateWithSoldier();
    const bar = new Abilities({
      abilities: ['slam', 'rip-and-tear', 'shield-wall'],
      ultimate: 'berserk',
    });
    soldier.addComponent(bar);
    const empty = hasher.hash(state);
    const granted = bar.slot('granted');

    granted?.hold('fury-dash');
    const furyDash = hasher.hash(state);
    granted?.hold('leap');
    const leap = hasher.hash(state);
    granted?.hold(null);

    expect(new Set([empty, furyDash, leap]).size).toBe(3);
    // Empty again, the bar hashes as one never granted anything: the golden replays stay valid.
    expect(hasher.hash(state)).toBe(empty);
  });

  it('hashes a passive only while it is due (05 §7, DEC-330)', () => {
    const kit = {
      abilities: ['slam', 'rip-and-tear', 'shield-wall'],
      ultimate: 'berserk',
    } as const;
    const { state: plain, soldier: none } = stateWithSoldier();
    none.addComponent(new Abilities(kit));
    const { state, soldier } = stateWithSoldier();
    const bar = new Abilities(kit, 'necromancy');
    soldier.addComponent(bar);
    const without = hasher.hash(plain);

    const due = hasher.hash(state);
    bar.takeDuePassive();
    const putOn = hasher.hash(state);
    bar.rearmPassive();

    expect(due).not.toBe(without);
    // Put on, the bar hashes as one with no passive: the golden replays stay valid.
    expect(putOn).toBe(without);
    expect(hasher.hash(state)).toBe(due);
  });

  it('hashes a cast in progress only while one waits, then each of its fields (05 §4)', () => {
    const { state, soldier } = stateWithSoldier();
    const bar = new Abilities({
      abilities: ['slam', 'rip-and-tear', 'shield-wall'],
      ultimate: 'berserk',
    });
    soldier.addComponent(bar);
    const before = hasher.hash(state);
    const cast: CastInProgress = {
      abilityId: 'fury-dash',
      slot: 'granted',
      aim: { point: { x: 4, y: 4 }, targetId: null },
      origin: { x: 3, y: 4 },
      casterLevel: 2,
      tick: 5,
      nextStep: 1,
    };
    /** The hash with one cast in progress: `cast` with `change` over it. */
    const hashWith = (change: Partial<CastInProgress> = {}): number => {
      bar.endCasts();
      bar.keepCast({ ...cast, ...change });
      return hasher.hash(state);
    };

    const hashes = [
      hashWith(),
      hashWith({ abilityId: 'blade-runner' }),
      hashWith({ slot: 'ability-1' }),
      hashWith({ aim: { point: { x: 5, y: 4 }, targetId: null } }),
      hashWith({ aim: { point: { x: 4, y: 5 }, targetId: null } }),
      hashWith({ aim: { point: { x: 4, y: 4 }, targetId: 'entity-9' } }),
      hashWith({ origin: { x: 2, y: 4 } }),
      hashWith({ origin: { x: 3, y: 5 } }),
      hashWith({ casterLevel: 3 }),
      hashWith({ tick: 6 }),
      hashWith({ nextStep: 2 }),
    ];
    bar.endCasts();

    expect(new Set([before, ...hashes]).size).toBe(12);
    // With none left, the bar hashes as one that never waited: the golden replays stay valid.
    expect(hasher.hash(state)).toBe(before);
  });

  it('hashes forced motion only while a push is under way, then each push field', () => {
    const { state, soldier } = stateWithSoldier();
    const before = hasher.hash(state);
    const movement = soldier.getComponent(Movement);

    movement.push({ x: 3, y: 0 }, 8);
    const pushed = hasher.hash(state);
    const { state: other, soldier: twin } = stateWithSoldier();
    twin.getComponent(Movement).push({ x: 0, y: 3 }, 8);
    const pushedElsewhere = hasher.hash(other);
    movement.takeForcedStep();
    const stepped = hasher.hash(state);
    for (let tick = 1; tick < 8; tick += 1) movement.takeForcedStep();

    expect(new Set([before, pushed, pushedElsewhere, stepped]).size).toBe(4);
    // Once the push ends, the entity hashes as one never pushed: the golden replays stay valid.
    expect(movement.isForced).toBe(false);
    expect(hasher.hash(state)).toBe(before);
  });

  it('changes when a minion counts a kill', () => {
    const { state, soldier } = stateWithSoldier();
    const veterancy = new Veterancy();
    soldier.addComponent(veterancy);
    const before = hasher.hash(state);

    veterancy.recordKill(2);

    expect(hasher.hash(state)).not.toBe(before);
  });

  it('changes with a shot owner, target, weapon and origin, which decide who it spares, what it may hit and how hard', () => {
    const payload = ({
      ownerId = 'a',
      targetId = 't',
      weaponId = 'magus-staff',
      originX = 1,
    }: {
      ownerId?: string;
      targetId?: string;
      weaponId?: string;
      originX?: number;
    }) =>
      new ProjectilePayload({
        ownerId,
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: ownerId, kind: 'weapon', definitionId: weaponId },
        targetId,
        impact: { kind: 'weapon', attack: SHOT_ATTACK },
        origin: { x: originX, y: 0 },
      });
    const hashWith = (shot: ProjectilePayload | null): number => {
      const { state, soldier } = stateWithSoldier();
      if (shot !== null) soldier.addComponent(shot);
      return hasher.hash(state);
    };
    const plain = hashWith(null);
    const base = hashWith(payload({}));

    expect(base).not.toBe(plain);
    expect(hashWith(payload({}))).toBe(base);
    expect(hashWith(payload({ ownerId: 'b' }))).not.toBe(base);
    expect(hashWith(payload({ targetId: 'u' }))).not.toBe(base);
    expect(hashWith(payload({ weaponId: 'obsidian-bow' }))).not.toBe(base);
    expect(hashWith(payload({ originX: 2 }))).not.toBe(base);
  });

  it('changes when a shot ends and as its ending counts down', () => {
    const { state, soldier } = stateWithSoldier();
    soldier.addComponent(
      new ProjectilePayload({
        ownerId: 'a',
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: 'a', kind: 'weapon', definitionId: 'magus-staff' },
        targetId: 't',
        impact: { kind: 'weapon', attack: SHOT_ATTACK },
        origin: { x: 1, y: 0 },
      }),
    );
    const flight = new ProjectileFlight(100, 80, 5);
    soldier.addComponent(flight);
    const flying = hasher.hash(state);

    flight.end();
    const ending = hasher.hash(state);
    flight.tickEnding();
    const later = hasher.hash(state);

    expect(ending).not.toBe(flying);
    expect(later).not.toBe(ending);
  });

  it("changes with a shot's range and where it slows, which an arc shot cuts to its aim point (DEC-342)", () => {
    const hashWith = (range: number, slowFrom: number, shortenTo?: number): number => {
      const { state, soldier } = stateWithSoldier();
      soldier.addComponent(
        new ProjectilePayload({
          ownerId: 'a',
          team: 'light',
          ownerLevel: 1,
          source: { attackerId: 'a', kind: 'weapon', definitionId: 'magus-staff' },
          targetId: null,
          impact: { kind: 'weapon', attack: SHOT_ATTACK },
          origin: { x: 1, y: 0 },
        }),
      );
      const flight = new ProjectileFlight(range, slowFrom, 5, true);
      if (shortenTo !== undefined) flight.shortenTo(shortenTo);
      soldier.addComponent(flight);
      return hasher.hash(state);
    };
    const base = hashWith(100, 80);

    expect(hashWith(100, 80)).toBe(base);
    expect(hashWith(100, 60)).not.toBe(base);
    expect(hashWith(100, 80, 90)).not.toBe(base);
    // Cut below where it slows, both change: the same as a shot authored that way.
    expect(hashWith(100, 80, 50)).toBe(hashWith(50, 50));
  });

  it('hashes an unlit shot as before shots could catch fire: only a lit shot adds a field (HC-Q89, DEC-345)', () => {
    const { state, soldier } = stateWithSoldier();
    soldier.addComponent(
      new ProjectilePayload({
        ownerId: 'a',
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: 'a', kind: 'weapon', definitionId: 'bow' },
        targetId: null,
        impact: { kind: 'weapon', attack: SHOT_ATTACK },
        origin: { x: 1, y: 0 },
      }),
    );
    soldier.addComponent(
      new ProjectileFlight(100, 80, 5, false, [
        { kind: 'debuff', statusId: 'burn', shape: { kind: 'hit' } },
      ]),
    );
    // The soldier's fields, then the shot's as `StateHasher` hashed them before DEC-345.
    const legacy = [
      state.tick,
      state.match.phase,
      state.rng.getState(),
      [
        [
          soldier.id,
          soldier.kind,
          soldier.definitionId,
          'light',
          [3, 4, 0.5],
          [100, 100],
          [0, 0, 0],
          ['projectile', 'a', null, 'weapon', 'bow', 1, 0, -1, 100, 80],
        ],
      ],
    ];

    expect(hasher.hash(state)).toBe(fnv1a(JSON.stringify(legacy)));
  });

  it('changes when a shot catches fire (HC-Q89, DEC-345)', () => {
    const { state, soldier } = stateWithSoldier();
    soldier.addComponent(
      new ProjectilePayload({
        ownerId: 'a',
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: 'a', kind: 'weapon', definitionId: 'obsidian-bow' },
        targetId: null,
        impact: { kind: 'weapon', attack: SHOT_ATTACK },
        origin: { x: 1, y: 0 },
      }),
    );
    const flight = new ProjectileFlight(100, 80, 5, false, [
      { kind: 'debuff', statusId: 'burn', shape: { kind: 'hit' } },
    ]);
    soldier.addComponent(flight);
    const unlit = hasher.hash(state);

    flight.light();

    expect(hasher.hash(state)).not.toBe(unlit);
  });

  it('hashes the walls a unit with momentum touched only while it has some, then each normal', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const runner = new Runner('entity-1', 'runner-definition');
    runner.spawn({});
    state.entities.add(runner);
    const movement = runner.getComponent(Movement);
    const before = hasher.hash(state);

    movement.hitBlock([{ x: -1, y: 0 }]);
    const walled = hasher.hash(state);
    movement.hitBlock([{ x: 0, y: -1 }]);
    const walledElsewhere = hasher.hash(state);
    movement.hitBlock([]);

    expect(new Set([before, walled, walledElsewhere]).size).toBe(3);
    expect(hasher.hash(state)).toBe(before);
  });

  it('adds a speed limit only once one is set, so an entity without one hashes as before', () => {
    const { state, soldier } = stateWithSoldier();
    const movement = soldier.getComponent(Movement);
    const before = hasher.hash(state);

    movement.limitSpeed(1);
    const limited = hasher.hash(state);
    movement.limitSpeed(0.5);

    expect(limited).not.toBe(before);
    expect(hasher.hash(state)).not.toBe(limited);
    expect(hasher.hash(stateWithSoldier().state)).toBe(before);
  });

  it('changes when only a granted minion level differs, the level capped (DEC-258)', () => {
    const { state, soldier } = stateWithSoldier();
    const veterancy = new Veterancy();
    soldier.addComponent(veterancy);
    veterancy.gainLevels(3, 3);
    const before = hasher.hash(state);

    veterancy.grantLevels(1, 3, 'zone-1');

    expect(veterancy.level).toBe(3);
    expect(hasher.hash(state)).not.toBe(before);
  });

  it('changes when only the zone that granted a minion level differs (DEC-258)', () => {
    const hashGrantedBy = (sourceId: string): number => {
      const { state, soldier } = stateWithSoldier();
      const veterancy = new Veterancy();
      soldier.addComponent(veterancy);
      veterancy.grantLevels(1, 3, sourceId);
      return hasher.hash(state);
    };

    expect(hashGrantedBy('zone-1')).not.toBe(hashGrantedBy('zone-2'));
  });

  it('hashes the weapon in hand only while the second one is, so a run that never swaps hashes as before (DEC-303)', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const scout = new Scout('entity-1', 'scout-definition');
    scout.spawn({});
    state.entities.add(scout);
    const before = hasher.hash(state);

    scout.getComponent(Loadout).swap();
    const swapped = hasher.hash(state);
    scout.getComponent(Loadout).swap();

    expect(swapped).not.toBe(before);
    expect(hasher.hash(state)).toBe(before);
  });

  it('changes when an entity turns, and changes back when it turns back (DEC-192)', () => {
    const { state, soldier } = stateWithSoldier();
    const before = hasher.hash(state);

    soldier.getComponent(Transform).face({ x: 0, y: 1 });
    const turned = hasher.hash(state);
    soldier.getComponent(Transform).face({ x: -1, y: 0 });

    expect(turned).not.toBe(before);
    expect(hasher.hash(state)).not.toBe(turned);
    soldier.getComponent(Transform).face(INITIAL_FACING);
    expect(hasher.hash(state)).toBe(before);
  });

  it('changes with a chase watch and with its detour waypoint (DEC-193)', () => {
    const { state, soldier } = stateWithSoldier();
    const watch = new ChaseWatch();
    const bare = hasher.hash(state);
    soldier.addComponent(watch);
    const watched = hasher.hash(state);

    watch.headFor(5, 6, 2, 0);

    expect(watched).not.toBe(bare);
    expect(hasher.hash(state)).not.toBe(watched);
  });

  it('changes with a combat clock and with each of its ticks (DEC-188)', () => {
    const { state, soldier } = stateWithSoldier();
    const clock = new CombatClock();
    const bare = hasher.hash(state);
    soldier.addComponent(clock);
    const clocked = hasher.hash(state);
    clock.recordDealt(5);
    const dealt = hasher.hash(state);

    clock.recordHurt(5);

    expect(clocked).not.toBe(bare);
    expect(dealt).not.toBe(clocked);
    expect(hasher.hash(state)).not.toBe(dealt);
  });

  it('changes with a last enemy hit and with each of its fields (DEC-346)', () => {
    const { state, soldier } = stateWithSoldier();
    const bare = hasher.hash(state);
    const last = new LastEnemyHit('entity-7', 5);
    soldier.addComponent(last);
    const hit = hasher.hash(state);
    last.record('entity-8', 5);
    const byAnother = hasher.hash(state);

    last.record('entity-8', 6);

    expect(hit).not.toBe(bare);
    expect(byAnother).not.toBe(hit);
    expect(hasher.hash(state)).not.toBe(byAnother);
  });

  it('hashes an aim point only while one is set, and tells aim points apart (DEC-184)', () => {
    const { state, soldier } = stateWithSoldier();
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    soldier.addComponent(combat);
    combat.setTarget('entity-9');
    const targeting = hasher.hash(state);

    combat.setAim({ x: 5, y: 6 });
    const aimed = hasher.hash(state);
    combat.setAim({ x: 5, y: 7 });
    const aimedElsewhere = hasher.hash(state);
    combat.setAim(null);
    combat.setTarget('entity-9');

    expect(aimed).not.toBe(targeting);
    expect(aimedElsewhere).not.toBe(aimed);
    // Without an aim the field is the same as before aimed attacks existed: back to the old hash.
    expect(hasher.hash(state)).toBe(targeting);
  });

  it('hashes a unit with a target, and a melee target, exactly as before aimed attacks existed (DEC-184)', () => {
    // Pinned from the hasher at the commit before `attack-aim`; a changed value breaks old replays.
    const hashWith = (mode: 'basic' | 'melee', isReady: boolean): number => {
      const { state, soldier } = stateWithSoldier();
      const attack = { strategy: 'melee', damage: 1, reach: 1, interval: 5 } as const;
      const combat = new Combat({ basic: attack, melee: attack });
      soldier.addComponent(combat);
      combat.setTarget('entity-9', mode);
      if (isReady) combat.beginAttack(2);
      return hasher.hash(state);
    };

    expect(hashWith('basic', false)).toBe(1983316836);
    expect(hashWith('basic', true)).toBe(3886219609);
    expect(hashWith('melee', false)).toBe(3814708316);
    expect(hashWith('melee', true)).toBe(2312166913);
  });

  it('hashes an aimed attack that has not yet landed, with no target and no cooldown', () => {
    const { state, soldier } = stateWithSoldier();
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    soldier.addComponent(combat);
    const idle = hasher.hash(state);

    combat.setAim({ x: 5, y: 6 });

    expect(hasher.hash(state)).not.toBe(idle);
  });

  it('hashes recorded hits once there are some, with their ids and the tick they stop counting, which decide whom the AI sees a unit attack (DEC-322 (2))', () => {
    const { state, soldier } = stateWithSoldier();
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    soldier.addComponent(combat);
    combat.setTarget('entity-9');
    combat.beginAttack(2);
    const before = hasher.hash(state);

    combat.recordHits(['entity-9'], 2, 1);
    const hit = hasher.hash(state);
    combat.recordHits(['entity-8'], 2, 1);
    const twoHits = hasher.hash(state);
    combat.recordHits(['entity-9'], 3, 1);
    const later = hasher.hash(state);

    expect(hit).not.toBe(before);
    expect(twoHits).not.toBe(hit);
    expect(later).not.toBe(hit);
  });

  it('hashes recorded hits on a unit with no target, no aim and no cooldown: an ability cast before any attack', () => {
    const { state, soldier } = stateWithSoldier();
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    soldier.addComponent(combat);
    const idle = hasher.hash(state);

    combat.recordHits(['entity-9'], 0, 1);

    expect(hasher.hash(state)).not.toBe(idle);
  });

  it('does not hash the swing record, which is display only (DEC-304)', () => {
    const { state, soldier } = stateWithSoldier();
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    soldier.addComponent(combat);
    combat.setTarget('entity-9');
    const before = hasher.hash(state);

    combat.recordSwing({ atTick: 3, direction: { x: 1, y: 0 }, radius: 3, arcDegrees: 90 });

    expect(hasher.hash(state)).toBe(before);
  });

  it('differs between seeds', () => {
    expect(hasher.hash(stateWithSoldier(1).state)).not.toBe(hasher.hash(stateWithSoldier(2).state));
  });

  it('hashes entities without components, and tells them apart from those with', () => {
    const { state } = stateWithSoldier();
    const before = hasher.hash(state);
    const bare = new Bare('entity-2', 'bare-definition');
    bare.spawn({});
    state.entities.add(bare);
    expect(hasher.hash(state)).not.toBe(before);
  });

  it.each<[string, (scout: Scout) => void]>([
    [
      'a shield bar',
      (scout) => {
        scout.getComponent(Health).addShield('buff-tower-1', 50);
      },
    ],
    [
      'a heading',
      (scout) => {
        scout.getComponent(Movement).steer({ x: 0, y: 1 });
      },
    ],
    [
      'a collider being disabled',
      (scout) => {
        scout.getComponent(Collider).disable();
      },
    ],
    [
      'a reveal',
      (scout) => {
        scout.getComponent(Vision).revealUntil(90);
      },
    ],
    [
      'aether',
      (scout) => {
        scout.getComponent(Aether).spend(1);
      },
    ],
    [
      'progression',
      (scout) => {
        scout.getComponent(Progression).addXp(1, { id: 'test', cap: 2, xpToNext: [10] });
      },
    ],
    [
      'the weapon in hand (DEC-303)',
      (scout) => {
        scout.getComponent(Loadout).swap();
      },
    ],
  ])('changes when %s changes on an entity that has it', (_, change) => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const scout = new Scout('entity-1', 'scout-definition');
    scout.spawn({});
    state.entities.add(scout);
    const before = hasher.hash(state);

    change(scout);

    expect(hasher.hash(state)).not.toBe(before);
  });
  it('hashes an untouched match as tick, phase and RNG only, as before the match fields existed', () => {
    const state = new GameState(
      createDefaultGameConfig(),
      1,
      null,
      {},
      {
        schedule: [{ entryId: 'later', tick: 9 }],
      },
    );

    expect(hasher.hash(state)).toBe(
      fnv1a(JSON.stringify([0, 'countdown', state.rng.getState(), []])),
    );
  });

  it.each<[string, (state: GameState) => void]>([
    [
      'the phase',
      (state) => {
        state.match.setPhase('early-game');
      },
    ],
    [
      'the timeline cursor',
      (state) => {
        state.match.advanceTimeline();
      },
    ],
    [
      'the idle hold',
      (state) => {
        state.match.holdIdle(true);
      },
    ],
    [
      'the scoring (a Legend row)',
      (state) => {
        state.match.scoreBook.addRow({
          entityId: 'entity-1',
          team: 'light',
          classId: 'warrior',
          controller: 'bot',
        });
      },
    ],
    [
      'the scoring (a team total)',
      (state) => {
        state.match.scoreBook.awardTeam('dark', {
          counter: 'structuresDestroyed',
          by: 0,
          points: 4,
        });
      },
    ],
    [
      'the scoring (a team counter)',
      (state) => {
        state.match.scoreBook.awardTeam('dark', {
          counter: 'structuresDestroyed',
          by: 1,
          points: 0,
        });
      },
    ],
    [
      'the scoring (a recent hit)',
      (state) => {
        state.match.scoreBook.recordHit('entity-2', 'entity-1', 0);
      },
    ],
    [
      'the scoring (a reached checkpoint)',
      (state) => {
        state.match.scoreBook.awardTeam('light', {
          counter: 'checkpointsReached',
          by: 1,
          points: 0,
        });
      },
    ],
    [
      'the scoring (held ticks)',
      (state) => {
        state.match.scoreBook.awardTeam('light', {
          counter: 'capturesHeldTicks',
          by: 1,
          points: 0,
        });
      },
    ],
  ])('changes when %s of the match changes', (_, change) => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const before = hasher.hash(state);

    change(state);

    expect(hasher.hash(state)).not.toBe(before);
  });

  it('changes with the tick the phase was entered on', () => {
    const enteredFirst = new GameState(createDefaultGameConfig(), 1);
    const enteredLater = new GameState(createDefaultGameConfig(), 1);
    enteredFirst.match.setPhase('early-game');
    enteredFirst.advanceTick();
    enteredLater.advanceTick();
    enteredLater.match.setPhase('early-game');

    expect(hasher.hash(enteredLater)).not.toBe(hasher.hash(enteredFirst));
  });

  describe('between two matches that have both left their initial state', () => {
    type MatchFields = Pick<
      MatchState,
      'phase' | 'phaseEnteredTick' | 'timelineCursor' | 'isIdleHeld'
    >;
    const AWAY: MatchFields = {
      phase: 'early-game',
      phaseEnteredTick: 1,
      timelineCursor: 1,
      isIdleHeld: true,
    };

    /** A match at tick 3 whose match fields are `fields`; non-initial, so they are all hashed. */
    const matchWith = (fields: MatchFields): GameState => {
      const state = new GameState(createDefaultGameConfig(), 1);
      while (state.tick < fields.phaseEnteredTick) {
        state.advanceTick();
      }
      state.match.setPhase(fields.phase);
      while (state.tick < 3) {
        state.advanceTick();
      }
      for (let mark = 0; mark < fields.timelineCursor; mark += 1) {
        state.match.advanceTimeline();
      }
      state.match.holdIdle(fields.isIdleHeld);
      return state;
    };

    it.each<[string, Partial<MatchFields>]>([
      ['phase', { phase: 'quarter-mark' }],
      ['phaseEnteredTick', { phaseEnteredTick: 2 }],
      ['timelineCursor', { timelineCursor: 2 }],
      ['isIdleHeld', { isIdleHeld: false }],
    ])('hashes differently when only %s differs', (_, change) => {
      const base = matchWith(AWAY);
      const changed = matchWith({ ...AWAY, ...change });

      expect(hasher.hash(matchWith(AWAY))).toBe(hasher.hash(base));
      expect(hasher.hash(changed)).not.toBe(hasher.hash(base));
    });
  });

  it('covers every brain field and the deferred queue once a brain exists', () => {
    const { state } = stateWithSoldier();
    const without = hasher.hash(state);
    const brain = {
      controllerId: 'minion' as const,
      profileId: 'minion',
      memory: { fsm: 'marching' },
      rngState: new SeededRandom(3).getState(),
    };
    state.ai.set('entity-1', brain);
    const withBrain = hasher.hash(state);

    state.ai.set('entity-1', { ...brain, memory: { fsm: 'engaging' } });
    const otherMemory = hasher.hash(state);
    state.ai.set('entity-1', { ...brain, rngState: new SeededRandom(4).getState() });
    const otherRng = hasher.hash(state);
    state.ai.set('entity-1', { ...brain, controllerId: 'guard' });
    const otherController = hasher.hash(state);
    state.ai.set('entity-1', { ...brain, profileId: 'other' });
    const otherProfile = hasher.hash(state);
    state.ai.set('entity-1', brain);
    state.ai.defer(['entity-1']);
    const deferred = hasher.hash(state);

    expect(
      new Set([without, withBrain, otherMemory, otherRng, otherController, otherProfile, deferred])
        .size,
    ).toBe(7);
  });

  it('hashes lost towers once a lane has one, by team and lane', () => {
    const hashWith = (losses: readonly (readonly ['light' | 'dark', string])[]): number => {
      const { state } = stateWithSoldier();
      for (const [team, lane] of losses) {
        state.recordTowerLost(team, lane);
      }
      return hasher.hash(state);
    };
    const without = hashWith([]);
    const one = hashWith([['light', 'lane-0']]);
    const two = hashWith([
      ['light', 'lane-0'],
      ['light', 'lane-0'],
    ]);
    const dark = hashWith([
      ['dark', 'lane-0'],
      ['dark', 'lane-0'],
    ]);

    expect(new Set([without, one, two, dark]).size).toBe(4);
  });

  describe('hordes', () => {
    const stateWithHorde = (fields: Partial<Omit<Horde, 'leaderId'>> = {}): GameState => {
      const { state } = stateWithSoldier();
      state.hordes.add({
        id: state.hordes.nextId(),
        team: 'light',
        weightClass: 'light',
        lane: 'lane-0',
        formationId: 'ranks',
        // `entity-2` need not exist: the store takes member ids as given.
        memberIds: ['entity-1', 'entity-2'],
        progress: 0,
        ...fields,
      });
      state.recordSpawnRequest('light', 2, 2);
      return state;
    };

    it('hashes a match without hordes from tick, phase, RNG state and entities only', () => {
      const { state, soldier } = stateWithSoldier();
      const legacy = [
        state.tick,
        state.match.phase,
        state.rng.getState(),
        [
          [
            soldier.id,
            soldier.kind,
            soldier.definitionId,
            'light',
            [3, 4, 0.5],
            [100, 100],
            [0, 0, 0],
          ],
        ],
      ];
      expect(hasher.hash(state)).toBe(fnv1a(JSON.stringify(legacy)));
    });

    it('changes once a horde exists', () => {
      expect(hasher.hash(stateWithHorde())).not.toBe(hasher.hash(stateWithSoldier().state));
    });

    it.each<[string, (state: GameState) => void]>([
      [
        'horde progress',
        (state) => {
          state.hordes.setProgress('horde-1', 0.5);
        },
      ],
      // Dropping the follower keeps the horde and its leader: only `memberIds` changes.
      ['the member ids', (state) => state.hordes.removeMember('entity-2')],
      ['issuedIds', (state) => state.hordes.nextId()],
    ])('changes when %s changes', (_, change) => {
      const state = stateWithHorde();
      const before = hasher.hash(state);
      change(state);
      expect(hasher.hash(state)).not.toBe(before);
    });

    // The leader is the lowest member id, so `memberIds` covers it.
    it.each<[string, Partial<Omit<Horde, 'leaderId'>>]>([
      ['team', { team: 'dark' }],
      ['weight class', { weightClass: 'heavy' }],
      ['lane', { lane: 'lane-1' }],
      ['formation', { formationId: 'wedge' }],
    ])('tells apart hordes that differ only in their %s', (_, fields) => {
      expect(hasher.hash(stateWithHorde(fields))).not.toBe(hasher.hash(stateWithHorde()));
    });

    it('hashes the spawn counters even before any horde exists (a wave suppressed whole)', () => {
      const withRequest = (requested: number, spawned: number): number => {
        const { state } = stateWithSoldier();
        state.recordSpawnRequest('dark', requested, spawned);
        return hasher.hash(state);
      };
      const none = hasher.hash(stateWithSoldier().state);
      expect(new Set([none, withRequest(2, 0), withRequest(3, 0), withRequest(3, 1)]).size).toBe(4);
    });

    it.each(['light', 'dark'] as const)(
      'tells apart %s spawn counters that differ only in unitsRequested or unitsSuppressed',
      (team) => {
        const withRequest = (requested: number, spawned: number): number => {
          const state = stateWithHorde();
          state.recordSpawnRequest(team, requested, spawned);
          return hasher.hash(state);
        };
        expect(new Set([withRequest(2, 2), withRequest(3, 3), withRequest(2, 1)]).size).toBe(3);
      },
    );
  });

  it('hashes the Cathedral gem: holder, glow ticks left, glow hits and ticks since hit each change the hash', () => {
    const stateWithGem = (): { state: GameState; gem: CathedralGemState } => {
      const state = new GameState(createDefaultGameConfig(), 1);
      const holder = new Bare('entity-1', 'bare');
      holder.spawn({});
      state.entities.add(holder);
      const gem = new CathedralGemState();
      holder.addComponent(gem);
      return { state, gem };
    };
    const { state, gem } = stateWithGem();
    const untouched = hasher.hash(state);

    gem.hold('light');
    const held = hasher.hash(state);
    gem.struck(3);
    const struck = hasher.hash(state);
    gem.struck(3);
    const struckTwice = hasher.hash(state);
    gem.age();
    const aged = hasher.hash(state);
    gem.age();
    gem.age();
    const dark = hasher.hash(state);
    gem.age(); // the glow is dark: only the ticks since the hit move
    const later = hasher.hash(state);

    expect(new Set([untouched, held, struck, struckTwice, aged, dark, later]).size).toBe(7);

    // Each step above moves more than one field; these two gems differ in glow ticks left alone.
    const struckFor = (glowTicks: number): number => {
      const fresh = stateWithGem();
      fresh.gem.struck(glowTicks);
      return hasher.hash(fresh.state);
    };
    expect(struckFor(3)).not.toBe(struckFor(4));
  });

  it('hashes a capture point: owner, progress, checkpoint and reached marks each change the hash', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const point = new CapturePoint('entity-1', CAPTURE_POINT.id);
    point.spawn({
      definition: CAPTURE_POINT,
      position: { x: 5, y: 5 },
      team: 'neutral',
      area: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 10 },
        ],
      ],
    });
    state.entities.add(point);
    const zone = point.getComponent(Capturable);
    const untouched = hasher.hash(state);

    zone.setProgress(0.5, 1);
    const progressed = hasher.hash(state);
    zone.setProgress(0.5, 2);
    const checkpoint = hasher.hash(state);
    zone.markReached('light', 2);
    const reached = hasher.hash(state);
    zone.setOwner('light', 0);
    const owned = hasher.hash(state);

    expect(new Set([untouched, progressed, checkpoint, reached, owned]).size).toBe(5);
  });

  it('changes when only the tick a capture point was taken differs (DEC-258)', () => {
    const hashOwnedSince = (tick: number): number => {
      const state = new GameState(createDefaultGameConfig(), 1);
      const point = new CapturePoint('entity-1', CAPTURE_POINT.id);
      point.spawn({
        definition: CAPTURE_POINT,
        position: { x: 5, y: 5 },
        team: 'neutral',
        area: [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
        ],
      });
      state.entities.add(point);
      point.getComponent(Capturable).setOwner('light', tick);
      return hasher.hash(state);
    };

    expect(hashOwnedSince(0)).not.toBe(hashOwnedSince(5));
  });

  describe('ally damage (DEC-89)', () => {
    const withTally = (...tallies: readonly ['light' | 'dark', string, number][]): number => {
      const { state } = stateWithSoldier();
      for (const [team, lane, amount] of tallies) {
        state.allyDamage.add(team, lane, amount);
      }
      return hasher.hash(state);
    };

    it('hashes the same tallies the same, and a cleared tally as none', () => {
      const { state } = stateWithSoldier();
      const none = hasher.hash(state);
      state.allyDamage.add('dark', 'lane-1', 9);
      state.allyDamage.clear('dark');

      expect(withTally(['light', 'lane-0', 5])).toBe(withTally(['light', 'lane-0', 5]));
      expect(hasher.hash(state)).toBe(none);
    });

    it('changes with the team, the lane and the amount of a tally', () => {
      const hashes = [
        hasher.hash(stateWithSoldier().state),
        withTally(['light', 'lane-0', 5]),
        withTally(['dark', 'lane-0', 5]),
        withTally(['light', 'lane-1', 5]),
        withTally(['light', 'lane-0', 6]),
      ];

      expect(new Set(hashes).size).toBe(5);
    });
  });

  it('changes when a checkpoint defender set is cleared, and with which set (07 §7)', () => {
    const withCleared = (...sets: readonly string[]): number => {
      const { state } = stateWithSoldier();
      for (const set of sets) state.guards.markCleared(set);
      return hasher.hash(state);
    };

    expect(new Set([withCleared(), withCleared('set-1'), withCleared('set-2')]).size).toBe(3);
    expect(withCleared('set-1')).toBe(withCleared('set-1'));
  });

  describe('defender damage (07 §7)', () => {
    const withTally = (set: string, legend: string, amount: number): number => {
      const { state } = stateWithSoldier();
      state.defenderDamage.add(set, legend, amount);
      return hasher.hash(state);
    };

    it('hashes a taken tally as none, and changes with the set, the Legend and the amount', () => {
      const { state } = stateWithSoldier();
      const none = hasher.hash(state);
      state.defenderDamage.add('set-1', 'legend-a', 9);
      state.defenderDamage.take('set-1');
      const hashes = [
        none,
        withTally('set-1', 'legend-a', 5),
        withTally('set-2', 'legend-a', 5),
        withTally('set-1', 'legend-b', 5),
        withTally('set-1', 'legend-a', 6),
      ];

      expect(hasher.hash(state)).toBe(none);
      expect(new Set(hashes).size).toBe(5);
    });
  });

  describe('Legend hits (DEC-335)', () => {
    const withHits = (...ticks: readonly number[]): number => {
      const { state } = stateWithSoldier();
      for (const entity of [new Champion('light-1', 'light'), new Champion('dark-1', 'dark')]) {
        entity.spawn({});
        state.entities.add(entity);
      }
      for (const tick of ticks) {
        while (state.tick < tick) state.advanceTick();
        state.events.emit('damage-applied', {
          targetId: 'light-1',
          amount: 1,
          absorbed: 0,
          source: { attackerId: 'dark-1', kind: 'weapon', definitionId: 'sword' },
        });
      }
      while (state.tick < 10) state.advanceTick();
      return hasher.hash(state);
    };

    it('hashes a recorded Legend hit, and the tick of it', () => {
      const hashes = [withHits(), withHits(5), withHits(6)];

      expect(new Set(hashes).size).toBe(3);
      expect(withHits(5)).toBe(withHits(5));
    });
  });
});
