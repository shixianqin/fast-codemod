import * as t from '@babel/types';
import { getPropertyMeta } from '../utils/get-property-meta';
import type { LiteralObject } from './types';

/**
 * 创建符合 js 要求的变量标识符
 * @param key
 */
export function createValidKey (key: string) {
  if (t.isValidIdentifier(key)) {
    return {
      computed: false,
      id: t.identifier(key),
    };
  }

  return {
    computed: true,
    id: t.stringLiteral(key),
  };
}

/**
 * 判断是否为字面量对象表达式，
 * 所有 key 都是字面量，不存在任何动态计算的 key
 * @param node
 */
export function isLiteralObject (node: t.Expression): node is LiteralObject {
  if (t.isObjectExpression(node)) {
    for (const property of node.properties) {
      if (t.isSpreadElement(property) || getPropertyMeta(property).computed) {
        return false;
      }
    }

    return true;
  }

  return false;
}
