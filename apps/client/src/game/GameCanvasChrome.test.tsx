import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { GameCanvasLabels } from './GameCanvas.types';
import { GameCanvasChrome } from './GameCanvasChrome';

/** The labels `main.tsx` passes (`STRINGS.viewport`; `game/` never imports `ui/`). */
const LABELS: GameCanvasLabels = {
  canvas: 'Battlefield',
  explorer: {
    canvas: 'Drag to explore, scroll to zoom, click a building to toggle its roof',
    hint: 'Drag to explore · Scroll to zoom · Click a building to toggle its roof',
    overview: 'World overview',
    restoreRoofs: 'Restore roofs & overview',
    legend: { stronghold: (teamName) => `${teamName} stronghold`, camps: 'Neutral camps' },
  },
};
/** Team names no shipped content uses, so a legend naming them can only come from `teamNames`. */
const TEAM_NAMES = { light: 'Lux', dark: 'Umbra' };

/**
 * Renders what `GameCanvas` draws over the canvas for a chrome state its hook can only reach in a
 * browser (a roof cut away once the match reports it).
 */
function renderChrome(options: {
  readonly isExplorerShown: boolean;
  readonly hasOpenRoofs: boolean;
}): string {
  return renderToStaticMarkup(
    <GameCanvasChrome
      isExplorerShown={options.isExplorerShown}
      hasOpenRoofs={options.hasOpenRoofs}
      labels={LABELS}
      teamNames={TEAM_NAMES}
      onOverview={() => undefined}
    />,
  );
}

describe('GameCanvasChrome', () => {
  it('draws nothing in normal play, even with a roof cut away', () => {
    expect(renderChrome({ isExplorerShown: false, hasOpenRoofs: true })).toBe('');
  });

  it('offers to restore the roofs in the developer toolbar while a roof is cut away', () => {
    const html = renderChrome({ isExplorerShown: true, hasOpenRoofs: true });
    expect(html).toContain('Click a building to toggle its roof');
    expect(html).toContain('Restore roofs &amp; overview');
    expect(renderChrome({ isExplorerShown: true, hasOpenRoofs: false })).toContain(
      'World overview',
    );
  });

  it('names each stronghold in the developer legend after the content team names', () => {
    const html = renderChrome({ isExplorerShown: true, hasOpenRoofs: false });
    expect(html).toContain('Lux stronghold');
    expect(html).toContain('Umbra stronghold');
    expect(html).not.toContain('Light stronghold');
  });
});
