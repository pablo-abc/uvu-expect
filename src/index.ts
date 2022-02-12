import kleur from 'kleur';
import * as defaultProperties from './properties';
import type { Context, Property, Expect } from './types';
export type {
  Context as ExpectContext,
  Property as ExpectProperty,
  Assert as ExpectAssert,
} from './types';
import { assert, rejectAssertion } from './custom-assert';
import { Assertion } from 'uvu/assert';
import { createMatcher } from '@sinonjs/samsam';

const {
  beTrue,
  beFalse,
  beNull,
  beUndefined,
  beFunction,
  beNaN,
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
  NaN: beNaN,
};

function tryWithStack(
  this: Context,
  fn: () => void,
  captured: { stack?: string; assertion: string[] }
) {
  try {
    fn();
  } catch (err) {
    this.abortNoAssertionWarning();
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

function setupNoAssertionWarning(captured: {
  stack?: string;
  assertion: string[];
}) {
  return setTimeout(() => {
    const message =
      '\n' +
      kleur
        .bold()
        .underline()
        .red('No assertion was done on one of your `expect` calls.') +
      '\n\n' +
      'Make sure you have no typos on your assertion:' +
      '\n' +
      kleur.yellow('expect(...).' + captured.assertion.join('.')) +
      '\n\n' +
      kleur.gray(captured.stack ?? '');
    console.warn(message);
  });
}

let noAssertionGloballyDisabled = false;

export function disableNoAssertionWarnings() {
  noAssertionGloballyDisabled = true;
}

export function enableNoAssertionWarnings() {
  noAssertionGloballyDisabled = false;
}

export function expectFn(
  value: any,
  { disableNoAssertionWarning } = { disableNoAssertionWarning: false }
) {
  const accessed: (string | any[])[] = [];
  const timer: { timeout?: NodeJS.Timeout } = {};
  const captured: { stack?: string; assertion: string[] } = {
    assertion: [],
  };

  Error.captureStackTrace?.(captured, expect);

  if (!disableNoAssertionWarning && !noAssertionGloballyDisabled) {
    timer.timeout = setupNoAssertionWarning(captured);
  }

  function abortNoAssertionWarning() {
    if (timer.timeout) clearTimeout(timer.timeout);
  }

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
    abortNoAssertionWarning,
  } as Context;
  chainContext.clearFlags = clearFlags.bind(chainContext);
  chainContext.assert = assert.bind(chainContext);
  internalFlags.set('object', value);

  let resolve: (v: any) => void;
  let reject: (v: any) => void;
  function executeValidations() {
    for (let i = 0; i < accessed.length; i += 1) {
      const name = accessed[i] as string;
      let args: string | any[] | undefined = accessed[i + 1];
      if (Array.isArray(args)) {
        i += 1;
      } else {
        args = undefined;
      }
      if (args) {
        proxy[name](...args);
      } else {
        proxy[name];
      }
    }
  }

  const promisifiedProxy: any = new Proxy(
    Object.assign(
      new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      }),
      properties
    ),
    {
      get(target, prop) {
        if (typeof prop !== 'string') return;
        if (prop === 'then') return target.then.bind(target);
        if (prop === 'catch') return target.catch.bind(target);
        if (prop === 'finally') return target.finally.bind(target);
        accessed.push(prop);
        return new Proxy(
          function (...args: unknown[]) {
            accessed.push(args);
            return promisifiedProxy;
          },
          {
            get(_, prop) {
              return promisifiedProxy[prop];
            },
          }
        );
      },
    }
  );

  const proxy: any = new Proxy(properties, {
    get(target, prop) {
      if (typeof prop !== 'string') return;
      if (['resolves', 'resolve', 'rejects', 'reject'].includes(prop)) {
        const actual = internalFlags.get('object') as Promise<any>;
        abortNoAssertionWarning();
        if (
          typeof actual !== 'object' ||
          !('then' in actual) ||
          !('catch' in actual) ||
          !('finally' in actual)
        ) {
          throw new TypeError('Expected target to be a promise');
        }
        actual
          .then((v) => {
            if (/reject/.test(prop))
              return reject(
                rejectAssertion('Expected promise to reject', prop, captured)
              );
            internalFlags.set('object', v);
          })
          .catch((v) => {
            if (/resolve/.test(prop))
              return reject(
                rejectAssertion('Expected promise to resolve', prop, captured)
              );
            internalFlags.set('object', v);
          })
          .finally(() => {
            try {
              executeValidations();
              resolve(undefined);
            } catch (err) {
              reject(err);
            }
          });
        return promisifiedProxy;
      }
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

export type ExpectExtension = (helpers: ExtendExpectHelpers) => void;

const loadedExtensions = new Set();

export function extend(extension: ExpectExtension) {
  if (loadedExtensions.has(extension)) return;
  extension({
    addProperty,
    replaceProperty,
  });
  loadedExtensions.add(extension);
}
