import type { NodePath, types } from '@babel/core';

export type ImportKind = types.ImportDeclaration['importKind'];
export type ImportPath = NodePath<types.ImportDeclaration>;
export type ImportModuleSpecifier = types.ImportDeclaration['specifiers'][0];

export interface AddImportOptions {
  importKind?: ImportKind;
  nameHint?: string;
  preferTypeImportInline?: boolean;
}
