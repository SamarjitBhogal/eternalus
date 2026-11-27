import type { EntityId, GameEventMap, Simulation, Snapshot, Unsubscribe } from '@eternalus/core';

import { BIG_HIT_SHARE, STATUS_BADGE_KINDS } from './DamageBadges.constants';
import type { WorldPoint } from './engine/render/Renderer.types';
import { BADGE_LIFETIME_SECONDS, BADGE_SLOT_OFFSETS } from './views/DamageBadgeLayer.constants';
import type { DamageBadge, DamageBadgeKind } from './views/DamageBadgeLayer.types';

/** A badge from a hit of the step in progress, before the next snapshot gives it its tick and place. */
type HeardBadge = Omit<DamageBadge, 'slot' | 'bornTick'>;

/** What a hit needs to know of its target, from the latest snapshot. */
type Target = { readonly at: WorldPoint; readonly maxHealth: number };

/**
 * Decides which damage numbers are on screen (W5, DEC-410). It hears each `damage-applied`
 * through `Simulation.on`, as `HealthBarVisibility` does. By default the player sees only the
 * hits their Legend deals (a bleed or burn they applied counts) and takes; with the "show every
 * hit" setting on, every hit (W5c). The part of a hit a shield soaked up is a `steel` badge, the
 * rest a `hit` shield, or a drop or flame for a bleed or burn tick (`STATUS_BADGE_KINDS`); a part
 * above `BIG_HIT_SHARE` of the target's max health is big (W5a). A target shows up to
 * `BADGE_SLOT_OFFSETS.length` badges side by side; a newer one takes the oldest one's place (W5b).
 * The views get only `badges`.
 */
export class DamageBadges {
  private live: DamageBadge[] = [];

  private heard: HeardBadge[] = [];

  /** The entities of the latest snapshot that can take damage, by id. */
  private targets: ReadonlyMap<EntityId, Target> = new Map();

  private playerId: EntityId | null = null;

  private readonly unsubscribe: Unsubscribe;

  /**
   * Starts listening to `damage-applied`; `destroy` stops.
   *
   * @param simulation - Where the hits come from.
   * @param isShowingEveryHit - The "show every hit" setting (W5c), read at each hit.
   * @param tickRate - Ticks per second, to turn `BADGE_LIFETIME_SECONDS` into ticks.
   */
  public constructor(
    simulation: Pick<Simulation, 'on'>,
    private readonly isShowingEveryHit: () => boolean,
    private readonly tickRate: number,
  ) {
    this.unsubscribe = simulation.on('damage-applied', this.hear);
  }

  /**
   * Reads the latest snapshot: the hits of the step that made it get its tick and a place beside
   * their target's other badges, badges older than `BADGE_LIFETIME_SECONDS` go, and the next
   * step's hits see this snapshot's targets. Call it for the first snapshot and after each step.
   */
  public observe(snapshot: Snapshot, playerId: EntityId | null): void {
    const lifetimeTicks = BADGE_LIFETIME_SECONDS * this.tickRate;
    this.live = this.live.filter(({ bornTick }) => snapshot.tick - bornTick < lifetimeTicks);
    for (const badge of this.heard) {
      this.place({ ...badge, bornTick: snapshot.tick });
    }
    this.heard = [];
    this.targets = new Map(
      snapshot.entities.flatMap(({ id, transform, health }) =>
        transform === null || health === null
          ? []
          : [[id, { at: { x: transform.x, y: transform.y }, maxHealth: health.max }] as const],
      ),
    );
    this.playerId = playerId;
  }

  /** The badges on screen, oldest first. */
  public get badges(): readonly DamageBadge[] {
    return this.live;
  }

  /** Stops listening, so a finished match leaves no listener behind (13 §2). */
  public destroy(): void {
    this.unsubscribe();
  }

  private readonly hear = ({
    targetId,
    amount,
    absorbed,
    source,
  }: GameEventMap['damage-applied']): void => {
    const target = this.targets.get(targetId);
    const isPlayers =
      this.playerId !== null && (targetId === this.playerId || source.attackerId === this.playerId);
    if (target === undefined || !(isPlayers || this.isShowingEveryHit())) {
      return;
    }
    const onBase =
      (source.kind === 'status' ? STATUS_BADGE_KINDS[source.definitionId] : undefined) ?? 'hit';
    const parts: readonly (readonly [number, DamageBadgeKind])[] = [
      [absorbed, 'steel'],
      [amount, onBase],
    ];
    for (const [damage, kind] of parts) {
      const shown = Math.round(damage);
      if (shown > 0) {
        const isBig = damage > BIG_HIT_SHARE * target.maxHealth;
        this.heard.push({ targetId, text: String(shown), kind, isBig, at: target.at });
      }
    }
  };

  /** Puts `badge` in its target's first free place, or in the place of its oldest badge. */
  private place(badge: Omit<DamageBadge, 'slot'>): void {
    const own = this.live.filter(({ targetId }) => targetId === badge.targetId);
    const taken = new Set(own.map(({ slot }) => slot));
    const free = BADGE_SLOT_OFFSETS.findIndex((_, slot) => !taken.has(slot));
    const oldest = own[0];
    if (free === -1 && oldest !== undefined) {
      this.live = this.live.filter((live) => live !== oldest);
    }
    this.live.push({ ...badge, slot: free === -1 ? (oldest?.slot ?? 0) : free });
  }
}
