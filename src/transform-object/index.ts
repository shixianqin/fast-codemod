import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { addVariable } from '../utils/add-variable';
import { transformByIdentifier } from './transform-by-identifier';
import { transformByLiteralObject } from './transform-by-literal-object';
import type { TransformObjectOptions } from './types';
import { isLiteralObject } from './utils';

export function transformObject (path: NodePath, node: t.Expression, options: TransformObjectOptions): t.ObjectExpression {
  if (isLiteralObject(node)) {
    return transformByLiteralObject(node, options);
  }

  return transformByIdentifier(
    addVariable(path, node, {
      name: '_tempObj',
    }),
    options,
  );
}

export { type TransformObjectOptions } from './types';
