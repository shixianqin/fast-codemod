import type {
  JSXMemberExpression,
  MemberExpression,
  ObjectMethod,
  ObjectProperty,
  OptionalMemberExpression,
  TSIndexedAccessType,
  TSQualifiedName,
} from '@babel/types';

export type MemberNode =
  JSXMemberExpression |
  MemberExpression |
  ObjectMethod |
  ObjectProperty |
  OptionalMemberExpression |
  TSIndexedAccessType |
  TSQualifiedName;

export type KeyNode =
  JSXMemberExpression['property'] |
  MemberExpression['property'] |
  ObjectMethod['key'] |
  ObjectProperty['key'] |
  OptionalMemberExpression['property'] |
  TSIndexedAccessType['indexType'] |
  TSQualifiedName['right'];

export interface AccessedKeyMeta {
  computed?: boolean;
  key?: string;
  tsKeyword?: boolean;
}
