import * as t from '@babel/types';

/**
 * 创建符合 js 要求的属性变量标识符
 * @param key
 */
export function createValidProperty (key: string) {
  if (t.isValidIdentifier(key)) {
    return {
      computed: false,
      key: t.identifier(key),
    };
  }

  return {
    computed: true,
    key: t.stringLiteral(key),
  };
}
