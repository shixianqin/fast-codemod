import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { findProgramPath } from '../utils/find-path';
import type { ImportKind, ImportPath } from './types';

export function getImports (path: NodePath, source: string, importKinds: ImportKind[]) {
  const programPath = findProgramPath(path);
  const importPaths: ImportPath[] = [];

  let lastImportPath: undefined | ImportPath;

  const traverseImports = () => {
    traverse(programPath.node, {
      ImportDeclaration: (path) => {
        if (path.node.source.value === source && importKinds.includes(path.node.importKind || 'value')) {
          importPaths.push(path);
        }

        lastImportPath = path;
      },
    });
  };

  traverseImports();

  if (importPaths.length === 0) {
    const declaration = t.importDeclaration([], t.stringLiteral(source));

    if (lastImportPath) {
      lastImportPath.insertAfter([declaration]);
    }
    else {
      programPath.unshiftContainer('body', declaration);
    }

    traverseImports();
  }

  return importPaths;
}
