import { expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { WinObjective } from '../../components/WinObjective';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { OneSovereignPerTeamInvariant } from '../../diagnostics/invariants/OneSovereignPerTeamInvariant';
import { GameState } from '../../state/GameState';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';
import { Sovereign } from '../Sovereign';

it('creates a team Sovereign with health and the generic win objective', () => {
  const content = loadDefaultContent(createDefaultGameConfig().tickRate);
  const factory = new EntityFactory(createDefaultEntityRegistry(), content);
  const king = factory.create('monarch', 'monarch', { position: { x: 10, y: 20 }, team: 'light' });

  expect(king).toBeInstanceOf(Sovereign);
  expect(king.family).toBe('sovereign');
  expect(king.hasComponent(WinObjective)).toBe(true);
  expect(king.getComponent(Health).current).toBe(content.get('monarch').baseHealth);
});

it('reports a second Sovereign on the same team', () => {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(config.tickRate),
  );
  const position = { x: 10, y: 20 };
  const add = (team: 'light' | 'dark') => {
    const king = factory.create('monarch', 'monarch', { position, team });
    state.entities.add(king);
    return king;
  };
  const invariant = new OneSovereignPerTeamInvariant();
  add('light');
  add('dark');
  expect(invariant.check(state)).toEqual([]);
  const duplicate = add('light');
  expect(invariant.check(state)).toEqual([expect.objectContaining({ entityId: duplicate.id })]);
});
