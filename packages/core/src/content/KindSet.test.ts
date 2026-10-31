import { describe, expect, it } from 'vitest';

import { LEGEND_KINDS } from './legends/legendKinds';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { MOB_DEFINITIONS } from './mobs/mobCatalogue';
import { MOB_KINDS } from './mobs/mobKinds';

describe('KindSet', () => {
  it('tells Legends and mobs apart by kind, covering every shipped definition', () => {
    expect(LEGEND_CLASSES.all().every((legend) => LEGEND_KINDS.has(legend))).toBe(true);
    expect(MOB_DEFINITIONS.all().every((mob) => MOB_KINDS.has(mob))).toBe(true);
    expect(LEGEND_KINDS.has(MOB_DEFINITIONS.get('light-minion'))).toBe(false);
    expect(MOB_KINDS.has(LEGEND_CLASSES.get('warrior'))).toBe(false);
  });

  it('answers for a bare kind', () => {
    expect(LEGEND_KINDS.hasKind('warrior')).toBe(true);
    expect(MOB_KINDS.hasKind('heavy-mob')).toBe(true);
    expect(MOB_KINDS.hasKind('warrior')).toBe(false);
  });
});
