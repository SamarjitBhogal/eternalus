import type { MapDefinition } from './maps.types';
import { MAP_1_TERRAIN } from './map1Terrain';

/**
 * Map 1: a mirrored three-lane map with the Grand Cathedral in the centre.
 *
 * TUNE: every position and shape here is provisional. It was traced from the team's
 * layout sketch and scaled to a 1600 x 900 world. Light is on the west, Dark on the east.
 */
export const MAP_1: MapDefinition = {
  id: 'map-1',
  displayName: 'Map 1', // TUNE: placeholder name
  width: 1600,
  height: 900,
  lanes: [
    {
      id: 'north-lane',
      path: [
        { x: 85, y: 450 },
        { x: 180, y: 350 },
        { x: 295, y: 315 },
        { x: 480, y: 175 },
        { x: 645, y: 115 },
        { x: 800, y: 100 },
        { x: 955, y: 115 },
        { x: 1120, y: 175 },
        { x: 1305, y: 315 },
        { x: 1420, y: 350 },
        { x: 1515, y: 450 },
      ],
    },
    {
      id: 'middle-lane',
      path: [
        { x: 85, y: 450 },
        { x: 500, y: 455 },
        { x: 610, y: 485 },
        { x: 690, y: 440 },
        { x: 800, y: 450 },
        { x: 910, y: 440 },
        { x: 990, y: 485 },
        { x: 1100, y: 455 },
        { x: 1515, y: 450 },
      ],
    },
    {
      id: 'south-lane',
      path: [
        { x: 85, y: 450 },
        { x: 180, y: 550 },
        { x: 295, y: 585 },
        { x: 480, y: 725 },
        { x: 645, y: 785 },
        { x: 800, y: 800 },
        { x: 955, y: 785 },
        { x: 1120, y: 725 },
        { x: 1305, y: 585 },
        { x: 1420, y: 550 },
        { x: 1515, y: 450 },
      ],
    },
  ],
  terrain: MAP_1_TERRAIN,
  features: [
    { id: 'light-capital', kind: 'capital', owner: 'light', position: { x: 55, y: 450 } },
    { id: 'dark-capital', kind: 'capital', owner: 'dark', position: { x: 1545, y: 450 } },
    { id: 'grand-cathedral', kind: 'cathedral', owner: 'neutral', position: { x: 800, y: 450 } },
    { id: 'north-crossing', kind: 'crossing', owner: 'neutral', position: { x: 800, y: 95 } },
    { id: 'south-crossing', kind: 'crossing', owner: 'neutral', position: { x: 800, y: 805 } },
    {
      id: 'light-structure-1',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 565, y: 130 },
    },
    {
      id: 'light-structure-2',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 365, y: 255 },
    },
    {
      id: 'light-structure-3',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 400, y: 445 },
    },
    {
      id: 'light-structure-4',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 650, y: 460 },
    },
    {
      id: 'light-structure-5',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 365, y: 640 },
    },
    {
      id: 'light-structure-6',
      kind: 'team-structure',
      owner: 'light',
      position: { x: 565, y: 750 },
    },
    {
      id: 'dark-structure-1',
      kind: 'team-structure',
      owner: 'dark',
      position: { x: 1035, y: 130 },
    },
    {
      id: 'dark-structure-2',
      kind: 'team-structure',
      owner: 'dark',
      position: { x: 1235, y: 255 },
    },
    {
      id: 'dark-structure-3',
      kind: 'team-structure',
      owner: 'dark',
      position: { x: 1200, y: 445 },
    },
    { id: 'dark-structure-4', kind: 'team-structure', owner: 'dark', position: { x: 950, y: 460 } },
    {
      id: 'dark-structure-5',
      kind: 'team-structure',
      owner: 'dark',
      position: { x: 1235, y: 640 },
    },
    {
      id: 'dark-structure-6',
      kind: 'team-structure',
      owner: 'dark',
      position: { x: 1035, y: 750 },
    },
    {
      id: 'north-west-objective',
      kind: 'side-objective',
      owner: 'neutral',
      position: { x: 320, y: 80 },
    },
    {
      id: 'south-west-objective',
      kind: 'side-objective',
      owner: 'neutral',
      position: { x: 320, y: 820 },
    },
    {
      id: 'north-east-objective',
      kind: 'side-objective',
      owner: 'neutral',
      position: { x: 1280, y: 80 },
    },
    {
      id: 'south-east-objective',
      kind: 'side-objective',
      owner: 'neutral',
      position: { x: 1280, y: 820 },
    },
  ],
};
