import { describe, expect, it } from 'vitest';

import type { MapFeature } from '../content/maps/maps.types';
import { CAMP_ART, campHalfExtent, isCampArtKind } from './campArtByKind';
import type { CampArtKind } from './campArtByKind';

const KINDS: readonly CampArtKind[] = ['camp', 'corner-camp'];

const featureAt = (kind: CampArtKind, x: number): MapFeature => ({
  id: `east-${kind}`,
  kind,
  team: 'neutral',
  definitionId: kind,
  position: { x, y: 450 },
  minimapGlyph: { shape: 'dot', size: 1, colourRole: 'neutral' },
});

describe('campArtByKind', () => {
  it('knows the camp kinds and no other kind', () => {
    expect(KINDS.every(isCampArtKind)).toBe(true);
    expect(isCampArtKind('spawner-tower')).toBe(false);
  });

  it('measures each camp box from its art (DEC-238 art, DEC-321 one source)', () => {
    // A change here is a change to the camp art: the generator then clears forts by the new box.
    expect(campHalfExtent('camp')).toEqual({ x: 27, y: 27 });
    expect(campHalfExtent('corner-camp')).toEqual({ x: 39, y: 58 });
  });

  it('keeps the mirrored art of a Dark side camp inside the same box', () => {
    for (const kind of KINDS) {
      const feature = featureAt(kind, 1200);
      const half = campHalfExtent(kind);
      const points = CAMP_ART[kind](feature, 1600).flatMap(({ shape }) => shape);

      for (const { x, y } of points) {
        expect(Math.abs(x - feature.position.x)).toBeLessThanOrEqual(half.x + 1e-9);
        expect(Math.abs(y - feature.position.y)).toBeLessThanOrEqual(half.y + 1e-9);
      }
    }
  });
});
