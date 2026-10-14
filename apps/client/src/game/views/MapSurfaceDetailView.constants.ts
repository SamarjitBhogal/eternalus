import type { SurfaceMaterial } from './MapSurfaceDetailView.types';
/** Material detail dimensions are in world units so walking never stretches their scale. */
export const SURFACE_MATERIALS: readonly SurfaceMaterial[] = [
  {
    tokens: ['carpet', 'banner', 'cushion', 'bedchamber-cover'],
    step: 0.65,
    height: 0.035,
    hasSeams: false,
    isSparse: false,
    isWater: false,
  },
  {
    tokens: ['roof', 'great-hall'],
    step: 1,
    height: 0.82,
    hasSeams: true,
    isSparse: false,
    isWater: false,
  },
  {
    tokens: ['floor', 'wall', 'foundation', 'gate-bridge', 'court'],
    step: 1.4,
    height: 1.2,
    hasSeams: true,
    isSparse: false,
    isWater: false,
  },
  {
    tokens: ['surface-meadow', 'clearing', 'street', 'road', 'tree-', 'snow-', 'hill-'],
    step: 1.4,
    height: 0.05,
    hasSeams: false,
    isSparse: true,
    isWater: false,
  },
  {
    tokens: ['lake-', 'lava-flow', 'lava-core'],
    step: 2,
    height: 0.045,
    hasSeams: false,
    isSparse: false,
    isWater: true,
  },
];
