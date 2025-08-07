import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
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

  const statement = path.getStatementParent()!;
  const id = generateUidIdentifier(statement, options?.name || '_temp');

  statement.insertBefore(
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
