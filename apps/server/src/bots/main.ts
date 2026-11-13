import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { SystemClock } from '../time/SystemClock';
import { BotLogger } from './BotLogger';
import { BotNavigatorSource } from './BotNavigatorSource';
import { BOT_OPTION_DEFAULTS } from './BotOptions.constants';
import { BotOptionsParser } from './BotOptionsParser';
import { BotRun } from './BotRun';
import { WebSocketBotLinkFactory } from './WebSocketBotLinkFactory';

// Dev tool entry (`npm run duel:bots`): the only bots file that owns argv, the std streams, the
// timers and the exit code.
const logger = new BotLogger(
  {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
  },
  new SystemClock(),
);
const { values } = parseArgs({
  options: {
    url: { type: 'string', default: BOT_OPTION_DEFAULTS.url },
    players: { type: 'string', default: BOT_OPTION_DEFAULTS.players },
    seconds: { type: 'string', default: BOT_OPTION_DEFAULTS.seconds },
    stagger: { type: 'string', default: BOT_OPTION_DEFAULTS.stagger },
    mode: { type: 'string', default: BOT_OPTION_DEFAULTS.mode },
    rounds: { type: 'string', default: BOT_OPTION_DEFAULTS.rounds },
  },
});

try {
  const options = new BotOptionsParser().parse(values);
  const run = new BotRun(options, {
    links: new WebSocketBotLinkFactory(),
    clock: new SystemClock(),
    navigators: new BotNavigatorSource(),
    logger,
    sleep: (ms) => sleep(ms),
  });
  process.exit(await run.run());
} catch (error) {
  logger.fail(`[duel-bots] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
