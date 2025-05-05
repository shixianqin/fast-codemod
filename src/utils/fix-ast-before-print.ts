import type { ParseResult } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';

function clearPosition (path: NodePath) {
  path.node.start = null;
  path.node.end = null;
}

/**
 * **Potential Issue:** Modified `ImportSpecifier` or `ObjectProperty` not printed correctly
 * @see https://github.com/benjamn/recast/issues/1421
 */
export function __fixAstBeforePrint (ast: ParseResult) {
  traverse(ast, {
    ImportSpecifier: clearPosition,
    ObjectProperty: clearPosition,
  });
}
