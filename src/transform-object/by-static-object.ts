import * as t from '@babel/types';
import { getPropertyMeta } from '../utils/get-property-meta';
import type { ObjectProperties, StaticObject, TransformObjectOptions } from './types';
import { createValidKey, objectMethodToFunctionExpression } from './utils';

function toMap<T extends object> (map: undefined | T) {
  return new Map<string, T[keyof T]>(map ? Object.entries(map) : []);
}

/**
 * 基于静态字面量对象表达式转换
 * @param obj
 * @param options
 */
export function byStaticObject (obj: StaticObject, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];
  const unmatchedProperties: ObjectProperties = [];
  const renameMap = toMap(options.rename);
  const extractMap = toMap(options.extract);

  for (const property of obj.properties) {
    const name = getPropertyMeta(property).name!;
    const extract = extractMap.get(name);

    if (extract) {
      extract(
        t.isObjectMethod(property)
          ? objectMethodToFunctionExpression(property)
          : property.value as t.Expression,
        property,
      );

      continue;
    }

    const newKey = renameMap.get(name);

    if (newKey) {
      const validNewKey = createValidKey(typeof newKey === 'string' ? newKey : newKey.name);

      properties.push({
        ...property,
        computed: validNewKey.computed,
        key: validNewKey.id,
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
    const validNestKey = createValidKey(options.wrapUnmatchedIn!);

    properties.push(
      t.objectProperty(
        validNestKey.id,
        t.objectExpression(unmatchedProperties),
        validNestKey.computed,
      ),
    );
  }

  return t.objectExpression(properties);
}
