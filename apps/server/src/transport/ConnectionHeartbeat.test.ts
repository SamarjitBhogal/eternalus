import { describe, expect, it } from 'vitest';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { ConnectionHeartbeat } from './ConnectionHeartbeat';
import { FakeConnection } from './FakeConnection';

function setup() {
  const scheduler = new FakeTickScheduler();
  const heartbeat = new ConnectionHeartbeat(scheduler, 15, 2);
  const stop = heartbeat.start();
  const connect = (): FakeConnection => {
    const connection = new FakeConnection();
    heartbeat.watch(connection);
    return connection;
  };
  return { scheduler, heartbeat, stop, connect };
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

  it('probe pings at once and terminates a connection with no pong by the probe timeout', () => {
    const { scheduler, heartbeat, connect } = setup();
    const silent = connect();
    heartbeat.probe(silent);
    expect(silent.pings).toBe(1);
    expect(scheduler.intervals).toEqual([15, 2]);
    scheduler.tickEvery(2);
    expect(silent.isTerminated).toBe(true);
    expect(scheduler.activeCount).toBe(1);
  });

  it('probe keeps a connection that pongs, and probes it only once at a time', () => {
    const { scheduler, heartbeat, connect } = setup();
    const alive = connect();
    heartbeat.probe(alive);
    heartbeat.probe(alive);
    expect(alive.pings).toBe(1);
    alive.pong();
    scheduler.tickEvery(2);
    expect(alive.isTerminated).toBe(false);
  });

  it('a beat during a probe leaves the connection to the probe', () => {
    const { scheduler, heartbeat, connect } = setup();
    const probed = connect();
    scheduler.tickEvery(15);
    probed.pong();
    heartbeat.probe(probed);
    scheduler.tickEvery(15);
    expect(probed.isTerminated).toBe(false);
    expect(probed.pings).toBe(2);
    probed.pong();
    scheduler.tickEvery(2);
    expect(probed.isTerminated).toBe(false);
  });

  it('probe ignores a connection it does not watch', () => {
    const { scheduler, heartbeat } = setup();
    const stranger = new FakeConnection();
    heartbeat.probe(stranger);
    expect(stranger.pings).toBe(0);
    expect(scheduler.intervals).toEqual([15]);
  });
});
