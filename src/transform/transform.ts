import * as t from '@babel/types';
import { traverse } from '../babel/traverse';
import { report } from '../utils/report';
import { parse } from './parse';
import { print } from './print';
import type { FileInfo, TransformApi, TransformOptions } from './types';

export function transform (source: string, options: TransformOptions, fileInfo?: FileInfo) {
  const ast = parse(source, {
    ...options.recastOptions,
    parser: options.parser,
  });

  const api: TransformApi = {
    t,
    types: t,
    report: (info) => report(fileInfo, info),
  };

  for (const transformer of options.transformers) {
    const obj = transformer(api, fileInfo);

    traverse(ast, obj.visitor);
  }

  return print(ast, options.recastOptions);
}
