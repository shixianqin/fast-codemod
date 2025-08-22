/* eslint perfectionist/sort-modules: ['error', { type: 'natural' }] */

import { types, type NodePath } from '@babel/core';

type Path<P extends NodePath, T extends types.Node> = P & {
  parent: T;
  parentPath: NodePath<T>;
};

export function isAssignmentLeft<T extends NodePath> (path: T): path is Path<T, types.AssignmentExpression> {
  return types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
}

export function isAssignmentPatternLeft<T extends NodePath> (path: T): path is Path<T, types.AssignmentPattern> {
  return types.isAssignmentPattern(path.parent) && path.parent.left === path.node;
}

export function isAssignmentPatternRight<T extends NodePath> (path: T): path is Path<T, types.AssignmentPattern> {
  return types.isAssignmentPattern(path.parent) && path.parent.right === path.node;
}

export function isAssignmentRight<T extends NodePath> (path: T): path is Path<T, types.AssignmentExpression> {
  return types.isAssignmentExpression(path.parent) && path.parent.right === path.node;
}

export function isBinaryLeft<T extends NodePath> (path: T): path is Path<T, types.BinaryExpression> {
  return types.isBinaryExpression(path.parent) && path.parent.left === path.node;
}

export function isBinaryRight<T extends NodePath> (path: T): path is Path<T, types.BinaryExpression> {
  return types.isBinaryExpression(path.parent) && path.parent.right === path.node;
}

export function isCallCallee<T extends NodePath> (path: T): path is Path<T, types.CallExpression> {
  return types.isCallExpression(path.parent) && path.parent.callee === path.node;
}

export function isConditionalAlternate<T extends NodePath> (path: T): path is Path<T, types.ConditionalExpression> {
  return types.isConditionalExpression(path.parent) && path.parent.alternate === path.node;
}

export function isConditionalConsequent<T extends NodePath> (path: T): path is Path<T, types.ConditionalExpression> {
  return types.isConditionalExpression(path.parent) && path.parent.consequent === path.node;
}

export function isConditionalTest<T extends NodePath> (path: T): path is Path<T, types.ConditionalExpression> {
  return types.isConditionalExpression(path.parent) && path.parent.test === path.node;
}

export function isLogicalLeft<T extends NodePath> (path: T): path is Path<T, types.LogicalExpression> {
  return types.isLogicalExpression(path.parent) && path.parent.left === path.node;
}

export function isLogicalRight<T extends NodePath> (path: T): path is Path<T, types.LogicalExpression> {
  return types.isLogicalExpression(path.parent) && path.parent.right === path.node;
}

export function isMemberObject<T extends NodePath> (path: T): path is Path<T, types.MemberExpression> {
  return types.isMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isMemberProperty<T extends NodePath> (path: T): path is Path<T, types.MemberExpression> {
  return types.isMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isNewCallee<T extends NodePath> (path: T): path is Path<T, types.NewExpression> {
  return types.isNewExpression(path.parent) && path.parent.callee === path.node;
}

export function isOptionalMemberObject<T extends NodePath> (path: T): path is Path<T, types.OptionalMemberExpression> {
  return types.isOptionalMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isOptionalMemberProperty<T extends NodePath> (path: T): path is Path<T, types.OptionalMemberExpression> {
  return types.isOptionalMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isPropertyKey<T extends NodePath> (path: T): path is Path<T, types.ObjectProperty> {
  return types.isObjectProperty(path.parent) && path.parent.key === path.node;
}

export function isPropertyValue<T extends NodePath> (path: T): path is Path<T, types.ObjectProperty> {
  return types.isObjectProperty(path.parent) && path.parent.value === path.node;
}
