import { kitOf, loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { kitDetailRows, kitRows } from './kitRows';

const CONTENT = loadDisplayContent();
const legend = (id: string) => {
  const found = CONTENT.legends.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`no class ${id}`);
  return found;
};
const spec = (id: string) => {
  const found = CONTENT.specs.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`no spec ${id}`);
  return found;
};

describe('kitOf', () => {
  it("is the class's default kit for a spec with no kit of its own", () => {
    expect(kitOf(spec('oracle'), legend('magus'))).toBe(legend('magus').defaultKit);
  });

  it("is the spec's own kit when it has one", () => {
    const own = { abilities: ['slam', 'shockwave', 'imbue'], ultimate: 'death-ray' } as const;
    expect(kitOf({ ...spec('oracle'), kit: own }, legend('magus'))).toBe(own);
  });
});

describe('kitRows', () => {
  const rows = kitRows(legend('warrior').defaultKit, CONTENT.abilities);

  it('lists abilities 1 to 3 then the ultimate on ability-4, with name, description, cost and cooldown', () => {
    expect(rows.map(({ slot, abilityId }) => [slot, abilityId])).toEqual([
      ['ability-1', 'blade-runner'],
      ['ability-2', 'veil'],
      ['ability-3', 'hamstring'],
      ['ability-4', 'fury'],
    ]);
    expect(rows[0]).toMatchObject({
      displayName: 'Blade Runner',
      cost: { kind: 'aether', amount: 35 },
      cooldownSeconds: 12,
      isAvailable: true,
    });
    expect(rows[0]?.description).toMatch(/^Dash forward/);
  });

  it('marks an ability with no effects as not available', () => {
    expect(rows[1]).toMatchObject({ abilityId: 'veil', isAvailable: false });
  });

  it('shows the ultimate as charge-based, never as 0 aether or a 0 s cooldown', () => {
    expect(rows[3]).toMatchObject({ cost: { kind: 'charge' }, cooldownSeconds: null });
  });

  it('throws naming an ability the catalogue lacks', () => {
    expect(() =>
      kitRows({ abilities: ['nope', 'veil', 'hamstring'], ultimate: 'fury' }, CONTENT.abilities),
    ).toThrow('"nope"');
  });
});

describe('kitDetailRows', () => {
  it("puts the ultimate first, then abilities 1 to 3, with the kit's names over the icons", () => {
    const rows = kitRows(legend('magus').defaultKit, CONTENT.abilities);
    const details = kitDetailRows(rows, { ultimate: 'icon-u', 'ability-2': 'icon-2' });
    expect(
      details.map(({ slot, displayName, iconAssetId }) => [slot, displayName, iconAssetId]),
    ).toEqual([
      ['ultimate', 'Death Ray', 'icon-u'],
      ['ability-1', 'Shockwave', null],
      ['ability-2', 'Sanctuary', 'icon-2'],
      ['ability-3', 'Imbue', null],
    ]);
    expect(details[0]?.kit).toBe(rows[3]);
  });
});
