import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { CombatClock } from '../components/CombatClock';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { OUT_OF_COMBAT_HEALING } from '../content/healing/outOfCombatHealing';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { MapObjectKind } from '../content/maps/mapObjects.types';
import type { MapFeature } from '../content/maps/maps.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { MapGenerator } from '../map/MapGenerator';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../map/MapPresentationBuilder';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { spawnWorldObjects } from '../state/__fixtures__/spawnWorldObjects';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { PlayableTeam, Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { OutOfCombatHealingSystem } from './OutOfCombatHealingSystem';

const logger = new NullLogger();
const CONFIG = createDefaultGameConfig();
const TICK_RATE = CONFIG.tickRate;
const DELAY = OUT_OF_COMBAT_HEALING.delaySeconds * TICK_RATE;
const MAP = new MapGenerator().generate(CONFIG, 1);
const MAP_OBJECTS = new MapObjectBuilder().build(MAP, new MapPresentationBuilder().build(MAP));
/** Open ground far from every fort and both shields. */
const FAR = { x: MAP.width / 2, y: 200 };
/** Half a metre: "just inside" and "just outside" a zone's edge. */
const EDGE = 0.5;

const strongholdOf = (team: PlayableTeam): MapFeature => {
  const found = MAP.features.find(
    ({ kind, team: owner }) => kind === 'stronghold' && owner === team,
  );
  if (found?.wallBoundary === undefined) throw new Error('no stronghold');
  return found;
};

/** The point on a shield's outer face straight ahead of its Stronghold, `offset` m further out. */
const shieldFront = (team: PlayableTeam, offset: number): Vec2 => {
  const { position, wallBoundary } = strongholdOf(team);
  const reach = (wallBoundary?.radius ?? 0) + (wallBoundary?.thickness ?? 0) / 2 + offset;
  return { x: position.x + (team === 'light' ? reach : -reach), y: position.y };
};

/** The point straight ahead of a Stronghold, `offset` m inside its shield's inner face. */
const shieldInside = (team: PlayableTeam, offset: number): Vec2 => {
  const { position, wallBoundary } = strongholdOf(team);
  const reach = (wallBoundary?.radius ?? 0) - (wallBoundary?.thickness ?? 0) / 2 - offset;
  return { x: position.x + (team === 'light' ? reach : -reach), y: position.y };
};

/** The map objects a team's shield is made of. */
const SHIELD_OBJECTS: readonly MapObjectKind[] = ['wall', 'gate', 'turret'];

const setUp = () => {
  const state = new GameState(CONFIG, 1, matchWorldOf(MAP));
  spawnMapStructures(state, MAP_OBJECTS);
  const system = new OutOfCombatHealingSystem(state, OUT_OF_COMBAT_HEALING);
  const definitions = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    definitions,
    undefined,
    loadWeapons(TICK_RATE),
  );
  const add = (kind: string, id: string, team: Team, position: Vec2 = FAR): Entity => {
    const entity = factory.create(kind, id, { position, team });
    state.entities.add(entity);
    return entity;
  };
  const minion = (team: Team = 'light', position: Vec2 = FAR) =>
    add('light-mob', 'light-minion', team, position);
  const wound = (entity: Entity, fraction = 0.5): Health => {
    const health = entity.getComponent(Health);
    health.applyDamage(health.max * fraction);
    return health;
  };
  const hit = (targetId: string, attackerId: string | null = null): void => {
    state.events.emit('damage-applied', {
      targetId,
      amount: 1,
      absorbed: 0,
      source: { attackerId, kind: 'weapon', definitionId: 'test' },
    });
  };
  const tickTo = (tick: number) => {
    while (state.tick < tick) state.advanceTick();
  };
  /** Advances to `tick`, runs the system once, and returns the health gained by that one run. */
  const gainAt = (tick: number, health: Health): number => {
    tickTo(tick);
    const before = health.current;
    system.update({ state, logger });
    return health.current - before;
  };
  const structure = (kind: string, team: Team): Entity => {
    let found: Entity | undefined;
    state.entities.forEach((entity) => {
      if (entity.kind === kind && state.entities.teamOf(entity.id) === team) found ??= entity;
    });
    if (found === undefined) throw new Error('no structure');
    return found;
  };
  /** A point `offset` m east of the west edge of a fort's outer walls, halfway down. */
  const fortWest = (fort: Entity, offset: number): Vec2 => {
    const { x, y, height } = fort.getComponent(Footprint).bounds;
    return { x: x + offset, y: y + height / 2 };
  };
  return { state, add, minion, wound, hit, gainAt, structure, fortWest, tickTo };
};

/** The heal one run gives `health` at `percent` of max health per second. */
const perTick = (health: Health, percent: number): number =>
  (health.max * percent) / 100 / TICK_RATE;

describe('OutOfCombatHealingSystem', () => {
  it('heals nothing before 10 s out of combat and something from then on', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion());

    expect(gainAt(DELAY - 1, health)).toBe(0);
    expect(gainAt(DELAY, health)).toBeGreaterThan(0);
  });

  it('heals 2% of max health per second, flat', () => {
    const { minion, wound, gainAt, add } = setUp();
    const small = wound(minion());
    const legend = wound(add('warrior', 'warrior', 'light'));

    const smallGain = gainAt(DELAY, small);
    const legendGain = legend.current - legend.max / 2;

    expect(smallGain).toBeCloseTo(perTick(small, 2), 9);
    expect(legendGain).toBeCloseTo(perTick(legend, 2), 9);
  });

  it('restarts the delay when the unit takes damage', () => {
    const { minion, wound, hit, gainAt, tickTo } = setUp();
    const unit = minion();
    const health = wound(unit);
    tickTo(DELAY - 10);
    hit(unit.id);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(gainAt(DELAY - 10 + DELAY, health)).toBeGreaterThan(0);
  });

  it('restarts the delay when the unit deals damage', () => {
    const { minion, wound, hit, gainAt, tickTo } = setUp();
    const attacker = minion();
    const victim = minion('dark');
    const health = wound(attacker);
    tickTo(DELAY - 10);
    hit(victim.id, attacker.id);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(gainAt(DELAY - 10 + DELAY, health)).toBeGreaterThan(0);
  });

  it.each(['spawner-tower', 'buff-tower'])(
    "adds 10 points (12 per cent a second) in a friendly %s's fort box (its gateway), none just outside",
    (kind) => {
      const { minion, wound, gainAt, structure, fortWest } = setUp();
      const fort = structure(kind, 'light');
      const inside = wound(minion('light', fortWest(fort, EDGE)));
      const outside = wound(minion('light', fortWest(fort, -EDGE)));

      expect(gainAt(DELAY, inside)).toBeCloseTo(perTick(inside, 12), 9);
      expect(outside.current - outside.max / 2).toBeCloseTo(perTick(outside, 2), 9);
    },
  );

  it('adds 15 points (17%/s) anywhere inside the shield, in front of and behind the Stronghold', () => {
    const { minion, wound, gainAt } = setUp();
    const light = strongholdOf('light');
    const spots = [shieldInside('light', EDGE), { x: EDGE, y: light.position.y }].map((spot) =>
      wound(minion('light', spot)),
    );
    const dark = wound(minion('dark', { x: MAP.width - EDGE, y: light.position.y }));

    gainAt(DELAY, dark);
    for (const health of [...spots, dark]) {
      expect(health.current - health.max / 2).toBeCloseTo(perTick(health, 17), 9);
    }
  });

  it('gives no Stronghold bonus on its wall, outside the shield, nor inside an enemy shield', () => {
    const { minion, wound, gainAt } = setUp();
    const wall = MAP.features.find(
      ({ kind, team }) => kind === 'wall-segment' && team === 'light',
    )?.position;
    if (wall === undefined) throw new Error('no wall segment');
    const onFace = wound(minion('light', shieldFront('light', -EDGE)));
    const onWall = wound(minion('light', wall));
    const outside = wound(minion('light', shieldFront('light', EDGE)));
    const enemy = wound(minion('light', shieldInside('dark', EDGE)));

    gainAt(DELAY, onFace);
    for (const health of [onFace, onWall, outside, enemy]) {
      expect(health.current - health.max / 2).toBeCloseTo(perTick(health, 2), 9);
    }
  });

  it('gives no Stronghold bonus while it is under attack, and gives it back after 10 s quiet', () => {
    const { minion, wound, hit, gainAt, structure, tickTo } = setUp();
    const health = wound(minion('light', shieldInside('light', EDGE)));
    tickTo(DELAY - 5);
    hit(structure('stronghold', 'light').id, 'enemy');

    expect(gainAt(DELAY, health)).toBeCloseTo(perTick(health, 2), 9);
    expect(gainAt(DELAY - 5 + DELAY, health)).toBeCloseTo(perTick(health, 17), 9);
  });

  it("does not count hits on the Stronghold's walls, gates or turrets as an attack on it (DEC-215 (2))", () => {
    const { state, minion, wound, hit, gainAt, tickTo } = setUp();
    const shield = spawnWorldObjects(
      state,
      MAP_OBJECTS.filter(({ kind, team }) => team === 'light' && SHIELD_OBJECTS.includes(kind)),
    );
    const health = wound(minion('light', shieldInside('light', EDGE)));
    tickTo(DELAY - 5);
    for (const id of shield) hit(id, 'enemy');

    expect(new Set(shield.map((id) => state.worldObjects?.objectFor(id)?.kind))).toEqual(
      new Set(SHIELD_OBJECTS),
    );
    expect(gainAt(DELAY, health)).toBeCloseTo(perTick(health, 17), 9);
  });

  it("counts a unit in a zone by its centre point only, not by its body's edge (DEC-215 (3))", () => {
    const { minion, wound, gainAt, structure, fortWest } = setUp();
    const fort = structure('spawner-tower', 'light');
    const outside = minion('light', fortWest(fort, -0.2));
    const inside = minion('light', fortWest(fort, 0.2));
    const radius = outside.getComponent(Collider).shape.radius;
    const [outsideHealth, insideHealth] = [wound(outside), wound(inside)];

    // Each body reaches across the edge of the box; only the second centre is inside it.
    expect(radius).toBeGreaterThan(0.2);
    expect(gainAt(DELAY, insideHealth)).toBeCloseTo(perTick(insideHealth, 12), 9);
    expect(outsideHealth.current - outsideHealth.max / 2).toBeCloseTo(perTick(outsideHealth, 2), 9);
  });

  it('gives no bonus under an enemy tower', () => {
    const { minion, wound, gainAt, structure, fortWest } = setUp();
    const health = wound(minion('dark', fortWest(structure('spawner-tower', 'light'), EDGE)));

    expect(gainAt(DELAY, health)).toBeCloseTo(perTick(health, 2), 9);
  });

  it('gives no bonus while the tower is under attack, and gives it back after 10 s quiet', () => {
    const { minion, wound, hit, gainAt, structure, fortWest, tickTo } = setUp();
    const tower = structure('spawner-tower', 'light');
    const health = wound(minion('light', fortWest(tower, EDGE)));
    tickTo(DELAY - 5);
    hit(tower.id, 'enemy');

    expect(gainAt(DELAY, health)).toBeCloseTo(perTick(health, 2), 9);
    expect(gainAt(DELAY - 5 + DELAY, health)).toBeCloseTo(perTick(health, 12), 9);
  });

  it('gives no bonus from a destroyed tower', () => {
    const { minion, wound, gainAt, structure, fortWest } = setUp();
    const tower = structure('spawner-tower', 'light');
    const health = wound(minion('light', fortWest(tower, EDGE)));
    wound(tower, 1);

    expect(gainAt(DELAY, health)).toBeCloseTo(perTick(health, 2), 9);
  });

  it('never heals the dead', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion(), 1);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(health.isDead).toBe(true);
  });

  it('never heals above max health', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion(), 0.0001);

    expect(gainAt(DELAY, health)).toBeCloseTo(health.max * 0.0001, 9);
    expect(health.current).toBe(health.max);
    expect(gainAt(DELAY + 1, health)).toBe(0);
  });

  it('heals a camp mob and does not heal structures', () => {
    const { add, wound, gainAt, structure } = setUp();
    const camp = wound(add('light-mob', 'light-camp-mob', 'neutral'));
    const tower = wound(structure('spawner-tower', 'dark'));
    const before = tower.current;

    expect(gainAt(DELAY, camp)).toBeGreaterThan(0);
    expect(tower.current).toBe(before);
  });

  it("keeps each fight in a CombatClock: the target's both ticks, the attacker's active tick", () => {
    const { minion, hit, tickTo } = setUp();
    const attacker = minion();
    const victim = minion('dark');
    const bystander = minion();
    tickTo(7);
    hit(victim.id, attacker.id);

    expect(victim.getComponent(CombatClock).fields).toEqual([7, 7]);
    expect(attacker.getComponent(CombatClock).fields).toEqual([7, 0]);
    expect(bystander.hasComponent(CombatClock)).toBe(false);
  });

  it('heals the same way twice: same setup, same hash', () => {
    const hashes = [1, 2].map(() => {
      const { state, minion, wound, hit, gainAt, structure, fortWest } = setUp();
      const health = wound(minion('light', shieldInside('light', EDGE)), 0.9);
      wound(minion('light', fortWest(structure('buff-tower', 'light'), EDGE)), 0.9);
      wound(minion('dark', shieldInside('dark', EDGE)), 0.9);
      wound(minion(), 0.9);
      // Three seconds: long enough to heal in every zone, too short for anyone to reach max.
      for (let tick = DELAY; tick < DELAY + 3 * TICK_RATE; tick += 1) {
        if (tick === DELAY + TICK_RATE) hit(structure('stronghold', 'light').id, null);
        gainAt(tick, health);
      }
      expect(health.current).toBeLessThan(health.max);
      return new StateHasher().hash(state);
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
