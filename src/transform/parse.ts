import type { ParseResult } from '@babel/parser';
import { parse as recastParse } from 'recast';
import babelTsParser from 'recast/parsers/babel-ts.js';
import bableParser from 'recast/parsers/babel.js';
import flowParser from 'recast/parsers/flow.js';
import typescriptParser from 'recast/parsers/typescript.js';
import type { RecastOptions, TransformParser } from './types';

interface Options extends RecastOptions {
  parser?: TransformParser;
}

function getParser (parser: undefined | TransformParser): Exclude<TransformParser, string> {
  switch (parser) {
    case 'babel': {
      return bableParser;
    }

    case 'babel-ts': {
      return babelTsParser;
    }

    case 'flow': {
      return flowParser;
    }

    case 'typescript': {
      return typescriptParser;
    }

    default: {
      return parser || babelTsParser;
    }
  }
}

export function parse (source: string, options?: Options): ParseResult {
  return recastParse(source, {
    ...options,
    parser: getParser(options?.parser),
  });
}

export { type ParseResult } from '@babel/parser';
