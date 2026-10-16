import { describe, expect, it } from 'vitest';

import { Progression } from '../../components/Progression';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { ProgressionLevelInvariant } from './ProgressionLevelInvariant';

const CURVE = { id: 'test', xpToNext: [100, 150], cap: 3 };

class Hero extends Entity {
  public readonly kind = 'hero';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Progression(CURVE, { healthPerLevel: 0, aetherPerLevel: 0 }));
  }
}

const stateWithHero = (): { state: GameState; progression: Progression } => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const hero = new Hero('entity-1', 'hero');
  hero.spawn({});
  state.entities.add(hero);
  return { state, progression: hero.getComponent(Progression) };
};

describe('ProgressionLevelInvariant', () => {
  it('holds while the level follows the XP, up to the cap', () => {
    const { state, progression } = stateWithHero();
    progression.addXp(120);
    expect(new ProgressionLevelInvariant().check(state)).toEqual([]);
    progression.addXp(10_000);
    expect(new ProgressionLevelInvariant().check(state)).toEqual([]);
  });

  it('flags a level that does not match the XP (injected)', () => {
    const { state, progression } = stateWithHero();
    // Inject a broken level to prove the invariant catches it.
    Object.assign(progression, { levelValue: 3 });

    expect(new ProgressionLevelInvariant().check(state)).toMatchObject([
      {
        invariantId: 'progression-level',
        entityId: 'entity-1',
        details: { level: 3, expected: 1 },
      },
    ]);
  });
});
