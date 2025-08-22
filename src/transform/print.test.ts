import { types, type NodePath } from '@babel/core';
import { describe, expect, test } from 'vitest';
import { transform } from '../index';

function transformImportSpecifier (source: string, visit: (path: NodePath<types.ImportSpecifier>) => void) {
  return transform(source, {
    transformers: [
      () => ({
        visitor: {
          ImportSpecifier: visit,
        },
      }),
    ],
  }).code;
}

function transformObjectProperty (source: string, visit: (path: NodePath<types.ObjectProperty>) => void) {
  return transform(source, {
    transformers: [
      () => ({
        visitor: {
          ObjectProperty: visit,
        },
      }),
    ],
  }).code;
}

describe('Fix ast before print', () => {
  describe('ImportSpecifier', () => {
    test('Modify the names of imported and local', () => {
      const code = transformImportSpecifier(`import { foo } from 'foo'`, (path) => {
        // @ts-expect-error ignore
        path.node.imported.name = 'bar';
        path.node.local.name = 'bar';
      });

      expect(code).toBe(`import { bar } from 'foo'`);
    });

    test('Modify the name of local', () => {
      const code = transformImportSpecifier(`import { foo } from 'foo'`, (path) => {
        path.node.local.name = '_fooLocal';
      });

      expect(code).toBe(`import { foo as _fooLocal } from 'foo'`);
    });

    test('Modify the name of imported', () => {
      const code = transformImportSpecifier(`import { foo } from 'foo'`, (path) => {
        // @ts-expect-error ignore
        path.node.imported.name = '_fooImported';
      });

      expect(code).toBe(`import { _fooImported as foo } from 'foo'`);
    });

    test('Modify the local name of the type', () => {
      const code = transformImportSpecifier(`import { type foo } from 'foo'`, (path) => {
        path.node.local.name = '_fooLocal';
      });

      expect(code).toBe(`import { type foo as _fooLocal } from 'foo'`);
    });

    test('Modify the imported name of the type', () => {
      const code = transformImportSpecifier(`import { type foo } from 'foo'`, (path) => {
        // @ts-expect-error ignore
        path.node.imported.name = '_fooImported';
      });

      expect(code).toBe(`import { type _fooImported as foo } from 'foo'`);
    });

    test('Modify the name of imported to be the same as local', () => {
      const code = transformImportSpecifier(`import { foo as bar } from 'foo'`, (path) => {
        // @ts-expect-error ignore
        path.node.imported.name = 'bar';
      });

      expect(code).toBe(`import { bar } from 'foo'`);
    });

    test('Modify the name of local to be the same as imported', () => {
      const code = transformImportSpecifier(`import { foo as bar } from 'foo'`, (path) => {
        path.node.local.name = 'foo';
      });

      expect(code).toBe(`import { foo } from 'foo'`);
    });

    test('No side effects', () => {
      const source = `
        import 'foo'
        import {} from 'foo'
        import fooDefault from 'foo'
        import * as fooNamespace from 'foo'
        import { foo} from 'foo'
        import {foo2} from 'foo'
        import {foo3 } from 'foo'
        import {foo as bar } from 'foo'
        import {foo as bar2} from 'foo'
        import { foo as bar3} from 'foo'
        import { type foo as barType } from 'foo'
        import type { fooType} from 'foo'
        import type {foo as fooType2 } from 'foo'

        import { /*before*/ fooX /*after*/} from 'foo'
      `;

      const { code } = transform(source, {
        transformers: [],
      });

      expect(code).toBe(source);
    });
  });

  describe('ObjectProperty', () => {
    test('Modify the names of key and value', () => {
      const code = transformObjectProperty('const obj = { key: value }', (path) => {
        // @ts-expect-error ignore
        path.node.key.name = 'bar';
        // @ts-expect-error ignore
        path.node.value.name = 'bar';
      });

      expect(code).toBe('const obj = { bar: bar }');
    });

    test('Modify the names of key and value (shorthand)', () => {
      const code = transformObjectProperty('const obj = { foo }', (path) => {
        // @ts-expect-error ignore
        path.node.key.name = 'bar';
        // @ts-expect-error ignore
        path.node.value.name = 'bar';
      });

      expect(code).toBe('const obj = { bar }');
    });

    test('Modify the name of key', () => {
      const code = transformObjectProperty('const obj = { foo }', (path) => {
        // @ts-expect-error ignore
        path.node.key.name = '_fooKey';
      });

      expect(code).toBe('const obj = { _fooKey: foo }');
    });

    test('Modify the name of value', () => {
      const code = transformObjectProperty('const obj = { foo }', (path) => {
        // @ts-expect-error ignore
        path.node.value.name = '_fooValue';
      });

      expect(code).toBe('const obj = { foo: _fooValue }');
    });

    test('Modify the name of key to be same as value', () => {
      const code = transformObjectProperty('const obj = { foo: bar }', (path) => {
        // @ts-expect-error ignore
        path.node.key.name = 'bar';
      });

      expect(code).toBe('const obj = { bar: bar }');
    });

    test('Modify the name of value to be same as key', () => {
      const code = transformObjectProperty('const obj = { foo: bar }', (path) => {
        // @ts-expect-error ignore
        path.node.value.name = 'foo';
      });

      expect(code).toBe('const obj = { foo: foo }');
    });

    test('Modify the value to an expression', () => {
      const code = transformObjectProperty('const obj = { foo: bar }', (path) => {
        path.node.value = types.callExpression(types.identifier('bar'), [types.numericLiteral(123)]);
      });

      expect(code).toBe('const obj = { foo: bar(123) }');
    });

    test('Modify the value to an expression (shorthand)', () => {
      const code = transformObjectProperty('const obj = { foo }', (path) => {
        path.node.value = types.callExpression(types.identifier('bar'), [types.numericLiteral(123)]);
      });

      expect(code).toBe('const obj = { foo: bar(123) }');
    });

    test('No side effects', () => {
      const source = `
        const obj1 = { foo }
        const obj2 = { foo: foo }
        const obj3 = { foo: bar }
        const obj4 = { foo: 123 }
        const obj5 = { foo: bar(123) }
        const obj6 = { [foo]: foo }
        const obj7 = { [foo]: bar }
        const { foo, bar = 1 } = {}
      `;

      const { code } = transform(source, {
        transformers: [],
      });

      expect(code).toBe(source);
    });
  });
});
