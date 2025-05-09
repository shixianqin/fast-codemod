import type * as t from '@babel/types';

export interface PropertyMeta {
  computed?: boolean;
  key?: string;
}

export type MemberNode =
  | t.JSXMemberExpression
  | t.MemberExpression
  | t.ObjectMethod
  | t.ObjectProperty
  | t.OptionalMemberExpression
  | t.TSIndexedAccessType
  | t.TSQualifiedName;

export type PropertyNode =
  | t.JSXMemberExpression['property']
  | t.MemberExpression['property']
  | t.ObjectMethod['key']
  | t.ObjectProperty['key']
  | t.OptionalMemberExpression['property']
  | t.TSIndexedAccessType['indexType']
  | t.TSQualifiedName['right'];
