import type { MapObjectKind } from '@eternalus/core';
/** Presentation-only health bars and ruined materials; no simulation tuning. */
export const OBJECT_DRAWING = {
  barWidth: 8,
  barHeight: 0.5,
  barGap: 1,
  healthBarViewLimit: 500,
  barBackground: '#242823',
  barHealth: '#95b76c',
  rubbleShadow: '#3d4236',
  rubbleColors: {
    tree: '#6e5840',
    house: '#6e5840',
    furniture: '#6e5840',
    rock: '#777666',
    wall: '#777666',
    fort: '#777666',
    camp: '#6e5840',
    terrain: '#777666',
    stronghold: '#777666',
    cathedral: '#777666',
    'spawner-tower': '#777666',
    'buff-tower': '#777666',
    turret: '#777666',
    gate: '#6e5840',
  } satisfies Record<MapObjectKind, string>,
} as const;
