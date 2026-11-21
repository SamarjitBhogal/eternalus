import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { EntityDrawState } from './EntityView.types';
import { STRUCTURE_MARKERS } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { StructureView } from './StructureView';

const structure = (
  kind: string,
  health: { current: number; max: number } | null = { current: 3000, max: 3000 },
): EntityDrawState => ({
  entity: {
    id: 'entity-1',
    kind,
    family: 'structure',
    definitionId: kind,
    team: 'light',
    transform: { x: 5, y: 6, radius: 3, facing: { x: 1, y: 0 } },
    health,
    progression: null,
    aether: null,
    area: null,
    capture: null,
  },
  position: { x: 5, y: 6 },
  facing: { x: 1, y: 0 },
  isFocused: false,
});

describe('StructureView', () => {
  it.each(['spawner-tower', 'buff-tower'])('draws the %s marker in its team colour', (kind) => {
    const renderer = new RecordingRenderer();
    new StructureView().draw(structure(kind), renderer);
    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [STRUCTURE_MARKERS[kind], { x: 5, y: 6 }, TEAM_COLORS.light] },
    ]);
  });

  it('draws a spawner tower and a buff tower differently', () => {
    expect(STRUCTURE_MARKERS['spawner-tower']?.shape).not.toBe(
      STRUCTURE_MARKERS['buff-tower']?.shape,
    );
  });

  it('draws nothing for a dead tower', () => {
    const renderer = new RecordingRenderer();
    new StructureView().draw(structure('buff-tower', { current: 0, max: 2500 }), renderer);
    expect(renderer.calls).toEqual([]);
  });

  it('draws nothing for a structure kind without a marker, and nothing on the minimap', () => {
    const renderer = new RecordingRenderer();
    const view = new StructureView();
    view.draw(structure('gate'), renderer);
    view.drawMinimap();
    expect(renderer.calls).toEqual([]);
  });
});
