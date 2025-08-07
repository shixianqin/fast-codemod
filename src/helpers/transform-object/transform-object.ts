import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { addVariable } from '../add-variable';
import { transformFromIdentifier } from './transform-from-identifier';
import { transformFromLiteralObject } from './transform-from-literal-object';
import type { TransformObjectOptions } from './types';
import { isLiteralObjectExpression } from './utils';

export function transformObject (path: NodePath, node: t.Expression, options: TransformObjectOptions): t.ObjectExpression {
  if (isLiteralObjectExpression(node)) {
    return transformFromLiteralObject(node, options);
  }

  return transformFromIdentifier(
    addVariable(path, node, {
      name: options.cachedVariableName || '_obj',
    }),
    options,
  );
}
