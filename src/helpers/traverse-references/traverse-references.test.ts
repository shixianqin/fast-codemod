import { types, type NodePath } from '@babel/core';
import { describe, expect, test } from 'vitest';
import { transform } from '../../index';
import { traverseReferences, type ReferencePattern, type ReferenceVisitor } from '../index';

function _transform (source: string, expected: string) {
  const prefix = 'let foo; ';

  const { code } = transform(prefix + source, {
    transformers: [
      () => ({
        visitor: {
          Program: (path) => {
            traverseReferences(path, 'foo', visitor);
          },
        },
      }),
    ],
  });

  expect(code).toBe(prefix + expected);
}

function visit (level: number, hint?: string): ReferenceVisitor {
  const replace = (
    path: NodePath,
    type: string,
    handler?: (name: string) => types.Node,
  ) => {
    const name = `$_${ type }_${ level }${ hint ? `_${ hint }` : '' }`;

    path.replaceWith(handler ? handler(name) : types.identifier(name));
  };

  return {
    Identifier: (path) => {
      replace(path, 'Identifier');
    },
    JSXIdentifier: (path) => {
      replace(path, 'JSXIdentifier', types.jsxIdentifier);
    },
    JSXMemberExpression: (path) => {
      replace(path, 'JSXMemberExpression', types.jsxIdentifier);
    },
    MemberExpression: (path) => {
      replace(path, 'MemberExpression');
    },
    OptionalMemberExpression: (path) => {
      replace(path, 'OptionalMemberExpression');
    },
    TSIndexedAccessType: (path) => {
      replace(path, 'TSIndexedAccessType', (name) => types.tsTypeReference(types.identifier(name)));
    },
    TSQualifiedName: (path) => {
      replace(path, 'TSQualifiedName');
    },
  };
}

const visitor: ReferencePattern = {
  visitor: visit(1),
  arrayRestElement: {
    visitor: visit(1, 'rest_array'),
  },
  members: [
    {
      key: 'bar',
      type: 'literal',
      visitor: visit(2, 'bar'),
      members: [
        {
          key: 'baz',
          type: 'literal',
          visitor: visit(3, 'baz'),
          members: [
            {
              key: 'qux',
              type: 'literal',
              visitor: visit(4, 'qux'),
            },
          ],
        },
      ],
    },
    {
      key: 0,
      type: 'literal',
      visitor: visit(2, 'index_0'),
    },
    {
      type: 'computed',
      visitor: visit(2, 'computed'),
    },
  ],
  objectRestElement: {
    visitor: visit(1, 'rest_object'),
  },
};

describe('Direct', () => {
  test('AssignmentExpression', () => {
    _transform('bar = foo', 'bar = $_Identifier_1');
  });

  test('RestElement.Array', () => {
    _transform(
      'const [ ...rest ] = foo; rest;',
      'const [ ...rest ] = $_Identifier_1; $_Identifier_1_rest_array;',
    );
  });

  test('RestElement.Object', () => {
    _transform(
      'const { ...rest } = foo; rest;',
      'const { ...rest } = $_Identifier_1; $_Identifier_1_rest_object;',
    );
  });

  test('CallExpression', () => {
    _transform('foo()', '$_Identifier_1()');
  });

  test('OptionalCallExpression', () => {
    _transform('foo?.()', '$_Identifier_1?.()');
  });

  test('NewExpression', () => {
    _transform('new foo()', 'new $_Identifier_1()');
  });

  test('CallExpression.arguments', () => {
    _transform('bar(foo)', 'bar($_Identifier_1)');
  });

  test('ObjectProperty', () => {
    _transform('bar = { foo }', 'bar = { foo: $_Identifier_1 }');
  });

  test('ExpressionStatement', () => {
    _transform('foo', '$_Identifier_1');
  });

  test('TypeAlias', () => {
    _transform('type T = foo', 'type T = $_Identifier_1');
  });

  test('GenericTypeAlias', () => {
    _transform(
      'type T = Array<foo>',
      'type T = Array<$_Identifier_1>',
    );
  });

  test('ConditionalType', () => {
    _transform(
      'type T = foo extends string ? number : boolean',
      'type T = $_Identifier_1 extends string ? number : boolean',
    );
  });

  test('InterfaceDeclaration.extends', () => {
    _transform('interface T extends foo {}', 'interface T extends $_Identifier_1 {}');
  });

  test('ClassDeclaration.implements', () => {
    _transform('class C implements foo {}', 'class C implements $_Identifier_1 {}');
  });

  test('JSXElement', () => {
    _transform('const Comp = foo; <Comp/>', 'const Comp = $_Identifier_1; <$_JSXIdentifier_1/>');
  });

  test('Scope Safety', () => {
    const suffix = '{ const foo = 1; foo }; function fn () { const foo = 1; foo }';

    _transform(`foo();${ suffix }`, `$_Identifier_1();${ suffix }`);
  });

  test('Deep traverse', () => {
    _transform('const bar = foo; bar', 'const bar = $_Identifier_1; $_Identifier_1');
  });
});

describe('Member', () => {
  test('AssignmentExpression', () => {
    _transform('bar = foo.bar;', 'bar = $_MemberExpression_2_bar;');
  });

  test('Unknown Property', () => {
    _transform('x = foo.x; y = foo.y', 'x = $_Identifier_1.x; y = $_Identifier_1.y');
  });

  test('CallExpression', () => {
    _transform('foo.bar()', '$_MemberExpression_2_bar()');
  });

  test('CallExpression.arguments', () => {
    _transform('bar(foo.bar)', 'bar($_MemberExpression_2_bar)');
  });

  test('NewExpression', () => {
    _transform('new foo.bar()', 'new $_MemberExpression_2_bar()');
  });

  test('ObjectProperty', () => {
    _transform('bar = { v: foo.bar }', 'bar = { v: $_MemberExpression_2_bar }');
  });

  test('ArrayPattern', () => {
    _transform(
      'const [ bar ] = foo; bar;',
      'const [ bar ] = $_Identifier_1; $_Identifier_2_index_0;',
    );
  });

  test('ObjectPattern', () => {
    _transform(
      'const { bar } = foo; bar;',
      'const { bar } = $_Identifier_1; $_Identifier_2_bar;',
    );
  });

  test('ObjectProperty.computed', () => {
    _transform(
      'const bar = foo[bar]; bar',
      'const bar = $_MemberExpression_2_computed; $_Identifier_2_computed',
    );
  });

  test('ExpressionStatement', () => {
    _transform('foo.bar', '$_MemberExpression_2_bar');
  });

  test('ExpressionStatement.Optional', () => {
    _transform('foo?.bar', '$_OptionalMemberExpression_2_bar');
  });

  test('ExpressionStatement.TSNonNull', () => {
    _transform('foo!.bar', '$_MemberExpression_2_bar');
  });

  test('TypeAlias', () => {
    _transform('type T = foo.bar', 'type T = $_TSQualifiedName_2_bar');
  });

  test('TypeAlias.IndexedAccessType', () => {
    _transform(`type T = foo['bar']`, 'type T = $_TSIndexedAccessType_2_bar;');
  });

  test('InterfaceDeclaration.extends', () => {
    _transform(
      'interface T extends foo.bar {}',
      'interface T extends $_TSQualifiedName_2_bar {}',
    );
  });

  test('ClassDeclaration.implements', () => {
    _transform(
      'class C implements foo.bar {}',
      'class C implements $_TSQualifiedName_2_bar {}',
    );
  });

  test('JSXElement', () => {
    _transform(
      'const Comp = foo.bar; <Comp/>',
      'const Comp = $_MemberExpression_2_bar; <$_JSXIdentifier_2_bar/>',
    );
  });

  test('JSXElement.member', () => {
    _transform(
      'const Comp = foo; <Comp.bar/>',
      'const Comp = $_Identifier_1; <$_JSXMemberExpression_2_bar/>',
    );
  });

  test('Deep traverse', () => {
    _transform(
      'const bar = foo.bar; bar',
      'const bar = $_MemberExpression_2_bar; $_Identifier_2_bar',
    );
  });
});

describe('MultiMember', () => {
  test('ExpressionStatement', () => {
    _transform('foo.bar.baz.value', '$_MemberExpression_3_baz.value');
  });

  test('CallExpression', () => {
    _transform('foo.bar.baz()', '$_MemberExpression_3_baz()');
  });

  test('OptionalCallExpression', () => {
    _transform('foo?.bar?.baz?.()', '$_OptionalMemberExpression_3_baz?.()');
  });

  test('CallExpression.TSNonNull', () => {
    _transform('foo!.bar!.baz!()', '$_MemberExpression_3_baz!()');
  });

  test('NewExpression', () => {
    _transform('new foo.bar.baz()', 'new $_MemberExpression_3_baz()');
  });

  test('JSXElement', () => {
    _transform(
      'const Comp = foo.bar.baz; <Comp.value/>',
      'const Comp = $_MemberExpression_3_baz; <$_JSXIdentifier_3_baz.value/>',
    );
  });

  test('JSXElement.member', () => {
    _transform(
      'const Comp = foo; <Comp.bar.baz.Provider/>',
      'const Comp = $_Identifier_1; <$_JSXMemberExpression_3_baz.Provider/>',
    );
  });

  test('TypeAlias', () => {
    _transform('type T = foo.bar.baz', 'type T = $_TSQualifiedName_3_baz');
  });

  test('TypeAlias.IndexedAccessType', () => {
    _transform(`type T = foo.bar['baz']`, 'type T = $_TSIndexedAccessType_3_baz;');
  });

  test('TypeAlias.IndexedAccessType.multi', () => {
    _transform(`type T = foo['bar']['baz']`, 'type T = $_TSIndexedAccessType_3_baz;');
  });

  test('OptionalChainAndNonNull', () => {
    _transform(
      'foo?.bar!.baz?.qux!()',
      '$_OptionalMemberExpression_4_qux!()',
    );
  });
});
