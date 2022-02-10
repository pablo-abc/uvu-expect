import type { Context, Property, SpyFn } from './types';
import * as assert from 'uvu/assert';
import { checkIncludes, checkProperty, checkMembers } from './matchers';
import {
  isPlainObject,
  isEmpty,
  isMap,
  isSet,
  isString,
  isArray,
  isEqual,
} from 'lodash';
import { isSpyFn } from './utils';

export const not: Property = {
  onAccess(this: Context) {
    this.flag('negate', true);
  },
};

export const include: Property = {
  onAccess(this: Context) {
    this.flag('include', true);
  },
  onCall(this: Context, value: any) {
    const actual = this.flag('object');
    const negate = this.flag('negate');
    if (typeof actual === 'string') {
      if (negate) {
        assert.not.match(actual, value);
      } else {
        assert.match(actual, value);
      }
    } else {
      const deep = this.flag('deep') as boolean;
      this.assert(
        checkIncludes.call(this, actual, value),
        `Expected target to ${deep ? 'deeply ' : ''}contain #{exp}`,
        `Expected target not to ${deep ? 'deeply ' : ''}contain #{exp}`,
        { expects: value, actual, showDiff: !negate }
      );
    }
    this.clearFlags();
  },
};

export const deep: Property = {
  onAccess(this: Context) {
    this.flag('deep', true);
  },
};

export const length: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object') as
      | any[]
      | Set<any>
      | Map<any, any>
      | string;
    let n;
    if (isArray(actual) || isString(actual)) {
      n = actual.length;
    } else if (isMap(actual) || isSet(actual)) {
      n = actual.size;
    }
    this.flag('length', n);
  },
  onCall(this: Context, size: number) {
    const actual = this.flag('actual');
    const n = this.flag('length');
    if (typeof n !== 'number') {
      return assert.unreachable(
        `Expected "${typeof actual}" to be an "array", "string", "map" or "set`
      );
    }
    this.assert(
      n === size,
      'Expected array to have length #{exp}',
      'Expected array not to have length #{exp}',
      { expects: size, actual: n, showDiff: !this.flag('negate') }
    );
    this.clearFlags();
  },
};

export const beTrue: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.is.not(actual, true);
    } else {
      assert.is(actual, true);
    }
    this.clearFlags();
  },
};

export const beFalse: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.is.not(actual, false);
    } else {
      assert.is(actual, false);
    }
    this.clearFlags();
  },
};

export const beNull: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.is.not(actual, null);
    } else {
      assert.is(actual, null);
    }
    this.clearFlags();
  },
};

export const beUndefined: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.is.not(actual, undefined);
    } else {
      assert.is(actual, undefined);
    }
    this.clearFlags();
  },
};

export const ok: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.not.ok(actual);
    } else {
      assert.ok(actual);
    }
    this.clearFlags();
  },
};

export const equal: Property = {
  onCall(this: Context, Expected: any) {
    const actual = this.flag('object');
    const deep = this.flag('deep');
    const not = this.flag('negate');
    if (deep) {
      if (not) {
        assert.not.equal(actual, Expected);
      } else {
        assert.equal(actual, Expected);
      }
    } else {
      if (not) {
        assert.is.not(actual, Expected);
      } else {
        assert.is(actual, Expected);
      }
    }
    this.clearFlags();
  },
};

type Constructor = { new (...args: any[]): any };

export const instance: Property = {
  onCall(this: Context, constructor: Constructor) {
    const actual = this.flag('object');
    const not = this.flag('negate');
    if (not) {
      assert.not.instance(actual, constructor);
    } else {
      assert.instance(actual, constructor);
    }
    this.clearFlags();
  },
};

export const own: Property = {
  onAccess(this: Context) {
    this.flag('own', true);
  },
};

export const property: Property = {
  onCall(this: Context, name: string) {
    const actual = this.flag('object') as object;
    const own = this.flag('own');
    const deep = this.flag('deep');
    const nested = this.flag('nested');
    const { passed, value } = checkProperty.call(this, actual, name);
    this.assert(
      passed,
      `Expected target to have ${nested ? 'nested ' : ''}${
        deep ? 'deep ' : ''
      }${own ? 'own ' : ''}property #{exp}`,
      `Expected target not to have ${nested ? 'nested ' : ''}${
        deep ? 'deep ' : ''
      }${own ? 'own ' : ''}property #{exp}`,
      { expects: name }
    );
    this.flag('object', value);
  },
};

export const type: Property = {
  onCall(
    this: Context,
    type:
      | 'string'
      | 'number'
      | 'boolean'
      | 'object'
      | 'undefined'
      | 'array'
      | 'function'
  ) {
    const actual = this.flag('object');
    const plain = this.flag('plain');
    const not = this.flag('negate');
    if (type === 'array') {
      this.assert(
        Array.isArray(actual),
        'Expected #{act} to be an "array"',
        'Expected #{act} not to be an "array"',
        { actual: typeof actual, operator: 'type' }
      );
    } else if (type === 'object' && plain) {
      this.assert(
        isPlainObject(actual),
        'Expected #{act} to be a plain object',
        'Expected #{act} not to be a plain object',
        { actual: typeof actual, operator: 'type' }
      );
    } else if (not) {
      assert.not.type(actual, type);
    } else {
      assert.type(actual, type);
    }
    this.clearFlags();
  },
};

export const string: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'string');
  },
};

export const number: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'number');
  },
};

export const boolean: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'boolean');
  },
};

export const plain: Property = {
  onAccess(this: Context) {
    this.flag('plain', true);
  },
};

export const object: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'object');
  },
};

export const array: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'array');
  },
};

export const beFunction: Property = {
  onAccess(this: Context) {
    type.onCall?.call(this, 'function');
  },
};

export const ordered: Property = {
  onAccess(this: Context) {
    this.flag('ordered', true);
  },
};

export const members: Property = {
  onCall(this: Context, value: any[]) {
    const deep = this.flag('deep');
    const ordered = this.flag('ordered');
    this.assert(
      checkMembers.call(this, this.flag('object') as any[], value),
      `Expected target to have ${deep ? 'deep ' : ''}${
        ordered ? 'ordered ' : ''
      }members #{exp}`,
      `Expected target not to have ${deep ? 'deep ' : ''}${
        ordered ? 'ordered ' : ''
      }members #{exp}`,
      { expects: value, showDiff: !this.flag('negate') }
    );
  },
};

export const satisfy: Property = {
  onCall(this: Context, fn: (this: Context, actual: unknown) => boolean) {
    this.assert(
      fn.call(this, this.flag('object')),
      'Expected target to satisfy validation',
      'Expected target not to satisfy validation'
    );
  },
};

export const empty: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    if (
      !Array.isArray(actual) &&
      !isPlainObject(actual) &&
      !isMap(actual) &&
      !isString(actual) &&
      !isSet(actual)
    ) {
      assert.unreachable('Target must be a string, array, object, map or set');
    }
    this.assert(
      isEmpty(actual),
      'Expected #{this} to be empty',
      'Expected #{this} not to be empty'
    );
  },
};

export const nested: Property = {
  onAccess(this: Context) {
    this.flag('nested', true);
  },
};

export const called: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    const nth = this.flag('nth');
    const last = this.flag('last');
    if (!isSpyFn(actual)) return;
    this.assert(
      actual.called,
      'Expected function to have been called',
      'Expected function not to have been called'
    );
    this.flag('nth', nth);
    this.flag('last', last);
  },
};

export const calledTimes: Property = {
  onAccess(this: Context) {
    const actual = this.flag('object');
    if (!isSpyFn(actual)) return;
    this.flag('length', actual.callCount);
  },
  onCall(this: Context, size: number) {
    const callCount = this.flag('length') as number;
    this.assert(
      callCount === size,
      'Expected function to have been called #{exp} times',
      'Expected function not to have been called #{exp} times',
      { expects: size, actual: callCount, showDiff: !this.flag('negate') }
    );
  },
};

export const once: Property = {
  onAccess(this: Context) {
    calledTimes.onAccess?.call(this);
    calledTimes.onCall?.call(this, 1);
  },
};

export const twice: Property = {
  onAccess(this: Context) {
    calledTimes.onAccess?.call(this);
    calledTimes.onCall?.call(this, 2);
  },
};

export const thrice: Property = {
  onAccess(this: Context) {
    calledTimes.onAccess?.call(this);
    calledTimes.onCall?.call(this, 3);
  },
};

export const calledWith: Property = {
  onCall(this: Context, ...args: any[]) {
    const actual = this.flag('object');
    const last = this.flag('last');
    if (!isSpyFn(actual)) return;
    let calls: any[][];
    if ('getCalls' in actual) {
      calls = actual.getCalls().map((c) => c.args);
    } else {
      calls = actual.calls;
    }
    const callNumber = last ? calls.length : (this.flag('nth') as number);
    if (!actual.called || (callNumber && calls.length < callNumber)) {
      assert.unreachable('The function has not been called enough times');
    }
    if (callNumber) {
      this.assert(
        isEqual(calls[callNumber - 1], args),
        'Expected function to have been called with #{exp} on ' + last
          ? 'last call'
          : `call number ${callNumber}`,
        'Expected function not to have been called with #{exp} on ' + last
          ? 'last call'
          : `call number ${callNumber}`,
        {
          actual: calls[callNumber - 1],
          expects: args,
          showDiff: !this.flag('negate'),
        }
      );
    } else {
      this.assert(
        calls.some((a) => isEqual(a, args)),
        'Expected function to have been called with #{exp}',
        'Expected function not to have been called with #{exp}',
        { expects: args }
      );
    }
  },
};

export const nth: Property = {
  onCall(this: Context, n: number) {
    this.flag('nth', n);
  },
};

export const last: Property = {
  onAccess(this: Context) {
    this.flag('last', true);
  },
};
