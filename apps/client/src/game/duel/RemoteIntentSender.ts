import type { InputIntent } from '@eternalus/core';

import type { Projection } from '../engine/input/Projection.types';
import type { IntentSource } from '../Match.types';
import type { PlayerActions } from '../PlayerActions';
import type { DuelLink } from './DuelLink.types';

/**
 * The online `PlayerActions` (ADR 0016 point 1): each tick it reads the player's intent from the
 * same `IntentSource` a local match uses and sends it to the server as is; the server turns it
 * into commands. A press the canvas gestures own is no attack, as locally. The developer
 * explorer's clicks do nothing: no command is made on the client.
 */
export class RemoteIntentSender implements PlayerActions {
  private isPointerClaimed = false;

  /** Creates a sender over the player's input, the camera's projection and the Duel. */
  public constructor(
    private readonly input: IntentSource,
    private readonly projection: Projection,
    private readonly link: DuelLink,
  ) {}

  /** Whether the canvas gestures own the main button's press. */
  public setPointerClaimed(isClaimed: boolean): void {
    this.isPointerClaimed = isClaimed;
  }

  /** Sends this tick's intent; returns whether the player moves. */
  public apply(): boolean {
    const intent = this.input.read(this.projection);
    this.link.sendIntent(this.isPointerClaimed ? RemoteIntentSender.withoutAttack(intent) : intent);
    return intent.move.x !== 0 || intent.move.y !== 0;
  }

  /** No local attack online. */
  public attackUnitAt(): boolean {
    return false;
  }

  /** No local attack online. */
  public attackObjectAt(): void {
    return undefined;
  }

  private static withoutAttack(intent: InputIntent): InputIntent {
    return { ...intent, isAttacking: false };
  }
}
