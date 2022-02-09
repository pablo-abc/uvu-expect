import type { Context } from './types';
import { Assertion } from 'uvu/assert';
import { compare } from 'uvu/diff';
import { formatMessage } from './utils';

export function assert(
  this: Context,
  condition: boolean,
  message: string,
  messageIfNegated: string,
  {
    expects,
    actual,
    operator,
    showDiff,
  }: { expects?: any; actual?: any; showDiff?: boolean; operator?: string } = {}
) {
  const negate = this.flag('negate');
  const object = this.flag('object');
  const passed = negate ? !condition : condition;
  if (passed) return;
  throw new Assertion({
    message: negate
      ? formatMessage(messageIfNegated, object, actual ?? object, expects)
      : formatMessage(message, object, actual ?? object, expects),
    generated: true,
    operator: operator ?? '',
    expects,
    actual: actual ?? object,
    details: showDiff ? compare(actual ?? object, expects) : undefined,
  });
}
