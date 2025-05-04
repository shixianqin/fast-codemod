import type { ParseResult } from '@babel/parser';
import { parse as recastParse, type Options } from 'recast';
import bableParser from 'recast/parsers/babel';
import babelTsParser from 'recast/parsers/babel-ts';
import flowParser from 'recast/parsers/flow';

export interface RecastOptions extends Omit<Options, 'parser'> {
  parser?: 'babel' | 'babel-ts' | 'flow';
}

function getParser (options?: RecastOptions) {
  switch (options?.parser) {
    case 'babel': {
      return bableParser;
    }

    case 'flow': {
      return flowParser;
    }

    // case 'babel-ts':
    default: {
      return babelTsParser;
    }
  }
}

export function parse (source: string, options?: RecastOptions): ParseResult {
  return recastParse(source, {
    ...options,
    parser: getParser(options),
  });
}

export { type ParseResult } from '@babel/parser';
