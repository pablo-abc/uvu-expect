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
