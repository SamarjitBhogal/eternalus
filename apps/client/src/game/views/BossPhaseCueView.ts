import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { BOSS_PHASE_CUE_LOOKS } from './BossPhaseCueView.constants';
import type { BossPhaseCueLook, CueColor } from './BossPhaseCueView.types';
import type { EntityDrawState } from './EntityView.types';

/**
 * Draws a boss's phase cue (DEC-417) in place of a cut-scene: when the boss enters a phase with a
 * look (`BOSS_PHASE_CUE_LOOKS`), rings grow out from it and fade, and for the rest of the phase it
 * glows and light motes orbit it. Everything comes from the snapshot's `bossPhase` and the clock
 * (no random numbers), so a replay draws the same cue. `EntityLayer` draws it under the entities.
 */
export class BossPhaseCueView {
  /**
   * Draws the cue of `state`'s entity, or nothing for an entity in a phase without a look.
   *
   * @param clock - The moment drawn, in ticks (the snapshot's tick plus the frame's `alpha`).
   */
  public draw({ entity, position }: EntityDrawState, clock: number, renderer: Renderer): void {
    const phase = entity.bossPhase;
    const radius = entity.transform?.radius;
    const look = phase === null ? undefined : BOSS_PHASE_CUE_LOOKS[phase.phase];
    if (phase === null || radius === undefined || look === undefined) return;
    const elapsed = Math.max(0, clock - phase.changedTick);
    BossPhaseCueView.drawRings(look.rings, elapsed, radius, position, renderer);
    const shown = Math.min(1, elapsed / look.glow.fadeInTicks);
    BossPhaseCueView.drawGlow(look.glow, shown, clock, radius, position, renderer);
    BossPhaseCueView.drawParticles(look.particles, shown, clock, radius, position, renderer);
  }

  private static drawRings(
    rings: BossPhaseCueLook['rings'],
    elapsed: number,
    radius: number,
    at: WorldPoint,
    renderer: Renderer,
  ): void {
    for (const delay of rings.delays) {
      const grown = (elapsed / rings.ticks - delay) / (1 - delay);
      if (grown <= 0 || grown >= 1) continue;
      const size = radius * (rings.startSize + (rings.endSize - rings.startSize) * grown);
      renderer.drawWorldGlyph(
        { shape: 'ring', size },
        at,
        BossPhaseCueView.rgba(rings.color, 1 - grown),
      );
    }
  }

  private static drawGlow(
    glow: BossPhaseCueLook['glow'],
    shown: number,
    clock: number,
    radius: number,
    at: WorldPoint,
    renderer: Renderer,
  ): void {
    const pulse = 1 + (glow.pulseAlpha / glow.color.alpha) * Math.sin(clock * glow.pulseSpeed);
    renderer.drawWorldGlyph(
      { shape: 'dot', size: radius * glow.size },
      at,
      BossPhaseCueView.rgba(glow.color, shown * pulse),
    );
  }

  private static drawParticles(
    particles: BossPhaseCueLook['particles'],
    shown: number,
    clock: number,
    radius: number,
    at: WorldPoint,
    renderer: Renderer,
  ): void {
    const color = BossPhaseCueView.rgba(particles.color, shown);
    for (let index = 0; index < particles.count; index += 1) {
      const angle = clock * particles.orbitSpeed + (index / particles.count) * Math.PI * 2;
      const bob = 1 + particles.bobShare * Math.sin(clock * particles.bobSpeed + index);
      const orbit = (radius * particles.orbitSize * bob) / 2;
      const center = { x: at.x + Math.cos(angle) * orbit, y: at.y + Math.sin(angle) * orbit };
      renderer.drawWorldGlyph({ shape: 'dot', size: radius * particles.size }, center, color);
    }
  }

  /** `color` as a CSS `rgba()`, its alpha scaled by `share` (0 to 1). */
  private static rgba({ rgb, alpha }: CueColor, share: number): string {
    return `rgba(${rgb},${String(alpha * share)})`;
  }
}
