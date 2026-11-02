import { describe, expect, it } from 'vitest';

import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { validateGameConfig } from '../../config/validateGameConfig';
import type { Team } from '../../teams/teams.types';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { Legend } from '../../entities/Legend';
import { Unit } from '../../entities/Unit';
import { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Command } from '../Command.types';
import type { CommandContext } from '../CommandHandler.types';
import { DevSpawnHandler } from './DevSpawnHandler';

class Dummy extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'test';

  protected installComponents(context: unknown): void {
    const { team, position } = context as { team: Team; position: Vec2 };
    this.addComponent(new Transform(position, 0.5));
    this.addComponent(new TeamMembership(team));
  }
}

const installAt = (entity: Entity, context: unknown): void => {
  const { team, position } = context as { team: Team; position: Vec2 };
  entity.addComponent(new Transform(position, 0.5));
  entity.addComponent(new TeamMembership(team));
};

class Grunt extends Unit {
  public readonly kind = 'grunt';

  protected override installComponents(context: unknown): void {
    installAt(this, context);
  }
}

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(context: unknown): void {
    installAt(this, context);
  }
}

const contextWithDummy = (
  limits = { maxUnitsPerTeam: 144, maxLegendsPerTeam: 10 },
): CommandContext => {
  const registry = new EntityRegistry();
  registry.register('dummy', Dummy);
  registry.register('grunt', Grunt);
  registry.register('hero', Hero);
  return {
    // One Legend, one lane and one-mob light hordes, so the small caps below are valid configs.
    state: new GameState(
      validateGameConfig(
        createDefaultGameConfig({
          limits,
          map: { numLanes: 1, campsPerSide: 0 },
          match: { legendsPerTeam: 1, hordeSizes: { light: 1 } },
        }),
      ),
      1,
    ),
    factory: new EntityFactory(
      registry,
      new ContentCatalogue([
        ...['dummy', 'grunt', 'hero'].map((kind) => ({ id: kind, kind, displayName: kind })),
        { id: 'lane-grunt', kind: 'grunt', displayName: 'lane grunt', controller: 'minion' },
      ]),
    ),
  };
};

const spawn = (overrides: Partial<Command<'dev-spawn'>> = {}): Command<'dev-spawn'> => ({
  type: 'dev-spawn',
  kind: 'dummy',
  team: 'dark',
  at: { x: 10, y: 20 },
  count: 2,
  ...overrides,
  // Each test kind is built from the definition of the same id unless a test says otherwise.
  definitionId: overrides.definitionId ?? overrides.kind ?? 'dummy',
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
    ['unknown-definition', { definitionId: 'no-such-definition' }],
    ['unknown-definition', { kind: 'grunt', definitionId: 'hero' }],
    ['invalid-count', { count: 0 }],
    ['invalid-count', { count: 1.5 }],
    ['invalid-position', { at: { x: Number.NaN, y: 0 } }],
    ['invalid-position', { at: { x: 0, y: Infinity } }],
    // A lane minion only spawns in a horde, through `dev-spawn-mobs` (MS-25).
    ['horde-only', { kind: 'grunt', definitionId: 'lane-grunt' }],
  ])('rejects with %s and spawns nothing', (reason, overrides) => {
    const context = contextWithDummy();
    expect(new DevSpawnHandler().handle(spawn(overrides), context)).toBe(reason);
    expect(context.state.entities.size).toBe(0);
  });

  it('counts units per team and refuses a spawn that would pass maxUnitsPerTeam', () => {
    const context = contextWithDummy({ maxUnitsPerTeam: 3, maxLegendsPerTeam: 3 });
    const handler = new DevSpawnHandler();
    expect(handler.handle(spawn({ kind: 'grunt', count: 2 }), context)).toBeNull();
    expect(handler.handle(spawn({ kind: 'hero', count: 1, team: 'light' }), context)).toBeNull();
    expect(handler.handle(spawn({ kind: 'grunt', count: 2 }), context)).toBe('cap-exceeded');
    expect(handler.handle(spawn({ kind: 'hero', count: 1 }), context)).toBeNull();
    expect(handler.handle(spawn({ kind: 'grunt', count: 1 }), context)).toBe('cap-exceeded');
    expect(context.state.entities.size).toBe(4);
  });

  it('refuses a Legend spawn that would pass maxLegendsPerTeam', () => {
    const context = contextWithDummy({ maxUnitsPerTeam: 144, maxLegendsPerTeam: 2 });
    const handler = new DevSpawnHandler();
    expect(handler.handle(spawn({ kind: 'hero', count: 2 }), context)).toBeNull();
    expect(handler.handle(spawn({ kind: 'hero', count: 1 }), context)).toBe('cap-exceeded');
    expect(handler.handle(spawn({ kind: 'hero', count: 2, team: 'light' }), context)).toBeNull();
  });

  it('does not count non-unit entities against the unit cap', () => {
    const context = contextWithDummy({ maxUnitsPerTeam: 1, maxLegendsPerTeam: 1 });
    expect(new DevSpawnHandler().handle(spawn({ count: 5 }), context)).toBeNull();
    expect(new DevSpawnHandler().handle(spawn({ kind: 'grunt', count: 1 }), context)).toBeNull();
  });
});
