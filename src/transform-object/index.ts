import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { addVariable } from '../utils/add-variable';
import { byIdentifier } from './by-identifier';
import { byStaticObject } from './by-static-object';
import type { TransformObjectOptions } from './types';
import { isStaticObject } from './utils';

export { type StaticObject, type TransformObjectOptions } from './types';

export function transformObject (path: NodePath, node: t.Expression, options: TransformObjectOptions): t.ObjectExpression {
  if (isStaticObject(node)) {
    return byStaticObject(node, options);
  }

  return byIdentifier(
    addVariable(path, node, {
      name: options.cachedVariableName || '_obj',
    }),
    options,
  );
}

export { isStaticObject } from './utils';
