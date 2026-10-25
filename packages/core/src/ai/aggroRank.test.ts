import { describe, expect, it } from 'vitest';

import { LANE_MINION_AGGRO } from '../content/ai/aggro/laneMinion';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { EntityStore } from '../state/EntityStore';
import { aggroRank } from './aggroRank';

const CLASS_OF = (kind: string) =>
  kind === 'warrior' ? ('legend' as const) : kind === 'light-mob' ? ('minion' as const) : null;
const PRIORITY = LANE_MINION_AGGRO.priority;

const setUp = () => {
  const entities = new EntityStore();
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const add = (team: 'light' | 'dark', kind: string, id: string) => {
    const entity = factory.create(kind, id, { team, position: { x: 0, y: 0 } });
    entities.add(entity);
    return entity.id;
  };
  const rank = (candidate: string) =>
    aggroRank(candidate, { team: 'light', priority: PRIORITY, entities, classOf: CLASS_OF });
  return { entities, add, rank };
};

describe('aggroRank', () => {
  it('ranks an enemy by whom it attacks, then by its class (11 §4.3)', () => {
    const { entities, add, rank } = setUp();
    const allyLegend = add('light', 'warrior', 'warrior');
    const allyMinion = add('light', 'light-mob', 'light-minion');
    const enemyLegend = add('dark', 'warrior', 'warrior');
    const enemyMinion = add('dark', 'light-mob', 'light-minion');

    expect(rank(enemyMinion)).toBe(PRIORITY.indexOf('closest-minion'));
    expect(rank(enemyLegend)).toBe(PRIORITY.indexOf('closest-legend'));
    entities.setAttackTarget(enemyMinion, allyMinion);
    expect(rank(enemyMinion)).toBe(PRIORITY.indexOf('minion-attacking-ally-minion'));
    entities.setAttackTarget(enemyMinion, allyLegend);
    expect(rank(enemyMinion)).toBe(PRIORITY.indexOf('minion-attacking-ally-legend'));
    entities.setAttackTarget(enemyLegend, allyLegend);
    expect(rank(enemyLegend)).toBe(PRIORITY.indexOf('legend-attacking-ally-legend'));
  });

  it('treats an attack on its own side as no attack, and an unknown class as no match', () => {
    const { entities, add, rank } = setUp();
    const enemyMinion = add('dark', 'light-mob', 'light-minion');
    const otherEnemy = add('dark', 'light-mob', 'light-minion');
    entities.setAttackTarget(enemyMinion, otherEnemy);

    expect(rank(enemyMinion)).toBe(PRIORITY.indexOf('closest-minion'));
    expect(rank(add('dark', 'sentinel', 'sentinel'))).toBe(-1);
    expect(rank('nobody')).toBe(-1);
  });
});
