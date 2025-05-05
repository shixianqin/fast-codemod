import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { findStatementPath } from './find-path';
import { generateUidIdentifier } from './generate-uid';

export interface AddVariableOptions {
  kind?: 'const' | 'let' | 'var';
  name?: string;
}

export function addVariable (path: NodePath, init: t.Expression, options?: AddVariableOptions) {
  const kind = options?.kind || 'const';

  if (kind === 'const' && t.isIdentifier(init)) {
    return init;
  }

  const statementNodePath = findStatementPath(path)!;
  const id = generateUidIdentifier(statementNodePath, options?.name);

  statementNodePath.insertBefore(
    t.variableDeclaration(
      kind,
      [
        t.variableDeclarator(
          id,
          init,
        ),
      ],
    ),
  );

  return id;
}
