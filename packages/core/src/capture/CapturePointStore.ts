import type { Team } from '../teams/teams.types';
import type {
  CapturePointDefinition,
  CapturePointSnapshot,
  CapturePointState,
} from './CapturePoint.types';

/** Every capture point in the match, in a fixed order (deterministic iteration). */
export class CapturePointStore {
  private readonly points = new Map<string, CapturePointState>();

  /**
   * @param definitions - Where the points are; every one starts neutral and empty.
   * @param neutral - The team that owns nothing.
   */
  public constructor(definitions: readonly CapturePointDefinition[], neutral: Team) {
    for (const definition of definitions) {
      if (this.points.has(definition.id)) {
        throw new Error(`Duplicate capture point id "${definition.id}".`);
      }
      if (!(definition.halfSize > 0)) {
        throw new Error(`Capture point "${definition.id}" needs a positive halfSize.`);
      }
      this.points.set(definition.id, {
        ...definition,
        owner: neutral,
        progressTeam: neutral,
        progress: 0,
        checkpoint: 0,
        contested: false,
        locked: false,
        heldTicks: 0,
      });
    }
  }

  /** Visits every point in order. For systems only: they may change the state they are given. */
  public forEach(visit: (point: CapturePointState) => void): void {
    this.points.forEach(visit);
  }

  /** The point with `id`, or `undefined`. Read only. */
  public get(id: string): Readonly<CapturePointState> | undefined {
    return this.points.get(id);
  }

  /** Locks or unlocks a point, e.g. while its mini-boss is alive (design doc). */
  public setLocked(id: string, locked: boolean): void {
    const point = this.points.get(id);
    if (point === undefined) {
      throw new Error(`Unknown capture point "${id}".`);
    }
    point.locked = locked;
  }

  /**
   * Fields for `StateHasher`, only for points that changed since match start. While every point is
   * untouched this is empty, so hashes (and recorded replay checkpoints) stay exactly as before.
   */
  public hashFields(neutral: Team): unknown[] {
    const fields: unknown[] = [];
    this.points.forEach((point) => {
      const untouched =
        point.owner === neutral &&
        point.progress === 0 &&
        !point.contested &&
        !point.locked &&
        point.heldTicks === 0;
      if (!untouched) {
        fields.push([
          point.id,
          point.owner,
          point.progressTeam,
          point.progress,
          point.checkpoint,
          point.contested,
          point.locked,
          point.heldTicks,
        ]);
      }
    });
    return fields;
  }

  /** Plain-data copy of every point for `Snapshot`. */
  public snapshot(): CapturePointSnapshot[] {
    const out: CapturePointSnapshot[] = [];
    this.points.forEach((point) => {
      out.push({
        id: point.id,
        lane: point.lane,
        x: point.center.x,
        y: point.center.y,
        halfSize: point.halfSize,
        owner: point.owner,
        progressTeam: point.progressTeam,
        progress: point.progress,
        checkpoint: point.checkpoint,
        contested: point.contested,
        locked: point.locked,
        heldTicks: point.heldTicks,
      });
    });
    return out;
  }
}
