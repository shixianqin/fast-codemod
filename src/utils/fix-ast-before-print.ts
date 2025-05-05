import type { ParseResult } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';

function removeRange (path: NodePath) {
  delete path.node.start;
  delete path.node.end;
}

/**
 * **Potential Issue:** Modified `ImportSpecifier` or `ObjectProperty` not printed correctly
 * @see https://github.com/benjamn/recast/issues/1421
 */
export function __fixAstBeforePrint (ast: ParseResult) {
  traverse(ast, {
    ImportSpecifier: removeRange,
    ObjectProperty: removeRange,
  });
}
