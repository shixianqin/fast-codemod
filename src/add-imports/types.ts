import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

export interface AddImportOptions {
  importKind?: ImportKind;
  localNameHint?: string;
}

export type ImportKind = t.ImportDeclaration['importKind'];
export type ImportPath = NodePath<t.ImportDeclaration>;
