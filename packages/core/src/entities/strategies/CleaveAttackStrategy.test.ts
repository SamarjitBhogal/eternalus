import { expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { GameState } from '../../state/GameState';
import type { Team } from '../../teams/teams.types';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';
import { CleaveAttackStrategy } from './CleaveAttackStrategy';

it('hits the target and other enemies in front and in reach', () => {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(config.tickRate),
  );
  const spawn = (team: Team, x: number, y: number) => {
    const unit = factory.create('monarch', 'monarch', { team, position: { x, y } });
    state.entities.add(unit);
    return unit;
  };
  const king = spawn('light', 0, 0);
  const target = spawn('dark', 1, 0);
  const neutral = spawn('neutral', 1, 1);
  spawn('light', 1, -1);
  spawn('dark', -1, 0);
  spawn('dark', 100, 0);

  const hitIds: string[] = [];
  new CleaveAttackStrategy().attack(king, target.id, king.getComponent(Combat).attack, {
    state,
    damage: {
      apply: (_state, targetId) => {
        hitIds.push(targetId);
      },
    },
  });
  expect(hitIds).toEqual([target.id, neutral.id]);
});
