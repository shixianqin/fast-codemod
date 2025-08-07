import type { NodePath } from '@babel/traverse';
import { describe, expect, test } from 'vitest';
import { transform } from '../index';
import { generateUid } from './index';

const source = `
  const foo = 1

  function fn (args) {
    const fnFoo = 2
  }

  {
    const blockFoo = 3
  }
`;

function _transform (scope: 'BlockStatement' | 'FunctionDeclaration' | 'Program', name: undefined | string, expected: string) {
  let uid = '';

  transform(source, {
    transformers: [
      () => ({
        visitor: {
          [scope]: (path: NodePath) => {
            if (scope === 'BlockStatement' && path.parent.type === 'FunctionDeclaration') {
              return;
            }

            uid = generateUid(path, name);
          },
        },
      }),
    ],
  });

  expect(uid).toBe(expected);
}

describe('Own Scope', () => {
  test('Has foo', () => {
    _transform('Program', 'foo', '_foo');
  });

  test('Has fn', () => {
    _transform('Program', 'fn', '_fn');
  });

  test('Has fnFoo', () => {
    _transform('Program', 'fnFoo', '_fnFoo');
  });

  test('Has args', () => {
    _transform('Program', 'args', '_args');
  });

  test('Has blockFoo', () => {
    _transform('Program', 'blockFoo', '_blockFoo');
  });

  test('No bar', () => {
    _transform('Program', 'bar', 'bar');
  });
});

describe('Nested Function Scope', () => {
  test('Has foo', () => {
    _transform('FunctionDeclaration', 'foo', '_foo');
  });

  test('Has fn', () => {
    _transform('FunctionDeclaration', 'fn', '_fn');
  });

  test('Has args', () => {
    _transform('FunctionDeclaration', 'args', '_args');
  });

  test('Has fnFoo', () => {
    _transform('FunctionDeclaration', 'fnFoo', '_fnFoo');
  });

  test('No bar', () => {
    _transform('FunctionDeclaration', 'bar', 'bar');
  });

  test('No blockFoo', () => {
    _transform('FunctionDeclaration', 'blockFoo', 'blockFoo');
  });
});

describe('Nested Block Scope', () => {
  test('Has foo', () => {
    _transform('BlockStatement', 'foo', '_foo');
  });

  test('Has fn', () => {
    _transform('BlockStatement', 'fn', '_fn');
  });

  test('Has blockFoo', () => {
    _transform('BlockStatement', 'blockFoo', '_blockFoo');
  });

  test('No bar', () => {
    _transform('BlockStatement', 'bar', 'bar');
  });

  test('No args', () => {
    _transform('BlockStatement', 'args', 'args');
  });

  test('No fnFoo', () => {
    _transform('BlockStatement', 'fnFoo', 'fnFoo');
  });
});

describe('Invalid name', () => {
  test('/foo/bar', () => {
    _transform('Program', '/foo/bar', '_fooBar');
  });

  test('foo-bar', () => {
    _transform('Program', 'foo-bar', '_fooBar');
  });

  test('012', () => {
    _transform('Program', '012', '_');
  });

  test('012abc', () => {
    _transform('Program', '012abc', '_abc');
  });

  test('Undefined', () => {
    _transform('Program', undefined, '_temp');
  });

  test('Keyword', () => {
    _transform('Program', 'class', '_class');
    _transform('Program', 'const', '_const');
    _transform('Program', 'return', '_return');
  });
});
