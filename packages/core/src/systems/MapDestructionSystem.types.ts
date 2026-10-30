import type { DamageSource } from '../state/GameEvents.types';

/** A lethal building hit whose owned walls and furnishings must share its collapse. */
export type BuildingCollapse = { readonly buildingId: string; readonly source: DamageSource };
