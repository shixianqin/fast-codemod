import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { remapByIdentifier } from './remap-by-identifier';
import { remapByLiteralObject } from './remap-by-literal-object';
import type { RemapObjectOptions } from './types';
import { addVariable, isLiteralObject } from './utils';

export function remapObject (path: NodePath, node: t.Expression, rule: RemapObjectOptions): t.ObjectExpression {
  if (isLiteralObject(node)) {
    return remapByLiteralObject(node, rule);
  }

  return remapByIdentifier(
    addVariable(path, node),
    rule,
  );
}

export { type RemapObjectOptions } from './types';
