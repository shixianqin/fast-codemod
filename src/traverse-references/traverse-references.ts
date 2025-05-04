import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getPropertyMeta, type PropertyMeta } from './get-property-meta';
import type {
  MemberNode,
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
 * 判断父节点是否为成员表达式节点
 * @param parentNode
 * @param node
 */
function isParentMemberNode (parentNode: t.Node, node: t.Node): parentNode is MemberNode {
  switch (parentNode.type) {
    case 'JSXMemberExpression':
    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      return parentNode.object === node;
    }

    case 'TSIndexedAccessType': {
      return parentNode.objectType === node;
    }

    case 'TSQualifiedName': {
      return parentNode.left === node;
    }
  }

  return false;
}

/**
 * 匹配成员访问器
 * @param parentPattern
 * @param propertyMeta
 */
function matchMemberPattern (parentPattern: ReferencePattern, propertyMeta: PropertyMeta): null | MemberReferencePattern {
  for (const memberPattern of parentPattern.members || []) {
    if (memberPattern.computed ? propertyMeta.computed : String(memberPattern.property) === propertyMeta.name) {
      return memberPattern;
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
  let index = -1;

  for (const element of target.elements) {
    index += 1;

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
      name: String(index),
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

    const memberPattern = matchMemberPattern(pattern, getPropertyMeta(property));

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
  while (isParentMemberNode(currentParent, currentPath.node)) {
    const memberPattern = matchMemberPattern(currentPattern, getPropertyMeta(currentParent));

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
export function traverseReferences (scopePath: NodePath, target: string | t.LVal, pattern: ReferencePattern) {
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
  }
}
