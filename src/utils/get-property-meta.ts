import * as t from '@babel/types';

export interface PropertyMeta {
  computed?: boolean;
  name?: string;
}

export type MemberNode =
  | t.JSXMemberExpression
  | t.MemberExpression
  | t.ObjectMethod
  | t.ObjectProperty
  | t.OptionalMemberExpression
  | t.TSIndexedAccessType
  | t.TSQualifiedName;

export type PropertyNode =
  | t.JSXMemberExpression['property']
  | t.MemberExpression['property']
  | t.ObjectMethod['key']
  | t.ObjectProperty['key']
  | t.OptionalMemberExpression['property']
  | t.TSIndexedAccessType['indexType']
  | t.TSQualifiedName['right'];

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
  let name: undefined | string;

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
        name = String(propertyNode.value);
        break;
      }

      case 'NullLiteral':
      case 'TSNullKeyword': {
        name = 'null';
        break;
      }

      case 'RegExpLiteral': {
        name = `/${propertyNode.pattern}/${propertyNode.flags}`;
        break;
      }

      case 'TemplateLiteral': {
        if (propertyNode.expressions.length === 0) {
          name = propertyNode.quasis[0].value.cooked;
        }

        break;
      }

      case 'TSUndefinedKeyword': {
        name = 'undefined';
        break;
      }
    }

    // 如果已经从字面量中解析出 key 值，则不属于动态 key
    if (name !== undefined) {
      return {
        name,
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
      name = propertyNode.name;
      break;
    }

    case 'PrivateName': {
      name = propertyNode.id.name;
      break;
    }
  }

  return {
    name,
  };
}
