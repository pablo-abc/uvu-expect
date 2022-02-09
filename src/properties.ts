import type { Context, Property } from './types';
import * as assert from 'uvu/assert';
import { checkIncludes, checkProperty, checkMembers } from './matchers';
import { isPlainObject } from 'lodash';

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
    this.flag('length', true);
  },
  onCall(this: Context, size: number) {
    const actual = this.flag('object');
    if (!Array.isArray(actual) && typeof actual !== 'string') {
      return assert.unreachable(
        `Expected "${typeof actual}" to be an "array" or "string"`
      );
    }
    this.assert(
      actual.length === size,
      'Expected array to have length #{exp}',
      'Expected array not to have length #{exp}',
      { expects: size, actual: actual.length, showDiff: !this.flag('negate') }
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
    const { passed, value } = checkProperty.call(this, actual, name);
    this.assert(
      passed,
      `Expected target to have ${deep ? 'deep ' : ''}${
        own ? 'own ' : ''
      }property #{exp}`,
      `Expected target not to have ${deep ? 'deep ' : ''}${
        own ? 'own ' : ''
      }property #{exp}`,
      { expects: name }
    );
    this.flag('object', value);
    this.clearFlags();
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
        'Expected #{act} to not be an "array"',
        { actual: typeof actual, operator: 'type' }
      );
    } else if (type === 'object' && plain) {
      this.assert(
        isPlainObject(actual),
        'Expected #{act} to be a plain object',
        'Expected #{act} to not be a plain object',
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
    this.clearFlags();
  },
};

export const satisfy: Property = {
  onCall(this: Context, fn: (this: Context, actual: unknown) => boolean) {
    this.assert(
      fn.call(this, this.flag('object')),
      'Expected target to satisfy validation',
      'Expected target not to satisfy validation'
    );
    this.clearFlags();
  },
};
