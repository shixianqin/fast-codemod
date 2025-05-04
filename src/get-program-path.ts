import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

type ProgramPath = NodePath<t.Program>;

export function getProgramPath (path: NodePath) {
  switch (path.node.type) {
    case 'File': {
      return path.get('program');
    }

    case 'Program': {
      return path as ProgramPath;
    }

    default: {
      return path.findParent((p) => t.isProgram(p.node)) as ProgramPath;
    }
  }
}
