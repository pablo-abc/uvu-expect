import type { SinonSpyCall, SinonMatch } from 'sinon';

export type Assert = (
  this: Context,
  condition: boolean,
  message: string,
  messageIfNegated: string,
  options?: {
    expects?: any;
    actual?: any;
    showDiff?: boolean;
    operator?: string;
  }
) => void;

export type Context = {
  flag(key: string, value?: any): unknown;
  clearFlags(): void;
  assert: Assert;
};

export type Property = {
  onAccess?(): void;
  onCall?(...args: unknown[]): void;
};

export type TinySpy = {
  called: boolean;
  callCount: number;
  calls: any[][];
  returns: any[];
} & Function;

export type SinonSpy = {
  called: boolean;
  callCount: number;
  getCall(nth: number): SinonSpyCall<any, any>;
  getCalls(): SinonSpyCall<any, any>[];
} & Function;

export type SpyFn = TinySpy | SinonSpy;

export type Expect = ((value: any) => any) & {
  match: SinonMatch;
};
