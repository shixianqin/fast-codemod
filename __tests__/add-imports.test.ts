import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { describe, expect, test } from 'vitest';
import { transform } from '../src';
import { addImportDefault, addImportNamed, addImportNamespace, addImportSideEffect } from '../src/helpers';

function _transform (source: string[], expected: string[], visit: (path: NodePath<t.Program>) => void) {
  const { code } = transform(
    source.join('\n'),
    {
      recastOptions: {
        quote: 'single',
      },
      transformers: [
        () => ({
          visitor: {
            Program: visit,
          },
        }),
      ],
    },
  );

  expect(code).toBe(expected.join('\n'));
}

describe('addSideEffect', () => {
  test('Add without any import', () => {
    _transform(
      ['const v = 1'],
      [
        `import 'foo';`,
        'const v = 1',
      ],
      (path) => {
        addImportSideEffect(path, 'foo');
      },
    );
  });

  test('Add with other import and statements', () => {
    _transform([
      `import 'bar'`,
      'const v = 1',
    ], [
      `import 'bar'`,
      `import 'foo';`,
      'const v = 1',
    ], (path) => {
      addImportSideEffect(path, 'foo');
    });
  });

  test('Add when non-existent', () => {
    _transform(
      [`import 'bar'`],
      [
        `import 'bar'`,
        `import 'foo';`,
      ],
      (path) => {
        addImportSideEffect(path, 'foo');
      },
    );
  });

  test('Add when already existing', () => {
    _transform(
      [`import 'foo'`],
      [`import 'foo'`],
      (path) => {
        addImportSideEffect(path, 'foo');
      },
    );
  });

  test('Add when existing but not side effect', () => {
    _transform(
      [`import foo from 'foo'`],
      [`import foo from 'foo'`],
      (path) => {
        addImportSideEffect(path, 'foo');
      },
    );
  });

  test('Add when existing but with type', () => {
    _transform(
      [`import type foo from 'foo'`],
      [
        `import type foo from 'foo'`,
        `import 'foo';`,
      ],
      (path) => {
        addImportSideEffect(path, 'foo');
      },
    );
  });

  test('Add repeatedly', () => {
    _transform(
      [''],
      [`import 'foo';`],
      (path) => {
        addImportSideEffect(path, 'foo');
        addImportSideEffect(path, 'foo');
        addImportSideEffect(path, 'foo');
      },
    );
  });
});

describe('addDefault', () => {
  test('Add when non-existent', () => {
    _transform(
      [`import bar from 'bar'`],
      [
        `import bar from 'bar'`,
        `import foo from 'foo';`,
      ],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add when already existing', () => {
    _transform(
      [`import foo from 'foo'`],
      [`import foo from 'foo'`],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add when already existing with as named', () => {
    _transform(
      [`import { default as foo } from 'foo'`],
      [`import { default as foo } from 'foo'`],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add when existing but with side effect', () => {
    _transform(
      [`import 'foo'`],
      [`import foo from 'foo';`],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add when existing but with namespace', () => {
    _transform(
      [`import * as foo from 'foo'`],
      [`import _foo, * as foo from 'foo';`],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add when existing but with named', () => {
    _transform(
      [`import { bar } from 'foo'`],
      [`import foo, { bar } from 'foo';`],
      (path) => {
        addImportDefault(path, 'foo');
      },
    );
  });

  test('Add repeatedly', () => {
    _transform(
      [''],
      [`import foo from 'foo';`],
      (path) => {
        addImportDefault(path, 'foo');
        addImportDefault(path, 'foo');
        addImportDefault(path, 'foo');
      },
    );
  });
});

describe('addNamespace', () => {
  test('Add when non-existent', () => {
    _transform(
      [`import 'bar'`],
      [
        `import 'bar'`,
        `import * as foo from 'foo';`,
      ],
      (path) => {
        addImportNamespace(path, 'foo');
      },
    );
  });

  test('Add when already existing', () => {
    _transform(
      [`import * as foo from 'foo'`],
      [`import * as foo from 'foo'`],
      (path) => {
        addImportNamespace(path, 'foo');
      },
    );
  });

  test('Add when existing but with side effect', () => {
    _transform(
      [`import 'foo'`],
      [`import * as foo from 'foo';`],
      (path) => {
        addImportNamespace(path, 'foo');
      },
    );
  });

  test('Add when existing but with default', () => {
    _transform(
      [`import foo from 'foo'`],
      [`import foo, * as _foo from 'foo';`],
      (path) => {
        addImportNamespace(path, 'foo');
      },
    );
  });

  test('Add when existing but with named', () => {
    _transform(
      [`import { foo } from 'foo'`],
      [
        `import { foo } from 'foo'`,
        `import * as _foo from 'foo';`,
      ],
      (path) => {
        addImportNamespace(path, 'foo');
      },
    );
  });

  test('Add repeatedly', () => {
    _transform(
      [''],
      [`import * as foo from 'foo';`],
      (path) => {
        addImportNamespace(path, 'foo');
        addImportNamespace(path, 'foo');
        addImportNamespace(path, 'foo');
      },
    );
  });
});

describe('addNamed', () => {
  test('Add when non-existent', () => {
    _transform(
      [`import 'bar'`],
      [
        `import 'bar'`,
        `import { foo } from 'foo';`,
      ],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add when non-existent (type)', () => {
    _transform(
      [`import 'bar'`],
      [
        `import 'bar'`,
        `import { type foo } from 'foo';`,
      ],
      (path) => {
        addImportNamed(path, 'foo', 'foo', {
          importKind: 'type',
        });
      },
    );
  });

  test('Add when already existing', () => {
    _transform(
      [`import { foo } from 'foo'`],
      [`import { foo } from 'foo'`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add when already existing (type)', () => {
    _transform(
      [`import { foo } from 'foo'`],
      [`import { foo } from 'foo'`],
      (path) => {
        addImportNamed(path, 'foo', 'foo', {
          importKind: 'type',
        });
      },
    );
  });

  test('Add when already existing with as', () => {
    _transform(
      [`import { foo as bar } from 'foo'`],
      [`import { foo as bar } from 'foo'`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add when already existing with type', () => {
    _transform(
      [`import { type foo } from 'foo'`],
      [`import { foo } from 'foo'`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add when existing but with side effect', () => {
    _transform(
      [`import 'foo'`],
      [`import { foo } from 'foo';`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add when existing but with default', () => {
    _transform(
      [`import foo from 'foo'`],
      [`import foo, { bar } from 'foo';`],
      (path) => {
        addImportNamed(path, 'bar', 'foo');
      },
    );
  });

  test('Add when existing but with namespace', () => {
    _transform(
      [`import * as foo from 'foo'`],
      [
        `import * as foo from 'foo'`,
        `import { bar } from 'foo';`,
      ],
      (path) => {
        addImportNamed(path, 'bar', 'foo');
      },
    );
  });

  test('Add when existing but with others', () => {
    _transform(
      [`import { bar } from 'foo'`],
      [`import { bar, foo } from 'foo';`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });

  test('Add repeatedly', () => {
    _transform(
      [''],
      [`import { foo } from 'foo';`],
      (path) => {
        addImportNamed(path, 'foo', 'foo');
        addImportNamed(path, 'foo', 'foo');
        addImportNamed(path, 'foo', 'foo');
      },
    );
  });
});
