import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GameCanvas } from './GameCanvas';
import css from './GameCanvas.module.css?raw';
import type { GameCanvasLabels } from './GameCanvas.types';
import { GameCanvasChrome } from './GameCanvasChrome';

/** The labels `main.tsx` passes (`STRINGS.viewport`; `game/` never imports `ui/`). */
const LABELS: GameCanvasLabels = {
  canvas: 'Battlefield',
  leaveCathedral: 'Leave cathedral',
  explorer: {
    canvas: 'Drag to explore, scroll to zoom, click the cathedral to enter',
    worldHint: 'Drag to explore · Scroll to zoom · Click cathedral to enter',
    interiorHint: 'Drag to explore · Scroll to zoom · Explore the sanctuary',
    overview: 'World overview',
    legend: { light: 'Light stronghold', dark: 'Dark stronghold', camps: 'Neutral camps' },
  },
};

/** Renders the viewport on the server (its attach effect runs only in a browser). */
function render(isExplorerShown: boolean): string {
  return renderToStaticMarkup(
    <GameCanvas attach={() => () => undefined} isExplorerShown={isExplorerShown} labels={LABELS} />,
  );
}

/**
 * Renders what `GameCanvas` draws over the canvas for a chrome state its hook can only reach in a
 * browser (inside the interior once the match reports it).
 */
function renderChrome(options: {
  readonly isExplorerShown: boolean;
  readonly isInterior: boolean;
}): string {
  return renderToStaticMarkup(
    <GameCanvasChrome
      isExplorerShown={options.isExplorerShown}
      isInterior={options.isInterior}
      labels={LABELS}
      onOverview={() => undefined}
      onLeaveInterior={() => undefined}
    />,
  );
}

describe('GameCanvas', () => {
  it('renders only the battlefield canvas in normal play', () => {
    const html = render(false);
    expect(html).toContain('<canvas');
    expect(html).toContain('aria-label="Battlefield"');
    expect(html).not.toContain('World overview');
    expect(html).not.toContain('Light stronghold');
    expect(html).not.toContain('Leave cathedral');
  });

  it('shows the explorer toolbar and the map legend with the developer flag', () => {
    const html = render(true);
    expect(html).toContain('World overview');
    expect(html).toContain('Light stronghold');
  });

  it('offers Leave cathedral inside the interior in normal play, outside the toolbar', () => {
    const html = renderChrome({ isExplorerShown: false, isInterior: true });
    expect(html).toMatch(
      /^<button type="button" class="[^"]*leaveInterior[^"]*">Leave cathedral<\/button>$/,
    );
    expect(html).not.toContain('toolbar');
  });

  it('keeps the developer toolbar inside the interior, with its interior hint and no Leave control', () => {
    const html = renderChrome({ isExplorerShown: true, isInterior: true });
    expect(html).toContain('Explore the sanctuary');
    expect(html).toContain('World overview');
    expect(html).not.toContain('Leave cathedral');
  });

  it('styles the Leave control from tokens only (I-75)', () => {
    const rule = /\.leaveInterior \{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).not.toBe('');
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(rule).toContain('var(--font-game)');
    expect(rule).toContain('var(--text-min)');
  });
});
