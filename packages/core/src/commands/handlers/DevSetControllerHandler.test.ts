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
import type { PickedBotChooser } from '../../state/missingRoleChooser.types';
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
/** A role chooser that always picks the Rover (the chooser has tests of its own). */
const toRover = (): typeof ROVER => ROVER;
/** A picked-bot chooser that knows only the Rover's id (the chooser has tests of its own). */
const pickRover: PickedBotChooser = (_state, _legendId, _team, controllerId) =>
  controllerId === 'rover' ? ROVER : undefined;
const LANER = {
  controllerId: 'bot-legend',
  profileId: 'normal',
  memory: { lane: 'lane-1' },
} as const;

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

const command = (entityId: string, controllerId: string | null): Command<'dev-set-controller'> => ({
  type: 'dev-set-controller',
  entityId,
  controllerId,
});

describe('DevSetControllerHandler', () => {
  it('makes a bot Legend the human: no binding, humanLegendId set', () => {
    const context = contextWith();
    expect(
      new DevSetControllerHandler('player', toRover, pickRover).handle(
        command('entity-1', 'player'),
        context,
      ),
    ).toBeNull();

    expect(context.state.entities.controllerOf('entity-1')).toBeUndefined();
    expect(context.state.match.humanLegendId).toBe('entity-1');
  });

  it('moves the human seat: the old human becomes the chosen bot, and a Rover on the human leaves none', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
    handler.handle(command('entity-1', 'player'), context);

    handler.handle(command('entity-2', 'player'), context);
    expect(context.state.match.humanLegendId).toBe('entity-2');
    expect(context.state.entities.controllerOf('entity-1')?.controllerId).toBe('rover');

    handler.handle(command('entity-2', 'rover'), context);
    expect(context.state.match.humanLegendId).toBeNull();
    expect(context.state.entities.controllerOf('entity-2')?.controllerId).toBe('rover');
  });

  it('gives the human Legend the role its team lacks when no bot is picked (null, DEC-356)', () => {
    const context = contextWith();
    const asked: unknown[] = [];
    const handler = new DevSetControllerHandler(
      'player',
      (state, legendId, team) => {
        asked.push([state === context.state, legendId, team]);
        return LANER;
      },
      () => {
        throw new Error('no bot was picked');
      },
    );
    handler.handle(command('entity-1', 'player'), context);

    expect(handler.handle(command('entity-1', null), context)).toBeNull();
    expect(asked).toEqual([[true, 'entity-1', 'light']]);
    expect(context.state.match.humanLegendId).toBeNull();
    const binding = context.state.entities.controllerOf('entity-1');
    expect(binding?.controllerId).toBe('bot-legend');
    expect(binding?.initialMemory).toEqual({ lane: 'lane-1' });
  });

  it('gives the previous human the chosen role on a seat move, not counting the new human as a bot', () => {
    const context = contextWith();
    const asked: unknown[] = [];
    const laner = {
      controllerId: 'bot-legend',
      profileId: 'normal',
      memory: { lane: 'lane-0' },
    } as const;
    const handler = new DevSetControllerHandler(
      'player',
      (state, legendId) => {
        asked.push([legendId, state.entities.controllerOf('entity-2')]);
        return laner;
      },
      pickRover,
    );
    handler.handle(command('entity-1', 'player'), context);

    expect(handler.handle(command('entity-2', 'player'), context)).toBeNull();
    expect(asked).toEqual([['entity-1', undefined]]);
    expect(context.state.entities.controllerOf('entity-1')?.initialMemory).toEqual({
      lane: 'lane-0',
    });
    expect(context.state.entities.controllerOf('entity-2')).toBeUndefined();
  });

  it('binds the picked bot to a bot Legend without asking the missing-role chooser', () => {
    const context = contextWith();
    const asked: string[] = [];
    const handler = new DevSetControllerHandler(
      'player',
      (_state, legendId) => {
        asked.push(legendId);
        return ROVER;
      },
      pickRover,
    );

    expect(handler.handle(command('entity-2', 'rover'), context)).toBeNull();
    expect(asked).toEqual([]);
    expect(context.state.entities.controllerOf('entity-2')?.controllerId).toBe('rover');
  });

  it('gives the human Legend the bot the developer picks: the human leaves (DEC-356)', () => {
    const context = contextWith();
    const asked: unknown[] = [];
    const handler = new DevSetControllerHandler('player', toRover, (state, legendId, team, id) => {
      asked.push([state === context.state, legendId, team, id]);
      return LANER;
    });
    handler.handle(command('entity-1', 'player'), context);

    expect(handler.handle(command('entity-1', 'bot-legend'), context)).toBeNull();
    expect(asked).toEqual([[true, 'entity-1', 'light', 'bot-legend']]);
    expect(context.state.match.humanLegendId).toBeNull();
    expect(context.state.entities.controllerOf('entity-1')?.initialMemory).toEqual({
      lane: 'lane-1',
    });
  });

  it('refuses a Legend with no playable team as not a Legend and changes nothing', () => {
    const context = contextWith();
    const stray = new Hero('entity-6', 'hero');
    stray.spawn({});
    stray.removeComponent(TeamMembership);
    stray.addComponent(new ControllerBinding('bot-legend', 'normal'));
    context.state.entities.add(stray);
    const handler = new DevSetControllerHandler('player', toRover, pickRover);

    expect(handler.handle(command('entity-6', 'rover'), context)).toBe('not-a-legend');
    expect(handler.handle(command('entity-6', 'player'), context)).toBe('not-a-legend');
    expect(context.state.entities.controllerOf('entity-6')?.controllerId).toBe('bot-legend');
    expect(context.state.match.humanLegendId).toBeNull();
  });

  it.each([
    ['unknown-entity', 'nobody', 'player'],
    ['not-a-legend', 'entity-3', 'player'],
    ['unknown-controller', 'entity-1', 'human'],
    ['unknown-controller', 'entity-1', 'no-such'],
  ])('rejects with %s and changes nothing', (reason, entityId, controllerId) => {
    const context = contextWith();

    expect(
      new DevSetControllerHandler('player', toRover, pickRover).handle(
        command(entityId, controllerId),
        context,
      ),
    ).toBe(reason);
    expect(context.state.match.humanLegendId).toBeNull();
    expect(context.state.entities.controllerOf('entity-1')?.controllerId).toBe('bot-legend');
  });

  it('is not supported in a Duel: a human seated on the other team refuses the move', () => {
    const context = contextWith();
    context.state.match.seatHuman('entity-2', 'dark');

    expect(
      new DevSetControllerHandler('player', toRover, pickRover).handle(
        command('entity-1', 'player'),
        context,
      ),
    ).toBe('not-supported');
    expect(context.state.match.humanLegendId).toBeNull();
  });

  it('keeps the brain of a bot that already plays the Rover', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
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
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
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
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
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
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
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

  it("asks both choosers for the Legend's own team, not playerTeam: a dark bot Legend", () => {
    const context = contextWith();
    const asked: unknown[] = [];
    const handler = new DevSetControllerHandler(
      'player',
      (_state, legendId, team) => {
        asked.push(['missing', legendId, team]);
        return ROVER;
      },
      (_state, legendId, team, id) => {
        asked.push(['picked', legendId, team, id]);
        return LANER;
      },
    );
    const enemy = new Hero('entity-5', 'hero');
    enemy.spawn({});
    enemy.addComponent(new TeamMembership('dark'));
    enemy.addComponent(new ControllerBinding('bot-legend', 'normal'));
    context.state.entities.add(enemy);

    expect(handler.handle(command('entity-5', null), context)).toBeNull();
    expect(context.state.entities.controllerOf('entity-5')?.controllerId).toBe('rover');
    expect(handler.handle(command('entity-5', 'bot-legend'), context)).toBeNull();
    expect(asked).toEqual([
      ['missing', 'entity-5', 'dark'],
      ['picked', 'entity-5', 'dark', 'bot-legend'],
    ]);
    expect(context.state.entities.controllerOf('entity-5')?.initialMemory).toEqual({
      lane: 'lane-1',
    });
  });

  it('changes nothing on a refused command, even with the seat of a human that died', () => {
    const context = contextWith();
    const handler = new DevSetControllerHandler('player', toRover, pickRover);
    handler.handle(command('entity-1', 'player'), context);
    context.state.entities.remove('entity-1', 'died');
    const moves: unknown[] = [];
    context.state.events.on('human-reseated', (payload) => moves.push(payload));

    expect(handler.handle(command('entity-2', 'no-such'), context)).toBe('unknown-controller');
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
      new DevSetControllerHandler('player', toRover, pickRover).handle(
        command('entity-1', 'player'),
        context,
      ),
    ).toBe('not-supported');
    expect(context.state.match.humanLegendId).toBeNull();
  });
});
