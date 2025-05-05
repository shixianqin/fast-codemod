import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export function findProgramPath (path: NodePath) {
  switch (path.node.type) {
    case 'File': {
      return path.get('program');
    }

    case 'Program': {
      return path as NodePath<t.Program>;
    }

    default: {
      return path.findParent((p) => t.isProgram(p.node)) as NodePath<t.Program>;
    }
  }
}

export function findStatementPath (path: NodePath) {
  while (path) {
    if (t.isStatement(path.node)) {
      return path as NodePath<t.Statement>;
    }

    path = path.parentPath!;
  }
}
