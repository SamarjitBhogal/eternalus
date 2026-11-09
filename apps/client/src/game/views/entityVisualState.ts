import type { EntityDrawState } from './EntityView.types';

/** A view-only radius override; the source snapshot, collision and simulation stay untouched. */
export const withVisualRadius = (state: EntityDrawState, radius: number): EntityDrawState => ({
  ...state,
  entity: {
    ...state.entity,
    transform: state.entity.transform === null ? null : { ...state.entity.transform, radius },
  },
});
