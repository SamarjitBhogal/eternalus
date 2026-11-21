import { describe, expect, it } from 'vitest';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { RosterEntry } from '../../bridge/events';
import {
  type AllyTile as AllyTileView,
  selectAllyTiles,
} from '../../bridge/selectors/selectAllyTiles';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { createAppStore } from '../../bridge/store';
import { renderWithStore, TEST_CONTENT } from '../testStore';
import type { AllyRosterLayout } from './AllyRoster.types';
import { AllyTile } from './AllyTile';
import styles from './AllyTile.module.css';
import tileCss from './AllyTile.module.css?raw';

const tile = (overrides: Partial<AllyTileView>): AllyTileView => ({
  legendId: 'ally-3',
  displayName: 'Ally 3',
  isPlayer: false,
  classId: 'warrior',
  classDisplayName: 'Vanguard',
  specId: null,
  state: 'class',
  imageAssetId: 'warrior-sigil',
  accentToken: '--class-warrior-accent',
  ...overrides,
});

const PLAYER_UNDECIDED = tile({
  legendId: 'player',
  displayName: 'Player',
  isPlayer: true,
  classId: null,
  classDisplayName: null,
  state: 'undecided',
  imageAssetId: null,
  accentToken: null,
});
const PLAYER_ORACLE = tile({
  legendId: 'player',
  displayName: 'Player',
  isPlayer: true,
  classId: 'magus',
  classDisplayName: 'Magus',
  specId: 'oracle',
  state: 'legend',
  imageAssetId: 'oracle-portrait',
  accentToken: '--legend-oracle-accent',
});
const BOT_NECROMANCER = tile({
  classId: 'magus',
  classDisplayName: 'Magus',
  specId: 'necromancer',
  state: 'legend',
  imageAssetId: 'necromancer-portrait',
  accentToken: '--legend-necromancer-accent',
});

/** A bot on the locked harbinger class (TEST_CONTENT names it Harbinger). */
const HARBINGER_BOT: RosterEntry = {
  legendId: 'ally-3',
  displayName: 'Ally 3',
  classId: 'harbinger',
  specId: null,
  isBot: true,
  isPlayer: false,
  isRover: false,
  team: 'light',
};

/** Server-renders the tiles `selectAllyTiles` builds for `HARBINGER_BOT` over `legendClasses`. */
const renderSelected = (legendClasses: readonly LegendClassCard[]): string => {
  const store = createAppStore({ content: { ...TEST_CONTENT, legendClasses } });
  store.dispatch(matchSetupSlice.actions.setRosters({ allies: [HARBINGER_BOT], enemies: [] }));
  return renderWithStore(
    <>
      {selectAllyTiles(store.getState()).map((view) => (
        <AllyTile key={view.legendId} tile={view} layout="class-step" playerSigilAssetId={null} />
      ))}
    </>,
  );
};

const render = (view: AllyTileView, layout: AllyRosterLayout, sigil: string | null = null) =>
  renderWithStore(<AllyTile tile={view} layout={layout} playerSigilAssetId={sigil} />);
const imageClassOf = (html: string): string => /<img [^>]*class="([^"]+)"/.exec(html)?.[1] ?? '';

describe('AllyTile', () => {
  it('draws the class step player tile with the local pick’s sigil at 85 % and names it "You"', () => {
    const html = render(PLAYER_UNDECIDED, 'class-step', 'magus-sigil');

    expect(html).toMatch(/^(?:<link [^>]*\/>)*<li class="[^"]+" data-look="player">/);
    expect(html).toContain('src="/assets/test/magus-sigil@player-tile.webp"');
    expect(imageClassOf(html)).toBe(`${String(styles.image)} ${String(styles.sigil)}`);
    expect(html).toContain(`<span class="${String(styles.srOnly)}">You</span>`);
  });

  it('leaves the player tile empty before a pick (border only)', () => {
    expect(render(PLAYER_UNDECIDED, 'class-step')).not.toContain('<img');
  });

  it('draws the Legend step player tile enlarged with its portrait, the Legend accent and no fade', () => {
    const html = render(PLAYER_ORACLE, 'legend-step');

    expect(html).toContain('data-look="player-picked"');
    expect(html).toContain('style="--tile-accent:var(--legend-oracle-accent)"');
    expect(html).toContain('src="/assets/test/oracle-portrait@player-tile-picked.webp"');
    expect(imageClassOf(html)).toBe(String(styles.image));
    expect(html).toContain('>You, Magus</span>');
  });

  it('fades the Legend step player tile’s sigil while no Legend is picked', () => {
    const html = render(
      {
        ...PLAYER_ORACLE,
        specId: null,
        state: 'class',
        imageAssetId: 'magus-sigil',
        accentToken: '--class-magus-accent',
      },
      'legend-step',
    );

    expect(html).toContain('src="/assets/test/magus-sigil@player-tile-picked.webp"');
    expect(html).toContain('style="--tile-accent:var(--class-magus-accent)"');
    expect(imageClassOf(html)).toContain(String(styles.sigil));
  });

  it('draws a bot with a Legend as its portrait with the Legend accent, unfaded', () => {
    const html = render(BOT_NECROMANCER, 'class-step');

    expect(html).toContain('data-look="legend"');
    expect(html).toContain('style="--tile-accent:var(--legend-necromancer-accent)"');
    expect(html).toContain('src="/assets/test/necromancer-portrait@ally-tile.webp"');
    expect(imageClassOf(html)).toBe(String(styles.image));
    expect(html).toContain('>Ally 3, Magus</span>');
  });

  it('draws any other bot idle: its class sigil at 85 %, no accent', () => {
    const html = render(tile({}), 'legend-step');

    expect(html).toContain('data-look="idle"');
    expect(html).toContain('src="/assets/test/warrior-sigil@ally-tile.webp"');
    expect(html).toContain('>Ally 3, Vanguard</span>');
    expect(imageClassOf(html)).toBe(`${String(styles.image)} ${String(styles.sigil)}`);
    expect(html).not.toContain('--tile-accent');
  });

  it('names a tile by its class from the catalogue, by its name alone while the catalogue lacks it', () => {
    const named = renderSelected(TEST_CONTENT.legendClasses);
    const unnamed = renderSelected([]);

    expect(named).toContain(`<span class="${String(styles.srOnly)}">Ally 3, Harbinger</span>`);
    expect(unnamed).toContain(`<span class="${String(styles.srOnly)}">Ally 3</span>`);
  });

  it('draws images at the tile box with no fit, crop or under-fill (I-45, I-16)', () => {
    const imageRule = /\n\.image \{([^}]*)\}/.exec(tileCss)?.[1] ?? 'missing';

    expect(imageRule).toMatch(/width: 60px;\s*height: 60px;/);
    expect(tileCss).not.toMatch(
      /object-fit|object-position|transform|translate|radial-gradient|underfill/,
    );
    expect(tileCss).toMatch(/\.sigil \{\s*opacity: 0\.85;/);
    expect(tileCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });
});
