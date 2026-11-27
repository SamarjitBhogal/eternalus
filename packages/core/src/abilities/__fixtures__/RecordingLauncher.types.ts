import type { ProjectilePayloadData } from '../../components/ProjectilePayload.types';
import type { Vec2 } from '../../utils/geometry.types';

/** One shot a `RecordingLauncher` was asked to launch. */
export type LaunchedShot = {
  readonly projectileId: string;
  readonly payload: ProjectilePayloadData;
  readonly direction: Vec2;
};
