import { describe, expect, it } from 'vitest';

import { ControllerBinding } from '../../components/ControllerBinding';
import { TeamMembership } from '../../components/TeamMembership';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { Legend } from '../../entities/Legend';
import { GameState } from '../../state/GameState';
import { SeededRandom } from '../../utils/SeededRandom';
import type { Command } from '../Command.types';
import type { CommandContext } from '../CommandHandler.types';
import { DevSetControllerHandler } from './DevSetControllerHandler';

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(): void {
    this.addComponent(new TeamMembership('light'));
  }
}

class Prop extends Entity {
  public readonly kind = 'prop';
  public readonly family = 'test';

  protected override installComponents(): void {
    this.addComponent(new TeamMembership('light'));
  }
}

const ROVER = { controllerId: 'rover', profileId: 'rover', memory: {} } as const;

/** Two bot Legends (entity-1 and entity-2) and a prop (entity-3), no human yet. */
const contextWith = (): CommandContext => {
  const registry = new EntityRegistry();
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(registry, new ContentCatalogue([]));
  for (const entity of [
    new Hero('entity-1', 'hero'),
    new Hero('entity-2', 'hero'),
    new Prop('entity-3', 'prop'),
  ]) {
    entity.spawn({});
    if (entity instanceof Legend) {
      entity.addComponent(new ControllerBinding('bot-legend', 'normal'));
    }
    state.entities.add(entity);
  }
  return { state, factory };
};

const command = (entityId: string, controllerId: string): Command<'dev-set-controller'> => ({
  type: 'dev-set-controller',
  entityId,
  controllerId,
});

describe('DevSetControllerHandler', () => {
  it('makes a bot Legend the human: no binding, humanLegendId set', () => {
    const context = contextWith();
    expect(
      new DevSetControllerHandler(ROVER, 'player').handle(command('entity-1', 'player'), context),
    ).toBeNull();

    expect(context.state.entities.controllerOf('entity-1')).toBeUndefined();
    expect(context.state.match.humanLegendId).toBe('entity-1');
  });

  it('moves the human seat: the old human becomes a Rover bot, and a Rover on the human leaves none', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-1', 'player'), context);

    handler.handle(command('entity-2', 'player'), context);
    expect(context.state.match.humanLegendId).toBe('entity-2');
    expect(context.state.entities.controllerOf('entity-1')?.controllerId).toBe('rover');

    handler.handle(command('entity-2', 'rover'), context);
    expect(context.state.match.humanLegendId).toBeNull();
    expect(context.state.entities.controllerOf('entity-2')?.controllerId).toBe('rover');
  });

  it.each([
    ['unknown-entity', 'nobody', 'player'],
    ['not-a-legend', 'entity-3', 'player'],
    ['unknown-controller', 'entity-1', 'human'],
    ['unknown-controller', 'entity-1', 'bot-legend'],
  ])('rejects with %s and changes nothing', (reason, entityId, controllerId) => {
    const context = contextWith();

    expect(
      new DevSetControllerHandler(ROVER, 'player').handle(command(entityId, controllerId), context),
    ).toBe(reason);
    expect(context.state.match.humanLegendId).toBeNull();
    expect(context.state.entities.controllerOf('entity-1')?.controllerId).toBe('bot-legend');
  });

  it('is not supported in a Duel: a human seated on the other team refuses the move', () => {
    const context = contextWith();
    context.state.match.seatHuman('entity-2', 'dark');

    expect(
      new DevSetControllerHandler(ROVER, 'player').handle(command('entity-1', 'player'), context),
    ).toBe('not-supported');
    expect(context.state.match.humanLegendId).toBeNull();
  });

  it('keeps the brain of a bot that already plays the Rover', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-2', 'rover'), context);
    context.state.ai.set('entity-2', {
      controllerId: 'rover',
      profileId: 'rover',
      memory: { seen: 1 },
      rngState: new SeededRandom(1).getState(),
    });

    handler.handle(command('entity-2', 'rover'), context);

    expect(context.state.ai.get('entity-2')?.memory).toEqual({ seen: 1 });
  });

  it('clears the seat of a human Legend that died (DeathSystem removed it), before moving it', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-1', 'player'), context);
    context.state.entities.remove('entity-1', 'died');

    expect(handler.handle(command('entity-2', 'rover'), context)).toBeNull();
    expect(context.state.match.humanLegendId).toBeNull();

    handler.handle(command('entity-2', 'player'), context);
    context.state.entities.remove('entity-2', 'died');
    const fresh = new Hero('entity-4', 'hero');
    fresh.spawn({});
    context.state.entities.add(fresh);
    expect(handler.handle(command('entity-4', 'player'), context)).toBeNull();
    expect(context.state.match.humanLegendId).toBe('entity-4');
  });

  it('keeps the seat of a human Legend waiting in the respawn queue and gives it to the Rover on a move', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-1', 'player'), context);
    const waiting = context.state.entities.withdraw('entity-1', 'died');
    if (!(waiting instanceof Legend)) {
      throw new Error('entity-1 must be a Legend');
    }
    context.state.respawns.add(waiting, 'light', 100);

    expect(handler.handle(command('entity-2', 'rover'), context)).toBeNull();
    expect(context.state.match.humanLegendId).toBe('entity-1');

    expect(handler.handle(command('entity-2', 'player'), context)).toBeNull();
    expect(context.state.match.humanLegendId).toBe('entity-2');
    expect(waiting.getComponent(ControllerBinding).controllerId).toBe('rover');
  });

  it('refuses to seat the human on a Legend off playerTeam (DEC-173) and changes nothing', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-1', 'player'), context);
    const enemy = new Hero('entity-5', 'hero');
    enemy.spawn({});
    enemy.addComponent(new TeamMembership('dark'));
    enemy.addComponent(new ControllerBinding('bot-legend', 'normal'));
    context.state.entities.add(enemy);

    expect(handler.handle(command('entity-5', 'player'), context)).toBe('not-player-team');
    expect(context.state.match.humanLegendId).toBe('entity-1');
    expect(context.state.entities.controllerOf('entity-5')?.controllerId).toBe('bot-legend');
    expect(context.state.entities.controllerOf('entity-1')).toBeUndefined();
  });

  it('changes nothing on a refused command, even with the seat of a human that died', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler(ROVER, 'player');
    handler.handle(command('entity-1', 'player'), context);
    context.state.entities.remove('entity-1', 'died');
    const moves: unknown[] = [];
    context.state.events.on('human-reseated', (payload) => moves.push(payload));

    expect(handler.handle(command('entity-2', 'bot-legend'), context)).toBe('unknown-controller');
    expect(handler.handle(command('entity-3', 'player'), context)).toBe('not-a-legend');
    expect(context.state.match.humanLegendId).toBe('entity-1');
    expect(moves).toEqual([]);

    expect(handler.handle(command('entity-2', 'player'), context)).toBeNull();
    expect(moves).toEqual([
      { from: 'entity-1', to: null },
      { from: null, to: 'entity-2' },
    ]);
  });

  it('is not supported in a Duel, whoever holds the other seat', () => {
    const context = contextWith();
    context.state.match.startDuel(10);

    expect(
      new DevSetControllerHandler(ROVER, 'player').handle(command('entity-1', 'player'), context),
    ).toBe('not-supported');
    expect(context.state.match.humanLegendId).toBeNull();
  });
});
