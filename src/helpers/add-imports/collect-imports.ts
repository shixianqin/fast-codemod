import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getProgram } from '../get-program';
import type { ImportKind, ImportPath } from './types';

export function collectImports (path: NodePath, source: string, importKinds: ImportKind[]) {
  const programPath = getProgram(path);
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
