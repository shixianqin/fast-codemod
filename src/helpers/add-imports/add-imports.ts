/* eslint perfectionist/sort-modules: ['error', { type: 'natural' }] */

import { types, type NodePath } from '@babel/core';
import { Importer } from './importer';
import type { AddImportOptions } from './types';
import { getImportKind, isImportSpecifier } from './utils';

export function addImportDefault (path: NodePath, source: string, options?: AddImportOptions) {
  const importer = new Importer(path, source, options);

  let local = importer.findLocal((specifier) => {
    return specifier.type === 'ImportDefaultSpecifier' || isImportSpecifier(specifier, 'default');
  });

  if (!local) {
    local = importer.generateLocal();
    importer.addSpecifier(types.importDefaultSpecifier(local));
  }

  return local;
}

// eslint-disable-next-line typescript/max-params
export function addImportNamed (path: NodePath, name: string, source: string, options?: AddImportOptions) {
  const importer = new Importer(path, source, options);

  let local = importer.findLocal((specifier) => {
    return isImportSpecifier(specifier, name);
  });

  if (!local) {
    local = importer.generateLocal(name);

    importer.addSpecifier(types.importSpecifier(
      local,
      types.isValidIdentifier(name, false) ? types.identifier(name) : types.stringLiteral(name),
    ));
  }

  return local;
}

export function addImportNamespace (path: NodePath, source: string, options?: AddImportOptions) {
  const importer = new Importer(path, source, options);

  let local = importer.findLocal((specifier) => {
    return specifier.type === 'ImportNamespaceSpecifier';
  });

  if (!local) {
    local = importer.generateLocal();
    importer.addSpecifier(types.importNamespaceSpecifier(local));
  }

  return local;
}

export function addImportSideEffect (path: NodePath, source: string) {
  const importer = new Importer(path, source);

  for (const importPath of importer.importPaths) {
    if (getImportKind(importPath) !== 'value') {
      continue;
    }

    const { specifiers } = importPath.node;

    if (specifiers.length === 0) {
      return;
    }

    for (const specifier of specifiers) {
      switch (specifier.type) {
        case 'ImportSpecifier': {
          if (specifier.importKind === 'value' || !specifier.importKind) {
            return;
          }

          break;
        }

        default: {
          return;
        }
      }
    }
  }

  importer.addDeclaration([]);
}
