import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * 匹配计算属性成员，例如 `obj[bar]`
 */
export interface ComputedMemberPattern extends ReferencePattern {
  computed: true;
}

/**
 * 匹配字面量成员访问，例如 `obj.foo` 或 `arr[0]`
 */
export interface LiteralMemberPattern extends ReferencePattern {
  /**
   * 成员的属性名或数组索引
   * - 对象属性：`{ property: 'foo' }` → 匹配 `obj.foo`
   * - 数组索引：`{ property: 0 }` → 匹配 `arr[0]`
   */
  property: number | string;
  computed?: false;
}

/**
 * 访问器，用于匹配某个路径或成员路径
 */
export interface ReferencePattern {
  /**
   * 为什么 ArrayPattern 的 RestElement 不能复用上层的访问器❓
   * - RestElement 和上层已经不是同一个对象（RestElement !== Array）
   * - RestElement 的索引会发生变化，同样不能复用上层的 members 访问器
   */
  arrayRestElement?: ReferencePattern;

  /**
   * 对当前节点成员的进一步匹配规则
   * 可用于链式匹配，如 obj.foo.bar
   */
  members?: MemberReferencePattern[];

  /**
   * 为什么 ObjectPattern 的 RestElement 不能复用上层的访问器❓
   * - RestElement 和上层已经不是同一个对象（RestElement !== Object）
   * - RestElement 下的成员可能可以复用上层的 members 访问器。因为 key 不会变，但是为了增加灵活性，你需要自行给 RestElement 的 members 配置相同的访问器
   */
  objectRestElement?: ReferencePattern;

  /**
   * 引用访问器
   */
  visitor?: ReferenceVisitor;
}

/**
 * 引用访问器
 */
export interface ReferenceVisitor {
  Identifier?: VisitFunction<t.Identifier>;
  JSXIdentifier?: VisitFunction<t.JSXIdentifier>;
  JSXMemberExpression?: VisitFunction<t.JSXMemberExpression>;
  MemberExpression?: VisitFunction<t.MemberExpression>;
  OptionalMemberExpression?: VisitFunction<t.OptionalMemberExpression>;
  TSIndexedAccessType?: VisitFunction<t.TSIndexedAccessType>;
  TSQualifiedName?: VisitFunction<t.TSQualifiedName>;
}

export type MemberNode =
  | t.JSXMemberExpression
  | t.MemberExpression
  | t.ObjectMethod
  | t.ObjectProperty
  | t.OptionalMemberExpression
  | t.TSIndexedAccessType
  | t.TSQualifiedName;

export type MemberPropertyNode =
  | t.JSXMemberExpression['property']
  | t.MemberExpression['property']
  | t.ObjectMethod['key']
  | t.ObjectProperty['key']
  | t.OptionalMemberExpression['property']
  | t.TSIndexedAccessType['indexType']
  | t.TSQualifiedName['right'];

/**
 * 成员访问器的联合类型
 */
export type MemberReferencePattern = ComputedMemberPattern | LiteralMemberPattern;

export type ReferenceNode =
  | t.Identifier
  | t.JSXIdentifier
  | t.JSXMemberExpression
  | t.MemberExpression
  | t.OptionalMemberExpression
  | t.TSIndexedAccessType
  | t.TSQualifiedName;

/**
 * 用于匹配路径节点的访问函数
 * @param referencePath 当前匹配到的 NodePath
 */
export type VisitFunction<T extends ReferenceNode> = (referencePath: NodePath<T>) => void;
