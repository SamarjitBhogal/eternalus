/** Cosmetic-only spell colours, particle counts and animation rates. */
export const ABILITY_ART = {
  light: '#a8eeff',
  dark: '#ce9bff',
  healingFill: 'rgba(80,235,197,0.12)',
  healingEdge: '#8dffe0',
  healingCore: '#ecfff5',
  beamFill: 'rgba(246,215,135,0.35)',
  beamCore: '#fff6d6',
  wallFill: 'rgba(111,180,245,0.32)',
  particles: 12,
  beamBands: 8,
  outline: 2,
  coreWidth: 3,
  rotationRate: 0.3,
  pulseRate: 3,
  moteSize: 0.22,
  bladeSize: 0.65,
  bladeTrail: 1.5,
} as const;

/** Art variation is data keyed by the spawned definition, not gameplay branching in a view. */
export const ABILITY_FIELD_STYLES: Readonly<Record<string, { readonly isHealing: boolean }>> = {
  'sanctuary-field': { isHealing: true },
  'death-ray-field': { isHealing: false },
};
