import traverse from '@babel/traverse';
import { expect, test } from 'vitest';
import { parse } from '../index';
import { getProgram } from './index';

const ast = parse(`
  import foo from 'foo';
  function fn () { return { v: [] } }
  const bar = 1
`);

traverse(ast, {
  enter (path) {
    test(`get from ${path.type}`, () => {
      expect(getProgram(path).isProgram()).toBe(true);
    });
  },
});
