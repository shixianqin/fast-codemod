import { types, type NodePath } from '@babel/core';
import { generateUidIdentifier } from './generate-uid';

export interface AddVariableOptions {
  kind?: 'const' | 'let' | 'var';
  name?: string;
}

export function addVariable (path: NodePath, init: types.Expression, options?: AddVariableOptions) {
  const kind = options?.kind || 'const';

  if (kind === 'const' && types.isIdentifier(init)) {
    return init;
  }

  const statement = path.getStatementParent()!;
  const id = generateUidIdentifier(statement, options?.name || '_temp');

  statement.insertBefore(
    types.variableDeclaration(
      kind,
      [
        types.variableDeclarator(
          id,
          init,
        ),
      ],
    ),
  );

  return id;
}
