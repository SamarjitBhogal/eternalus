import type { ProjectilePayloadData } from '../../components/ProjectilePayload.types';
import type { GameState } from '../../state/GameState';
import type { ShotLauncher } from '../../state/ShotLauncher.types';
import type { Vec2 } from '../../utils/geometry.types';
import type { LaunchedShot } from './RecordingLauncher.types';

/** A test double for `ShotLauncher`: it only records each shot, and puts nothing in the state. */
export class RecordingLauncher implements ShotLauncher {
  /** Every shot asked for, in order. */
  public readonly shots: LaunchedShot[] = [];

  /** Records the shot. */
  public launch(
    _state: GameState,
    projectileId: string,
    payload: ProjectilePayloadData,
    direction: Vec2,
  ): void {
    this.shots.push({ projectileId, payload, direction });
  }
}
