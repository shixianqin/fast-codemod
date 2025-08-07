import type { NodePath } from '@babel/traverse';

export function getProgram (path: NodePath) {
  while (path) {
    if (path.isProgram()) {
      break;
    }

    if (path.isFile()) {
      return path.get('program');
    }

    path = path.parentPath!;
  }

  return path;
}
