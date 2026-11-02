import { createDefaultGameConfig, MapGenerator, MapPresentationBuilder } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { BuildingRoofs } from './BuildingRoofs';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);
const { buildings } = new MapPresentationBuilder().build(MAP);
/** Points inside each building's footprint and one on open ground, on seed 1's map. */
const IN_LIGHT_STRONGHOLD = { x: 130, y: 450 };
const IN_CATHEDRAL = { x: 800, y: 450 };
const OUTSIDE = { x: 0, y: 0 };

describe('BuildingRoofs', () => {
  it('starts with every roof on', () => {
    const roofs = new BuildingRoofs(buildings);
    expect([...roofs.hidden]).toEqual([]);
    expect(roofs.hasOpened).toBe(false);
  });

  it("opens only the roof of the building the player's Legend enters", () => {
    const roofs = new BuildingRoofs(buildings);
    roofs.playerAt(OUTSIDE);
    expect([...roofs.hidden]).toEqual([]);
    roofs.playerAt(IN_CATHEDRAL);
    expect([...roofs.hidden]).toEqual(['cathedral-lane-1']);
    expect(roofs.hasOpened).toBe(false);
  });

  it('says whether a point is on a building, and opens no roof doing so', () => {
    const roofs = new BuildingRoofs(buildings);
    expect(roofs.isBuildingAt(IN_CATHEDRAL)).toBe(true);
    expect(roofs.isBuildingAt(OUTSIDE)).toBe(false);
    expect([...roofs.hidden]).toEqual([]);
    expect(roofs.hasOpened).toBe(false);
  });

  it('closes the roof when the Legend walks out, or into another building', () => {
    const roofs = new BuildingRoofs(buildings);
    roofs.playerAt(IN_LIGHT_STRONGHOLD);
    roofs.playerAt(IN_CATHEDRAL);
    expect([...roofs.hidden]).toEqual(['cathedral-lane-1']);
    roofs.playerAt(OUTSIDE);
    expect([...roofs.hidden]).toEqual([]);
  });

  it('closes the roof when the Legend dies (it has no position)', () => {
    const roofs = new BuildingRoofs(buildings);
    roofs.playerAt(IN_LIGHT_STRONGHOLD);
    roofs.playerAt(null);
    expect([...roofs.hidden]).toEqual([]);
  });

  it('keeps a roof the developer opened when the Legend walks out of it', () => {
    const roofs = new BuildingRoofs(buildings);
    expect(roofs.toggleAt(IN_CATHEDRAL)).toBe(true);
    roofs.playerAt(IN_CATHEDRAL);
    roofs.playerAt(OUTSIDE);
    expect([...roofs.hidden]).toEqual(['cathedral-lane-1']);
    expect(roofs.hasOpened).toBe(true);
  });

  it("keeps the Legend's building open when the developer toggles or restores it", () => {
    const roofs = new BuildingRoofs(buildings);
    roofs.playerAt(IN_LIGHT_STRONGHOLD);
    roofs.toggleAt(IN_LIGHT_STRONGHOLD);
    expect([...roofs.hidden]).toEqual(['light-stronghold']);
    roofs.toggleAt(IN_LIGHT_STRONGHOLD);
    expect([...roofs.hidden]).toEqual(['light-stronghold']);
    roofs.toggleAt(IN_CATHEDRAL);
    expect([...roofs.hidden].sort()).toEqual(['cathedral-lane-1', 'light-stronghold']);
    roofs.restore();
    expect([...roofs.hidden]).toEqual(['light-stronghold']);
    expect(roofs.hasOpened).toBe(false);
  });

  it('toggles every building roof independently on developer clicks (moved from MapExplorer)', () => {
    const roofs = new BuildingRoofs(buildings);
    for (const [id, x] of [
      ['light-stronghold', 130],
      ['cathedral-lane-1', 800],
      ['dark-stronghold', 1470],
    ] as const) {
      expect(roofs.toggleAt({ x, y: 450 })).toBe(true);
      expect(roofs.hidden.has(id)).toBe(true);
    }
    expect(roofs.hidden.size).toBe(3);
    expect(roofs.toggleAt(IN_CATHEDRAL)).toBe(true);
    expect(roofs.hidden.has('cathedral-lane-1')).toBe(false);
    expect(roofs.hidden.has('light-stronghold')).toBe(true);
    roofs.restore();
    expect(roofs.hidden.size).toBe(0);
  });

  it('accepts both cathedral doors and rejects points outside real building silhouettes', () => {
    const roofs = new BuildingRoofs(buildings);
    for (const point of [{ x: 32, y: 325 }, { x: 700, y: 350 }, { x: 900, y: 550 }, OUTSIDE]) {
      expect(roofs.toggleAt(point)).toBe(false);
    }
    expect(roofs.toggleAt({ x: 800, y: 325 })).toBe(true);
    expect(roofs.toggleAt({ x: 800, y: 545 })).toBe(true);
    expect(roofs.hidden.size).toBe(0);
  });

  it('ignores clicks and the Legend on a map without buildings', () => {
    expect(buildings).toHaveLength(3);
    const roofs = new BuildingRoofs([]);
    expect(roofs.toggleAt(IN_CATHEDRAL)).toBe(false);
    roofs.playerAt(IN_CATHEDRAL);
    expect(roofs.hidden.size).toBe(0);
  });

  it('keeps one live set, so the views see every change without re-reading it', () => {
    const roofs = new BuildingRoofs(buildings);
    const { hidden } = roofs;
    roofs.playerAt(IN_CATHEDRAL);
    expect(hidden.has('cathedral-lane-1')).toBe(true);
  });
});
