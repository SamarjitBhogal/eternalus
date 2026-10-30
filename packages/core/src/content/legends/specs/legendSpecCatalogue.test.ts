import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legendCatalogue';
import { LEGEND_SPECS } from './legendSpecCatalogue';

/**
 * The mirror rule, checked here only (content computes no name): the Dark name is the Light name
 * spelled backwards, with the first letter capitalised. Names are plain ASCII letters.
 */
const mirrored = (light: string): string => {
  const reversed = light.toLowerCase().split('').reverse().join('');
  return reversed.charAt(0).toUpperCase() + reversed.slice(1);
};

const UNNAMED = ['assassin', 'knight', 'paladin', 'colossus', 'juggernaut'] as const;

describe('LEGEND_SPECS', () => {
  it('lists the eight Legends in class order, then the Figma order for the Magus', () => {
    expect(LEGEND_SPECS.ids).toEqual([
      'assassin',
      'knight',
      'paladin',
      'colossus',
      'juggernaut',
      'catalyst',
      'oracle',
      'necromancer',
    ]);
    expect(LEGEND_SPECS.all().map((spec) => spec.classId)).toEqual([
      'warrior',
      'warrior',
      'warrior',
      'sentinel',
      'sentinel',
      'magus',
      'magus',
      'magus',
    ]);
  });

  it('gives each Legend its sub-class title, one string for both teams (DEC-49)', () => {
    expect(LEGEND_SPECS.all().map((spec) => spec.displayName)).toEqual([
      'Zealot',
      'Templar',
      'Paladin',
      'Colossus',
      'Bulwark',
      'Catalyst',
      'Oracle',
      'Heretic',
    ]);
  });

  it('names only the three Magus Legends, with both team names stored', () => {
    expect(LEGEND_SPECS.get('catalyst').legendName).toEqual({ light: 'Veridan', dark: 'Nadirev' });
    expect(LEGEND_SPECS.get('oracle').legendName).toEqual({ light: 'Elarion', dark: 'Noirale' });
    expect(LEGEND_SPECS.get('necromancer').legendName).toEqual({
      light: 'Avedrin',
      dark: 'Nirdeva',
    });
    for (const id of UNNAMED) {
      expect(LEGEND_SPECS.get(id).legendName).toBeNull();
    }
  });

  it('stores every Dark name as its Light name spelled backwards (the mirror rule)', () => {
    const named = LEGEND_SPECS.all().flatMap((spec) =>
      spec.legendName === null ? [] : [spec.legendName],
    );

    expect(named).toHaveLength(3);
    for (const { light, dark } of named) {
      expect(dark).toBe(mirrored(light));
    }
  });

  it('gives the Oracle the Figma Cantor data with its title word changed (CD-26)', () => {
    const oracle = LEGEND_SPECS.get('oracle');

    expect(oracle.roleLabel).toBe('Support');
    // The prose names the title: built from `displayName`, a title renamed without it fails here.
    expect(oracle.description).toBe(
      `A voice of the Unison. The ${oracle.displayName} bends the Aether into chants that ` +
        'strengthen allies and sap the will of the enemy, healing, warding, and stripping the ' +
        'courage from enemy Host.',
    );
    expect(oracle.roleRatings?.damage).toBe(152 / 395);
    expect(oracle.roleRatings?.support).toBe(333 / 395);
    expect(oracle.roleRatings?.control).toBe(201 / 395);
    // DEC-65: the Ultimate on top, then abilities 1 to 3, and no Aetheric Recall (the class's
    // default ability); DEC-103: Unison Ward is ability 1, a preview until next sprint's abilities.
    expect(oracle.detailNames).toEqual({
      ultimate: 'Severed Accord',
      'ability-1': 'Unison Ward',
      'ability-2': null,
      'ability-3': null,
    });
  });

  it("uses the owner's Sentinel descriptions and writes none for the warrior Legends", () => {
    expect(LEGEND_SPECS.get('colossus').description).toBe(
      'Heaviest, slowest, strongest — a walking tank that specialises in fortifications.',
    );
    expect(LEGEND_SPECS.get('juggernaut').description).toBe(
      'A siege-breaker — faster, lower health, used to assault front lines.',
    );
    for (const id of ['assassin', 'knight', 'paladin'] as const) {
      expect(LEGEND_SPECS.get(id).description).toBeNull();
    }
  });

  it('invents no role, ratings or detail names where the sources give none', () => {
    for (const id of [...UNNAMED, 'catalyst', 'necromancer']) {
      const spec = LEGEND_SPECS.get(id);

      expect(spec.roleLabel).toBeNull();
      expect(spec.roleRatings).toBeNull();
      expect(spec.detailNames).toEqual({
        ultimate: null,
        'ability-1': null,
        'ability-2': null,
        'ability-3': null,
      });
    }
    expect(LEGEND_SPECS.get('catalyst').description).toBeNull();
    expect(LEGEND_SPECS.get('necromancer').description).toBeNull();
  });

  it('makes every Legend selectable (DEC-49)', () => {
    expect(LEGEND_SPECS.all().filter((spec) => !spec.isSelectable)).toEqual([]);
  });

  it('offers at least one Legend for every MVP class', () => {
    for (const classId of LEGEND_CLASSES.ids) {
      expect(LEGEND_SPECS.all().some((spec) => spec.classId === classId)).toBe(true);
    }
  });

  it('never ships the retired or replaced ids', () => {
    for (const id of ['mage', 'druid', 'cantor', 'gravecaller']) {
      expect(LEGEND_SPECS.has(id)).toBe(false);
    }
  });
});
