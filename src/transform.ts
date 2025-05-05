import traverse, { type Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import type { Entry } from 'fast-glob';
import { parse, type RecastOptions } from './recast/parse';
import { print, type PrintResult } from './recast/print';
import { report, type ReportInfo } from './utils/report';

interface Api {
  t: typeof t;
  types: typeof t;
  report: (info: ReportInfo) => void;
}

export interface FileInfo {
  name: string;
  path: string;
  source: string;
  stats: Entry['stats'];
}

export interface Transformer {
  (fileInfo: undefined | FileInfo, api: Api): null | TransformerObject;
}

export interface TransformerObject {
  visitor: Visitor;
  name?: string;
}

export interface TransformOptions {
  transformers: Transformer[];
  recastOptions?: RecastOptions;
}

export function transform (source: string, options: TransformOptions, fileInfo?: FileInfo): PrintResult {
  const ast = parse(source, options.recastOptions);

  const api: Api = {
    t,
    types: t,
    report: (info) => {
      report(fileInfo, info);
    },
  };

  for (const transformer of options.transformers) {
    const obj = transformer(
      fileInfo,
      api,
    );

    if (obj) {
      traverse(ast, obj.visitor);
    }
  }

  return print(ast, options.recastOptions);
}
