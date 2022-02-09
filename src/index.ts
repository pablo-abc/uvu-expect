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

const properties: Record<string, Property[] | undefined> = {
  ...Object.keys(initialProperties).reduce(
    (acc, key) => ({
      ...acc,
      [key]: [initialProperties[key as keyof typeof initialProperties]],
    }),
    {} as Record<string, Property[] | undefined>
  ),
  satisfies: [initialProperties.satisfy],
  equals: [initialProperties.equal],
  includes: [initialProperties.include],
  contain: [initialProperties.include],
  contains: [initialProperties.include],
  match: [initialProperties.include],
  matches: [initialProperties.include],
  a: [initialProperties.type],
  an: [initialProperties.type],
  lengthOf: [initialProperties.length],
  instanceOf: [initialProperties.instance],
  deeply: [initialProperties.deep],
  function: [initialProperties.beFunction],
  true: [beTrue],
  false: [beFalse],
  null: [beNull],
  undefined: [beUndefined],
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
      const props = target[prop];
      if (!props || props.length === 0) return proxy;
      props.forEach((p) => p.onAccess?.call(chainContext));
      if (props.some((p) => p.onCall)) {
        return new Proxy(
          function (...args: unknown[]) {
            props.forEach((p) => p.onCall?.call(chainContext, ...args));
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

function addProperty(names: string | string[], handler: Property): void {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    if (!properties[name]) properties[name] = [handler];
    else properties[name]!.push(handler);
  }
}

function replaceProperty(
  names: string | string[],
  extender: (handler: Property) => Property
) {
  names = Array.isArray(names) ? names : [names];
  for (const name of names) {
    const property = properties[name] ?? [];
    const handler: Property = {
      onCall(this: Context, ...args: any[]) {
        property.forEach((p) => p.onCall?.call(this, ...args));
      },
      onAccess(this: Context) {
        property.forEach((p) => p.onAccess?.call(this));
      },
    };
    properties[name] = [{ ...handler, ...extender(handler) }];
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
