import { expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { IdGenerator } from '../utils/IdGenerator';
import { SovereignProtectionStep } from './SovereignProtectionStep';

it('blocks every King hit until the last living friendly BuffTower falls', () => {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const registry = createDefaultEntityRegistry();
  const position = { x: 10, y: 20 };
  const ids = new IdGenerator();
  const king = new EntityFactory(registry, loadDefaultContent(config.tickRate), ids).create(
    'monarch',
    'monarch',
    { position, team: 'light' },
  );
  const structures = new EntityFactory(registry, STRUCTURE_DEFINITIONS, ids);
  const friendly = structures.create('buff-tower', 'buff-tower', { position, team: 'light' });
  const enemy = structures.create('buff-tower', 'buff-tower', { position, team: 'dark' });
  state.entities.add(king);
  state.entities.add(friendly);
  state.entities.add(enemy);

  const step = new SovereignProtectionStep();
  const hit = {
    targetId: king.id,
    amount: 25,
    source: { kind: 'environment', attackerId: null, definitionId: 'test' },
  } as const;
  expect(step.adjust(hit, state)).toBe(0);
  const towerHealth = friendly.getComponent(Health);
  towerHealth.applyDamage(towerHealth.max);
  expect(step.adjust(hit, state)).toBe(hit.amount);
});
