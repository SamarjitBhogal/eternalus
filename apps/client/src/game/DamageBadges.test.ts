import type { GameEventMap } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { mobAt, snapshotAt } from './__fixtures__/damageSnapshots';
import { FakeGameEvents } from './__fixtures__/FakeGameEvents';
import { DamageBadges } from './DamageBadges';
import { BADGE_LIFETIME_SECONDS, BADGE_SLOT_OFFSETS } from './views/damageBadge.constants';

const TICK_RATE = 30;

const WORLD = [mobAt('me', 0), mobAt('foe', 10), mobAt('pal', 20), mobAt('wall', 30, 0, false)];

type Event = GameEventMap['damage-applied'];

/** A hit's fields; each one left out takes the default of `damage`. */
type Hit = Partial<Pick<Event, 'targetId' | 'amount' | 'absorbed'> & Event['source']>;

/** Badges over `WORLD` at tick 0 with the player `me`, plus helpers to hit and step. */
const setUp = (isShowingEveryHit = false, playerId: string | null = 'me') => {
  const events = new FakeGameEvents();
  const badges = new DamageBadges(events, () => isShowingEveryHit, TICK_RATE);
  badges.observe(snapshotAt(0, WORLD), playerId);
  const damage = ({
    targetId = 'foe',
    amount = 10,
    absorbed = 0,
    attackerId = 'me',
    kind = 'weapon',
    definitionId = 'great-sword',
  }: Hit = {}) => {
    events.emit('damage-applied', {
      targetId,
      amount,
      absorbed,
      source: { attackerId, kind, definitionId },
    });
  };
  const stepTo = (tick: number) => {
    badges.observe(snapshotAt(tick, WORLD), playerId);
  };
  return { events, badges, damage, stepTo };
};

describe('DamageBadges (W5, DEC-410)', () => {
  it('shows by default only the hits the player deals and takes (W5c)', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ targetId: 'foe', attackerId: 'me', amount: 11 });
    damage({ targetId: 'me', attackerId: 'foe', amount: 12 });
    damage({ targetId: 'foe', attackerId: 'pal', amount: 13 });
    damage({ targetId: 'pal', attackerId: null, amount: 14 });
    stepTo(1);

    expect(badges.badges.map(({ targetId, text }) => [targetId, text])).toEqual([
      ['foe', '11'],
      ['me', '12'],
    ]);
  });

  it('counts a bleed tick the player applied as a hit the player deals', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ attackerId: 'me', kind: 'status', definitionId: 'bleed', amount: 3 });
    stepTo(1);

    expect(badges.badges.map(({ kind }) => kind)).toEqual(['bleed']);
  });

  it('shows every hit with the "show every hit" setting on (W5c)', () => {
    const { badges, damage, stepTo } = setUp(true);

    damage({ targetId: 'foe', attackerId: 'pal', amount: 13 });
    damage({ targetId: 'pal', attackerId: null, amount: 14 });
    stepTo(1);

    expect(badges.badges.map(({ text }) => text)).toEqual(['13', '14']);
  });

  it('shows no hit without a player, unless the setting shows every hit', () => {
    const hidden = setUp(false, null);
    hidden.damage({ targetId: 'me', attackerId: 'foe' });
    hidden.stepTo(1);
    const shown = setUp(true, null);
    shown.damage({ targetId: 'me', attackerId: 'foe' });
    shown.stepTo(1);

    expect(hidden.badges.badges).toEqual([]);
    expect(shown.badges.badges).toHaveLength(1);
  });

  it('splits a hit into a steel badge for the shielded part and a hit badge for the rest', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ amount: 30, absorbed: 12 });
    stepTo(1);

    expect(badges.badges.map(({ kind, text }) => [kind, text])).toEqual([
      ['steel', '12'],
      ['hit', '30'],
    ]);
  });

  it('gives a bleed tick a drop and a burn tick a flame, by status id', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ kind: 'status', definitionId: 'bleed' });
    damage({ kind: 'status', definitionId: 'burn' });
    damage({ kind: 'status', definitionId: 'gem-burn' });
    damage({ targetId: 'pal', kind: 'status', definitionId: 'slow' });
    damage({ targetId: 'pal', kind: 'weapon', definitionId: 'bleed' });
    stepTo(1);

    expect(badges.badges.map(({ kind }) => kind)).toEqual(['bleed', 'burn', 'burn', 'hit', 'hit']);
  });

  it('rounds the damage and shows no badge for a part that rounds to 0', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ amount: 2.6, absorbed: 0.4 });
    stepTo(1);

    expect(badges.badges.map(({ kind, text }) => [kind, text])).toEqual([['hit', '3']]);
  });

  it('makes a hit above the big-hit share of max health big (W5a)', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ targetId: 'foe', amount: 20 });
    damage({ targetId: 'pal', amount: 21 });
    stepTo(1);

    expect(badges.badges.map(({ isBig }) => isBig)).toEqual([false, true]);
  });

  it('counts the shielded part in a big hit, and makes both its badges big (W5a)', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ amount: 12, absorbed: 9 });
    stepTo(1);

    expect(badges.badges.map(({ kind, isBig }) => [kind, isBig])).toEqual([
      ['steel', true],
      ['hit', true],
    ]);
  });

  it('shows a hit only from the next snapshot, born on its tick, where the target stood', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ targetId: 'foe' });

    expect(badges.badges).toEqual([]);
    stepTo(7);
    expect(badges.badges).toEqual([
      {
        targetId: 'foe',
        text: '10',
        kind: 'hit',
        isBig: false,
        slot: 0,
        bornTick: 7,
        at: { x: 10, y: 0 },
      },
    ]);
  });

  it('shows no badge for a target the latest snapshot has no health for', () => {
    const { badges, damage, stepTo } = setUp();

    damage({ targetId: 'wall' });
    damage({ targetId: 'ghost' });
    stepTo(1);

    expect(badges.badges).toEqual([]);
  });

  it("puts a target's badges side by side, and a newer one in the place of its oldest (W5b)", () => {
    const { badges, damage, stepTo } = setUp();
    const limit = BADGE_SLOT_OFFSETS.length;

    for (let tick = 1; tick <= limit; tick += 1) {
      damage({ targetId: 'foe', amount: tick });
      stepTo(tick);
    }
    damage({ targetId: 'pal', amount: 50 });
    stepTo(limit + 1);
    expect(badges.badges.map(({ targetId, slot }) => [targetId, slot])).toEqual([
      ...Array.from({ length: limit }, (_, slot) => ['foe', slot]),
      ['pal', 0],
    ]);

    damage({ targetId: 'foe', amount: 99 });
    stepTo(limit + 2);
    const foes = badges.badges.filter(({ targetId }) => targetId === 'foe');
    expect(foes).toHaveLength(limit);
    expect(foes.map(({ text }) => text)).not.toContain('1');
    expect(foes.find(({ text }) => text === '99')?.slot).toBe(0);
  });

  it('removes a badge once its lifetime has passed', () => {
    const { badges, damage, stepTo } = setUp();
    const lifetimeTicks = BADGE_LIFETIME_SECONDS * TICK_RATE;

    damage();
    stepTo(1);
    stepTo(1 + Math.ceil(lifetimeTicks) - 1);
    expect(badges.badges).toHaveLength(1);
    stepTo(1 + Math.ceil(lifetimeTicks));
    expect(badges.badges).toEqual([]);
  });

  it('stops listening on destroy', () => {
    const { events, badges } = setUp();

    badges.destroy();

    expect(events.unsubscribed).toBe(1);
  });
});
