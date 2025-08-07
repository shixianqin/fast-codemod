import { identifier, isValidIdentifier, stringLiteral } from '@babel/types';

/**
 * 创建符合 js 要求的属性访问标识符
 * 因为是用于属性，所以不过滤关键字/保留字
 * @param key
 *
 * @example
 * const obj = {
 *   foo: 1, // Identifier
 *   'a-b': 2, // StringLiteral
 * };
 * obj.foo; // Identifier
 * obj['a-b']; // StringLiteral + computed:true
 */
export function createAccessedKey (key: string) {
  if (isValidIdentifier(key, false)) {
    return {
      computed: false,
      key: identifier(key),
    };
  }

  return {
    computed: true,
    key: stringLiteral(key),
  };
}
