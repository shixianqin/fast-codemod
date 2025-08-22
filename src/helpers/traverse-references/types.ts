import type { NodePath, types } from '@babel/core';

/**
 * 成员访问器的联合类型
 */
export type MemberReferencePattern = ComputedMemberPattern | LiteralMemberPattern | TSKeywordMemberPattern;

export type ReferenceNode =
  types.Identifier |
  types.JSXIdentifier |
  types.JSXMemberExpression |
  types.MemberExpression |
  types.OptionalMemberExpression |
  types.TSIndexedAccessType |
  types.TSQualifiedName;

/**
 * 用于匹配路径节点的访问函数
 * @param referencePath 当前匹配到的 NodePath
 */
export type VisitFunction<T extends ReferenceNode> = (referencePath: NodePath<T>) => void;

/**
 * 引用访问器
 */
export interface ReferenceVisitor {
  Identifier?: VisitFunction<types.Identifier>;
  JSXIdentifier?: VisitFunction<types.JSXIdentifier>;
  JSXMemberExpression?: VisitFunction<types.JSXMemberExpression>;
  MemberExpression?: VisitFunction<types.MemberExpression>;
  OptionalMemberExpression?: VisitFunction<types.OptionalMemberExpression>;
  TSIndexedAccessType?: VisitFunction<types.TSIndexedAccessType>;
  TSQualifiedName?: VisitFunction<types.TSQualifiedName>;
}

/**
 * 访问器，用于匹配某个路径或成员路径
 */
export interface ReferencePattern {
  /**
   * 引用访问器
   */
  visitor?: ReferenceVisitor;

  /**
   * 对当前节点成员的进一步匹配规则
   * 可用于链式匹配，如 obj.foo.bar
   */
  members?: MemberReferencePattern[];

  /**
   * ❓为什么 ObjectPattern 的 RestElement 不能复用上层的访问器
   * - RestElement 和上层已经不是同一个对象（RestElement !== Object）,Object.keys，Object.values, Object.entries 的结果是不一样的
   * - RestElement 下的成员可能可以复用上层的 members 访问器。因为 key 不会变，但是为了增加灵活性，你需要自行给 RestElement 的 members 配置相同的访问器
   */
  objectRestElement?: ReferencePattern;

  /**
   * ❓为什么 ArrayPattern 的 RestElement 不能复用上层的访问器
   * - RestElement 和上层已经不是同一个对象（RestElement !== Array）
   * - RestElement 的索引会发生变化，同样不能复用上层的 members 访问器
   */
  arrayRestElement?: ReferencePattern;
}

/**
 * 匹配计算属性成员，例如 `obj[bar]`, `obj[getKey()]`
 *                         ^^^         ^^^^^^^^
 */
export interface ComputedMemberPattern extends ReferencePattern {
  type: 'computed';
}

/**
 * 匹配类型关键字属性成员，例如 `type T = Foo[number]`
 *                                       ^^^^^^
 */
export interface TSKeywordMemberPattern extends ReferencePattern {
  type: 'tsKeyword';
  keyword: 'any' | 'bigint' | 'boolean' | 'never' | 'null' | 'number' | 'object' | 'string' | 'symbol' | 'undefined' | 'unknown' | 'void';
}

/**
 * 匹配字面量成员访问，例如 `obj.foo` 或 `arr[0]`
 *                           ^^^          ^
 */
export interface LiteralMemberPattern extends ReferencePattern {
  type: 'literal';

  /**
   * 成员的属性名或数组索引
   * - 对象属性：`{ key: 'foo' }` → 匹配 `obj.foo`
   * - 数组索引：`{ key: 0 }` → 匹配 `arr[0]`
   */
  key: number | string;
}
