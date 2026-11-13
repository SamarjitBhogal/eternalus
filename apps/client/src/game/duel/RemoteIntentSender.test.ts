import type { InputIntent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { Projection } from '../engine/input/Projection.types';
import type { IntentSource } from '../Match.types';
import type { PlayerActions } from '../PlayerActions';
import { snapshotAtTick } from './__fixtures__/snapshots';
import { FakeDuelLink } from './FakeDuelLink';
import { RemoteIntentSender } from './RemoteIntentSender';

const PROJECTION: Projection = { screenToWorld: ({ x, y }) => ({ x, y }) };

class ScriptedIntent implements IntentSource {
  public intent: InputIntent = { move: { x: 0, y: 0 }, aim: null, triggered: [] };

  public read(): InputIntent {
    return this.intent;
  }
}

function setUp() {
  const input = new ScriptedIntent();
  const link = new FakeDuelLink('entity-2', snapshotAtTick(0));
  const sender: PlayerActions = new RemoteIntentSender(input, PROJECTION, link);
  return { input, link, sender, snapshot: snapshotAtTick(0) };
}

describe('RemoteIntentSender', () => {
  it('sends the raw intent each tick and tells whether the player moves', () => {
    const { input, link, sender, snapshot } = setUp();

    expect(sender.apply('entity-2', snapshot)).toBe(false);
    input.intent = { move: { x: 1, y: 0 }, aim: { x: 5, y: 6 }, isAttacking: true, triggered: [] };
    expect(sender.apply('entity-2', snapshot)).toBe(true);

    expect(link.intents).toEqual([
      { move: { x: 0, y: 0 }, aim: null, triggered: [] },
      input.intent,
    ]);
  });

  it('sends no attack while the canvas gestures own the press', () => {
    const { input, link, sender, snapshot } = setUp();
    input.intent = { move: { x: 0, y: 0 }, aim: { x: 5, y: 6 }, isAttacking: true, triggered: [] };

    sender.setPointerClaimed(true);
    sender.apply('entity-2', snapshot);

    expect(link.intents[0]?.isAttacking).toBe(false);
  });

  it('makes no developer-explorer attack: no command is made on the client', () => {
    const { link, sender, snapshot } = setUp();

    expect(sender.attackUnitAt('entity-2', { x: 1, y: 1 }, snapshot)).toBe(false);
    sender.attackObjectAt('entity-2', { x: 1, y: 1 }, snapshot);

    expect(link.intents).toEqual([]);
  });
});
