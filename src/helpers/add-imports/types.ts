import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

export type ImportKind = t.ImportDeclaration['importKind'];
export type ImportPath = NodePath<t.ImportDeclaration>;
export type ImportModuleSpecifier = t.ImportDeclaration['specifiers'][0];

export interface AddImportOptions {
  importKind?: ImportKind;
  nameHint?: string;
  preferTypeImportInline?: boolean;
}
