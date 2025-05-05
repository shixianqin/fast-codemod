import * as t from '@babel/types';

export type ImportSpecifier = t.ImportDeclaration['specifiers'][0];

export function getImportDefaultLocal (specifier: ImportSpecifier) {
  if (t.isImportDefaultSpecifier(specifier)) {
    return specifier.local;
  }

  return getImportNamedLocal(specifier, 'default');
}

export function getImportedName (specifier: t.ImportSpecifier) {
  const { imported } = specifier;
  return t.isIdentifier(imported) ? imported.name : imported.value;
}

export function getImportNamedLocal (specifier: ImportSpecifier, name: string) {
  if (t.isImportSpecifier(specifier) && getImportedName(specifier) === name) {
    return specifier.local;
  }

  return null;
}
