import * as t from '@babel/types';
import type { MemberNode, PropertyMeta, PropertyNode } from './types';

/**
 * 从 TSIndexedAccessType 中查找字面量 key 节点
 * @param memberNode
 */
function getTSIndexType (memberNode: t.TSIndexedAccessType) {
  const { indexType } = memberNode;

  switch (indexType.type) {
    case 'TSLiteralType': {
      return t.isUnaryExpression(indexType.literal) ? null : indexType.literal;
    }

    case 'TSNullKeyword':
    case 'TSUndefinedKeyword': {
      return indexType;
    }
  }
}

/**
 * 获取属性元信息
 * @param memberNode
 */
export function getPropertyMeta (memberNode: MemberNode): PropertyMeta {
  let propertyNode!: PropertyNode;
  let computed: undefined | boolean;
  let key: undefined | string;

  switch (memberNode.type) {
    case 'JSXMemberExpression': {
      propertyNode = memberNode.property;
      break;
    }

    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      computed = memberNode.computed;
      propertyNode = memberNode.property;
      break;
    }

    case 'ObjectMethod':
    case 'ObjectProperty': {
      computed = memberNode.computed;
      propertyNode = memberNode.key;
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

      propertyNode = indexType;
      break;
    }

    case 'TSQualifiedName': {
      propertyNode = memberNode.right;
      break;
    }
  }

  if (computed) {
    switch (propertyNode.type) {
      case 'BigIntLiteral':
      case 'BooleanLiteral':
      case 'DecimalLiteral':
      case 'NumericLiteral':
      case 'StringLiteral': {
        key = String(propertyNode.value);
        break;
      }

      case 'NullLiteral':
      case 'TSNullKeyword': {
        key = 'null';
        break;
      }

      case 'RegExpLiteral': {
        key = `/${propertyNode.pattern}/${propertyNode.flags}`;
        break;
      }

      case 'TemplateLiteral': {
        if (propertyNode.expressions.length === 0) {
          key = propertyNode.quasis[0].value.cooked;
        }

        break;
      }

      case 'TSUndefinedKeyword': {
        key = 'undefined';
        break;
      }
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
  switch (propertyNode.type) {
    case 'Identifier':
    case 'JSXIdentifier': {
      key = propertyNode.name;
      break;
    }

    case 'PrivateName': {
      key = propertyNode.id.name;
      break;
    }
  }

  return {
    key,
  };
}
