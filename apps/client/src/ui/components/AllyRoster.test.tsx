import { describe, expect, it } from 'vitest';

import type { AllyTile } from '../../bridge/selectors/selectAllyTiles';
import { accessibleNames, renderWithStore } from '../testStore';
import { AllyRoster } from './AllyRoster';
import styles from './AllyRoster.module.css';
import rosterCss from './AllyRoster.module.css?raw';

/** A team of ten: the player, a Legend bot and eight bots on a class (62:201's count, FR-046). */
const TILES: readonly AllyTile[] = Array.from({ length: 10 }, (_, index): AllyTile => {
  if (index === 0) {
    return {
      legendId: 'player',
      displayName: 'Player',
      isPlayer: true,
      classId: null,
      classDisplayName: null,
      specId: null,
      state: 'undecided',
      imageAssetId: null,
      accentToken: null,
    };
  }
  const isLegend = index === 6;
  return {
    legendId: `ally-${String(index + 1)}`,
    displayName: `Ally ${String(index + 1)}`,
    isPlayer: false,
    classId: 'magus',
    classDisplayName: 'Magus',
    specId: isLegend ? 'necromancer' : null,
    state: isLegend ? 'legend' : 'class',
    imageAssetId: isLegend ? 'necromancer-portrait' : 'magus-sigil',
    accentToken: isLegend ? '--legend-necromancer-accent' : '--class-magus-accent',
  };
});

describe('AllyRoster', () => {
  it('lists every ally as a tile in roster order, named by its label', () => {
    const html = renderWithStore(
      <AllyRoster
        tiles={TILES}
        layout="class-step"
        label="Light team"
        playerSigilAssetId="magus-sigil"
      />,
    );

    expect(html).toMatch(
      new RegExp(
        `^(?:<link [^>]*/>)*<ul class="${String(styles.roster)}" data-layout="class-step" aria-label="Light team">`,
      ),
    );
    expect(html.match(/<li /g)).toHaveLength(10);
    expect([...html.matchAll(/data-look="([^"]+)"/g)].map(([, look]) => look)).toEqual([
      'player',
      'idle',
      'idle',
      'idle',
      'idle',
      'idle',
      'legend',
      'idle',
      'idle',
      'idle',
    ]);
    expect(html).toContain('src="/assets/test/magus-sigil@player-tile.webp"');
  });

  it('gives the Legend step its own column and the player’s enlarged tile', () => {
    const html = renderWithStore(
      <AllyRoster tiles={TILES} layout="legend-step" label="Dark team" />,
    );

    expect(html).toContain('data-layout="legend-step"');
    expect(html).toContain('data-look="player-picked"');
    expect(html).not.toContain('@player-tile.webp');
  });

  it('places the columns at 62:201 (x 1775) and 58:342 (x 1755) on a 75 px pitch', () => {
    expect(rosterCss).toMatch(/\.roster \{[^}]*top: 173px;[^}]*gap: 15px;/);
    expect(rosterCss).toMatch(/\.roster\[data-layout='class-step'\] \{\s*left: 1775px;/);
    expect(rosterCss).toMatch(/\.roster\[data-layout='legend-step'\] \{\s*left: 1755px;/);
  });

  it('is a named list for assistive technology', () => {
    const html = renderWithStore(
      <AllyRoster tiles={TILES.slice(0, 2)} layout="class-step" label="Light team" />,
    );

    expect(html).toContain('aria-label="Light team"');
    expect(accessibleNames(html, 'button')).toEqual([]);
  });
});
