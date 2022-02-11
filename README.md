# uvu-expect

[![NPM Version](https://img.shields.io/npm/v/uvu-expect)](https://www.npmjs.com/package/uvu-expect)
[![NPM Downloads](https://img.shields.io/npm/dw/uvu-expect)](https://www.npmjs.com/package/uvu-expect)
[![Tests](https://github.com/pablo-abc/uvu-expect/actions/workflows/test.yml/badge.svg)](https://github.com/pablo-abc/uvu-expect/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/pablo-abc/uvu-expect/branch/main/graph/badge.svg?token=JV9BKQJMCF)](https://codecov.io/gh/pablo-abc/uvu-expect)

[Chai](https://www.chaijs.com) like BDD assertions for [uvu](https://github.com/lukeed/uvu). You _can_ perfectly use Chai with uvu, but with this package I'm attempting to have a similar syntax with a better integration.

> **WARNING**: Very new package. Will most likely have breaking changes between minor versions

## Installation

You can grab it from npm:

```sh
npm install --save-dev uvu-expect
```

or if you use yarn

```sh
yarn add -D uvu-expect
```

## Usage

Unlike Jest, `expect` is not available globally but needs to be imported:

```javascript
import { expect } from 'uvu-expect';
```

This package works much like Chai. You pass the value you want to validate to `expect` and chain assertions to it.

```javascript
expect('a string').to.be.a.string;
```

Like Chai, you can add "chain" words to your assertion to make it more readable.

```javascript
expect('a string').to.still.work.after.I.type.all.of.this.but.it.should.be.a.string;
```

The only actual assertion on the previous example is `string`.

Assertions come in two ways: properties and methods. Properties only require to be accessed in order to trigger an assertion (like `string` above), while methods need an argument to be passed in order to validate. Besides these, certain properties will add "modifiers" to your assertion, such as `not` to negate an assertion.

### Properties

<hr />

#### .ok

Checks if the supplied value is truthy.

```javascript
expect('a string').to.be.ok;
expect('').to.not.be.ok;
```

<hr />

#### .empty

Checks if the target is empty. For arrays and strings, checks the `length` property to be 0. For Maps and Sets, checks the `size` property to be 0. For objects, expects it to not have any own properties.

```javascript
expect('').to.be.empty;
expect([]).to.be.empty;
expect(new Map()).to.be.empty;
expect(new Set()).to.be.empty;
expect({}).to.be.empty;
expect('not empty').to.not.be.empty;
expect(new Set([1])).to.not.be.empty;
expect(new Map([['a', 1]])).to.not.be.empty;
expect({ a: 1 }).to.not.be.empty;
```

<hr />

#### .resolves

Checks whether a promise resolves. Every assertion done after this happens on the resolved value. You must await `expect` when using this property.

Alias: `.resolve`

```javascript
await expect(Promise.resolve(true)).resolves.to.true;
await expect(Promise.resolve(false)).to.resolve.to.false;
```

<hr />

#### .rejects

Checks whether a promise rejects. Every assertion done after this happens on the rejected value. You must await `expect` when using this property.

Alias: `.reject`

```javascript
await expect(Promise.reject(true)).rejects.to.true;
await expect(Promise.reject(false)).to.reject.to.false;
```

<hr />

#### Checking if a value is of a specific type

We offer the properties `.string`, `.number`, `.boolean`, `.object`, `.array` and `.function`.

In the case of `.object`, this package will check for anything that JavaScript would consider an object. You can add `.plain` somewhere before to check for a plain object.

```javascript
expect(1).to.be.a.number;
expect(1).to.not.be.a.string.and.to.be.a.number;
expect('a').to.be.a.string;
expect(true).to.be.a.boolean;
expect({}).to.be.an.object;
expect(new Date()).to.be.an.object;
expect(new Date()).to.not.be.a.plain.object;
expect({}).to.be.a.plain.object;
expect(() => undefined).to.be.a.function;
```

Alternatively you can use the `.type` method to do the same.

<hr />

#### Checking for a specific value

We offer properties to check for the specific values `.true`, `.false`, `.null`, `.undefined`.

```javascript
expect(true).to.be.true;
expect(false).to.not.be.true;
expect(false).to.be.false;
expect(true).to.not.be.false;
expect(null).to.be.null;
expect(undefined).to.not.be.null;
expect(undefined).to.be.undefined;
expect(null).to.not.be.undefined;
```

### Methods

<hr />

#### .equal

Checks if the your target is equal (===) to the value supplied. You can add `.deep` before to check for deep equality.

When checking deep equality, you can use [matchers](#matchers) to make the comparison less strict.

Alias: `.equals`.

```javascript
expect('a string').to.equal('a string');
expect(1).to.be.a.number.that.equals(1);
expect('a string').not.to.equal('a different string');
```

<hr />

#### .contain

If your target is a string, checks if the string supplied is contained in your string.

If your target is an array or set, checks if the value supplied is contained in it. You can add `.deep` if you want to compare values using deep equality.

If your target is an object, checks if the partial object supplied is contained in the object. You can add `.deep` if you want to check on deeper levels of your object.

Alias: `.contains`, `.include`, `.includes`.

```javascript
expect('zaphod and arthur').to.include('arthur');
expect('zaphod').to.not.include('arthur');
expect(['zaphod', 'arthur']).to.contain('zaphod');
expect(['zaphod', 'arthur']).to.not.contain('marvin');


const testObj = {
  a: 1,
  b: 2,
  c: {
    d: 3,
  },
  e: [1, 2, 3],
};
expect(testObj).to.contain({ a: 1 });
expect(testObj).to.deeply.contain({ d: 3 });
expect(testObj).to.contain({ e: [1, 2, 3] });
expect(new Set([1, 2, 3])).to.contain(2);
expect(new Set([1, 2, 3])).to.not.contain(4);
expect([{}]).to.deeply.contain({});
```

<hr />

#### .match

Asserts that your target contains the supplied sub string, or matches the supplied regular expression. If the target provided is either an object or array, it will assert that the value "matches" the target,

You can use [matchers](#matchers) to make the comparison less strict.

Alias: `.matches`

```javascript
expect('zaphod and arthur').to.match('zaphod');
expect('zaphod and arthur').to.match(/arthur/);
expect('zaphod and arthur').to.not.match(/marvin/);
expect({ value: 'string', num: 1 }).to.match({ value: 'string' });
expect(['hello', 'hi', 'goodbye']).to.match(['hi', 'goodbye']);
```

<hr />

#### .property

Asserts that the object provided contains a property with the supplied name. Every assertion done after this will be done on the value returned from the property. You can use a string with dot notation (e.g. `a.b.c.1`) if you add `.nested` before.

```javascript
const testObj = {
  a: 1,
  b: 2,
  c: {
    d: 3,
  },
  e: [1, 2, 3],
};
expect(testObj).to.have.property('c').that.deep.equals({ d: 3 });
expect(testObj).to.have.a.property('a').that.equals(1);
expect(testObj).to.have.own.property('c').that.deep.equals({ d: 3 });
expect(testObj).to.have.own.property('a').that.equals(1);
expect(testObj).to.not.have.property('d');
expect(testObj).to.have.deep.own.property('d').that.equals(3);
expect(testObj).to.have.nested.property('c.d').that.equals(3);
expect(testObj).to.not.have.property('h');
```

<hr />

#### .type

Asserts if your target is the type supplied. Same as the properties described above but as a method.

Alias: `.a`, `.an`.

```javascript
expect('string').to.be.a('string');
expect(1).to.be.type('number');
expect('string').to.not.be.a('number');
expect({}).to.be.an('object');
expect({}).to.be.a.plain.type('object');
expect([]).to.be.an('array');
```

<hr />

#### .instance

Asserts that your target is an instance of the specified constructor.

Alias: `.instanceOf`.

```javascript
expect(new Date()).to.be.instance(Date);
expect(new URL('https://example.com')).to.not.be.instanceOf(Date);
```

<hr />

#### .length

Asserts that your array or string has the specified length.

Alias: `.lengthOf`

```javascript
expect('a string').to.have.a.lengthOf(8);
expect('a string').to.not.have.a.lengthOf(4);
expect([1, 2, 3]).to.have.a.length(3);
expect([1, 2, 3]).to.not.have.a.length(4);
```

<hr />

#### .members

Asserts that your array contains the specified members. It checks using strict equality, but you can add `.deep` somewhere before to use deep equality. You can also add `.ordered` to check if the members are in the same order as your supplied value.

```javascript
expect([1, 2, 3]).to.have.members([3, 2, 1]);
expect([1, 2, 3]).to.have.members([3, 2]);
expect([1, 2, 3]).to.not.have.ordered.members([3, 2]);
expect([1, 2, 3]).to.have.ordered.members([2, 3]);
expect([1, 2, 3]).to.not.have.members([3, 2, 4]);
expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.not.have.members([{ a: 1 }]);
expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.have.deep.members([{ a: 1 }]);
expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.have.deep.members([
  { b: 2 },
  { a: 1 },
]);
expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.not.have.deep.ordered.members([
  { b: 2 },
  { a: 1 },
]);
expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.have.deep.ordered.members([
  { b: 2 },
  { c: 3 },
]);
```

<hr />

#### .satisfy

Asserts that your supplied function returns a truthy value. The supplied function will receive the current target being validated. You can use this if none of the other assertions work for you.

```javascript
expect('value').to.satisfy((v) => typeof v === 'string');
expect('value').to.not.satisfy((v) => typeof v === 'number');
expect([1, 2, 3]).to.be.an.array.that.satisfies((arr) => {
  return arr.every((value) => typeof value === 'number');
});
expect([1, 2, 3]).to.be.an.array.that.does.not.satisfy((arr: number[]) => {
  return arr.every((value) => typeof value === 'string');
});
```

### Assertions on function mocks

Besides the previously mentioned assertions, we provide some assertions that work nicely with [tinyspy][tinyspy] and [sinonjs][sinonjs] (or any other mock library that shares a similar API).

<hr />

#### .called

Allows you to assert if a function has been called.

```javascript
import { expect } from 'uvu-expect';
import { spy } from 'tinyspy';

const mockFn = spy();
expect(mockFn).not.to.have.been.called;
mockFn();
expect(mockFn).to.have.been.called;
```

<hr />

#### .times

Method that allows you to assert if a function has been called a specific amount of times.

Alias: `.calledTimes`

```javascript
const mockFn = spy();
expect(mockFn).not.to.have.been.called;
mockFn();
expect(mockFn).to.have.been.called.times(1);
expect(mockFn).to.have.been.called.but.not.times(2);
expect(mockFn).to.have.not.been.calledTimes(2);
```

You may use `.once`, `.twice` and `.thrice` instead of `.times(1)`, `.times(2)` and `.times(3)` respectively.

```javascript
const mockFn = spy();
expect(mockFn).not.to.have.been.called;
mockFn();
expect(mockFn).to.have.been.called.once;
mockFn();
expect(mockFn).to.have.been.called.twice;
mockFn();
expect(mockFn).to.have.been.called.thrice;
```

<hr />

#### .with

Allows you to assert if a function has been called with the specified arguments. You may use `.nth` somewhere before to restrict it to a specific call. You may also use `.last` before to restrict it to the last call.

Alias: `.calledWith`.

```javascript
const mockFn = spy();

mockFn(1);
mockFn(1, 2);
mockFn(1, 2, 3);

expect(mockFn).to.have.been.called.with(1);
expect(mockFn).to.have.been.called.with(1, 2);
expect(mockFn).to.have.been.called.with(1, 2, 3);
expect(mockFn).to.have.been.nth(1).called.with(1);
expect(mockFn).to.have.been.nth(2).called.not.with(1, 2, 3);
expect(mockFn).to.have.not.been.nth(2).calledWith(1, 2, 3);
expect(mockFn).to.have.been.last.called.with(1, 2, 3);
```

### Matchers

`.deep.equal`, `.match`, `.contain` and `.with` (for function arguments) can be made less strict by using matchers. This package comes bundled with [Sinon's matchers](https://sinonjs.org/releases/v13/matchers/) via Samsam. You can access them directly from `expect`. Its useage is the same as shown on Sinon's documentation, but instead of using `sinon.*` use `expect.*`.

```javascript
expect({
  deep: 'string',
  num: 1,
  another: 'string',
  arr: ['hello', 'goodbye'],
  obj: {
    prop: 'value',
  },
}).to.match({
  deep: expect.match.string,
  num: expect.match.number,
  arr: expect.match.array.contains(['hello']),
  obj: expect.match({
    prop: expect.match.string,
  }),
});
expect('zaphod and arthur').to.match(expect.match('and arthur'));
expect('zaphod').to.match(expect.match('aphod'));
expect('zaphod').to.match(expect.match(/aphod/));
expect('1').to.match(expect.match(1));
```

## Preventing accidentally not doing any assertions

Since we allow to use anything as a chain for assertions (except symbols), it is possible for you to accidentally not assert anything on your target, which would make your tests always pass. In order to mitigate this, this package will show a warning when no assertions are done after an `expect` with a message like this on your console:

```
No assertion was done on one of your `expect` calls.

Make sure you have no typos on your assertion:
expect(...).to.do.nothing
```

Your tests will still pass, but it will be obvious if you missed anything.

In case of false positives, you can globally disable this behaviour by calling the exported function `disableNoAssertionWarnings`, and you can enable them again by calling `enableNoAssertionWarnings`. You can disable it for a specific `expect` call by passing an object as a second argument to expect: `{ disableNoAssertionWarning: true }`.

## Adding custom assertions (plugins)

You can add properties and methods to this package by using `extend`. It expects a function that will receive two helpers: `replaceProperty` and `extendProperty`.

Properties are defined as an object with two functions: `onCall` and `onAccess`. `onAccess` gets executed whenever the property is accessed, and `onCall` is what will be executed if the property is called as a method. If you're using both for the same property it is recommended for `onAccess` to just add flags to your chain.

Within `onAccess` and `onCall` you can access `this`, it will contain the current flags of the chain, an `assert` function and a function to clear your flags.

> Since we're using proxies, `onAccess` will _always_ be called regardless of if you're using the property as a method or not.

### Flags/Modifiers

Flags are used to modify assertions that will be run later. For example, when adding a `.not` to your assertion, it adds a flag `negate` with a value of `true` to the chain. The method to add or access flags can be accessed through `this` like `this.flag`.

```javascript
// Accessing the value
const negated = this.flag('negate');

// Setting the value
this.flag('negate', true);
```

The target you're validation can be accessed through the flag `object`.

### this.assert

A method that can be accessed on `onCall` and `onAccess` that will throw an assertion error if the first argument passed is `false` (or if it's `true` if there is a `.not` before).

- The first argument is the condition to assert.
- The second argument is a message to show if the assertion failed while _not_ being negated.
- The third argument is a message to show if the assertion failed while being negated.
- The fourth argument is an optional object with options:
  - `expects`: the value expected.
  - `actual`: your actual value being validated, which defaults to `this.flag('object')`.
  - `showDiff`: indicates if the error should show a diff (built from `expects` and `actual`). Defaults to `false`.

```javascript
this.assert(
  actual === 'zaphod',
  'expected to be zaphod',
  'expected to not be zaphod',
  { actual, expects: 'zaphod', showDiff: true }
);
```

### addProperty

Adds an assertion on top of other assertions executed by the property (if it has any). The first argument is the name of the property to add. It can be an array of string if you'd like the property to have "aliases". The second argument is a property object (an object with an `onAccess` and `onCall` functions).

```javascript
extend(({ addProperty }) => {
  addProperty('zaphod', {
    onAccess() {
      const actual = this.flag('object');
      this.assert(
        actual === 'zaphod',
        'expected to be zaphod',
        'expected to not be zaphod'
      );
    }
  });
});
```

### replaceProperty

Allows you to replace a property by providing you with the original property value (the `onAccess` and `onCall` functions). It expects the name (or names if you want to add aliases) of the property to add as a first argument, and a function that will receive the original property as a second argument. This function should return a new property.

```javascript
extend(({ replaceProperty }) => {
  // We will replace both aliases
  replaceProperty(['equal', 'equals'], (handler) => {
    return {
      onCall(value) {
        if (typeof value === 'string') {
          this.assert(
            value === 'zaphod',
            'expected to be zaphod',
            'expected to not be zaphod'
          );
        } else {
          handler.onCall?.(value);
        }
      },
      onAccess() {
        handler.onAccess?.();
      },
    };
  });
});
```

## Extensions

If you want to make assertions like how you would with `@testing-library/jest-dom`, check out [uvu-expect-dom](https://github.com/pablo-abc/uvu-expect-dom).

[tinyspy]: https://github.com/Aslemammad/tinyspy
[sinonjs]: https://sinonjs.org
