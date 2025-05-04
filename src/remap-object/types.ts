import type * as t from '@babel/types';

export interface LiteralObjectExpression extends t.ObjectExpression {
  properties: (t.ObjectMethod | t.ObjectProperty)[];
}

export interface RemapObjectOptions {
  /**
   * 显式键映射规则
   */
  keyMap: Record<string, string | {
    key: string;
    get?: boolean;
    set?: boolean;
  }>;

  /**
   * 将未匹配到 keyMap 的其他字段嵌套到指定字段下
   */
  nestUnmatchedIn?: string;

  /**
   * 是否保留未匹配字段（与 nestUnmatchedIn 互斥）
   */
  preserveUnmatched?: boolean;
}

export type ObjectProperties = t.ObjectExpression['properties'];
