import { types } from '@babel/core';
import { expect, test } from 'vitest';
import { transform } from '../../index';
import { traverseImportReferences, type SpecifierReferencePattern } from '../index';

function replace (type: SpecifierReferencePattern['type'], name: string): SpecifierReferencePattern {
  return {
    imported: name,
    type,
    visitor: {
      Identifier: (path) => {
        path.replaceWith(types.identifier(`$_${ type }_${ name }`));
      },
    },
  };
}

const visitors: SpecifierReferencePattern[] = [
  replace('default', 'foo'),
  replace('namespace', 'foo'),
  replace('named', 'foo'),
  replace('named', 'bar'),
];

function _transform (source: string, expected: string) {
  const { code } = transform(source, {
    transformers: [
      () => ({
        visitor: {
          Program: (path) => {
            traverseImportReferences(path, 'foo', visitors);
          },
        },
      }),
    ],
  });

  expect(code).toBe(expected);
}

test('Default', () => {
  _transform(
    `import foo from 'foo'; foo`,
    `import foo from 'foo'; $_default_foo`,
  );
});

test('Namespace', () => {
  _transform(
    `import * as foo from 'foo'; foo`,
    `import * as foo from 'foo'; $_namespace_foo`,
  );
});

test('Named', () => {
  _transform(
    `import { foo } from 'foo'; foo`,
    `import { foo } from 'foo'; $_named_foo`,
  );
});

test('Named.renamed', () => {
  _transform(
    `import { foo as bar } from 'foo'; bar`,
    `import { foo as bar } from 'foo'; $_named_foo`,
  );
});

test('MultiNamed', () => {
  _transform(
    `import { foo, bar } from 'foo'; foo; bar`,
    `import { foo, bar } from 'foo'; $_named_foo; $_named_bar`,
  );
});

test('MultiNamed.renamed', () => {
  _transform(
    `import { foo as _foo, bar as _bar } from 'foo'; _foo; _bar`,
    `import { foo as _foo, bar as _bar } from 'foo'; $_named_foo; $_named_bar`,
  );
});

test('MixedImports', () => {
  _transform(
    `
      import defaultFoo, { foo, bar } from 'foo';
      defaultFoo;
      foo;
      bar;
    `,
    `
      import defaultFoo, { foo, bar } from 'foo';
      $_default_foo;
      $_named_foo;
      $_named_bar;
    `,
  );
});

test('All', () => {
  _transform(
    `
      import defaultFoo, * as namespaceFoo from 'foo';
      import { foo, bar } from 'foo';
      defaultFoo;
      namespaceFoo;
      foo;
      bar;
    `,
    `
      import defaultFoo, * as namespaceFoo from 'foo';
      import { foo, bar } from 'foo';
      $_default_foo;
      $_namespace_foo;
      $_named_foo;
      $_named_bar;
    `,
  );
});
