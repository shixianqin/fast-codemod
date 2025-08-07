/* eslint perfectionist/sort-modules: ['error', { type: 'natural' }] */

import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

type Path<P extends NodePath, T extends t.Node> = P & {
  parent: T;
  parentPath: NodePath<T>;
};

export function isAssignmentLeft<T extends NodePath> (path: T): path is Path<T, t.AssignmentExpression> {
  return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
}

export function isAssignmentPatternLeft<T extends NodePath> (path: T): path is Path<T, t.AssignmentPattern> {
  return t.isAssignmentPattern(path.parent) && path.parent.left === path.node;
}

export function isAssignmentPatternRight<T extends NodePath> (path: T): path is Path<T, t.AssignmentPattern> {
  return t.isAssignmentPattern(path.parent) && path.parent.right === path.node;
}

export function isAssignmentRight<T extends NodePath> (path: T): path is Path<T, t.AssignmentExpression> {
  return t.isAssignmentExpression(path.parent) && path.parent.right === path.node;
}

export function isBinaryLeft<T extends NodePath> (path: T): path is Path<T, t.BinaryExpression> {
  return t.isBinaryExpression(path.parent) && path.parent.left === path.node;
}

export function isBinaryRight<T extends NodePath> (path: T): path is Path<T, t.BinaryExpression> {
  return t.isBinaryExpression(path.parent) && path.parent.right === path.node;
}

export function isCallCallee<T extends NodePath> (path: T): path is Path<T, t.CallExpression> {
  return t.isCallExpression(path.parent) && path.parent.callee === path.node;
}

export function isConditionalAlternate<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression> {
  return t.isConditionalExpression(path.parent) && path.parent.alternate === path.node;
}

export function isConditionalConsequent<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression> {
  return t.isConditionalExpression(path.parent) && path.parent.consequent === path.node;
}

export function isConditionalTest<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression> {
  return t.isConditionalExpression(path.parent) && path.parent.test === path.node;
}

export function isLogicalLeft<T extends NodePath> (path: T): path is Path<T, t.LogicalExpression> {
  return t.isLogicalExpression(path.parent) && path.parent.left === path.node;
}

export function isLogicalRight<T extends NodePath> (path: T): path is Path<T, t.LogicalExpression> {
  return t.isLogicalExpression(path.parent) && path.parent.right === path.node;
}

export function isMemberObject<T extends NodePath> (path: T): path is Path<T, t.MemberExpression> {
  return t.isMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isMemberProperty<T extends NodePath> (path: T): path is Path<T, t.MemberExpression> {
  return t.isMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isNewCallee<T extends NodePath> (path: T): path is Path<T, t.NewExpression> {
  return t.isNewExpression(path.parent) && path.parent.callee === path.node;
}

export function isOptionalMemberObject<T extends NodePath> (path: T): path is Path<T, t.OptionalMemberExpression> {
  return t.isOptionalMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isOptionalMemberProperty<T extends NodePath> (path: T): path is Path<T, t.OptionalMemberExpression> {
  return t.isOptionalMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isPropertyKey<T extends NodePath> (path: T): path is Path<T, t.ObjectProperty> {
  return t.isObjectProperty(path.parent) && path.parent.key === path.node;
}

export function isPropertyValue<T extends NodePath> (path: T): path is Path<T, t.ObjectProperty> {
  return t.isObjectProperty(path.parent) && path.parent.value === path.node;
}
