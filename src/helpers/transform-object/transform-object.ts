import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { addVariable } from '../add-variable';
import { transformFromIdentifier } from './transform-from-identifier';
import { transformFromStaticObject } from './transform-from-static-object';
import type { TransformObjectOptions } from './types';
import { isStaticObject } from './utils';

export function transformObject (path: NodePath, node: t.Expression, options: TransformObjectOptions): t.ObjectExpression {
  if (isStaticObject(node)) {
    return transformFromStaticObject(node, options);
  }

  return transformFromIdentifier(
    addVariable(path, node, {
      name: options.cachedVariableName || '_obj',
    }),
    options,
  );
}
