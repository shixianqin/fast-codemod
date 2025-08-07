import type { ParseResult } from '@babel/parser';
import type { Visitor } from '@babel/traverse';
import type * as t from '@babel/types';
import type { Entry } from 'fast-glob';
import type { Options as OriginalRecastOptions } from 'recast';
import type { ReportInfo } from '../utils/report';

export type TransformParser = 'babel' | 'babel-ts' | 'flow' | 'typescript' | {
  parse: (source: string) => ParseResult;
};

export type RecastOptions = Omit<OriginalRecastOptions, 'parser'>;

export type Transformer = (api: TransformApi, file?: FileInfo) => {
  visitor: Visitor;
  name?: string;
};

export interface TransformOptions {
  transformers: Transformer[];
  recastOptions?: RecastOptions;
  parser?: TransformParser;
}

export interface TransformApi {
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
