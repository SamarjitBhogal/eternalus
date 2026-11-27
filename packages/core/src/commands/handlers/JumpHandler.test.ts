import { describe, expect, it } from 'vitest';

import { Jump } from '../../components/Jump';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { CommandContext } from '../CommandHandler.types';
import { JumpHandler } from './JumpHandler';

const context = (): CommandContext => {
  const { tickRate } = createDefaultGameConfig();
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(tickRate),
    undefined,
    { weapons: loadWeapons(tickRate) },
  );
  state.entities.add(
    factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' }),
  );
  state.entities.add(
    factory.create('light-mob', 'training-dummy', { position: { x: 5, y: 0 }, team: 'neutral' }),
  );
  return { state, factory };
};

describe('JumpHandler', () => {
  it("holds and releases a Legend's jump key", () => {
    const ctx = context();
    const handler = new JumpHandler();
    const jump = ctx.state.entities.get('entity-1')?.getComponent(Jump);

    expect(handler.handle({ type: 'jump', actorId: 'entity-1', isHeld: true }, ctx)).toBeNull();
    expect(jump?.isHeld).toBe(true);
    expect(handler.handle({ type: 'jump', actorId: 'entity-1', isHeld: false }, ctx)).toBeNull();
    expect(jump?.isHeld).toBe(false);
  });

  it('rejects an unknown actor and an actor that cannot jump', () => {
    const ctx = context();
    const handler = new JumpHandler();

    expect(handler.handle({ type: 'jump', actorId: 'nobody', isHeld: true }, ctx)).toBe(
      'unknown-entity',
    );
    expect(handler.handle({ type: 'jump', actorId: 'entity-2', isHeld: true }, ctx)).toBe(
      'cannot-jump',
    );
  });
});
