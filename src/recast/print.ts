import type { ParseResult } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { print as recastPrint } from 'recast';
import type { PrintResultType } from 'recast/lib/printer';
import type { RecastOptions } from './parse';

export type PrintResult = PrintResultType;

/**
 * **Potential Issue:** Modified `ImportSpecifier` or `ObjectProperty` not printed correctly
 * @see https://github.com/benjamn/recast/issues/1421
 */
function __fixAstBeforePrint (ast: ParseResult) {
  traverse(ast, {
    ImportSpecifier (path) {
      const { node } = path;
      const specifier = t.importSpecifier(node.local, node.imported);

      specifier.importKind = node.importKind;

      path.replaceWith(specifier);
      path.skip();
    },

    ObjectProperty (path) {
      const { node } = path;

      if (!node.shorthand) {
        return;
      }

      const { key, value } = node;
      const _value = t.isAssignmentPattern(value) ? value.left : value;

      node.shorthand = t.isIdentifier(key) && t.isIdentifier(_value) && key.name === _value.name;
    },
  });
}

export function print (ast: ParseResult, options?: RecastOptions): PrintResult {
  __fixAstBeforePrint(ast);
  return recastPrint(ast, options);
}
