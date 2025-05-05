import type { ParseResult } from '@babel/parser';
import { print as recastPrint } from 'recast';
import type { PrintResultType } from 'recast/lib/printer';
import { __fixAstBeforePrint } from '../utils/fix-ast-before-print';
import type { RecastOptions } from './parse';

export type PrintResult = PrintResultType;

export function print (ast: ParseResult, options?: RecastOptions): PrintResult {
  __fixAstBeforePrint(ast);
  return recastPrint(ast, options);
}
