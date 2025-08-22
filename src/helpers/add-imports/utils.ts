/* eslint perfectionist/sort-modules: ['error', { type: 'natural', groups: ['class', 'function', 'export-function'] }] */

import type { types } from '@babel/core';
import type { ImportModuleSpecifier, ImportPath } from './types';

export function getImportedName (specifier: types.ImportSpecifier) {
  const { imported } = specifier;

  return imported.type === 'Identifier' ? imported.name : imported.value;
}

export function getImportKind (path: ImportPath, specifier?: ImportModuleSpecifier) {
  const importKind = path.node.importKind || 'value';

  if (specifier?.type === 'ImportSpecifier' && importKind === 'value') {
    return specifier.importKind || 'value';
  }

  return importKind;
}

export function hasConflictSpecifier (path: ImportPath, specifier: ImportModuleSpecifier) {
  let disallowedType: undefined | ImportModuleSpecifier['type'];

  switch (specifier.type) {
    case 'ImportNamespaceSpecifier': {
      disallowedType = 'ImportSpecifier';
      break;
    }

    case 'ImportSpecifier': {
      disallowedType = 'ImportNamespaceSpecifier';
      break;
    }

    default: {
      return false;
    }
  }

  for (const specifier of path.node.specifiers) {
    if (specifier.type === disallowedType) {
      return true;
    }
  }

  return false;
}

export function isImportSpecifier (specifier: ImportModuleSpecifier, name: string) {
  return specifier.type === 'ImportSpecifier' && getImportedName(specifier) === name;
}
