import * as sinon from 'sinon';
import { spy } from 'tinyspy';
import * as assert from 'uvu/assert';
import { suite } from 'uvu';
import type { ExpectContext } from '../src';
import { expect, extend } from '../src';

const Expect = suite('expect');

function assertThrows(fn: () => void, matcher?: any) {
  assert.throws(() => {
    try {
      fn();
    } catch (err: any) {
      if (!(err instanceof assert.Assertion) && !(err instanceof TypeError))
        return;
      throw new Error(err.message);
    }
  }, matcher);
}

async function assertRejects(fn: () => Promise<void>, matcher?: any) {
  try {
    await fn();
  } catch (err: any) {
    if (!(err instanceof assert.Assertion) && !(err instanceof TypeError)) {
      assert.unreachable('Should have rejected');
    }
    if (matcher) assert.match(err.message, matcher);
  }
}

Expect.before.each(() => {
  sinon.restore();
});

Expect('tests ok assertion', async () => {
  expect(null).to.not.be.ok;
  assertThrows(() => expect(null).to.be.ok, /Expected value to be truthy/);
  expect('truthy').to.be.ok;
  assertThrows(() => expect('truthy').to.not.be.ok);
  assertThrows(
    () => expect('truthy').to.resolve,
    /Expected target to be a promise/
  );
  await expect(Promise.resolve({ hello: 'hi' })).resolves.to.ok;
  await assertRejects(
    () => expect(Promise.resolve({ hello: 'hi' })).resolves.to.not.ok,
    /Expected value to be falsey/
  );
  await assertRejects(
    () => expect(Promise.resolve({ hello: 'hi' })).rejects,
    /Expected promise to reject/
  );
  await assertRejects(
    () => expect(Promise.reject({ hello: 'hi' })).resolves,
    /Expected promise to resolve/
  );
  await expect(Promise.resolve(null)).resolves.to.not.ok;
  await expect(Promise.resolve(null)).to.resolve.to.not.ok;
  await expect(Promise.reject({ hello: 'hi' })).rejects.to.ok.and.deep.equal({
    hello: expect.match.string,
  });
  await expect(Promise.reject(null)).rejects.to.not.ok;
});

Expect('equal assertion', () => {
  expect('test').to.equal('test');
  assertThrows(() => expect('test').to.not.equal('test'));
  expect('test').to.not.equal('wrong');
  assertThrows(() => expect('test').to.equal('wrong'));
  expect({ deep: 'value' }).to.deep.equal({ deep: 'value' });
  expect({ deep: 'value' }).to.deep.equal({ deep: expect.match.string });
  assertThrows(() =>
    expect({ deep: 'value' }).not.deep.equal({ deep: 'value' })
  );
  expect({ deep: 'value' })
    .to.not.equal({ deep: 'value' })
    .and.deep.equal({ deep: 'value' });
});

Expect('true, false, undefined and null assertions', () => {
  expect(true).to.be.true;
  assertThrows(() => expect(true).to.not.be.true);
  expect(false).to.not.be.true;
  assertThrows(() => expect(false).to.be.true);
  expect(false).to.be.false;
  assertThrows(() => expect(false).to.not.be.false);
  expect(true).to.not.be.false;
  assertThrows(() => expect(true).to.be.false);
  expect(null).to.be.null;
  assertThrows(() => expect(null).to.not.be.null);
  expect(undefined).to.not.be.null;
  assertThrows(() => expect(undefined).to.be.null);
  expect(undefined).to.be.undefined;
  assertThrows(() => expect(undefined).to.not.be.undefined);
  expect(null).to.not.be.undefined;
  assertThrows(() => expect(null).to.be.undefined);
  expect(NaN).to.be.NaN;
  expect(1).not.to.be.NaN;
  expect('asd').to.not.be.NaN;
  assertThrows(() => expect(NaN).to.not.be.NaN);
});

Expect('type assertion', () => {
  expect('string').to.be.a('string');
  assertThrows(() => expect('string').to.be.a('number'));
  expect(1).to.be.type('number');
  assertThrows(() => expect(1).to.be.type('string'));
  expect('string').to.not.be.a('number');
  assertThrows(() => expect('string').to.be.a('number'));
  expect({}).to.be.an('object');
  assertThrows(() => expect(() => undefined).to.be.an('object'));
  expect([]).to.be.an('object');
  assertThrows(() => expect([]).to.be.a.plain.type('object'));
  expect({}).to.be.a.plain.type('object');
  expect([]).to.be.an('array');
  assertThrows(() => expect({}).to.be.an('array'));
});

Expect('instance assertion', () => {
  expect(new Date()).to.be.instance(Date);
  expect(new URL('https://example.com')).to.not.be.instanceOf(Date);
});

Expect('extends expect', () => {
  const onCall = sinon.fake();
  const onAccess = sinon.fake();
  const zaphodValidation = sinon.fake();
  extend(({ addProperty, replaceProperty }) => {
    addProperty('test', { onCall, onAccess });
    addProperty(['equals', 'equal'], { onCall, onAccess });
    addProperty(['alias1', 'alias2'], {
      onCall,
      onAccess(this: any) {
        this.abortNoAssertionWarning();
        onAccess.call(this);
      },
    });
    replaceProperty(['test'], (handler) => {
      return {
        onCall(value: any) {
          handler.onCall?.();
          onCall(value);
        },
        onAccess(this: any) {
          this.abortNoAssertionWarning();
          handler.onAccess?.();
          onAccess();
        },
      };
    });

    replaceProperty('zaphod', () => ({
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
  expect('value').to.not.equal('not value');
  expect(onCall).to.have.been.called.once;
  expect(onAccess).to.have.been.called.once;
  assertThrows(() => expect('value').to.equal('not value'));
  onCall.resetHistory();
  onAccess.resetHistory();

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

Expect('only proxies string props and warns on no assertion', async () => {
  const mockWarn = sinon.spy(console, 'warn');
  assert.is(expect({}).on.symbol[Symbol()], undefined);
  await new Promise((r) => setTimeout(r));

  expect(mockWarn).to.have.been.called;
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
  expect('zaphod').to.match(expect.match('aphod'));
  expect('zaphod').to.match(expect.match(/aphod/));
  expect('1').to.match(expect.match(1));
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
  assertThrows(() => {
    expect({ deep: 'string', num: 1, another: 'string' }).to.match({
      deep: expect.match.number,
      num: expect.match.string,
    });
  });
  expect(['hello', 'goodbye', 'sup']).to.match(['goodbye', 'sup']);
  assertThrows(() =>
    expect(['hello', 'goodbye', 'sup']).to.match(['hello', 'sup'])
  );
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
  assertThrows(() => expect(testObj).to.contain({ d: 3 }));
  expect(testObj).to.deeply.contain({ d: 3 });
  expect(testObj).to.contain({ e: [1, 2, 3] });
  expect(new Set([1, 2, 3])).to.contain(2);
  expect(new Set([1, 2, 3])).to.not.contain(4);
  assertThrows(() => expect([{}]).to.contain({}));
  expect([{}]).to.deeply.contain({});
  expect(['arthur']).to.match(/art/);
  assertThrows(() => expect(['arthur']).to.match(/marvin/));
  expect([[{ a: 1 }], [2, 3]]).to.deep.contain({ a: 1 });
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
  assertThrows(() => expect(testObj).to.have.property('d'));
  assertThrows(
    () => expect(testObj).to.have.nested.own.property('c.d'),
    /can not be combined with/
  );
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
  expect(new Set([1, 2, 2])).to.have.length(2);
  assertThrows(() => expect({}).to.have.length(2));
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
  assertThrows(() => expect({}).to.satisfy(() => false));
  assert.throws(() =>
    expect({}).to.satisfy(() => {
      throw new Error('A message');
    })
  );
});

Expect('asserts on empty', () => {
  expect('').to.be.empty;
  expect([]).to.be.empty;
  expect(new Map()).to.be.empty;
  expect(new Set()).to.be.empty;
  expect({}).to.be.empty;
  expect('not empty').to.not.be.empty;
  expect(new Set([1])).to.not.be.empty;
  assertThrows(() => expect(new Set([1])).to.be.empty);
  expect(new Map([['a', 1]])).to.not.be.empty;
  expect({ a: 1 }).to.not.be.empty;
  assertThrows(() => expect(() => undefined).to.be.empty);
});

Expect('asserts called mock function', () => {
  const tspy = spy();
  const sspy = sinon.fake();
  assertThrows(() => expect(() => undefined).to.have.not.been.called);
  assertThrows(() => expect(() => undefined).to.have.been.called);
  expect(tspy).to.have.not.been.called;
  assertThrows(() => expect(tspy).to.have.been.called);
  expect(sspy).to.have.not.been.called;
  assertThrows(() => expect(sspy).to.have.been.called);
  tspy(1, 2, 3);
  sspy(1, 2, 3);
  expect(tspy).to.have.been.called.with(1, 2, 3);
  expect(tspy).to.have.been.last.called.with.args.that.have.members([1, 2, 3]);
  expect(tspy).to.have.been.called.but.not.with(1, 2, 4);
  expect(tspy).to.have.not.been.calledWith(1, 2, 4);
  expect(tspy).to.have.been.called.times(1);
  expect(tspy).to.have.not.been.calledTimes(2);
  expect(tspy).to.have.been.called.once;
  assertThrows(() => {
    expect(tspy).to.have.been.nth(2).called.with(1, 2, 3);
  }, /The function has not been called enough times/);
  assertThrows(() => expect(tspy).to.have.been.called.times(2));
  assertThrows(() => expect(tspy).to.not.have.been.called);
  assertThrows(() => expect(tspy).to.not.have.been.called.twice);
  assertThrows(() => expect(tspy).to.not.have.been.called.thrice);
  expect(sspy).to.have.been.called.with(1, 2, 3);
  expect(sspy).to.have.been.called.but.not.with(1, 2, 4);
  expect(sspy).to.have.been.called.times(1);
  expect(sspy).to.have.been.called.once;
  assertThrows(() => {
    expect(sspy).to.have.been.nth(2).called.with(1, 2, 3);
  }, /The function has not been called enough times/);
  assertThrows(() => expect(sspy).to.have.been.called.times(2));
  assertThrows(() => expect(sspy).to.not.have.been.called);
  assertThrows(() => expect(sspy).to.not.have.been.called.twice);
  assertThrows(() => expect(sspy).to.not.have.been.called.thrice);
  tspy(2, 3, [1]);
  sspy(2, 3, [1]);
  expect(tspy).to.have.been.called.twice;
  expect(tspy).to.have.been.nth(1).called.with(1, 2, 3);
  expect(tspy).to.have.been.last.called.with(2, 3, [1]);
  assertThrows(() => expect(tspy).to.have.been.last.called.with(1, 2, 3));
  expect(sspy).to.have.been.called.twice;
  expect(sspy).to.have.been.nth(1).called.with(1, 2, 3);
  expect(sspy).to.have.been.last.called.with(2, 3, [1]);
  assertThrows(() => expect(sspy).to.have.been.last.called.with(1, 2, 3));
  tspy({ value: 'string', num: 1 });
  sspy({ value: 'string', num: 1 });
  expect(tspy).to.have.been.called.thrice;
  expect(sspy).to.have.been.called.thrice;
  expect(tspy).to.have.been.last.called.with(
    expect.match({
      value: expect.match.string,
    })
  );
  expect(tspy).to.have.been.last.called.with({
    value: expect.match.string.and(expect.match('string')),
    num: expect.match.number,
  });
});

Expect.run();
