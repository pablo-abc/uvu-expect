import * as assert from 'uvu/assert';
import type { Context } from './types';
import {
  isPlainObject,
  isArray,
  isMatch,
  isSet,
  isEqual,
  difference,
  differenceWith,
} from 'lodash';

export function checkIncludes(this: Context, act: any, exp: any): boolean {
  const deep = this.flag('deep') as boolean;
  if (deep ? isEqual(act, exp) : exp === act) return true;
  if (isArray(act)) {
    const included =
      exp instanceof RegExp ? act.some((v) => exp.test(v)) : act.includes(exp);
    if (!deep || included) return included;
    return act.some((value) => {
      if (isArray(value) || isPlainObject(value))
        return checkIncludes.call(this, value, exp);
      return false;
    });
  }
  if (isPlainObject(act)) {
    if (!isPlainObject(exp))
      assert.unreachable('expected value must be an object');
    const match = isMatch(act, exp);
    if (match || !deep) return match;
    return Object.keys(act).some((key) => {
      if (isArray(act[key]) || isPlainObject(act[key]))
        return checkIncludes.call(this, act[key], exp);
      return false;
    });
  }
  if (isSet(act)) {
    return act.has(exp);
  }
  return false;
}

export function checkProperty(
  this: Context,
  act: Record<string, any>,
  exp: string
) {
  assert.type(act, 'object');
  const own = this.flag('own');
  const deep = this.flag('deep');
  const passed = own ? act.hasOwnProperty(exp) : !!act[exp];
  let result = { passed, value: act[exp] };
  if (!deep || passed) return result;
  Object.keys(act).some((key) => {
    if (!isPlainObject(act[key])) return false;
    result = checkProperty.call(this, act[key], exp);
    return result.passed;
  });
  return result;
}

export function checkMembers(this: Context, act: any[], exp: any[]): boolean {
  if (!isArray(act)) assert.unreachable('Expected target to be an array');
  if (!isArray(exp)) assert.unreachable('Expected value to be an array');
  const deep = this.flag('deep');
  const ordered = this.flag('ordered');
  const include = this.flag('include');
  if (!include && act.length !== exp.length) return false;
  if (ordered) {
    for (let i = 0; i < act.length; i += 1) {
      const passed = exp.every((vexp, index) => {
        if (deep) {
          return isEqual(vexp, act[i + index]);
        } else {
          return vexp === act[i + index];
        }
      });
      if (passed) return true;
    }
    return false;
  }
  if (deep) {
    return differenceWith(exp, act, isEqual).length === 0;
  } else {
    return difference(exp, act).length === 0;
  }
}
