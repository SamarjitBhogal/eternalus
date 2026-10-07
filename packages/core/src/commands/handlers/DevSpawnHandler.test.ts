import { describe, expect, it } from 'vitest';

import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { FeatureOwner } from '../../content/maps/maps.types';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Command } from '../Command.types';
import type { CommandContext } from '../CommandHandler.types';
import { DevSpawnHandler } from './DevSpawnHandler';

class Dummy extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'test';

  protected installComponents(context: unknown): void {
    const { team, position } = context as { team: FeatureOwner; position: Vec2 };
    this.addComponent(new Transform(position, 0.5));
    this.addComponent(new TeamMembership(team));
  }
}

const contextWithDummy = (): CommandContext => {
  const registry = new EntityRegistry();
  registry.register('dummy', Dummy);
  return {
    state: new GameState(createDefaultGameConfig(), 1),
    factory: new EntityFactory(registry),
  };
};

const spawn = (overrides: Partial<Command<'dev-spawn'>> = {}): Command<'dev-spawn'> => ({
  type: 'dev-spawn',
  kind: 'dummy',
  definitionId: 'training-dummy',
  team: 'dark',
  at: { x: 10, y: 20 },
  count: 2,
  ...overrides,
});

describe('DevSpawnHandler', () => {
  it('spawns count entities at the point, on the team, and announces each', () => {
    const context = contextWithDummy();
    const spawned: unknown[] = [];
    context.state.events.on('entity-spawned', (payload) => spawned.push(payload));
    expect(new DevSpawnHandler().handle(spawn(), context)).toBeNull();
    expect(spawned).toEqual([
      { entityId: 'entity-1', kind: 'dummy', team: 'dark' },
      { entityId: 'entity-2', kind: 'dummy', team: 'dark' },
    ]);
    expect(
      context.state.snapshot().entities.map(({ team, transform }) => ({ team, transform })),
    ).toEqual([
      { team: 'dark', transform: { x: 10, y: 20, radius: 0.5 } },
      { team: 'dark', transform: { x: 10, y: 20, radius: 0.5 } },
    ]);
  });

  it.each<[string, Partial<Command<'dev-spawn'>>]>([
    ['unknown-kind', { kind: 'dragon' }],
    ['invalid-count', { count: 0 }],
    ['invalid-count', { count: 1.5 }],
    ['invalid-position', { at: { x: Number.NaN, y: 0 } }],
    ['invalid-position', { at: { x: 0, y: Infinity } }],
  ])('rejects with %s and spawns nothing', (reason, overrides) => {
    const context = contextWithDummy();
    expect(new DevSpawnHandler().handle(spawn(overrides), context)).toBe(reason);
    expect(context.state.entities.size).toBe(0);
  });
});
