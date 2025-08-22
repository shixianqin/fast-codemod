/* eslint perfectionist/sort-objects: ['error', { type: 'natural' }] */

import { traverse, types, type Node, type NodePath } from '@babel/core';
import { describe, expect, test } from 'vitest';
import { parse, type TransformParser } from '../../index';
import { resolveAccessedKey, type MemberNode } from '../index';

type TestCase =
  { input: string, computed: true } |
  { input: string, key: string } |
  { input: string, tsKeyword: string };

type TestCases<T extends Node> = {
  [K in T['type']]: null | TestCase[]
};

type ObjectPropertyCases = TestCases<types.MemberExpression['property']>;

function createObjectPropertyCases (handler: (input: string) => string, exclude?: Array<string | types.MemberExpression['property']['type']>) {
  return Object.fromEntries(
    Object.entries(OBJECT_PROPERTY_CASES).map(([key, value]) => {
      if (exclude?.includes(key)) {
        return [key, null];
      }

      return [
        key,
        value && value.map((item) => {
          const source = item.input;

          let input = handler(source[0] === '.' ? source : `[${ source }]`);

          switch (source) {
            case '.#key': {
              input = `class C { #key; constructor() { ${ input } } }`;
              break;
            }

            case 'new.target': {
              input = `function F () { ${ input } }`;
              break;
            }

            case 'yield 1':
            case 'yield* 2': {
              input = `function* F () { ${ input } }`;
              break;
            }

            // no default
          }

          return {
            ...item,
            input,
          };
        }),
      ];
    }),
  ) as ObjectPropertyCases;
}

const JSX_MEMBER_EXPRESSION_CASES: TestCases<types.JSXMemberExpression['property']> = {
  JSXIdentifier: [
    {
      input: 'const el = <Foo.Bar/>',
      key: 'Bar',
    },
  ],
};

const TS_EXPRESSION_CASES: TestCase[] = [
  {
    input: '"bar"',
    key: 'bar',
  },
  {
    input: '123',
    key: '123',
  },
  {
    computed: true,
    input: 'bar',
  },
  {
    computed: true,
    input: 'fn()',
  },
];

const OBJECT_PROPERTY_CASES: ObjectPropertyCases = {
  ArrayExpression: [
    {
      computed: true,
      input: '[]',
    },
  ],
  ArrowFunctionExpression: [
    {
      computed: true,
      input: '() => {}',
    },
  ],
  AssignmentExpression: [
    {
      computed: true,
      input: 'a = 1',
    },
  ],
  AwaitExpression: [
    {
      computed: true,
      input: 'await promise',
    },
  ],
  BigIntLiteral: [
    {
      input: '123n',
      key: '123',
    },
  ],
  BinaryExpression: [
    {
      computed: true,
      input: '1 + 2',
    },
  ],
  BindExpression: [
    {
      computed: true,
      input: 'obj::key',
    },
  ],
  BooleanLiteral: [
    {
      input: 'true',
      key: 'true',
    },
    {
      input: 'false',
      key: 'false',
    },
  ],
  CallExpression: [
    {
      computed: true,
      input: 'fn()',
    },
  ],
  ClassExpression: [
    {
      computed: true,
      input: 'class {}',
    },
  ],
  ConditionalExpression: [
    {
      computed: true,
      input: 'a ? 1 : 2',
    },
  ],
  DecimalLiteral: [
    {
      input: '1.23m',
      key: '1.23',
    },
  ],
  DoExpression: [
    {
      computed: true,
      input: 'do { 1 * 2 }',
    },
  ],
  FunctionExpression: [
    {
      computed: true,
      input: 'function () {}',
    },
  ],
  Identifier: [
    {
      input: '.bar',
      key: 'bar',
    },
    {
      computed: true,
      input: 'bar',
    },
  ],
  Import: null, // invalid
  ImportExpression: null, // invalid
  JSXElement: [
    {
      computed: true,
      input: '<div/>',
    },
  ],
  JSXFragment: [
    {
      computed: true,
      input: '<></>',
    },
  ],
  LogicalExpression: types.LOGICAL_OPERATORS.map((op) => {
    return {
      computed: true,
      input: `a ${ op } b`,
    };
  }),
  MemberExpression: [
    {
      computed: true,
      input: 'obj.key',
    },
  ],
  MetaProperty: [
    {
      computed: true,
      input: 'new.target',
    },
    {
      computed: true,
      input: 'import.meta',
    },
  ],
  ModuleExpression: null, // todo
  NewExpression: [
    {
      computed: true,
      input: 'new Cls()',
    },
  ],
  NullLiteral: [
    {
      input: 'null',
      key: 'null',
    },
  ],
  NumericLiteral: [
    {
      input: '123',
      key: '123',
    },
  ],
  ObjectExpression: [
    {
      computed: true,
      input: '{}',
    },
  ],
  OptionalCallExpression: [
    {
      computed: true,
      input: 'fn?.()',
    },
  ],
  OptionalMemberExpression: [
    {
      computed: true,
      input: 'obj?.key',
    },
  ],
  ParenthesizedExpression: null, // todo
  PipelineBareFunction: null, // todo
  PipelinePrimaryTopicReference: null, // todo
  PipelineTopicExpression: null, // todo
  PrivateName: [
    {
      input: '.#key',
      key: '#key',
    },
  ],
  RecordExpression: [
    {
      computed: true,
      input: '#{}',
    },
  ],
  RegExpLiteral: [
    {
      input: '/rex/',
      key: '/rex/',
    },
  ],
  SequenceExpression: [
    {
      computed: true,
      input: '(a, b)',
    },
  ],
  StringLiteral: [
    {
      input: '"bar"',
      key: 'bar',
    },
  ],
  Super: null, // invalid
  TaggedTemplateExpression: [
    {
      computed: true,
      input: 'tag`template`',
    },
  ],
  TemplateLiteral: [
    {
      input: '`bar`',
      key: 'bar',
    },
    {
      computed: true,
      // eslint-disable-next-line no-template-curly-in-string
      input: '`bar${"Literal"}`', // todo
    },
    {
      computed: true,
      // eslint-disable-next-line no-template-curly-in-string
      input: '`bar${exp}`',
    },
  ],
  ThisExpression: [
    {
      computed: true,
      input: 'this',
    },
  ],
  TopicReference: null, // BinaryExpression
  TSAsExpression: TS_EXPRESSION_CASES.map((item) => {
    return {
      ...item,
      input: `${ item.input } as any`,
    };
  }),
  TSInstantiationExpression: null, // invalid
  TSNonNullExpression: TS_EXPRESSION_CASES.map((item) => {
    return {
      ...item,
      input: `${ item.input }!`,
    };
  }),
  TSSatisfiesExpression: TS_EXPRESSION_CASES.map((item) => {
    return {
      ...item,
      input: `${ item.input } satisfies any`,
    };
  }),
  TSTypeAssertion: TS_EXPRESSION_CASES.map((item) => {
    return {
      ...item,
      input: `<any>${ item.input }`,
    };
  }),
  TupleExpression: [
    {
      computed: true,
      input: '#[1, 2]',
    },
  ],
  TypeCastExpression: TS_EXPRESSION_CASES.map((item) => {
    return {
      ...item,
      input: `(${ item.input }: any)`,
    };
  }),
  UnaryExpression: [
    {
      input: '+123',
      key: '123',
    },
    {
      input: '-123',
      key: '-123',
    },
    {
      computed: true,
      input: '+"str"',
    },
    {
      computed: true,
      input: '-"str"',
    },
    ...types.UNARY_OPERATORS.map((op): TestCase => {
      return {
        computed: true,
        input: `${ op } obj.key`,
      };
    }),
  ],
  UpdateExpression: types.UPDATE_OPERATORS.flatMap((op): TestCase[] => {
    return [
      {
        computed: true,
        input: `${ op } count`,
      },
      {
        computed: true,
        input: `count ${ op }`,
      },
    ];
  }),
  YieldExpression: [
    {
      computed: true,
      input: 'yield 1',
    },
    {
      computed: true,
      input: 'yield* 2',
    },
  ],
};

const TS_INDEXED_ACCESS_TYPE_CASES: TestCases<types.TSIndexedAccessType['indexType'] | types.TSLiteralType['literal']> = {
  BigIntLiteral: OBJECT_PROPERTY_CASES.BigIntLiteral,
  BooleanLiteral: OBJECT_PROPERTY_CASES.BooleanLiteral,
  NumericLiteral: OBJECT_PROPERTY_CASES.NumericLiteral,
  StringLiteral: OBJECT_PROPERTY_CASES.StringLiteral,
  TemplateLiteral: OBJECT_PROPERTY_CASES.TemplateLiteral,
  TSAnyKeyword: [
    {
      input: 'any',
      tsKeyword: 'any',
    },
  ],
  TSArrayType: [
    {
      computed: true,
      input: 'any[]',
    },
  ],
  TSBigIntKeyword: [
    {
      input: 'bigint',
      tsKeyword: 'bigint',
    },
  ],
  TSBooleanKeyword: [
    {
      input: 'boolean',
      tsKeyword: 'boolean',
    },
  ],
  TSConditionalType: [
    {
      computed: true,
      input: '{} extends object ? 1 : 2',
    },
  ],
  TSConstructorType: [
    {
      computed: true,
      input: 'new () => 1',
    },
  ],
  TSExpressionWithTypeArguments: null, // invalid
  TSFunctionType: [
    {
      computed: true,
      input: '() => 1',
    },
  ],
  TSImportType: [
    {
      computed: true,
      input: 'import("foo")',
    },
  ],
  TSIndexedAccessType: [
    {
      computed: true,
      input: 'Type[index]',
    },
  ],
  TSInferType: [
    {
      computed: true,
      input: 'infer a',
    },
  ],
  TSIntersectionType: [
    {
      computed: true,
      input: 'a & b',
    },
  ],
  TSIntrinsicKeyword: null, // invalid
  TSLiteralType: null, // Literal nodes
  TSMappedType: [
    {
      computed: true,
      input: '{[K in keyof A]: B}',
    },
  ],
  TSNeverKeyword: [
    {
      input: 'never',
      tsKeyword: 'never',
    },
  ],
  TSNullKeyword: [
    {
      input: 'null',
      tsKeyword: 'null',
    },
  ],
  TSNumberKeyword: [
    {
      input: 'number',
      tsKeyword: 'number',
    },
  ],
  TSObjectKeyword: [
    {
      input: 'object',
      tsKeyword: 'object',
    },
  ],
  TSOptionalType: null, // invalid
  TSParenthesizedType: [
    {
      computed: true,
      input: '(1 | 2)',
    },
  ],
  TSRestType: null, // invalid
  TSStringKeyword: [
    {
      input: 'string',
      tsKeyword: 'string',
    },
  ],
  TSSymbolKeyword: [
    {
      input: 'symbol',
      tsKeyword: 'symbol',
    },
  ],
  TSTemplateLiteralType: null, // TemplateLiteral
  TSThisType: [
    {
      computed: true,
      input: 'this',
    },
  ],
  TSTupleType: [
    {
      computed: true,
      input: '[any]',
    },
  ],
  TSTypeLiteral: [
    {
      computed: true,
      input: '{}',
    },
  ],
  TSTypeOperator: [
    {
      computed: true,
      input: 'keyof {}',
    },
    {
      computed: true,
      input: 'readonly []',
    },
    {
      computed: true,
      input: 'unique symbol',
    },
  ],
  TSTypePredicate: null, // invalid
  TSTypeQuery: [
    {
      computed: true,
      input: 'typeof A',
    },
  ],
  TSTypeReference: [
    {
      computed: true,
      input: 'A.B',
    },
  ],
  TSUndefinedKeyword: [
    {
      input: 'undefined',
      tsKeyword: 'undefined',
    },
  ],
  TSUnionType: [
    {
      computed: true,
      input: '1 | 2',
    },
  ],
  TSUnknownKeyword: [
    {
      input: 'unknown',
      tsKeyword: 'unknown',
    },
  ],
  TSVoidKeyword: [
    {
      input: 'void',
      tsKeyword: 'void',
    },
  ],
  UnaryExpression: [
    {
      input: '-123',
      key: '-123',
    },
  ],
};

const ALL_CASES: {[K in MemberNode['type']]: TestCases<never> } = {
  JSXMemberExpression: JSX_MEMBER_EXPRESSION_CASES,

  MemberExpression: createObjectPropertyCases((input) => {
    return `foo${ input }`;
  }),

  ObjectMethod: createObjectPropertyCases(
    (input) => `({ ${ input[0] === '.' ? input.slice(1) : input } () {} })`,
    ['PrivateName'],
  ),

  ObjectProperty: createObjectPropertyCases(
    (input) => `({ ${ input[0] === '.' ? input.slice(1) : input }: 1 })`,
    ['PrivateName'],
  ),

  OptionalMemberExpression: createObjectPropertyCases((input) => {
    return (input[0] === '.' ? 'foo?' : 'foo?.') + input;
  }),

  TSIndexedAccessType: Object.fromEntries(
    Object.entries(TS_INDEXED_ACCESS_TYPE_CASES).map(([key, value]) => {
      return [
        key,
        value && value.map((item) => {
          return {
            ...item,
            input: `type T = Foo[${ item.input }]`,
          };
        }),
      ];
    }),
  ),

  TSQualifiedName: {
    Identifier: [
      {
        input: 'type T = Foo.Bar',
        key: 'Bar',
      },
    ],
    TSQualifiedName: null, // invalid
  } as TestCases<types.TSQualifiedName['left']>,
};

for (const [key, value] of Object.entries(ALL_CASES)) {
  describe(key, () => {
    for (const [propertyType, expected] of Object.entries(value)) {
      if (!expected) {
        continue;
      }

      describe(propertyType, () => {
        const expects = Array.isArray(expected) ? expected : [expected];

        for (const item of expects) {
          test(item.input, () => {
            if (!item.input) {
              throw new Error('invalid input');
            }

            let parser: TransformParser = 'babel-ts';

            switch (propertyType) {
              case 'TSTypeAssertion': {
                parser = 'typescript';
                break;
              }

              case 'TypeCastExpression': {
                parser = 'flow';
                break;
              }

                // no default
            }

            const ast = parse(
              item.input,
              {
                parser,
              },
            );

            let arrived = false;

            traverse(ast, {
              [key]: (path: NodePath) => {
                const { node } = path as NodePath<MemberNode>;

                switch (node.type) {
                  case 'MemberExpression':
                  case 'OptionalMemberExpression': {
                    if (!types.isIdentifier(node.object, { name: 'foo' })) {
                      return;
                    }

                    break;
                  }

                  case 'TSIndexedAccessType': {
                    // @ts-expect-error ignore
                    if (node.objectType.typeName?.name === 'Type') {
                      return;
                    }

                    break;
                  }

                  case 'TSQualifiedName': {
                    if (node.left.type === 'TSQualifiedName') {
                      return;
                    }

                    break;
                  }

                  // no default
                }

                const meta = resolveAccessedKey(node);

                if (item.computed) {
                  expect(meta).toMatchObject({ computed: true });
                }
                else if (item.tsKeyword) {
                  expect(meta).toMatchObject({ key: item.tsKeyword, tsKeyword: true });
                }
                else {
                  expect(meta).toMatchObject({ key: item.key });
                }

                arrived = true;

                // @ts-expect-error ignore
                const propertyNode = node.property || node.key || node.right || node.indexType?.literal || node.indexType;

                expect(propertyNode.type).toBe(propertyType);
              },
            });

            if (!arrived) {
              throw new Error('invalid input');
            }
          });
        }
      });
    }
  });
}
