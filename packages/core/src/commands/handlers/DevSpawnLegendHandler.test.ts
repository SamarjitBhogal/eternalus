import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { ControllerBinding } from '../../components/ControllerBinding';
import type { ControllerSpawn } from '../../entities/EntityFactory.types';
import { LEVEL_CURVE_CATALOGUE } from '../../content/progression/levelCurveCatalogue';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { Legend } from '../../entities/Legend';
import { WorldMap } from '../../map/WorldMap';
import { GameState } from '../../state/GameState';
import { MatchWorld } from '../../state/MatchWorld';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import type { Team } from '../../teams/teams.types';
import type { Vec2 } from '../../utils/geometry.types';
import type { Command } from '../Command.types';
import type { CommandContext } from '../CommandHandler.types';
import { DevSpawnLegendHandler } from './DevSpawnLegendHandler';

const place = (entity: Entity, context: unknown): void => {
  const { team, position } = context as { team: Team; position: Vec2 };
  entity.addComponent(new Transform(position, 0.5));
  entity.addComponent(new TeamMembership(team));
};

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(context: unknown): void {
    place(this, context);
    const { controller } = context as { controller?: ControllerSpawn };
    if (controller !== undefined) {
      this.addComponent(
        new ControllerBinding(controller.controllerId, controller.profileId, controller.memory),
      );
    }
  }
}

class Prop extends Entity {
  public readonly kind = 'prop';
  public readonly family = 'test';

  protected override installComponents(context: unknown): void {
    place(this, context);
  }
}

const contextWith = (limits = { maxUnitsPerTeam: 144, maxLegendsPerTeam: 2 }, hasMap = true) => {
  const registry = new EntityRegistry();
  registry.register('hero', Hero);
  registry.register('prop', Prop);
  const world = hasMap
    ? new MatchWorld(
        TWO_LANE_MAP,
        WorldMap.fromDefinition(TWO_LANE_MAP, 2, () => false),
      )
    : null;
  const context: CommandContext = {
    state: new GameState(createDefaultGameConfig({ limits }), 1, world),
    factory: new EntityFactory(
      registry,
      new ContentCatalogue([
        { id: 'hero', kind: 'hero', displayName: 'Hero' },
        { id: 'prop', kind: 'prop', displayName: 'Prop' },
      ]),
    ),
  };
  return context;
};

const ROVER = { controllerId: 'rover', profileId: 'rover', memory: {} } as const;

const command = (
  overrides: Partial<Command<'dev-spawn-legend'>> = {},
): Command<'dev-spawn-legend'> => ({
  type: 'dev-spawn-legend',
  team: 'light',
  definitionId: 'hero',
  ...overrides,
});

describe('DevSpawnLegendHandler', () => {
  it('spawns a bot Legend at its team Stronghold, bound to the Rover controller, and announces it', () => {
    const context = contextWith();
    const spawned: unknown[] = [];
    context.state.events.on('entity-spawned', (payload) => spawned.push(payload));

    expect(new DevSpawnLegendHandler(ROVER).handle(command({ team: 'dark' }), context)).toBeNull();

    expect(spawned).toEqual([{ entityId: 'entity-1', kind: 'hero', team: 'dark' }]);
    expect(
      context.state.snapshot(LEVEL_CURVE_CATALOGUE).entities.map(({ transform }) => transform),
    ).toEqual([{ x: 190, y: 30, radius: 0.5 }]);
    expect(context.state.entities.controllerOf('entity-1')).toMatchObject({
      controllerId: 'rover',
      profileId: 'rover',
    });
  });

  it.each<[string, Partial<Command<'dev-spawn-legend'>>, boolean]>([
    ['unknown-definition', { definitionId: 'no-such-class' }, true],
    ['not-a-legend', { definitionId: 'prop' }, true],
    ['no-stronghold', {}, false],
  ])('rejects with %s and spawns nothing', (reason, overrides, hasMap) => {
    const context = contextWith(undefined, hasMap);

    expect(new DevSpawnLegendHandler(ROVER).handle(command(overrides), context)).toBe(reason);
    expect(context.state.entities.size).toBe(0);
  });

  it('refuses a Legend past maxLegendsPerTeam, per team, and spawns nothing more', () => {
    const context = contextWith();
    const handler = new DevSpawnLegendHandler(ROVER);

    expect(handler.handle(command(), context)).toBeNull();
    expect(handler.handle(command(), context)).toBeNull();
    expect(handler.handle(command(), context)).toBe('cap-exceeded');
    expect(handler.handle(command({ team: 'dark' }), context)).toBeNull();
    expect(context.state.entities.size).toBe(3);
  });

  it('refuses a Legend when the team is at the Unit cap', () => {
    const context = contextWith({ maxUnitsPerTeam: 1, maxLegendsPerTeam: 2 });
    const handler = new DevSpawnLegendHandler(ROVER);

    expect(handler.handle(command(), context)).toBeNull();
    expect(handler.handle(command(), context)).toBe('cap-exceeded');
  });
});
