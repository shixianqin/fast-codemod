import { isIdentifier } from '@babel/types';
import { describe, expect, test } from 'vitest';
import { transform, type Transformer } from '../../index';
import { transformObject, type TransformObjectOptions } from '../index';

const ruleSimple: TransformObjectOptions = {
  cachedVariableName: '_config',
  rename: {
    data: 'body',
    params: 'queryParams',
  },
};

const ruleWithNest: TransformObjectOptions = {
  ...ruleSimple,
  wrapUnmatchedIn: 'config',
};

const ruleWithPreserve: TransformObjectOptions = {
  ...ruleSimple,
  flatUnmatched: true,
};

const ruleWithGetterSetter: TransformObjectOptions = {
  ...ruleSimple,
  rename: {
    params: 'queryParams',
    data: {
      get: true,
      name: 'body',
      set: true,
    },
  },
};

const createTransformer = (options: TransformObjectOptions): Transformer => {
  return () => ({
    visitor: {
      CallExpression: (path) => {
        // @ts-expect-error ignore
        if (path.node._processed) {
          return;
        }

        if (isIdentifier(path.node.callee, { name: 'getObj' })) {
          // @ts-expect-error ignore
          path.node._processed = true;

          path.replaceWith(
            transformObject(path, path.node, options),
          );
        }

        path.skip();
      },

      Identifier: (path) => {
        if (path.node.name === 'obj') {
          path.replaceWith(
            transformObject(path, path.node, options),
          );
        }

        path.skip();
      },

      ObjectExpression: (path) => {
        path.replaceWith(
          transformObject(path, path.node, options),
        );

        path.skip();
      },
    },
  });
};

function _transform (source: string, expected: string, rule: TransformObjectOptions) {
  const { code } = transform(source, {
    transformers: [createTransformer(rule)],
    recastOptions: {
      quote: 'single',
      trailingComma: true,
    },
  });

  expect(code).toBe(expected);
}

describe('Literal Object', () => {
  test('Simple', () => {
    _transform(
      'const foo = { data: {}, params: {} }',
      [
        'const foo = {',
        '  body: {},',
        '  queryParams: {},',
        '}',
      ].join('\n'),
      ruleSimple,
    );
  });

  test('With wrapUnmatchedIn', () => {
    _transform(
      'const foo = { data: {}, params: {}, otherA: 123, otherB: "abc" }',
      [
        'const foo = {',
        '  body: {},',
        '  queryParams: {},',
        '',
        '  config: {',
        '    otherA: 123,',
        '    otherB: "abc",',
        '  },',
        '}',
      ].join('\n'),
      ruleWithNest,
    );
  });

  test('With preserveUnmatched', () => {
    _transform(
      'const foo = { data: {}, params: {}, otherA: 123, otherB: "abc" }',
      [
        'const foo = {',
        '  body: {},',
        '  queryParams: {},',
        '  otherA: 123,',
        '  otherB: "abc",',
        '}',
      ].join('\n'),
      ruleWithPreserve,
    );
  });

  test('With getter/setter', () => {
    _transform(
      'const foo = { get data() { return {} }, set data(v) { v; }, params: {} }',
      [
        'const foo = {',
        '  get body() { return {} },',
        '  set body(v) { v; },',
        '  queryParams: {},',
        '}',
      ].join('\n'),
      ruleWithGetterSetter,
    );
  });
});

describe('Identifier', () => {
  test('Simple', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        '  body: obj.data,',
        '  queryParams: obj.params,',
        '}',
      ].join('\n'),
      ruleSimple,
    );
  });

  test('With wrapUnmatchedIn', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        '  body: obj.data,',
        '  queryParams: obj.params,',
        '  config: obj,',
        '}',
      ].join('\n'),
      ruleWithNest,
    );
  });

  test('With preserveUnmatched', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        '  ...obj,',
        '  body: obj.data,',
        '  queryParams: obj.params,',
        '}',
      ].join('\n'),
      ruleWithPreserve,
    );
  });

  test('With getter/setter', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        '  queryParams: obj.params,',
        '',
        '  get body() {',
        '    return obj.data;',
        '  },',
        '',
        '  set body(value) {',
        '    obj.data = value;',
        '  },',
        '}',
      ].join('\n'),
      ruleWithGetterSetter,
    );
  });
});

describe('Expression', () => {
  test('Simple', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _config = getObj();',
        'const foo = {',
        '  body: _config.data,',
        '  queryParams: _config.params,',
        '}',
      ].join('\n'),
      ruleSimple,
    );
  });

  test('With wrapUnmatchedIn', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _config = getObj();',
        'const foo = {',
        '  body: _config.data,',
        '  queryParams: _config.params,',
        '  config: _config,',
        '}',
      ].join('\n'),
      ruleWithNest,
    );
  });

  test('With preserveUnmatched', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _config = getObj();',
        'const foo = {',
        '  ..._config,',
        '  body: _config.data,',
        '  queryParams: _config.params,',
        '}',
      ].join('\n'),
      ruleWithPreserve,
    );
  });

  test('With getter/setter', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _config = getObj();',
        'const foo = {',
        '  queryParams: _config.params,',
        '',
        '  get body() {',
        '    return _config.data;',
        '  },',
        '',
        '  set body(value) {',
        '    _config.data = value;',
        '  },',
        '}',
      ].join('\n'),
      ruleWithGetterSetter,
    );
  });
});

describe('Unsafe Key', () => {
  test('Simple', () => {
    _transform(
      'const foo = { data: {}, params: {} }',
      [
        'const foo = {',
        `  ['012']: {},`,
        `  ['query-params']: {},`,
        '}',
      ].join('\n'),
      {
        rename: {
          data: '012',
          params: 'query-params',
        },
      },
    );
  });

  test('With wrapUnmatchedIn', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        `  ['foo-bar']: obj,`,
        '}',
      ].join('\n'),
      {
        rename: {},
        wrapUnmatchedIn: 'foo-bar',
      },
    );
  });

  test('With getter/setter', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        `  ['-abc']: obj['abc-'],`,
        `  ['012']: obj.data,`,
        '',
        `  get ['new-query-params']() {`,
        `    return obj['query-params'];`,
        '  },',
        '',
        `  set ['new-query-params'](value) {`,
        `    obj['query-params'] = value;`,
        '  },',
        '}',
      ].join('\n'),
      {
        rename: {
          'abc-': '-abc',
          data: '012',
          'query-params': {
            get: true,
            name: 'new-query-params',
            set: true,
          },
        },
      },
    );
  });
});

describe('Options.extractor', () => {
  test('extract property', () => {
    _transform(
      'const obj2 = { foo: 100 }',
      'const obj2 = {}',
      {
        extractor: {
          foo: (property) => {
            expect(property.type).toBe('NumericLiteral');
          },
        },
      },
    );
  });

  test('extract method', () => {
    _transform(
      'const obj2 = { fn(){} }',
      'const obj2 = {}',
      {
        extractor: {
          fn: (exp, property) => {
            expect(exp.type).toBe('FunctionExpression');
            // @ts-expect-error ignore
            expect(property.key.name).toBe('fn');
          },
        },
      },
    );
  });

  test('extract from identifier', () => {
    _transform(
      'const obj2 = xxx',
      'const obj2 = xxx',
      {
        extractor: {
          foo: (member) => {
            expect(member.type).toBe('MemberExpression');
            // @ts-expect-error ignore
            expect(member.property.name).toBe('foo');
          },
        },
      },
    );
  });
});
