import * as sinon from 'sinon';
import * as assert from 'uvu/assert';
import { suite } from 'uvu';
import type { ExpectContext } from '../src';
import { expect, extend } from '../src';

const Expect = suite('expect');

function assertThrows(fn: () => void, matcher: any) {
  assert.throws(() => {
    try {
      fn();
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, matcher);
}

Expect('tests ok assertion', () => {
  expect(null).to.not.be.ok;
  expect('truthy').to.be.ok.test;
});

Expect('equal assertion', () => {
  expect('test').to.equal('test');
  expect('test').to.not.equal('wrong');
  expect({ deep: 'value' }).to.deep.equal({ deep: 'value' });
  expect({ deep: 'value' })
    .to.not.equal({ deep: 'value' })
    .and.deep.equal({ deep: 'value' });
});

Expect('true, false, undefined and null assertions', () => {
  expect(true).to.be.true;
  expect(false).to.not.be.true;
  expect(false).to.be.false;
  expect(true).to.not.be.false;
  expect(null).to.be.null;
  expect(undefined).to.not.be.null;
  expect(undefined).to.be.undefined;
  expect(null).to.not.be.undefined;
});

Expect('type assertion', () => {
  expect('string').to.be.a('string');
  expect(1).to.be.type('number');
  expect('string').to.not.be.a('number');
  expect({}).to.be.an('object');
  expect({}).to.be.a.plain.type('object');
  expect([]).to.be.an('array');
});

Expect('instance assertion', () => {
  expect(new Date()).to.be.instance(Date);
  expect(new URL('https://example.com')).to.not.be.instanceOf(Date);
});

Expect('extends expect', () => {
  const onCall = sinon.fake();
  const onAccess = sinon.fake();
  const zaphodValidation = sinon.fake();
  extend(({ replaceProperty, extendProperty }) => {
    replaceProperty('test', { onCall, onAccess });
    replaceProperty(['alias1', 'alias2'], { onCall, onAccess });
    extendProperty(['test'], (handler) => {
      return {
        onCall(value: any) {
          handler.onCall?.();
          onCall(value);
        },
        onAccess() {
          handler.onAccess?.();
          onAccess();
        },
      };
    });

    extendProperty('zaphod', () => ({
      onAccess(this: ExpectContext) {
        const actual = this.flag('object');
        zaphodValidation();
        this.assert(
          actual === 'zaphod',
          'expected to be zaphod',
          'expected to not be zaphod'
        );
      },
    }));
  });

  expect({}).to.test;

  sinon.assert.notCalled(onCall);
  sinon.assert.calledTwice(onAccess);

  expect({}).to.test('value');

  sinon.assert.calledTwice(onCall);
  sinon.assert.calledWith(onCall, 'value');
  sinon.assert.callCount(onAccess, 4);

  expect({}).to.alias1;

  sinon.assert.callCount(onAccess, 5);

  expect({}).to.alias2;

  sinon.assert.callCount(onAccess, 6);

  expect('zaphod').to.be.zaphod;

  expect('arthur').to.not.be.zaphod;

  sinon.assert.called(zaphodValidation);

  assertThrows(() => {
    expect('arthur').to.be.zaphod;
  }, /expected to be zaphod/);

  assertThrows(() => {
    expect('zaphod').to.not.be.zaphod;
  }, /expected to not be zaphod/);
});

Expect('only proxies handles strings', () => {
  assert.is(expect({})[Symbol()], undefined);
});

Expect('asserts inclusion of string and arrays', () => {
  expect('zaphod and arthur').to.include('arthur');
  expect('zaphod').to.not.include('arthur');
  expect(['zaphod', 'arthur']).to.contain('zaphod');
  expect(['zaphod', 'arthur']).to.not.contain('marvin');
});

Expect('asserts match', () => {
  expect('zaphod and arthur').to.match('arthur');
  expect('zaphod and arthur').to.match(/and/);
  expect('zaphod').to.not.match(/arthur/);
  expect('zaphod').to.not.match('arthur');
});

Expect('assert object and array include', () => {
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
  expect(['arthur']).to.match(/art/);
});

Expect('asserts property', () => {
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
  expect(testObj).to.not.have.property('h');
  expect(testObj).to.have.nested.property('c.d').that.equals(3);
});

Expect('asserts type with props', () => {
  expect(1).to.be.a.number;
  expect(1).to.not.be.a.string.and.to.be.a.number;
  expect('a').to.be.a.string;
  expect(true).to.be.a.boolean;
  expect({}).to.be.an.object;
  expect(new Date()).to.be.an.object;
  expect(new Date()).to.not.be.a.plain.object;
  expect({}).to.be.a.plain.object;
  expect(() => undefined).to.be.a.function;
});

Expect('asserts on members', () => {
  expect([1, 2, 3]).to.have.members([3, 2, 1]);
  expect([1, 2, 3]).to.contain.members([3, 2]);
  expect([1, 2, 3]).to.not.have.ordered.members([3, 2]);
  expect([1, 2, 3]).to.contain.ordered.members([2, 3]);
  expect([1, 2, 3]).to.not.have.members([3, 2, 4]);
  expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.not.contain.members([{ a: 1 }]);
  expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.contain.deep.members([{ a: 1 }]);
  expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.contain.deep.members([
    { b: 2 },
    { a: 1 },
  ]);
  expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.not.contain.deep.ordered.members([
    { b: 2 },
    { a: 1 },
  ]);
  expect([{ a: 1 }, { b: 2 }, { c: 3 }]).to.contain.deep.ordered.members([
    { b: 2 },
    { c: 3 },
  ]);
});

Expect('asserts on length', () => {
  expect('a string').to.have.a.lengthOf(8);
  expect('a string').to.not.have.a.lengthOf(4);
  expect([1, 2, 3]).to.have.a.length(3);
  expect([1, 2, 3]).to.not.have.a.length(4);
});

Expect('asserts on satisfy', () => {
  expect('value').to.satisfy((v: string) => typeof v === 'string');
  expect('value').to.not.satisfy((v: string) => typeof v === 'number');
  expect([1, 2, 3]).to.be.an.array.that.satisfies((arr: number[]) => {
    return arr.every((value) => typeof value === 'number');
  });
  expect([1, 2, 3]).to.be.an.array.that.does.not.satisfy((arr: number[]) => {
    return arr.every((value) => typeof value === 'string');
  });
});

Expect('asserts on empty', () => {
  expect('').to.be.empty;
  expect([]).to.be.empty;
  expect(new Map()).to.be.empty;
  expect(new Set()).to.be.empty;
  expect({}).to.be.empty;
  expect('not empty').to.not.be.empty;
  expect(new Set([1])).to.not.be.empty;
  expect(new Map([['a', 1]])).to.not.be.empty;
  expect({ a: 1 }).to.not.be.empty;
});

Expect.run();
