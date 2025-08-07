/* eslint perfectionist/sort-objects: ['error', { type: 'natural' }] */

import type { NodePath } from '@babel/traverse';
import { describe, expect, test } from 'vitest';
import { transform, type TransformParser } from '../../index';
import { addImportDefault, addImportNamed, addImportNamespace, addImportSideEffect } from '../index';

type ImportKind = typeof IMPORT_KINDS[number];
type ImportType = typeof IMPORT_TYPES[number];

interface ImportTestCase {
  name: string;
  kind: ImportKind;
  type: ImportType;
  template: string;
}

const IMPORT_TYPES = ['default', 'named', 'namespace', 'sideEffect'] as const;
const IMPORT_KINDS = ['type', 'typeof', 'value'] as const;
const TEMPLATE_DEFAULT = 'DEFAULT';
const TEMPLATE_NAMED = 'NAMED';
const TEMPLATE_NAMESPACE = 'NAMESPACE';
const TEMPLATE_SOURCE = 'source';

const TEMPLATES: {[K in ImportKind]: {[T in ImportType]: string }} = {
  type: {
    default: `import type TYPE_${TEMPLATE_DEFAULT} from "${TEMPLATE_SOURCE}"`,
    named: `import type { TYPE_${TEMPLATE_NAMED} } from "${TEMPLATE_SOURCE}"`,
    namespace: `import type * as TYPE_${TEMPLATE_NAMESPACE} from "${TEMPLATE_SOURCE}"`,
    sideEffect: `import "${TEMPLATE_SOURCE}"`,
  },
  typeof: {
    default: `import typeof TYPEOF_${TEMPLATE_DEFAULT} from "${TEMPLATE_SOURCE}"`,
    named: `import typeof { TYPEOF_${TEMPLATE_NAMED} } from "${TEMPLATE_SOURCE}"`,
    namespace: `import typeof * as TYPEOF_${TEMPLATE_NAMESPACE} from "${TEMPLATE_SOURCE}"`,
    sideEffect: `import "${TEMPLATE_SOURCE}"`,
  },
  value: {
    default: `import VALUE_${TEMPLATE_DEFAULT} from "${TEMPLATE_SOURCE}"`,
    named: `import { VALUE_${TEMPLATE_NAMED} } from "${TEMPLATE_SOURCE}"`,
    namespace: `import * as VALUE_${TEMPLATE_NAMESPACE} from "${TEMPLATE_SOURCE}"`,
    sideEffect: `import "${TEMPLATE_SOURCE}"`,
  },
};

const addImports: {[T in ImportType]: (path: NodePath, importKind: ImportKind) => void } = {
  default: (path, importKind) => {
    addImportDefault(path, TEMPLATE_SOURCE, {
      importKind,
      nameHint: `${importKind.toUpperCase()}_${TEMPLATE_DEFAULT}`,
    });
  },

  named: (path, importKind) => {
    addImportNamed(path, `${importKind.toUpperCase()}_${TEMPLATE_NAMED}`, TEMPLATE_SOURCE, {
      importKind,
    });
  },

  namespace: (path, importKind) => {
    addImportNamespace(path, TEMPLATE_SOURCE, {
      importKind,
      nameHint: `${importKind.toUpperCase()}_${TEMPLATE_NAMESPACE}`,
    });
  },

  sideEffect: (path) => {
    addImportSideEffect(path, TEMPLATE_SOURCE);
  },
};

function _transform (source: string, visit: (path: NodePath) => void, parser?: TransformParser) {
  const { code } = transform(source, {
    parser,
    transformers: [
      () => ({
        visitor: {
          Program: visit,
        },
      }),
    ],
  });

  return code;
}

function fastTransform (source: string, importKind: ImportKind, importType: ImportType) {
  return _transform(
    source,
    (path) => {
      addImports[importType](path, importKind);
    },
    (importKind === 'typeof' || source.includes(' typeof ')) ? 'flow' : 'typescript',
  );
}

function getMixedExpected (input: ImportTestCase, mixin: ImportTestCase) {
  if (input.name === mixin.name) {
    return input.template;
  }

  if (input.type === 'sideEffect' && mixin.type === 'sideEffect') {
    return input.template;
  }

  if (input.kind === 'value' && mixin.type === 'sideEffect') {
    return input.template;
  }

  if (input.type === 'sideEffect' && mixin.kind === 'value') {
    return `${mixin.template};`;
  }

  if (input.kind === mixin.kind) {
    const keyword = input.kind === 'value' ? '' : `${input.kind} `;
    const prefix = `${input.kind.toUpperCase()}_`;

    if (
      (input.type === 'default' && mixin.type === 'named') ||
      (input.type === 'named' && mixin.type === 'default')
    ) {
      return `import ${keyword + prefix + TEMPLATE_DEFAULT}, { ${prefix + TEMPLATE_NAMED} } from "${TEMPLATE_SOURCE}";`;
    }

    if (
      (input.type === 'default' && mixin.type === 'namespace') ||
      (input.type === 'namespace' && mixin.type === 'default')
    ) {
      return `import ${keyword + prefix + TEMPLATE_DEFAULT}, * as ${prefix + TEMPLATE_NAMESPACE} from "${TEMPLATE_SOURCE}";`;
    }
  }

  return `${input.template}\n${mixin.template};`;
}

for (const importKind of IMPORT_KINDS) {
  for (const importType of IMPORT_TYPES) {
    const template = TEMPLATES[importKind][importType];
    const caseName = `${importKind}:${importType}`;

    test(`Add ${caseName} when there is no content`, () => {
      const code = fastTransform('', importKind, importType);

      expect(code).toBe(`${template};`);
    });

    test(`Add ${caseName} when there is no import`, () => {
      const input = 'console.log(1)';
      const code = fastTransform(input, importKind, importType);

      expect(code).toBe(`${template};\n${input}`);
    });

    test(`Add ${caseName} when other imports exist`, () => {
      const input = 'import bar from "bar"';
      const code = fastTransform(input, importKind, importType);

      expect(code).toBe(`${input}\n${template};`);
    });

    describe('Mixed', () => {
      for (const importKind2 of IMPORT_KINDS) {
        if (
          (importKind === 'type' && importKind2 === 'typeof') ||
          (importKind === 'typeof' && importKind2 === 'type')
        ) {
          continue;
        }

        for (const importType2 of IMPORT_TYPES) {
          const inputCase: ImportTestCase = {
            kind: importKind,
            name: caseName,
            template,
            type: importType,
          };

          const mixinCase: ImportTestCase = {
            kind: importKind2,
            name: `${importKind2}:${importType2}`,
            template: TEMPLATES[importKind2][importType2],
            type: importType2,
          };

          test(`${inputCase.name} & ${mixinCase.name}`, () => {
            const code = fastTransform(inputCase.template, mixinCase.kind, mixinCase.type);

            expect(code).toBe(getMixedExpected(inputCase, mixinCase));
          });
        }
      }
    });
  }
}

describe('Prefer type import inline', () => {
  const visit = (path: NodePath) => {
    addImportNamed(path, 'foo', 'foo', {
      importKind: 'type',
      preferTypeImportInline: true,
    });
  };

  test('When only one', () => {
    const code = _transform('', visit);

    expect(code).toBe('import type { foo } from "foo";');
  });

  test('Mixed value:default', () => {
    const code = _transform('import VALUE_DEFAULT from "foo"', visit);

    expect(code).toBe('import VALUE_DEFAULT, { type foo } from "foo";');
  });

  test('Mixed value:named', () => {
    const code = _transform('import { bar } from "foo"', visit);

    expect(code).toBe('import { bar, type foo } from "foo";');
  });

  test('Mixed type:named', () => {
    const code = _transform('import { type bar } from "foo"', visit);

    expect(code).toBe('import { type bar, type foo } from "foo";');
  });

  test('Mixed value:sideEffect', () => {
    const code = _transform('import "foo"', visit);

    expect(code).toBe('import "foo"\nimport type { foo } from "foo";');
  });

  test('Mixed value import empty', () => {
    const code = _transform('import {} from "foo"', visit);

    expect(code).toBe('import {} from "foo"\nimport type { foo } from "foo";');
  });

  test('Mixed type import empty', () => {
    const code = _transform('import type {} from "foo"', visit);

    expect(code).toBe('import type { foo } from "foo";');
  });

  test('Mixed type import default', () => {
    const code = _transform('import type TYPE_DEFAULT from "foo"', visit);

    expect(code).toBe('import type TYPE_DEFAULT, { foo } from "foo";');
  });

  test('Mixed type import named', () => {
    const code = _transform('import type { bar } from "foo"', visit);

    expect(code).toBe('import type { bar, foo } from "foo";');
  });
});

describe('Import sideEffect', () => {
  const visit = (path: NodePath) => {
    addImportSideEffect(path, 'foo');
  };

  test('Mixed value:sideEffect', () => {
    const code = _transform('import "foo"', visit);

    expect(code).toBe('import "foo"');
  });

  test('Mixed value:default', () => {
    const code = _transform('import foo from "foo"', visit);

    expect(code).toBe('import foo from "foo"');
  });

  test('Mixed value:namespace', () => {
    const code = _transform('import * as foo from "foo"', visit);

    expect(code).toBe('import * as foo from "foo"');
  });

  test('Mixed value:named', () => {
    const code = _transform('import { foo } from "foo"', visit);

    expect(code).toBe('import { foo } from "foo"');
  });

  test('Mixed type:default', () => {
    const code = _transform('import type foo from "foo"', visit);

    expect(code).toBe('import type foo from "foo"\nimport "foo";');
  });

  test('Mixed type:named only', () => {
    const code = _transform('import { type foo } from "foo"', visit);

    expect(code).toBe('import { type foo } from "foo"\nimport "foo";');
  });

  test('Mixed type:named and value:named', () => {
    const code = _transform('import { type foo, bar } from "foo"', visit);

    expect(code).toBe('import { type foo, bar } from "foo"');
  });

  test('Mixed type:named and value:default', () => {
    const code = _transform('import d, { type foo } from "foo"', visit);

    expect(code).toBe('import d, { type foo } from "foo"');
  });
});

describe('Using source as the name hint', () => {
  test('default', () => {
    const code = _transform(
      '',
      (path) => {
        addImportDefault(path, 'foo/bar');
      },
    );

    expect(code).toBe('import _fooBar from "foo/bar";');
  });

  test('namespace', () => {
    const code = _transform(
      '',
      (path) => {
        addImportNamespace(path, 'foo/bar');
      },
    );

    expect(code).toBe('import * as _fooBar from "foo/bar";');
  });
});

test('Existing default ImportSpecifier', () => {
  const input = 'import { default as foo } from "foo"';

  const code = _transform(
    input,
    (path) => {
      addImportDefault(path, 'foo');
    },
  );

  expect(code).toBe(input);
});

test('Existing "foo-bar" ImportSpecifier', () => {
  const input = 'import { "foo-bar" as fooBar } from "foo"';

  const code = _transform(
    input,
    (path) => {
      addImportNamed(path, 'foo-bar', 'foo');
    },
  );

  expect(code).toBe(input);
});

test('Support add keyword ImportSpecifier', () => {
  const code = _transform(
    '',
    (path) => {
      addImportNamed(path, 'class', 'foo');
      addImportNamed(path, 'const', 'foo');
      addImportNamed(path, 'delete', 'foo');
    },
  );

  expect(code).toBe('import { class as _class, const as _const, delete as _delete } from "foo";');
});

test('Support add invalid ImportSpecifier', () => {
  const code = _transform(
    '',
    (path) => {
      addImportNamed(path, 'foo-bar', 'foo');
      addImportNamed(path, '---', 'foo');
      addImportNamed(path, '***', 'foo');
    },
  );

  expect(code).toBe('import { "foo-bar" as _fooBar, "---" as _, "***" as _2 } from "foo";');
});
