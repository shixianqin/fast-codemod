import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { resolveAccessedKey, type AccessedKeyMeta, type MemberNode } from '../accessed-key';
import type {
  MemberReferencePattern,
  ReferenceNode,
  ReferencePattern,
  VisitFunction,
} from './types';

/**
 * 获取某个标识符的引用
 * @param scopePath
 * @param target
 */
function getReferencePaths (scopePath: NodePath, target: t.Identifier): NodePath[] {
  return scopePath.scope.getBinding(target.name)?.referencePaths || [];
}

/**
 * 判断是否为成员表达式的对象节点
 * @param parent
 * @param node
 */
function isMemberObject (parent: t.Node, node: t.Node): parent is MemberNode {
  switch (parent.type) {
    case 'JSXMemberExpression':
    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      return parent.object === node;
    }

    case 'TSIndexedAccessType': {
      return parent.objectType === node;
    }

    case 'TSQualifiedName': {
      return parent.left === node;
    }

    default: {
      return false;
    }
  }
}

/**
 * 匹配成员访问器
 * @param parentPattern
 * @param meta
 */
function matchMemberPattern (parentPattern: ReferencePattern, meta: AccessedKeyMeta): null | MemberReferencePattern {
  for (const memberPattern of parentPattern.members || []) {
    switch (memberPattern.type) {
      case 'computed': {
        if (meta.computed) {
          return memberPattern;
        }

        break;
      }

      case 'literal': {
        if (String(memberPattern.key) === meta.key) {
          return memberPattern;
        }

        break;
      }

      case 'tsKeyword': {
        if (meta.tsKeyword && memberPattern.keyword === meta.key) {
          return memberPattern;
        }

        break;
      }

      // no default
    }
  }

  return null;
}

/**
 * 基于 ArrayPattern 遍历
 * @param scopePath
 * @param target
 * @param pattern
 */
function traverseByArrayPattern (scopePath: NodePath, target: t.ArrayPattern, pattern: ReferencePattern) {
  for (const [index, element] of target.elements.entries()) {
    if (!element) {
      continue;
    }

    if (t.isRestElement(element)) {
      if (pattern.arrayRestElement) {
        traverseReferences(scopePath, element.argument, pattern.arrayRestElement);
      }

      continue;
    }

    const memberPattern = matchMemberPattern(pattern, {
      key: String(index),
    });

    if (memberPattern) {
      traverseReferences(scopePath, element, memberPattern);
    }
  }
}

/**
 * 基于 ObjectPattern 遍历
 * @param scopePath
 * @param target
 * @param pattern
 */
function traverseByObjectPattern (scopePath: NodePath, target: t.ObjectPattern, pattern: ReferencePattern) {
  for (const property of target.properties) {
    if (t.isRestElement(property)) {
      if (pattern.objectRestElement) {
        traverseReferences(scopePath, property.argument, pattern.objectRestElement);
      }

      continue;
    }

    if (!t.isLVal(property.value)) {
      continue;
    }

    const memberPattern = matchMemberPattern(pattern, resolveAccessedKey(property));

    if (memberPattern) {
      traverseReferences(scopePath, property.value, memberPattern);
    }
  }
}

/**
 * 访问引用
 * @param originalReferencePath
 * @param pattern
 */
function visitReferencePath (originalReferencePath: NodePath, pattern: ReferencePattern) {
  const trackPath = (path: NodePath, isContinue?: boolean) => {
    currentPath = path;
    currentParent = path.parent;

    if (!isContinue) {
      referencePath = path;
    }

    if (t.isTSTypeReference(currentParent) || t.isTSNonNullExpression(currentParent)) {
      trackPath(path.parentPath!, true);
    }
  };

  let currentPattern = pattern;
  let currentPath!: NodePath;
  let currentParent!: t.Node;
  let referencePath!: NodePath;

  trackPath(originalReferencePath);

  // 如果是链式引用，则需要递归查找父级路径
  while (isMemberObject(currentParent, currentPath.node)) {
    const memberPattern = matchMemberPattern(currentPattern, resolveAccessedKey(currentParent));

    if (memberPattern) {
      currentPattern = memberPattern;
      trackPath(currentPath.parentPath!);
    }
    else {
      break;
    }
  }

  // 如果引用被赋值给了新的变量（如：const b = obj.foo），则需对新变量继续追踪引用
  if (t.isVariableDeclarator(currentParent) && currentParent.id !== currentPath.node) {
    traverseReferences(currentPath, currentParent.id, currentPattern);
  }

  // Call visit
  // eslint-disable-next-line typescript/no-explicit-any
  const visit: undefined | VisitFunction<any> = currentPattern.visitor?.[referencePath.node.type as ReferenceNode['type']];

  if (typeof visit === 'function') {
    visit(referencePath);
  }
}

/**
 * 遍历引用（支持深度遍历）
 * @param scopePath
 * @param target
 * @param pattern
 */
export function traverseReferences (
  scopePath: NodePath,
  target: string | t.LVal | t.VoidPattern,
  pattern: ReferencePattern,
) {
  if (typeof target === 'string') {
    target = t.identifier(target);
  }

  switch (target.type) {
    case 'ArrayPattern': {
      traverseByArrayPattern(scopePath, target, pattern);
      break;
    }

    case 'AssignmentPattern': {
      traverseReferences(scopePath, target.left, pattern);
      break;
    }

    case 'Identifier': {
      for (const referencePath of getReferencePaths(scopePath, target)) {
        visitReferencePath(referencePath, pattern);
      }

      break;
    }

    case 'ObjectPattern': {
      traverseByObjectPattern(scopePath, target, pattern);
      break;
    }

    case 'RestElement': {
      traverseReferences(scopePath, target.argument, pattern);
      break;
    }

    // no default
  }
}
