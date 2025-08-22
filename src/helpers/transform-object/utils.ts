import { types, type Node } from '@babel/core';
import { resolveAccessedKey } from '../accessed-key';
import type { LiteralObjectExpression } from './types';

/**
 * 判断是否为静态字面量对象表达式，
 * 所有 key 都是字面量，不存在任何动态计算的 key
 * @param node
 */
export function isLiteralObjectExpression (node: Node): node is LiteralObjectExpression {
  if (node.type === 'ObjectExpression') {
    for (const property of node.properties) {
      if (property.type === 'SpreadElement' || resolveAccessedKey(property).computed) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * 将 ObjectMethod 转换为 FunctionExpression
 * @param node
 */
export function methodToFunction (node: types.ObjectMethod) {
  return types.functionExpression(
    !node.computed && node.key.type === 'Identifier' ? node.key : null,
    node.params,
    node.body,
    node.generator,
    node.async,
  );
}
