import type { AuthoredArtifact } from './artifacts.types';
import { WEAPON_SWAP } from './weaponSwap';

/**
 * Every artifact as authored (05 §11, the gadgets on Z and C); a new artifact is a file and a line
 * here (17 R10). `abilityCatalogue.ts` lists them after the abilities, so the ability registry
 * resolves a gadget slot from the same catalogue as every other slot.
 */
export const ARTIFACTS: readonly AuthoredArtifact[] = [WEAPON_SWAP];
