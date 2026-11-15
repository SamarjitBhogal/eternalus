import { describe, expect, it } from 'vitest';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { ConnectionHeartbeat } from './ConnectionHeartbeat';
import { FakeConnection } from './FakeConnection';

function setup() {
  const scheduler = new FakeTickScheduler();
  const heartbeat = new ConnectionHeartbeat(scheduler, 15);
  const stop = heartbeat.start();
  const connect = (): FakeConnection => {
    const connection = new FakeConnection();
    heartbeat.watch(connection);
    return connection;
  };
  return { scheduler, stop, connect };
}

describe('ConnectionHeartbeat', () => {
  it('schedules on the interval and stops', () => {
    const { scheduler, stop } = setup();
    expect(scheduler.intervals).toEqual([15]);
    stop();
    expect(scheduler.activeCount).toBe(0);
  });

  it('pings each beat and keeps a connection that pongs', () => {
    const { scheduler, connect } = setup();
    const a = connect();
    scheduler.tick();
    a.pong();
    scheduler.tick();
    expect(a.pings).toBe(2);
    expect(a.isClosed).toBe(false);
  });

  it('terminates a connection with no pong since the last ping', () => {
    const { scheduler, connect } = setup();
    const silent = connect();
    const alive = connect();
    scheduler.tick();
    alive.pong();
    scheduler.tick();
    expect(silent.isTerminated).toBe(true);
    expect(silent.isClosed).toBe(true);
    expect(alive.isTerminated).toBe(false);
    scheduler.tick();
    expect(silent.pings).toBe(1);
  });

  it('forgets a closed connection and ignores its late pong', () => {
    const { scheduler, connect } = setup();
    const a = connect();
    a.close();
    a.pong();
    scheduler.tick();
    expect(a.pings).toBe(0);
  });
});
