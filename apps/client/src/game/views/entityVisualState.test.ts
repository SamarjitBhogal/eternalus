import { describe, expect, it } from 'vitest';
import type { EntityDrawState } from './EntityView.types';
import { withVisualRadius } from './entityVisualState';

describe('withVisualRadius', () => {
  it('changes only the copied display radius, retaining absent transforms', () => {
    const state: EntityDrawState = {
      entity: {
        id: 'hero',
        kind: 'warrior',
        family: 'legend',
        definitionId: 'warrior',
        team: 'light',
        transform: { x: 1, y: 2, radius: 0.5 },
        health: null,
        progression: null,
        aether: null,
        area: null,
        capture: null,
      },
      position: { x: 1, y: 2 },
      isFocused: true,
    };
    const visual = withVisualRadius(state, 3);
    expect(visual.entity.transform).toEqual({ x: 1, y: 2, radius: 3 });
    expect(state.entity.transform?.radius).toBe(0.5);
    expect(visual.position).toBe(state.position);
    expect(
      withVisualRadius({ ...state, entity: { ...state.entity, transform: null } }, 3).entity
        .transform,
    ).toBeNull();
  });
});
