import type { ParseResult } from '@babel/parser';
import { print as recastPrint } from 'recast';
import type { PrintResultType } from 'recast/lib/printer';
import { fixAstBeforePrint } from './fix-ast-before-print';
import type { RecastOptions } from './parse';

export type PrintResult = PrintResultType;

export function print (ast: ParseResult, options?: RecastOptions): PrintResult {
  fixAstBeforePrint(ast);

  return recastPrint(ast, options);
}
