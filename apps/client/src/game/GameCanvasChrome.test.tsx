import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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
    legend: { stronghold: (teamName) => `${teamName} stronghold`, camps: 'Neutral camps' },
  },
};
/** Team names no shipped content uses, so a legend naming them can only come from `teamNames`. */
const TEAM_NAMES = { light: 'Lux', dark: 'Umbra' };

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
      teamNames={TEAM_NAMES}
      onOverview={() => undefined}
      onLeaveInterior={() => undefined}
    />,
  );
}

describe('GameCanvasChrome', () => {
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

  it('names each stronghold in the developer legend after the content team names', () => {
    const html = renderChrome({ isExplorerShown: true, isInterior: false });
    expect(html).toContain('Lux stronghold');
    expect(html).toContain('Umbra stronghold');
    expect(html).not.toContain('Light stronghold');
  });

  it('runs the leave action, never the overview, when Leave cathedral is clicked', () => {
    const actions: string[] = [];
    // The chrome holds no state, so calling it returns the element a render would draw.
    const control = GameCanvasChrome({
      isExplorerShown: false,
      isInterior: true,
      labels: LABELS,
      teamNames: TEAM_NAMES,
      onOverview: () => {
        actions.push('overview');
      },
      onLeaveInterior: () => {
        actions.push('leave-interior');
      },
    });
    if (!isValidElement<{ readonly children?: unknown; readonly onClick?: () => void }>(control)) {
      throw new Error('the chrome drew no Leave cathedral control');
    }

    control.props.onClick?.();

    expect({ type: control.type, label: control.props.children }).toEqual({
      type: 'button',
      label: 'Leave cathedral',
    });
    expect(actions).toEqual(['leave-interior']);
  });
});
