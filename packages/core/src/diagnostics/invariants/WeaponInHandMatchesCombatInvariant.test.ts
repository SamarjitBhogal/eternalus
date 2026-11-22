import { describe, expect, it } from 'vitest';

import { unitsWithWarriorKit } from '../../abilities/__fixtures__/casterState';
import { castSteps } from '../../abilities/__fixtures__/castSteps';
import { Combat } from '../../components/Combat';
import { Loadout } from '../../components/Loadout';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../../config/matchPhases';
import { loadAbilities } from '../../content/abilities/loadAbilities';
import { LEGEND_SPECS } from '../../content/legends/specs/legendSpecCatalogue';
import { loadLevelCurves } from '../../content/progression/loadLevelCurves';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { DefaultInvariantRunner } from '../DefaultInvariantRunner';
import { TEST_DEBUG_CONFIG } from '../InvariantRunner.constants';
import { MemoryLogger } from '../MemoryLogger';
import { WeaponInHandMatchesCombatInvariant } from './WeaponInHandMatchesCombatInvariant';

/** A Zealot (Warrior, spec `assassin`: talons, and the bow as its second weapon) at the origin. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    unitsWithWarriorKit(),
    undefined,
    loadWeapons(30),
    LEGEND_SPECS,
  );
  const zealot = factory.create('warrior', 'warrior', {
    position: { x: 0, y: 0 },
    team: 'light',
    specId: 'assassin',
  });
  state.entities.add(zealot);
  return { state, zealot };
};

const check = (state: GameState) => new WeaponInHandMatchesCombatInvariant().check(state);

describe('WeaponInHandMatchesCombatInvariant', () => {
  it('holds at spawn and while the swap step keeps the hand and Combat in step', () => {
    const { state, zealot } = setUp();

    expect(check(state)).toEqual([]);
    castSteps(state, zealot.id, [{ kind: 'swap-weapon' }]);
    expect(zealot.getComponent(Combat).weaponId).toBe('obsidian-bow');
    expect(check(state)).toEqual([]);
  });

  it('flags a loadout swapped around the swap step', () => {
    const { state, zealot } = setUp();

    zealot.getComponent(Loadout).swap(); // Combat keeps the talons

    expect(check(state)).toEqual([
      expect.objectContaining({
        invariantId: 'weapon-in-hand-matches-combat',
        entityId: zealot.id,
        details: { inHand: 'obsidian-bow', equipped: 'raptor-talons' },
      }),
    ]);
  });

  it('flags a weapon equipped around the loadout', () => {
    const { state, zealot } = setUp();
    const loadout = zealot.getComponent(Loadout);
    const bow = loadout.swap();
    loadout.swap(); // the talons in hand again
    if (bow === null) {
      throw new Error('The Zealot has no second weapon.');
    }

    zealot.getComponent(Combat).equip(bow.attacks, bow.weaponId);

    expect(check(state)).toEqual([
      expect.objectContaining({
        entityId: zealot.id,
        details: { inHand: 'raptor-talons', equipped: 'obsidian-bow' },
      }),
    ]);
  });

  it('is one of the default invariants, so a running match checks it', () => {
    const { state, zealot } = setUp();
    const runner = new DefaultInvariantRunner({
      debug: { ...TEST_DEBUG_CONFIG, throwOnViolation: false },
      logger: new MemoryLogger(),
      abilities: loadAbilities(30),
      curves: loadLevelCurves(),
      phaseOrder: MATCH_PHASES,
      terminalPhases: TERMINAL_MATCH_PHASES,
    });

    zealot.getComponent(Loadout).swap();

    expect(runner.run(state).map(({ invariantId }) => invariantId)).toContain(
      'weapon-in-hand-matches-combat',
    );
  });
});
