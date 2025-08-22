import type { types } from '@babel/core';
import type { AccessedKeyMeta, KeyNode, MemberNode } from './types';

const tsKeywordPattern = /^TS\w+?Keyword$/;

/**
 * 从 TSIndexedAccessType 中查找字面量 key 节点
 * @param node
 */
function getTSIndexType (node: types.TSIndexedAccessType) {
  const { indexType } = node;

  if (tsKeywordPattern.test(indexType.type)) {
    return indexType;
  }

  if (indexType.type === 'TSLiteralType') {
    return indexType.literal;
  }

  return null;
}

/**
 * 解析访问的 key
 * @param memberNode
 */
export function resolveAccessedKey (memberNode: MemberNode): AccessedKeyMeta {
  let keyNode!: KeyNode;
  let computed: undefined | boolean;
  let key: undefined | string;

  switch (memberNode.type) {
    case 'JSXMemberExpression': {
      keyNode = memberNode.property;
      break;
    }

    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      computed = memberNode.computed;
      keyNode = memberNode.property;
      break;
    }

    case 'ObjectMethod':
    case 'ObjectProperty': {
      computed = memberNode.computed;
      keyNode = memberNode.key;
      break;
    }

    case 'TSIndexedAccessType': {
      const indexType = getTSIndexType(memberNode);

      computed = true;

      if (!indexType) {
        return {
          computed,
        };
      }

      // TS Keywords
      if (tsKeywordPattern.test(indexType.type)) {
        return {
          key: indexType.type
            .replace(/^TS|Keyword$/g, '')
            .toLowerCase(),
          tsKeyword: true,
        };
      }

      keyNode = indexType;
      break;
    }

    case 'TSQualifiedName': {
      keyNode = memberNode.right;
      break;
    }

    // no default
  }

  if (computed) {
    switch (keyNode.type) {
      case 'TSAsExpression':
      case 'TSNonNullExpression':
      case 'TSSatisfiesExpression':
      case 'TSTypeAssertion':
      case 'TypeCastExpression': {
        keyNode = keyNode.expression;
        break;
      }
      // no default
    }

    switch (keyNode.type) {
      case 'BigIntLiteral':
      case 'BooleanLiteral':
      case 'DecimalLiteral':
      case 'NumericLiteral':
      case 'StringLiteral': {
        key = String(keyNode.value);
        break;
      }

      case 'NullLiteral': {
        key = 'null';
        break;
      }

      case 'RegExpLiteral': {
        key = `/${ keyNode.pattern }/${ keyNode.flags }`;
        break;
      }

      case 'TemplateLiteral': {
        if (keyNode.expressions.length === 0) {
          key = keyNode.quasis[0].value.cooked;
        }

        break;
      }

      case 'UnaryExpression': {
        const { argument } = keyNode;

        if (argument.type === 'NumericLiteral') {
          switch (keyNode.operator) {
            case '+': {
              key = String(argument.value);
              break;
            }

            case '-': {
              key = `-${ argument.value }`;
              break;
            }

            // no default
          }
        }

        break;
      }

      // no default
    }

    // 如果已经从字面量中解析出 key 值，则不属于动态 key
    if (key !== undefined) {
      return {
        key,
      };
    }

    return {
      computed,
    };
  }

  // 解析静态 key
  switch (keyNode.type) {
    case 'Identifier':
    case 'JSXIdentifier': {
      key = keyNode.name;
      break;
    }

    case 'PrivateName': {
      key = `#${ keyNode.id.name }`;
      break;
    }

    // no default
  }

  return {
    key,
  };
}
