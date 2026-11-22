import type { LegendSpecDefinition } from './legendSpecs.types';

/**
 * A warrior Legend whose sub-class title is its `displayName` (content id `assassin`; DEC-49). The title
 * is the same on both teams. The Legend has no name yet (`legendName: null`): only its class and
 * sub-class title exist, so its description, role, ratings and detail rows are not written.
 */
export const ASSASSIN = {
  id: 'assassin',
  classId: 'warrior',
  isSelectable: true,
  displayName: 'Zealot',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings: null,
  detailNames: { ultimate: null, 'ability-1': null, 'ability-2': null, 'ability-3': null },
  kit: null, // the class default kit; no Legend has its own yet
  secondaryWeaponId: 'obsidian-bow', // DEC-303: the Zealot's bow, beside the class's talons
  artifacts: ['weapon-swap', null], // DEC-303; gadget-1 (Z): INBOX.md HC-Q80 (A)
} as const satisfies LegendSpecDefinition;
