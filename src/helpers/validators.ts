import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

type Path<
  T extends NodePath,
  Parent extends t.Node,
  Key extends keyof Parent = 'type',
  Node = Key extends 'type' ? Parent : Omit<Parent, Key> & {[K in Key]: T['node'] },
> = T & {
  parent: Node;
  parentPath: NodePath<Node>;
};

export function isAssignmentLeft<T extends NodePath> (path: T): path is Path<T, t.AssignmentExpression, 'left'> {
  return t.isAssignmentPattern(path.parent) && path.parent.left === path.node;
}

export function isAssignmentRight<T extends NodePath> (path: T): path is Path<T, t.AssignmentExpression, 'right'> {
  return t.isAssignmentPattern(path.parent) && path.parent.right === path.node;
}

export function isCallCallee<T extends NodePath> (path: T): path is Path<T, t.CallExpression, 'callee'> {
  return t.isCallExpression(path.parent) && path.parent.callee === path.node;
}

export function isConditionalAlternate<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression, 'alternate'> {
  return t.isConditionalExpression(path.parent) && path.parent.alternate === path.node;
}

export function isConditionalConsequent<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression, 'consequent'> {
  return t.isConditionalExpression(path.parent) && path.parent.consequent === path.node;
}

export function isConditionalTest<T extends NodePath> (path: T): path is Path<T, t.ConditionalExpression, 'test'> {
  return t.isConditionalExpression(path.parent) && path.parent.test === path.node;
}

export function isLogicalLeft<T extends NodePath> (path: T): path is Path<T, t.LogicalExpression, 'left'> {
  return t.isLogicalExpression(path.parent) && path.parent.left === path.node;
}

export function isLogicalRight<T extends NodePath> (path: T): path is Path<T, t.LogicalExpression, 'right'> {
  return t.isLogicalExpression(path.parent) && path.parent.right === path.node;
}

export function isMemberObject<T extends NodePath> (path: T): path is Path<T, t.MemberExpression, 'object'> {
  return t.isMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isMemberProperty<T extends NodePath> (path: T): path is Path<T, t.MemberExpression, 'property'> {
  return t.isMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isNewCallee<T extends NodePath> (path: T): path is Path<T, t.NewExpression, 'callee'> {
  return t.isNewExpression(path.parent) && path.parent.callee === path.node;
}

export function isOptionalMemberObject<T extends NodePath> (path: T): path is Path<T, t.OptionalMemberExpression, 'object'> {
  return t.isOptionalMemberExpression(path.parent) && path.parent.object === path.node;
}

export function isOptionalMemberProperty<T extends NodePath> (path: T): path is Path<T, t.OptionalMemberExpression, 'property'> {
  return t.isOptionalMemberExpression(path.parent) && path.parent.property === path.node;
}

export function isPropertyKey<T extends NodePath> (path: T): path is Path<T, t.ObjectProperty, 'key'> {
  return t.isObjectProperty(path.parent) && path.parent.key === path.node;
}

export function isPropertyValue<T extends NodePath> (path: T): path is Path<T, t.ObjectProperty, 'value'> {
  return t.isObjectProperty(path.parent) && path.parent.value === path.node;
}
