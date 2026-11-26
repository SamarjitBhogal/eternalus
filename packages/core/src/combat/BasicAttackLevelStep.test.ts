import { describe, expect, it } from 'vitest';

import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { WARRIOR } from '../content/legends/warrior';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { LEGEND_LEVEL_CURVE } from '../content/progression/levelCurves';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { BasicAttackLevelStep } from './BasicAttackLevelStep';
import { DamagePipeline } from './DamagePipeline';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const warrior = spawn('warrior', 'warrior', 'light');
  const dummy = spawn('light-mob', 'training-dummy', 'dark');
  const raiseTo = (level: number) => {
    const progression = warrior.getComponent(Progression);
    progression.addXp(progression.xpToReach(level, LEGEND_LEVEL_CURVE), LEGEND_LEVEL_CURVE);
  };
  const from = (attacker: Entity | null, kind: DamageSource['kind'] = 'weapon'): DamageSource => ({
    attackerId: attacker?.id ?? null,
    kind,
    definitionId: 'raptor-talons',
  });
  return { state, warrior, dummy, raiseTo, from };
};

const step = new BasicAttackLevelStep(
  new ContentCatalogue([
    { ...WARRIOR, levelScaling: { ...WARRIOR.levelScaling, basicAttackPerLevel: 0.5 } },
  ]),
);

describe('BasicAttackLevelStep', () => {
  it("multiplies a Legend's weapon hit by 1 + basicAttackPerLevel × (level − 1)", () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    const hit = { targetId: dummy.id, amount: 10, source: from(warrior) };

    expect(step.adjust(hit, state)).toBe(10);
    raiseTo(3);
    expect(step.adjust(hit, state)).toBe(20); // 10 × (1 + 0.5 × 2)
  });

  it('leaves ability, status and attacker-less hits, mobs and departed attackers unchanged', () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    raiseTo(3);
    const at = (source: DamageSource) =>
      step.adjust({ targetId: dummy.id, amount: 10, source }, state);

    expect(at(from(warrior, 'ability'))).toBe(10);
    expect(at(from(warrior, 'status'))).toBe(10);
    expect(at(from(null))).toBe(10);
    expect(at(from(dummy))).toBe(10);
    state.entities.remove(warrior.id, 'died');
    expect(at(from(warrior))).toBe(10);
  });

  it('runs in the default damage steps: a max-level Legend hits harder than a level-1 one', () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    const potency = 1 + WARRIOR.levelScaling.basicAttackPerLevel * (LEGEND_LEVEL_CURVE.cap - 1);
    const damage = new DamagePipeline();

    expect(damage.apply(state, dummy.id, 10, from(warrior))).toMatchObject({ amount: 10 });
    raiseTo(LEGEND_LEVEL_CURVE.cap);
    const result = damage.apply(state, dummy.id, 10, from(warrior));
    expect(result.applied && result.amount).toBeCloseTo(10 * potency);
  });
});
