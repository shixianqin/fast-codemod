import { traverse, types } from '@babel/core';
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
    types,
    report: (info) => report(fileInfo, info),
  };

  for (const transformer of options.transformers) {
    const obj = transformer(api, fileInfo);

    traverse(ast, obj.visitor);
  }

  return print(ast, options.recastOptions);
}
