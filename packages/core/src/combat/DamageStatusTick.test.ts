import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { DamagePipeline } from './DamagePipeline';
import { DamageStatusTick } from './DamageStatusTick';

const CONFIG = createDefaultGameConfig();
const LOADED = loadStatusEffects(CONFIG.tickRate, 2);

/** A dark dummy with `statusId` applied `stacks` times by entity-9. */
const setUp = (statusId: string, stacks: number) => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 0, y: 0 },
    team: 'dark',
  });
  state.entities.add(dummy);
  const statuses = dummy.getComponent(StatusEffects);
  for (let i = 0; i < stacks; i += 1) {
    statuses.apply(LOADED.get(statusId), 'entity-9', 0);
  }
  const hits: GameEventMap['damage-applied'][] = [];
  state.events.on('damage-applied', (payload) => hits.push(payload));
  const tick = (spec: Parameters<DamageStatusTick['tick']>[0]) => {
    const [status] = statuses.active;
    if (status !== undefined) {
      new DamageStatusTick().tick(spec, status, dummy.id, { state, damage: new DamagePipeline() });
    }
  };
  return { dummy, hits, tick };
};

describe('DamageStatusTick', () => {
  it('deals amount × stacks, credited to the applier as a status hit', () => {
    const { hits, tick } = setUp('bleed', 2);
    tick({ kind: 'damage', amount: 6 });

    expect(hits).toEqual([
      {
        targetId: expect.any(String) as string,
        amount: 12,
        absorbed: 0,
        source: { attackerId: 'entity-9', kind: 'status', definitionId: 'bleed' },
      },
    ]);
  });

  it("deals fractionOfMax of the target's max health per stack", () => {
    const { dummy, hits, tick } = setUp('crushed', 1);
    tick({ kind: 'damage', fractionOfMax: 0.03 });

    expect(hits[0]?.amount).toBeCloseTo(dummy.getComponent(Health).max * 0.03);
  });
});
