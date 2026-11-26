import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { REPLAY_CHECKPOINT_EVERY } from '../diagnostics/Replay.constants';
import { ReplayRecorder } from './ReplayRecorder';

const config = createDefaultGameConfig();

describe('ReplayRecorder', () => {
  it('keeps only the setup fields the match had', () => {
    const replay = new ReplayRecorder({ seed: 3, config, roster: [] }).export();

    expect(replay).toEqual({ seed: 3, config, commands: [], checkpoints: [] });
  });

  it('records a checkpoint only on checkpoint ticks, hashing only then', () => {
    const recorder = new ReplayRecorder({ seed: 3, config });
    let hashes = 0;
    const hash = () => {
      hashes += 1;
      return 40 + hashes;
    };

    recorder.recordCheckpointIfDue(0, hash);
    recorder.recordCheckpointIfDue(1, hash);
    recorder.recordCheckpointIfDue(REPLAY_CHECKPOINT_EVERY, hash);

    expect(hashes).toBe(2);
    expect(recorder.export().checkpoints).toEqual([
      { tick: 0, hash: 41 },
      { tick: REPLAY_CHECKPOINT_EVERY, hash: 42 },
    ]);
  });

  it('exports a copy of the command log, not the live one', () => {
    const recorder = new ReplayRecorder({ seed: 3, config });
    const command: Command = {
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    };
    recorder.recordCommand(5, command);
    const first = recorder.export();

    recorder.recordCommand(6, command);

    expect(first.commands).toEqual([{ tick: 5, command }]);
    expect(recorder.export().commands).toHaveLength(2);
  });
});
