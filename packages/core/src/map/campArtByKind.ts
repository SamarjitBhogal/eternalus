import type { MapDecoration, MapFeature, MapFeatureKind } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapCampBuilder } from './MapCampBuilder';
import { NeutralCampBuilder } from './NeutralCampBuilder';

/** The camp kinds the generator places and keeps clear of the lane tower forts. */
export type CampArtKind = 'camp' | 'corner-camp';

/**
 * The art of each camp kind round the camp's point, mirrored when `mirrorWidth` is given: a
 * forest camp is a woodland circle, a corner camp a shrine (DEC-238). `MapSceneryBuilder` draws
 * it, and `campHalfExtent` measures it.
 */
export const CAMP_ART: Readonly<
  Record<CampArtKind, (feature: MapFeature, mirrorWidth?: number) => readonly MapDecoration[]>
> = {
  camp: (feature, mirrorWidth) => new NeutralCampBuilder().build(feature, mirrorWidth),
  'corner-camp': (feature, mirrorWidth) =>
    new MapCampBuilder().build(feature, 'corner', mirrorWidth),
};

/** Whether a feature of `kind` is drawn as a camp (`CAMP_ART`). */
export const isCampArtKind = (kind: MapFeatureKind): kind is CampArtKind =>
  Object.hasOwn(CAMP_ART, kind);

/**
 * Half the box that a camp's art fills round the camp's point, in sketch units. It comes from the
 * art itself (`CAMP_ART`), so the box that the generator keeps clear of the lane tower forts
 * (`clearCampOfForts`, DEC-315) and the art cannot drift apart (DEC-321). The box is centred on
 * the point, so it also holds the art that the Dark side draws mirrored.
 */
export const campHalfExtent = (kind: CampArtKind): Vec2 => {
  // Only the id, kind, team and position reach the camp builders; the art is placed at the origin.
  const anchor: MapFeature = {
    id: kind,
    kind,
    team: 'neutral',
    definitionId: kind,
    position: { x: 0, y: 0 },
    minimapGlyph: { shape: 'dot', size: 1, colourRole: 'neutral' },
  };
  const points = CAMP_ART[kind](anchor).flatMap(({ shape }) => shape);
  return {
    x: Math.max(...points.map(({ x }) => Math.abs(x))),
    y: Math.max(...points.map(({ y }) => Math.abs(y))),
  };
};
