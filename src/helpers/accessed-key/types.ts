import type { types } from '@babel/core';

export type MemberNode =
  types.JSXMemberExpression |
  types.MemberExpression |
  types.ObjectMethod |
  types.ObjectProperty |
  types.OptionalMemberExpression |
  types.TSIndexedAccessType |
  types.TSQualifiedName;

export type KeyNode =
  types.JSXMemberExpression['property'] |
  types.MemberExpression['property'] |
  types.ObjectMethod['key'] |
  types.ObjectProperty['key'] |
  types.OptionalMemberExpression['property'] |
  types.TSIndexedAccessType['indexType'] |
  types.TSQualifiedName['right'];

export interface AccessedKeyMeta {
  computed?: boolean;
  key?: string;
  tsKeyword?: boolean;
}
