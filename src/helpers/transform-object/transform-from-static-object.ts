import * as t from '@babel/types';
import { createValidProperty, getPropertyMeta } from '../property';
import type { ObjectProperties, StaticObject, TransformObjectOptions } from './types';
import { methodToFunction } from './utils';

function toMap<T extends object> (map: undefined | T) {
  return new Map<string, T[keyof T]>(map ? Object.entries(map) : []);
}

/**
 * 基于静态字面量对象表达式转换
 * @param obj
 * @param options
 */
export function transformFromStaticObject (obj: StaticObject, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];
  const unmatchedProperties: ObjectProperties = [];
  const renameMap = toMap(options.rename);
  const extractMap = toMap(options.extract);

  for (const property of obj.properties) {
    const name = getPropertyMeta(property).key!;
    const extract = extractMap.get(name);

    if (extract) {
      extract(
        t.isObjectMethod(property) ? methodToFunction(property) : property.value,
        property,
      );

      continue;
    }

    const newKey = renameMap.get(name);

    if (newKey) {
      const validProperty = createValidProperty(typeof newKey === 'string' ? newKey : newKey.name);

      properties.push({
        ...property,
        ...validProperty,
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
    const validNestProperty = createValidProperty(options.wrapUnmatchedIn!);

    properties.push(
      t.objectProperty(
        validNestProperty.key,
        t.objectExpression(unmatchedProperties),
        validNestProperty.computed,
      ),
    );
  }

  return t.objectExpression(properties);
}
