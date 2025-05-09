import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export function getProgram (path: NodePath) {
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
