import * as defaultProperties from './properties';
import type { Context, Property } from './types';
export type {
  Context as ExpectContext,
  Property as ExpectProperty,
  Assert as ExpectAssert,
} from './types';
import { assert } from './custom-assert';

const { beTrue, beFalse, beNull, beUndefined, ...initialProperties } =
  defaultProperties;

const properties: Record<string, Property | undefined> = {
  ...initialProperties,
  satisfies: initialProperties.satisfy,
  equals: initialProperties.equal,
  includes: initialProperties.include,
  contain: initialProperties.include,
  contains: initialProperties.include,
  match: initialProperties.include,
  matches: initialProperties.include,
  a: initialProperties.type,
  an: initialProperties.type,
  lengthOf: initialProperties.length,
  instanceOf: initialProperties.instance,
  deeply: initialProperties.deep,
  function: initialProperties.beFunction,
  true: beTrue,
  false: beFalse,
  null: beNull,
  undefined: beUndefined,
};

export function expect(value: any) {
  const internalFlags = new Map();
  function flag(key: string, value: any) {
    if (arguments.length === 1) return internalFlags.get(key);
    internalFlags.set(key, value);
    return value;
  }
  function clearFlags(this: Context) {
    const actual = internalFlags.get('object');
    internalFlags.clear();
    internalFlags.set('object', actual);
  }
  const chainContext = {
    flag,
  } as Context;
  chainContext.clearFlags = clearFlags.bind(chainContext);
  chainContext.assert = assert.bind(chainContext);
  internalFlags.set('object', value);
  const proxy: any = new Proxy(properties, {
    get(target, prop) {
      if (typeof prop !== 'string') return;
      const property = target[prop];
      if (!property?.onAccess && !property?.onCall) return proxy;
      property.onAccess?.call(chainContext);
      if (property.onCall) {
        return new Proxy(
          function (...args: unknown[]) {
            property.onCall?.call(chainContext, ...args);
            return proxy;
          },
          {
            get(_, prop) {
              return proxy[prop];
            },
          }
        );
      }
      return proxy;
    },
  });
  return proxy;
}

function replaceProperty(names: string | string[], handler: Property): void {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    properties[name] = handler;
  }
}

function extendProperty(
  names: string | string[],
  extender: (handler: Property) => Property
) {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    const handler = properties[name] ?? {};
    properties[name] = { ...handler, ...extender(handler) };
  }
}

type ExtendHelpers = {
  replaceProperty: typeof replaceProperty;
  extendProperty: typeof extendProperty;
};

export function extend(extension: (helpers: ExtendHelpers) => void) {
  extension({
    replaceProperty,
    extendProperty,
  });
}
