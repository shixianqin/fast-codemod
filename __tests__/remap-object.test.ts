import { describe, expect, test } from 'vitest';
import { remapObject, types as t, transform, type RemapObjectOptions, type Transformer } from '../src';

const ruleSimple: RemapObjectOptions = {
  keyMap: {
    data: 'body',
    params: 'queryParams',
  },
};

const ruleWithNest: RemapObjectOptions = {
  ...ruleSimple,
  nestUnmatchedIn: 'config',
};

const ruleWithPreserve: RemapObjectOptions = {
  ...ruleSimple,
  preserveUnmatched: true,
};

const ruleWithGetterSetter: RemapObjectOptions = {
  keyMap: {
    params: 'queryParams',
    data: {
      get: true,
      key: 'body',
      set: true,
    },
  },
};

const createTransformer = (rule: RemapObjectOptions): Transformer => {
  return () => ({
    visitor: {
      CallExpression: (path) => {
        // @ts-expect-error ignore
        if (path.node._processed) {
          return;
        }

        if (t.isIdentifier(path.node.callee, { name: 'getObj' })) {
          // @ts-expect-error ignore
          path.node._processed = true;

          path.replaceWith(
            remapObject(path, path.node, rule),
          );
        }

        path.skip();
      },

      Identifier: (path) => {
        if (path.node.name === 'obj') {
          path.replaceWith(
            remapObject(path, path.node, rule),
          );
        }

        path.skip();
      },

      ObjectExpression: (path) => {
        path.replaceWith(
          remapObject(path, path.node, rule),
        );

        path.skip();
      },
    },
  });
};

function _transform (source: string, expected: string, rule: RemapObjectOptions) {
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

  test('With nestUnmatchedIn', () => {
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

  test('With nestUnmatchedIn', () => {
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
        'const _tempObj = getObj();',
        'const foo = {',
        '  body: _tempObj.data,',
        '  queryParams: _tempObj.params,',
        '}',
      ].join('\n'),
      ruleSimple,
    );
  });

  test('With nestUnmatchedIn', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _tempObj = getObj();',
        'const foo = {',
        '  body: _tempObj.data,',
        '  queryParams: _tempObj.params,',
        '  config: _tempObj,',
        '}',
      ].join('\n'),
      ruleWithNest,
    );
  });

  test('With preserveUnmatched', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _tempObj = getObj();',
        'const foo = {',
        '  ..._tempObj,',
        '  body: _tempObj.data,',
        '  queryParams: _tempObj.params,',
        '}',
      ].join('\n'),
      ruleWithPreserve,
    );
  });

  test('With getter/setter', () => {
    _transform(
      'const foo = getObj()',
      [
        'const _tempObj = getObj();',
        'const foo = {',
        '  queryParams: _tempObj.params,',
        '',
        '  get body() {',
        '    return _tempObj.data;',
        '  },',
        '',
        '  set body(value) {',
        '    _tempObj.data = value;',
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
        keyMap: {
          data: '012',
          params: 'query-params',
        },
      },
    );
  });

  test('With nestUnmatchedIn', () => {
    _transform(
      'const foo = obj',
      [
        'const foo = {',
        `  ['foo-bar']: obj,`,
        '}',
      ].join('\n'),
      {
        keyMap: {},
        nestUnmatchedIn: 'foo-bar',
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
        keyMap: {
          'abc-': '-abc',
          data: '012',
          'query-params': {
            get: true,
            key: 'new-query-params',
            set: true,
          },
        },
      },
    );
  });
});
