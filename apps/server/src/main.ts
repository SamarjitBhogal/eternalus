import { randomInt } from 'node:crypto';
import { createServer } from 'node:http';
import { createDefaultGameConfig, makeLogRecord } from '@eternalus/core';
import { ClientMessageParser } from '@eternalus/protocol';
import { OPS_HOST, OPS_PORT, SEED_LIMIT } from './config/ServerConfig.constants';
import { ServerConfig } from './config/ServerConfig';
import { DuelGateway } from './gateway/DuelGateway';
import { MAX_CONNECTIONS, MAX_CONNECTIONS_PER_IP } from './limits/ConnectionLimiter.constants';
import { ConnectionLimiter } from './limits/ConnectionLimiter';
import { MESSAGE_BURST, MESSAGES_PER_SECOND, MS_PER_SECOND } from './limits/TokenBucket.constants';
import { TokenBucket } from './limits/TokenBucket';
import { StdoutLogger } from './logging/StdoutLogger';
import { CoreDuelSimulationFactory } from './match/CoreDuelSimulationFactory';
import { DuelHost } from './match/DuelHost';
import { DuelQueue } from './queue/DuelQueue';
import { IntervalTickScheduler } from './time/IntervalTickScheduler';
import { SystemClock } from './time/SystemClock';
import { ConnectionHeartbeat } from './transport/ConnectionHeartbeat';
import { HEARTBEAT_INTERVAL_MS } from './transport/ConnectionHeartbeat.constants';
import { WsListener } from './transport/WsListener';

// Composition root: the only place the adapters are chosen and wired.
const logger = new StdoutLogger();
const clock = new SystemClock();
const config = createDefaultGameConfig();

const scheduler = new IntervalTickScheduler();
const host = new DuelHost({
  factory: new CoreDuelSimulationFactory(config, logger, () => randomInt(SEED_LIMIT)),
  scheduler,
  tickIntervalMs: MS_PER_SECOND / config.tickRate,
  logger,
});
const queue = new DuelQueue(host);
const gateway = new DuelGateway(
  new ClientMessageParser(),
  queue,
  host,
  () => new TokenBucket(clock, MESSAGE_BURST, MESSAGES_PER_SECOND),
);

const heartbeat = new ConnectionHeartbeat(scheduler, HEARTBEAT_INTERVAL_MS);
const stopHeartbeat = heartbeat.start();
const listener = new WsListener(
  new ServerConfig(process.env).duelListener(),
  new ConnectionLimiter(MAX_CONNECTIONS, MAX_CONNECTIONS_PER_IP),
);
listener.listen((connection) => {
  heartbeat.watch(connection);
  gateway.accept(connection);
});

const ops = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200).end('ok');
  } else {
    response.writeHead(404).end();
  }
});
ops.listen(OPS_PORT, OPS_HOST);

logger.log(makeLogRecord('INFO', 'server.main', 'Duel server started.'));

// Graceful shutdown: stop the heartbeat, refuse new clients, close the open ones, then exit.
const shutdown = (): void => {
  logger.log(makeLogRecord('INFO', 'server.main', 'Duel server shutting down.'));
  stopHeartbeat();
  const opsClosed = new Promise<void>((resolve) => {
    ops.close(() => {
      resolve();
    });
  });
  ops.closeAllConnections();
  // Exit only once the WebSocket closing handshakes are done too, so no client is cut off mid-flush.
  void Promise.all([listener.close(), opsClosed]).then(() => {
    process.exit(0);
  });
};
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
