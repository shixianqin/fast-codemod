import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { generateUidIdentifier } from '../index';
import { collectImports } from './collect-imports';
import type { AddImportOptions } from './types';
import { getImportDefaultLocal, getImportedName } from './utils';

/**
 * addImportDefault
 * @param path
 * @param source
 * @param options
 */
export function addImportDefault (path: NodePath, source: string, options?: AddImportOptions) {
  const importPaths = collectImports(path, source, [options?.importKind || 'value', 'value']);

  for (const importPath of importPaths) {
    for (const specifier of importPath.node.specifiers) {
      const local = getImportDefaultLocal(specifier);

      if (local) {
        return local;
      }
    }
  }

  const local = generateUidIdentifier(
    path,
    options?.localNameHint || source.split('.')[0],
  );

  importPaths[0].unshiftContainer(
    'specifiers',
    t.importDefaultSpecifier(local),
  );

  return local;
}

/**
 * addImportNamed
 * @param path
 * @param name
 * @param source
 * @param options
 */
export function addImportNamed (path: NodePath, name: string, source: string, options?: AddImportOptions) {
  const importKind = options?.importKind || 'value';
  const importPaths = collectImports(path, source, [importKind, 'value']);

  for (const importPath of importPaths) {
    for (const specifier of importPath.node.specifiers) {
      if (t.isImportSpecifier(specifier) && getImportedName(specifier) === name) {
        if (importKind === 'value' && (specifier.importKind || 'value') !== importKind) {
          specifier.importKind = importKind;
        }

        return specifier.local;
      }
    }
  }

  const local = generateUidIdentifier(path, options?.localNameHint || name);
  const newSpecifier = t.importSpecifier(local, t.identifier(name));
  const firstImportPath = importPaths[0];

  let targetImportPath: undefined | NodePath<t.ImportDeclaration>;

  newSpecifier.importKind = importKind;

  for (const importPath of importPaths) {
    let noNamespace = true;

    for (const specifier of importPath.node.specifiers) {
      if (t.isImportNamespaceSpecifier(specifier)) {
        noNamespace = false;
        break;
      }
    }

    if (noNamespace) {
      targetImportPath = importPath;
      break;
    }
  }

  if (targetImportPath) {
    targetImportPath.pushContainer('specifiers', newSpecifier);
  }
  else {
    firstImportPath.insertAfter([
      t.importDeclaration(
        [newSpecifier],
        firstImportPath.node.source,
      ),
    ]);
  }

  return local;
}

/**
 * addImportNamespace
 * @param path
 * @param source
 * @param options
 */
export function addImportNamespace (path: NodePath, source: string, options?: AddImportOptions) {
  const importPaths = collectImports(path, source, [options?.importKind || 'value', 'value']);

  for (const importPath of importPaths) {
    for (const specifier of importPath.node.specifiers) {
      if (t.isImportNamespaceSpecifier(specifier)) {
        return specifier.local;
      }
    }
  }

  const local = generateUidIdentifier(path, options?.localNameHint || source.split('.')[0]);
  const newSpecifier = t.importNamespaceSpecifier(local);
  const firstImportPath = importPaths[0];
  const firstSpecifiers = firstImportPath.node.specifiers;

  if (firstSpecifiers.length === 0) {
    firstImportPath.pushContainer('specifiers', newSpecifier);
  }
  else if (firstSpecifiers.length === 1 && t.isImportDefaultSpecifier(firstSpecifiers[0])) {
    firstImportPath.pushContainer('specifiers', newSpecifier);
  }
  else {
    firstImportPath.insertAfter([
      t.importDeclaration(
        [newSpecifier],
        firstImportPath.node.source,
      ),
    ]);
  }

  return local;
}

/**
 * addImportSideEffect
 * @param path
 * @param source
 */
export function addImportSideEffect (path: NodePath, source: string) {
  collectImports(path, source, ['value']);
}
