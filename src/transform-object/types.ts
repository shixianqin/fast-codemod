import type * as t from '@babel/types';

export interface LiteralObject extends t.ObjectExpression {
  properties: t.ObjectMember[];
}

export interface TransformObjectOptions {
  /**
   * 将未匹配到 keyMap 的其他字段嵌套到指定字段下
   */
  nestUnmatchedIn?: string;

  /**
   * 是否保留未匹配字段（与 nestUnmatchedIn 互斥）
   */
  preserveUnmatched?: boolean;

  /**
   * 提取器
   * 如果是字面量对象，就将指定的 key 从对象中抽离
   * 如果是是计算型对象，就引用一个 member 表达式
   */
  extractor?: {
    [K in string]: (node: t.MemberExpression | t.ObjectMember) => void
  };

  /**
   * 显式键映射规则
   */
  remap?: {
    [K in string]: string | {
      key: string;
      get?: boolean;
      set?: boolean;
    }
  };
}

export type ObjectProperties = t.ObjectExpression['properties'];
