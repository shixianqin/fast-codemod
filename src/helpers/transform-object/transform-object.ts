import type { NodePath, types } from '@babel/core';
import { addVariable } from '../add-variable';
import { transformFromIdentifier } from './transform-from-identifier';
import { transformFromLiteralObject } from './transform-from-literal-object';
import type { TransformObjectOptions } from './types';
import { isLiteralObjectExpression } from './utils';

export function transformObject (path: NodePath, node: types.Expression, options: TransformObjectOptions): types.ObjectExpression {
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
