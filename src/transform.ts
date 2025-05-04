import traverse, { type Visitor } from '@babel/traverse';
import type { Entry } from 'fast-glob';
import { parse, type RecastOptions } from './recast/parse';
import { print, type PrintResult } from './recast/print';

export interface FileInfo {
  name: string;
  path: string;
  source: string;
  stats: Entry['stats'];
}

export interface Transformer {
  (fileInfo?: FileInfo): TransformerObject;
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

  for (const transformer of options.transformers) {
    const obj = transformer(fileInfo);
    traverse(ast, obj.visitor);
  }

  return print(ast, options.recastOptions);
}
