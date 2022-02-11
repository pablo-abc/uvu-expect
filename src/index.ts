import kleur from 'kleur';
import * as defaultProperties from './properties';
import type { Context, Property, Expect } from './types';
export type {
  Context as ExpectContext,
  Property as ExpectProperty,
  Assert as ExpectAssert,
} from './types';
import { assert } from './custom-assert';
import { Assertion } from 'uvu/assert';
import { createMatcher } from '@sinonjs/samsam';

const {
  beTrue,
  beFalse,
  beNull,
  beUndefined,
  beFunction,
  ...initialProperties
} = defaultProperties;

const properties: Record<string, Property | undefined> = {
  ...initialProperties,
  satisfies: initialProperties.satisfy,
  equals: initialProperties.equal,
  includes: initialProperties.include,
  contain: initialProperties.include,
  contains: initialProperties.include,
  matches: initialProperties.match,
  a: initialProperties.type,
  an: initialProperties.type,
  lengthOf: initialProperties.length,
  instanceOf: initialProperties.instance,
  deeply: initialProperties.deep,
  function: beFunction,
  with: initialProperties.calledWith,
  times: initialProperties.calledTimes,
  true: beTrue,
  false: beFalse,
  null: beNull,
  undefined: beUndefined,
};

function tryWithStack(
  this: Context,
  fn: () => void,
  captured: { stack?: string; assertion: string[] }
) {
  try {
    fn();
  } catch (err) {
    clearTimeout(this.timeout);
    if (err instanceof Assertion) {
      const operator = captured.assertion
        .map((a) => a.replace('(...)', ''))
        .filter((a) => a && Object.keys(properties).includes(a))
        .join('.');
      err.operator = kleur.bold(operator);
      if (captured.stack) err.stack = captured.stack;
      throw err;
    }
    throw err;
  }
}

export function expectFn(
  value: any,
  { disableNoAssertionWarning } = { disableNoAssertionWarning: false }
) {
  const captured: { stack?: string; assertion: string[] } = {
    assertion: [],
  };

  Error.captureStackTrace?.(captured, expect);
  const timeout = setTimeout(() => {
    if (disableNoAssertionWarning) return;
    console.warn(
      kleur
        .bold()
        .underline()
        .red('No assertion was done on one of your `expect` calls.')
    );
    console.warn('');
    console.warn('Make sure you have no typos on your assertion:');
    console.warn(kleur.yellow('expect(...).' + captured.assertion.join('.')));
    console.warn('');
    console.warn(kleur.gray(captured.stack ?? ''));
  });

  const internalFlags = new Map();
  function flag(key: string, value: any) {
    if (arguments.length === 1) return internalFlags.get(key);
    internalFlags.set(key, value);
    return value;
  }
  function clearFlags(this: Context) {
    if (this.flag('preventClear')) return;
    const actual = internalFlags.get('object');
    internalFlags.clear();
    internalFlags.set('object', actual);
  }
  const chainContext = {
    flag,
    timeout,
  } as Context;
  chainContext.clearFlags = clearFlags.bind(chainContext);
  chainContext.assert = assert.bind(chainContext);
  internalFlags.set('object', value);
  const proxy: any = new Proxy(properties, {
    get(target, prop) {
      if (typeof prop !== 'string') return;
      captured.assertion.push(prop);
      const property = target[prop];
      tryWithStack.call(
        chainContext,
        () => {
          property?.onAccess?.call(chainContext);
        },
        captured
      );
      return new Proxy(
        function (...args: unknown[]) {
          captured.assertion.splice(-1, 1, `${prop}(...)`);
          tryWithStack.call(
            chainContext,
            () => {
              property?.onCall?.apply(chainContext, args);
            },
            captured
          );
          return proxy;
        },
        {
          get(_, prop) {
            return proxy[prop];
          },
        }
      );
    },
  });

  return proxy;
}

export const expect: Expect = Object.assign(expectFn, {
  match: createMatcher as any,
});

function addProperty(names: string | string[], handler: Property): void {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    const originalHandler = properties[name];
    if (!originalHandler) {
      properties[name] = handler;
    } else {
      properties[name] = {
        onAccess(this: Context) {
          if (originalHandler.onAccess) this.flag('preventClear', true);
          handler.onAccess?.call(this);
          this.flag('preventClear', false);
          originalHandler.onAccess?.call(this);
        },
        onCall(this: Context, ...args: any[]) {
          if (originalHandler.onCall) this.flag('preventClear', true);
          handler.onCall?.apply(this, args);
          this.flag('preventClear', false);
          originalHandler.onCall?.apply(this, args);
        },
      };
    }
  }
}

function replaceProperty(
  names: string | string[],
  extender: (handler: Property) => Property
) {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    const handler = properties[name] ?? {};
    properties[name] = { ...handler, ...extender(handler) };
  }
}

export type ExtendExpectHelpers = {
  addProperty: typeof addProperty;
  replaceProperty: typeof replaceProperty;
};

export function extend(extension: (helpers: ExtendExpectHelpers) => void) {
  extension({
    addProperty,
    replaceProperty,
  });
}
