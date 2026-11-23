import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { TurretState } from '../components/TurretState';
import { AI_CADENCE } from '../content/ai/cadence';
import type { EntityId } from '../state/EntityStore.types';
import { StateHasher } from '../state/StateHasher';
import { TurretAmmoRule } from '../state/TurretAmmoRule';
import { AiSystem } from './AiSystem';
import { predictiveAim } from './predictiveAim';
import { ARC_LAUNCH_DELAY_TICKS } from './TurretController.constants';
import {
  AT,
  CLEAR,
  controller,
  PROJECTILES,
  PYLON,
  RANGE,
  setUp,
} from './__fixtures__/turretControllerSetup';

describe('TurretController', () => {
  it('has only the turret profiles it was given, and throws on a brain that names another', () => {
    const { decide } = setUp();

    expect(controller.id).toBe('turret');
    expect(controller.hasProfile('wall-turret')).toBe(true);
    expect(controller.hasProfile('lane-minion')).toBe(false);
    expect(() => decide({}, 'lane-minion')).toThrow('lane-minion');
  });

  it('takes no target, sends nothing and keeps only the target in memory, with no enemy in range', () => {
    const { add, decide } = setUp();
    add('light', 10);
    // Just past range: its centre is farther than the range from the pylon's edge.
    add('dark', PYLON + RANGE + 0.5);

    const { commands, memory } = decide({ targetId: 'entity-9', nextShotTick: 7, ammoId: 'x' });

    expect(commands).toEqual([]);
    expect(memory).toEqual({ targetId: null });
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
    const decision = decide();

    // It starts with its first ammo, the heavy bolt, loaded: no switch for a heavy target.
    expect(decision.memory).toEqual({ targetId: heavy });
    expect(decision.commands.map(({ type }) => type)).toEqual(['attack-aim']);

    const light = setUp();
    light.add('dark', PYLON + 2);
    expect(light.decide().commands[0]).toEqual({
      type: 'switch-ammo',
      actorId: light.turret.id,
      ammoId: 'bolt-default',
    });
  });

  it('prefers an enemy Legend that hurt an allied Legend in the last 3 s, and forgets it after', () => {
    const { add, decide, advance, hit } = setUp();
    add('dark', PYLON + 2, 'heavy-mob', 'heavy-minion');
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const ally = add('light', -PYLON - 20, 'warrior', 'warrior');
    advance(10);
    hit(hurter, ally);
    advance(90);

    expect(decide().memory.targetId).toBe(hurter);

    advance(1);
    expect(decide().memory.targetId).not.toBe(hurter);
  });

  it('ignores a hit on a Legend of the other team, a hit on a minion and a hit by a minion', () => {
    const { add, decide, hit } = setUp();
    const near = add('dark', PYLON + 2);
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const minionHurter = add('dark', PYLON + 6);
    const enemy = add('dark', PYLON + 40, 'warrior', 'warrior', 10);
    const ally = add('light', -PYLON - 20, 'warrior', 'warrior');
    const minion = add('light', -PYLON - 20);
    hit(hurter, enemy);
    hit(hurter, minion);
    hit(minionHurter, ally);

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
    const { turret, add, decide, hit } = setUp();
    const first = add('dark', PYLON + 2, 'heavy-mob', 'heavy-minion');
    const { memory } = decide();
    const hurter = add('dark', PYLON + 12, 'warrior', 'warrior');
    const ally = add('light', -PYLON - 20, 'warrior', 'warrior');

    expect(memory.targetId).toBe(first);
    expect(decide(memory).memory.targetId).toBe(first);

    hit(hurter, ally);
    const decision = decide(memory);
    expect(decision.memory.targetId).toBe(hurter);
    expect(decision.commands[0]).toEqual({
      type: 'switch-ammo',
      actorId: turret.id,
      ammoId: 'bolt-default',
    });
  });

  it('takes the first target in rank order with a clear line, tests no line past it, and drops a held target whose line closes', () => {
    const blocked = new Set<EntityId>();
    const tested: EntityId[] = [];
    const { add, decide } = setUp({
      isClear: (_state, _attackerId, targetId) => {
        tested.push(targetId);
        return !blocked.has(targetId);
      },
    });
    const heavy = add('dark', PYLON + 6, 'heavy-mob', 'heavy-minion');
    const near = add('dark', PYLON + 2);
    const far = add('dark', PYLON + 10);
    blocked.add(heavy);

    const { memory } = decide();
    expect(memory.targetId).toBe(near);
    expect(tested).toEqual([heavy, near]);

    blocked.add(near);
    expect(decide(memory).memory.targetId).toBe(far);

    blocked.add(far);
    expect(decide(memory)).toMatchObject({ memory: { targetId: null }, commands: [] });
  });

  it('tests the line of each candidate with the ammo it would fire at it, not the loaded ammo (BTD-1)', () => {
    const tested: string[] = [];
    const { add, decide } = setUp({
      isClear: (_state, _attackerId, targetId, attack) => {
        const projectileId =
          attack !== undefined && 'projectile' in attack
            ? attack.projectile.projectileId
            : 'loaded';
        tested.push(`${targetId} ${projectileId}`);
        // Only the default bolt's line is clear.
        return projectileId === 'turret-bolt';
      },
    });
    const heavy = add('dark', PYLON + 6, 'heavy-mob', 'heavy-minion');
    const light = add('dark', PYLON + 2);

    const { memory } = decide();

    expect(tested).toEqual([`${heavy} turret-heavy-bolt`, `${light} turret-bolt`]);
    expect(memory.targetId).toBe(light);
  });

  it('aims at a still target every decision, and switches ammo only when the loaded one is not the pick', () => {
    const { state, turret, add, decide } = setUp();
    add('dark', PYLON + 10);
    const aim = { type: 'attack-aim', actorId: turret.id, aim: { x: AT.x + PYLON + 10, y: AT.y } };
    const switchAmmo = { type: 'switch-ammo', actorId: turret.id, ammoId: 'bolt-default' };

    expect(decide().commands).toEqual([switchAmmo, aim]);
    // Not applied yet: it asks again.
    expect(decide().commands).toEqual([switchAmmo, aim]);

    new TurretAmmoRule().load(state.entities, turret.id, 'bolt-default');
    expect(decide().commands).toEqual([aim]);
    expect(decide().commands).toEqual([aim]);
  });

  it('stops its aim once when it has no target and an aim is set', () => {
    const { state, turret, add, decide } = setUp();
    const target = add('dark', PYLON + 10);
    const { memory } = decide();
    state.entities.setAttackAim(turret.id, { x: AT.x + PYLON + 10, y: AT.y });
    state.entities.get(target)?.getComponent(Health).applyDamage(1e6);

    expect(decide(memory).commands).toEqual([
      { type: 'attack-aim', actorId: turret.id, aim: null },
    ]);

    state.entities.setAttackAim(turret.id, null);
    expect(decide({ targetId: null }).commands).toEqual([]);
  });

  it('aims ahead of a moving target at its bolt speed, plus the launch delay of an arc shot (predictive aim)', () => {
    const { state, turret, add, decide } = setUp();
    const target = add('dark', PYLON + 10, 'heavy-mob', 'heavy-minion');
    const movement = state.entities.get(target)?.getComponent(Movement);
    movement?.steer({ x: 0, y: 1 });
    movement?.advance();
    const velocity = movement?.velocity ?? { x: 0, y: 0 };

    const { commands } = decide();
    const expected = predictiveAim(
      AT,
      { x: AT.x + PYLON + 10, y: AT.y },
      velocity,
      PROJECTILES.get('turret-heavy-bolt').movementProfile.maxSpeed,
      ARC_LAUNCH_DELAY_TICKS,
    );

    expect(PROJECTILES.get('turret-heavy-bolt').isArc).toBe(true);
    expect(velocity.y).toBeGreaterThan(0);
    expect(commands).toEqual([{ type: 'attack-aim', actorId: turret.id, aim: expected }]);
    expect(expected.y).toBeGreaterThan(AT.y);
  });

  it('leads a straight shot with no launch delay, as before DEC-342', () => {
    const straight = { get: (id: string) => ({ ...PROJECTILES.get(id), isArc: false }) };
    const { state, turret, add, decide } = setUp(CLEAR, straight);
    const target = add('dark', PYLON + 10, 'heavy-mob', 'heavy-minion');
    const movement = state.entities.get(target)?.getComponent(Movement);
    movement?.steer({ x: 0, y: 1 });
    movement?.advance();
    const velocity = movement?.velocity ?? { x: 0, y: 0 };

    expect(decide().commands).toEqual([
      {
        type: 'attack-aim',
        actorId: turret.id,
        aim: predictiveAim(
          AT,
          { x: AT.x + PYLON + 10, y: AT.y },
          velocity,
          PROJECTILES.get('turret-heavy-bolt').movementProfile.maxSpeed,
        ),
      },
    ]);
  });

  it('keeps its memory and sends nothing while it is dead', () => {
    const { turret, add, decide } = setUp();
    add('dark', PYLON + 10);
    turret.getComponent(Health).applyDamage(1e6);
    const memory = { targetId: 'entity-9' };

    expect(decide(memory)).toMatchObject({ commands: [], memory });
    expect(decide(memory).memory).toBe(memory);
  });

  it('sends nothing for a turret entity with no ammo (no TurretState)', () => {
    const { state, turret, add, decide } = setUp();
    add('dark', PYLON + 10);
    turret.removeComponent(TurretState);

    expect(decide({}).commands).toEqual([]);
    expect(new TurretAmmoRule().ammoOf(state.entities, turret.id)).toBeUndefined();
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

    expect(brain?.memory).toEqual({ targetId: target });

    const hash = new StateHasher().hash(state);
    if (brain !== undefined) {
      state.ai.set(turret.id, { ...brain, memory: { ...brain.memory, targetId: null } });
    }
    expect(new StateHasher().hash(state)).not.toBe(hash);
  });
});
