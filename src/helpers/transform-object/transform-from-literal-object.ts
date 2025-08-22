import { types } from '@babel/core';
import { createAccessedKey, resolveAccessedKey } from '../accessed-key';
import type { LiteralObjectExpression, ObjectProperties, TransformObjectOptions } from './types';
import { methodToFunction } from './utils';

function toMap<T extends object> (map: undefined | T) {
  return new Map<string, T[keyof T]>(map ? Object.entries(map) : []);
}

/**
 * 基于静态字面量对象表达式转换
 * @param obj
 * @param options
 */
export function transformFromLiteralObject (obj: LiteralObjectExpression, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];
  const unmatchedProperties: ObjectProperties = [];
  const renameMap = toMap(options.rename);
  const extractorMap = toMap(options.extractor);

  for (const property of obj.properties) {
    const name = resolveAccessedKey(property).key!;
    const extract = extractorMap.get(name);

    if (extract) {
      extract(
        types.isObjectMethod(property) ? methodToFunction(property) : property.value,
        property,
      );

      continue;
    }

    const newKey = renameMap.get(name);

    if (newKey) {
      const accessedKey = createAccessedKey(typeof newKey === 'string' ? newKey : newKey.name);

      properties.push({
        ...property,
        ...accessedKey,
      });
    }
    else if (options.flatUnmatched) {
      properties.push(property);
    }
    else if (options.wrapUnmatchedIn) {
      unmatchedProperties.push(property);
    }
  }

  // 嵌套未匹配的属性
  if (unmatchedProperties.length > 0) {
    const accessedKey = createAccessedKey(options.wrapUnmatchedIn!);

    properties.push(
      types.objectProperty(
        accessedKey.key,
        types.objectExpression(unmatchedProperties),
        accessedKey.computed,
      ),
    );
  }

  return types.objectExpression(properties);
}
