import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { ProjectilePayload } from '../components/ProjectilePayload';
import type { ProjectilePayloadData } from '../components/ProjectilePayload.types';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { IdGenerator } from '../utils/IdGenerator';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import { EntityFactory } from './EntityFactory';
import { ProjectileLauncher } from './ProjectileLauncher';

/** A Hamstring shot from (3, 4), fired by `entity-1` of the light team at no one. */
const PAYLOAD: ProjectilePayloadData = {
  ownerId: 'entity-1',
  team: 'light',
  source: { attackerId: 'entity-1', kind: 'ability', definitionId: 'hamstring' },
  targetId: null,
  impact: {
    kind: 'ability',
    abilityId: 'hamstring',
    slot: 'ability-3',
    onHit: [],
    scaling: {},
    casterLevel: 1,
  },
  origin: { x: 3, y: 4 },
};

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadProjectiles(30),
    new IdGenerator(6),
  );
  const spawned: GameEventMap['entity-spawned'][] = [];
  state.events.on('entity-spawned', (payload) => spawned.push(payload));
  return { state, launcher: new ProjectileLauncher(factory), spawned };
};

describe('ProjectileLauncher', () => {
  it('adds the projectile at the origin with the payload, flying along the direction, and announces it', () => {
    const { state, launcher, spawned } = setUp();

    launcher.launch(state, 'hamstring-blade', PAYLOAD, { x: 0, y: -1 });

    const shot = state.entities.get('entity-7');
    expect(shot?.definitionId).toBe('hamstring-blade');
    expect(shot?.getComponent(Transform).position).toEqual({ x: 3, y: 4 });
    expect(shot?.getComponent(ProjectilePayload).impact).toEqual(PAYLOAD.impact);
    expect(shot?.getComponent(ProjectilePayload).targetId).toBeNull();
    expect(shot?.getComponent(Movement).heading).toEqual({ x: 0, y: -1 });
    expect(spawned).toEqual([{ entityId: 'entity-7', kind: 'projectile', team: 'light' }]);
  });

  it('throws on a projectile id the factory does not know, and adds nothing', () => {
    const { state, launcher, spawned } = setUp();

    expect(() => {
      launcher.launch(state, 'no-such-shot', PAYLOAD, { x: 1, y: 0 });
    }).toThrow();
    expect(state.entities.size).toBe(0);
    expect(spawned).toEqual([]);
  });
});
