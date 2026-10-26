import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A Magus Legend whose sub-class title is "Oracle" (DEC-49; it replaces the Figma's "Cantor"), the
 * same on both teams. Its Legend is Elarion on the Light team and Noirale on the Dark team (both
 * owner-stated). The role line, description, ratings and detail rows are the Figma's Cantor data;
 * the description's one title word reads "Oracle" (register CD-26, pending the owner's HC-C1).
 */
export const ORACLE = {
  id: 'oracle',
  classId: 'magus',
  isSelectable: true,
  displayName: 'Oracle',
  legendName: { light: 'Elarion', dark: 'Noirale' },
  roleLabel: 'Support', // Figma 57:35
  description:
    'A voice of the Unison. The Oracle bends the Aether into chants that strengthen allies and ' +
    'sap the will of the enemy, healing, warding, and stripping the courage from enemy Host.', // Figma 56:35
  roleRatings: {
    damage: 152 / 395, // TUNE: Figma 58:323 fill 152 of 395 px (OQ-67)
    support: 333 / 395, // TUNE: Figma 58:323 fill 333 of 395 px (OQ-67)
    control: 201 / 395, // TUNE: Figma 58:323 fill 201 of 395 px (OQ-67)
  },
  detailNames: {
    signature: 'Aetheric Recall', // Figma 56:63
    specialty: 'Unison Ward', // Figma 56:57
    ultimate: 'Severed Accord', // Figma 56:51
  },
} as const satisfies LegendSpecDefinition;
