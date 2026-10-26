import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GameCanvas } from './GameCanvas';
import type { GameCanvasLabels } from './GameCanvas.types';

/** The labels `main.tsx` passes (`STRINGS.viewport`; `game/` never imports `ui/`). */
const LABELS: GameCanvasLabels = {
  canvas: 'Battlefield',
  leaveCathedral: 'Leave cathedral',
  explorer: {
    canvas: 'Drag to explore, scroll to zoom, click the cathedral to enter',
    worldHint: 'Drag to explore · Scroll to zoom · Click cathedral to enter',
    interiorHint: 'Drag to explore · Scroll to zoom · Explore the sanctuary',
    overview: 'World overview',
    legend: { stronghold: (teamName) => `${teamName} stronghold`, camps: 'Neutral camps' },
  },
};

/** Renders the viewport on the server (its attach effect runs only in a browser). */
function render(isExplorerShown: boolean): string {
  return renderToStaticMarkup(
    <GameCanvas
      attach={() => () => undefined}
      isExplorerShown={isExplorerShown}
      labels={LABELS}
      teamNames={{ light: 'Lux', dark: 'Umbra' }}
    />,
  );
}

describe('GameCanvas', () => {
  it('renders only the battlefield canvas in normal play', () => {
    const html = render(false);
    expect(html).toContain('<canvas');
    expect(html).toContain('aria-label="Battlefield"');
    expect(html).not.toContain('World overview');
    expect(html).not.toContain('Lux stronghold');
    expect(html).not.toContain('Leave cathedral');
  });

  it('shows the explorer toolbar and the map legend with the developer flag', () => {
    const html = render(true);
    expect(html).toContain('World overview');
    expect(html).toContain('Lux stronghold');
  });
});
