import type { BridgeEventMap, ClassSelection } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { ASSET_LICENCES } from '../data/resources/assetLicences';
import { ASSET_MANIFEST } from '../data/resources/AssetManifest';
import { describeCredits } from '../data/resources/describeCredits';
import { coreCatalogue } from './content/coreCatalogue';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { FakeRunningMatch } from './FakeRunningMatch';
import type { SessionContextCalls, SessionContextMethod } from './FakeSessionContext.types';
import type { SessionContext } from './SessionController.types';

/**
 * Test double of the session context (02 §8) for a state's unit test: a real bus and
 * `FakeSessionClock`, the shipped catalogue and credits, and a record of every method call (its
 * arguments per method in `calls`, the call order in `order`). `selection()` answers the last
 * `recordSelection`, `createMatch` hands out a new `FakeRunningMatch` each time, and a load's
 * cancel is recorded by load index; set `prepareWorldError` or `createMatchError` to make that
 * method throw.
 */
export class FakeSessionContext implements SessionContext {
  public readonly bus = new TypedEventBus<BridgeEventMap>();
  public readonly clock = new FakeSessionClock();
  public readonly catalogue = coreCatalogue.load();
  public readonly credits = describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES);
  /** The arguments of every call, per method. */
  public readonly calls: SessionContextCalls = {
    transition: [],
    newMatchSetup: [],
    repeatMatchSetup: [],
    clearMatchSetup: [],
    selection: [],
    recordSelection: [],
    prepareWorld: [],
    createMatch: [],
    dropWorld: [],
    abortMatch: [],
    loadAssets: [],
    releaseAssets: [],
  };
  /** The index in `calls.loadAssets` of the load each cancel call belonged to, in call order. */
  public readonly cancelledLoads: number[] = [];
  /** Every match `createMatch` built, in order. */
  public readonly matches: FakeRunningMatch[] = [];
  /** When set, `prepareWorld` throws it. */
  public prepareWorldError: Error | null = null;
  /** When set, `createMatch` throws it. */
  public createMatchError: Error | null = null;
  private picked: ClassSelection | null = null;

  /**
   * Creates a context with nothing recorded.
   * @param order - Receives each method's name as it is called; pass a test's own log to see the
   * calls interleaved with what the test records (bus events, say).
   */
  public constructor(public readonly order: string[] = []) {}

  /** Records the call. */
  public transition(...args: Parameters<SessionContext['transition']>): void {
    this.record('transition', args);
  }

  /** Records the call. */
  public newMatchSetup(): void {
    this.record('newMatchSetup', []);
  }

  /** Records the call. */
  public repeatMatchSetup(): void {
    this.record('repeatMatchSetup', []);
  }

  /** Records the call. */
  public clearMatchSetup(): void {
    this.record('clearMatchSetup', []);
  }

  /** Records the call; returns the last recorded pick, `null` before any. */
  public selection(): ClassSelection | null {
    this.record('selection', []);
    return this.picked;
  }

  /** Records the call and keeps the pick for `selection()`. */
  public recordSelection(selection: ClassSelection | null): void {
    this.record('recordSelection', [selection]);
    this.picked = selection;
  }

  /** Records the call, then throws `prepareWorldError` when it is set. */
  public prepareWorld(): void {
    this.record('prepareWorld', []);
    if (this.prepareWorldError !== null) throw this.prepareWorldError;
  }

  /** Records the call, then throws `createMatchError` when set, or returns a new match. */
  public createMatch(...args: Parameters<SessionContext['createMatch']>): FakeRunningMatch {
    this.record('createMatch', args);
    if (this.createMatchError !== null) throw this.createMatchError;
    const match = new FakeRunningMatch();
    this.matches.push(match);
    return match;
  }

  /** Records the call. */
  public dropWorld(): void {
    this.record('dropWorld', []);
  }

  /** Records the call. */
  public abortMatch(error: unknown): void {
    this.record('abortMatch', [error]);
  }

  /** Records the call; the returned cancel adds this load's index to `cancelledLoads`. */
  public loadAssets(...args: Parameters<SessionContext['loadAssets']>): () => void {
    const index = this.calls.loadAssets.length;
    this.record('loadAssets', args);
    return () => {
      this.cancelledLoads.push(index);
    };
  }

  /** Records the call. */
  public releaseAssets(...args: Parameters<SessionContext['releaseAssets']>): void {
    this.record('releaseAssets', args);
  }

  private record<Name extends SessionContextMethod>(
    method: Name,
    args: Parameters<SessionContext[Name]>,
  ): void {
    this.calls[method].push(args);
    this.order.push(method);
  }
}
