import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { timelineFrameOf } from '../config/timelineFrameOf';
import { AI_CADENCE } from '../content/ai/cadence';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import { loadTurrets } from '../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { IdGenerator } from '../utils/IdGenerator';
import { AiSystem } from './AiSystem';
import { Perception } from './perception/Perception';
import { predictiveAim } from './predictiveAim';
import { TurretController } from './TurretController';

const PROJECTILES = loadProjectiles(30);
const controller = new TurretController({ ...loadTurrets(30), projectiles: PROJECTILES });
const PYLON = MAP_FEATURE_DEFINITIONS.turret?.footprintRadius ?? 0;
const RANGE = 14;
/** The light turret stands here; units are placed by their distance east of it. */
const AT = { x: 100, y: 30 };

/** A light wall turret on the two-lane map with a space index; `add` places units east of it. */
const setUp = () => {
  const config = createDefaultGameConfig();
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(
    config,
    1,
    matchWorldOf(TWO_LANE_MAP),
    { space },
    { countdownEndTick: timelineFrameOf(config).countdownEndTick },
  );
  const units = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const structures = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  );
  const turret = structures.create('turret', 'turret', { team: 'light', position: AT });
  state.entities.add(turret);
  const add = (team: Team, east: number, kind = 'light-mob', id = 'light-minion', y = AT.y) => {
    const entity = units.create(kind, id, { team, position: { x: AT.x + east, y } });
    state.entities.add(entity);
    return entity.id;
  };
  /** Refills the index the way `SpaceSystem` does: every unit, in store order. */
  const index = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      if (entity.id !== turret.id) {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      }
    });
    space.commit();
  };
  const perception = new Perception(state);
  const decide = (memory: AiMemory = {}, profileId = 'wall-turret') => {
    index();
    return controller.decide({
      state,
      entityId: turret.id,
      perception,
      brain: {
        controllerId: 'turret',
        profileId,
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  const advance = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      state.advanceTick();
    }
  };
  return { state, turret, add, index, decide, advance };
};

describe('TurretController', () => {
  it('has only the turret profiles it was given, and throws on a brain that names another', () => {
    const { decide } = setUp();

    expect(controller.id).toBe('turret');
    expect(controller.hasProfile('wall-turret')).toBe(true);
    expect(controller.hasProfile('lane-minion')).toBe(false);
    expect(() => decide({}, 'lane-minion')).toThrow('lane-minion');
  });

  it('takes no target, and changes no shot clock, with no enemy in range', () => {
    const { add, decide } = setUp();
    add('light', 10);
    // Just past range: its centre is farther than the range from the pylon's edge.
    add('dark', PYLON + RANGE + 0.5);

    const { commands, memory } = decide({ nextShotTick: 7 });

    expect(commands).toEqual([]);
    expect(memory).toMatchObject({ targetId: null, nextShotTick: 7 });
  });

  it('takes the nearest enemy in range, measured from its edge, and a neutral unit counts as one', () => {
    const { add, decide } = setUp();
    add('dark', PYLON + RANGE - 0.5);
    const near = add('dark', PYLON + 3);

    expect(decide().memory.targetId).toBe(near);

    const second = setUp();
    const neutral = second.add('neutral', PYLON + 5);
    second.add('dark', PYLON + 9);
    expect(second.decide().memory.targetId).toBe(neutral);
  });

  it('prefers a heavy unit to a nearer enemy, and loads heavy ammo for it and default ammo otherwise', () => {
    const { add, decide } = setUp();
    add('dark', PYLON + 2);
    const heavy = add('dark', PYLON + 12, 'heavy-mob', 'heavy-minion');

    expect(decide().memory).toMatchObject({ targetId: heavy, ammoId: 'bolt-heavy' });

    const light = setUp();
    light.add('dark', PYLON + 2);
    expect(light.decide().memory.ammoId).toBe('bolt-default');
  });

  it('prefers an enemy Legend that hurt an allied Legend in the last 3 s, and forgets it after', () => {
    const { state, add, decide, advance } = setUp();
    add('dark', PYLON + 2, 'heavy-mob', 'heavy-minion');
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const ally = add('light', -PYLON - 20, 'warrior', 'warrior');
    advance(100);
    state.match.scoreBook.recordHit(ally, hurter, state.tick - 90);

    expect(decide().memory.targetId).toBe(hurter);

    state.match.scoreBook.recordHit(ally, hurter, state.tick - 91);
    expect(decide().memory.targetId).not.toBe(hurter);
  });

  it('ignores a hit on a Legend of the other team', () => {
    const { state, add, decide } = setUp();
    const near = add('dark', PYLON + 2);
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const enemy = add('dark', PYLON + 40, 'warrior', 'warrior', 10);
    state.match.scoreBook.recordHit(enemy, hurter, state.tick);

    expect(decide().memory.targetId).toBe(near);
  });

  it('keeps its target while it lives and stays in range, then re-acquires by priority', () => {
    const { state, add, decide } = setUp();
    const first = add('dark', PYLON + 10);
    const { memory } = decide();
    const heavy = add('dark', PYLON + 1, 'heavy-mob', 'heavy-minion');

    expect(memory.targetId).toBe(first);
    expect(decide(memory).memory.targetId).toBe(first);

    state.entities.get(first)?.getComponent(Transform).moveBy({ x: RANGE, y: 0 });
    expect(decide(memory).memory.targetId).toBe(heavy);

    const second = setUp();
    const doomed = second.add('dark', PYLON + 10);
    const kept = second.decide().memory;
    second.state.entities.get(doomed)?.getComponent(Health).applyDamage(1e6);
    expect(second.decide(kept).memory.targetId).toBeNull();
  });

  it('leaves its target at once for an enemy Legend that hurt an allied Legend (the defend-ally override, 11 §4.5)', () => {
    const { state, add, decide } = setUp();
    const first = add('dark', PYLON + 2, 'heavy-mob', 'heavy-minion');
    const { memory } = decide();
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const ally = add('light', -PYLON - 20, 'warrior', 'warrior');

    expect(memory.targetId).toBe(first);
    expect(decide(memory).memory.targetId).toBe(first);

    state.match.scoreBook.recordHit(ally, hurter, state.tick);
    expect(decide(memory).memory).toMatchObject({ targetId: hurter, ammoId: 'bolt-default' });
  });

  it('aims at a still target when its shot is due, and waits the ammo interval for the next', () => {
    const { state, add, decide, advance } = setUp();
    const target = add('dark', PYLON + 10);
    advance(40);

    const { memory } = decide({ nextShotTick: 40 });

    expect(memory).toEqual({
      targetId: target,
      ammoId: 'bolt-default',
      nextShotTick: 40 + loadTurrets(30).ammo.get('bolt-default').attack.interval,
      aimX: AT.x + PYLON + 10,
      aimY: AT.y,
    });
    expect(state.tick).toBe(40);
  });

  it('keeps its aim and shot clock while its shot is not due', () => {
    const { add, decide } = setUp();
    add('dark', PYLON + 10);

    const { memory } = decide({ nextShotTick: 5, aimX: 1, aimY: 2 });

    expect(memory).toMatchObject({ nextShotTick: 5, aimX: 1, aimY: 2 });
  });

  it('aims ahead of a moving target at its bolt speed (predictive aim)', () => {
    const { state, add, decide } = setUp();
    const target = add('dark', PYLON + 10, 'heavy-mob', 'heavy-minion');
    const movement = state.entities.get(target)?.getComponent(Movement);
    movement?.steer({ x: 0, y: 1 });
    movement?.advance();
    const velocity = movement?.velocity ?? { x: 0, y: 0 };

    const { memory } = decide();
    const expected = predictiveAim(
      AT,
      { x: AT.x + PYLON + 10, y: AT.y },
      velocity,
      PROJECTILES.get('turret-heavy-bolt').movementProfile.maxSpeed,
    );

    expect(velocity.y).toBeGreaterThan(0);
    expect(memory).toMatchObject({ ammoId: 'bolt-heavy', aimX: expected.x, aimY: expected.y });
    expect(expected.y).toBeGreaterThan(AT.y);
  });

  it('keeps its memory while it is dead', () => {
    const { turret, add, decide } = setUp();
    add('dark', PYLON + 10);
    turret.getComponent(Health).applyDamage(1e6);
    const memory = { targetId: 'entity-9', ammoId: 'bolt-heavy', nextShotTick: 3 };

    expect(decide(memory).memory).toBe(memory);
  });

  it('updates its memory in its brain as the match steps, which the state hash covers', () => {
    const { state, turret, add, index } = setUp();
    const system = new AiSystem(state, { turret: controller }, AI_CADENCE, () => undefined);
    const step = () => {
      index();
      system.update({ state });
      state.advanceTick();
    };
    // A training dummy has no controller of its own, so only the turret decides.
    const target = add('dark', PYLON + 10, 'light-mob', 'training-dummy');
    for (let tick = 0; tick < AI_CADENCE.everyTicks.turret; tick += 1) {
      step();
    }
    const brain = state.ai.get(turret.id);

    expect(brain?.memory).toMatchObject({ targetId: target, ammoId: 'bolt-default' });
    expect(brain?.memory.nextShotTick).toBeGreaterThan(0);

    const hash = new StateHasher().hash(state);
    if (brain !== undefined) {
      state.ai.set(turret.id, { ...brain, memory: { ...brain.memory, targetId: null } });
    }
    expect(new StateHasher().hash(state)).not.toBe(hash);
  });
});
