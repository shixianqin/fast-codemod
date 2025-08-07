import type { ParseResult } from '@babel/parser';
import { print as recastPrint } from 'recast';
import type { PrintResultType } from 'recast/lib/printer';
import { traverse, type NodePath } from '../babel/traverse';
import type { RecastOptions } from './types';

export type PrintResult = PrintResultType;

function removeNodeRange (path: NodePath) {
  delete path.node.start;
  delete path.node.end;
}

export function print (ast: ParseResult, options?: RecastOptions) {
  /**
   * Fix ast before print
   * @see https://github.com/benjamn/recast/issues/1421
   */
  traverse(ast, {
    ImportSpecifier: removeNodeRange,
    ObjectProperty: removeNodeRange,
  });

  return recastPrint(ast, options);
}
