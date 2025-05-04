import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { generateUidIdentifier } from '../generate-uid';
import { getPropertyMeta } from '../traverse-references/get-property-meta';
import type { LiteralObjectExpression } from './types';

/**
 * 如果转换目标不是变量标识符，则需要新建一个变量标识符
 * @param path
 * @param node
 */
export function addVariable (path: NodePath, node: t.Expression) {
  if (t.isIdentifier(node)) {
    return node;
  }

  // 向上查找到表达式语句，才能安全的插入新的变量声明
  if (!isStatementPath(path)) {
    path = path.findParent(isStatementPath)!;
  }

  const id = generateUidIdentifier(path, '_tempObj');

  path.insertBefore(
    t.variableDeclaration(
      'const',
      [
        t.variableDeclarator(
          id,
          node,
        ),
      ],
    ),
  );

  return id;
}

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
export function isLiteralObject (node: t.Expression): node is LiteralObjectExpression {
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

export function isStatementPath (path: NodePath) {
  return t.isStatement(path.node);
}
