import type * as t from '@babel/types';

export type ObjectProperties = t.ObjectExpression['properties'];

export interface LiteralObjectExpression extends t.ObjectExpression {
  properties: Array<LiteralObjectProperty | t.ObjectMethod>;
}

export interface LiteralObjectProperty extends t.ObjectProperty {
  value: t.Expression;
}

export interface TransformObjectOptions {
  /**
   * 当传入节点不是静态对象字面量（LiteralObjectExpression）时，将会自动创建一个变量用于缓存原始对象以便提取属性
   * @default _obj
   */
  cachedVariableName?: string;

  /**
   * 平移未匹配的属性
   */
  flatUnmatched?: boolean | string;

  /**
   * 将未匹配的属性嵌套在指定的属性下
   */
  wrapUnmatchedIn?: string;

  /**
   * 提取指定的属性
   * 如果是字面量对象，就将指定的 key 从对象中抽离
   * 如果是是计算型对象，就引用一个 member 表达式
   */
  extractor?: {
    [K in string]: (extractedNode: t.Expression, originalNode: t.Expression | t.ObjectMember) => void
  };

  /**
   * 属性重命名
   */
  rename?: {
    [K in string]: string | {
      name: string;
      get?: boolean;
      set?: boolean;
    }
  };
}
