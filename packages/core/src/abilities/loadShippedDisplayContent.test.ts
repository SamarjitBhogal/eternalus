import { describe, expect, it } from 'vitest';

import { ABILITIES } from '../content/abilities/abilityCatalogue';
import type { AuthoredAbility } from '../content/abilities/AbilityDefinition.types';
import { BLADE_RUNNER } from '../content/abilities/bladeRunner';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
import { loadShippedDisplayContent } from './loadShippedDisplayContent';

const area = (radius: number) => ({ kind: 'circle', radius }) as const;

describe('loadShippedDisplayContent', () => {
  it("carries each effect step's area from its strategy, a dash's steps after the dash itself", () => {
    const steps = (id: string) =>
      loadShippedDisplayContent().abilities.find((ability) => ability.id === id)?.steps;

    expect(steps('blade-runner')).toEqual([
      { kind: 'dash', shape: { kind: 'path', width: 1.5 }, distance: 8 },
      { kind: 'damage', shape: { kind: 'path', width: 1.5 } },
      { kind: 'knockback', shape: { kind: 'path', width: 1.5 } },
      { kind: 'debuff', shape: area(1.5) },
    ]);
    expect(steps('slam')).toEqual([
      { kind: 'damage', shape: area(4) },
      { kind: 'knockback', shape: area(4) },
    ]);
    expect(steps('shockwave')).toEqual([
      { kind: 'damage', shape: area(5) },
      { kind: 'knockback', shape: area(5) },
      { kind: 'debuff', shape: area(5) },
    ]);
  });

  it('draws a dash whose path steps have no path area as a lane 0 m wide', () => {
    const blink = {
      ...BLADE_RUNNER,
      id: 'blink',
      effects: [
        {
          kind: 'dash',
          distance: 6,
          durationSeconds: 0.2,
          onPath: [{ kind: 'debuff', statusId: 'stun', shape: area(2) }],
          onEnd: [],
        },
      ],
    } as const;

    const [display] = loadShippedDisplayContent({
      abilities: new ContentCatalogue<AuthoredAbility>([...ABILITIES.all(), blink]),
    }).abilities.filter(({ id }) => id === 'blink');

    expect(display?.steps).toEqual([
      { kind: 'dash', shape: { kind: 'path', width: 0 }, distance: 6 },
      { kind: 'debuff', shape: area(2) },
    ]);
  });

  it('gives an ability with no effects (not built) no steps, and the rest of the display content', () => {
    const content = loadShippedDisplayContent();

    for (const ability of content.abilities.filter((entry) => !entry.isAvailable)) {
      expect(ability.steps).toEqual([]);
    }
    expect(content.specs).toEqual(LEGEND_SPECS.all());
  });
});
