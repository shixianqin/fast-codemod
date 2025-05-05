import * as t from '@babel/types';
import { getPropertyMeta } from '../utils/get-property-meta';
import type { LiteralObject, ObjectProperties, TransformObjectOptions } from './types';
import { createValidKey } from './utils';

function toMap<T extends object> (map: undefined | T) {
  return new Map<string, T[keyof T]>(map ? Object.entries(map) : []);
}

/**
 * 基于字面量对象表达式转换
 * @param obj
 * @param options
 */
export function transformByLiteralObject (obj: LiteralObject, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];
  const unmatchedProperties: ObjectProperties = [];
  const remap = toMap(options.remap);
  const extractor = toMap(options.extractor);

  for (const property of obj.properties) {
    const name = getPropertyMeta(property).name!;
    const extract = extractor.get(name);

    if (extract) {
      extract(property);
      continue;
    }

    const newKey = remap.get(name);

    if (newKey) {
      const validNewKey = createValidKey(typeof newKey === 'string' ? newKey : newKey.key);

      properties.push({
        ...property,
        computed: validNewKey.computed,
        key: validNewKey.id,
      });
    }
    else if (options.preserveUnmatched) {
      properties.push(property);
    }
    else {
      unmatchedProperties.push(property);
    }
  }

  // 嵌套未匹配的属性
  if (options.nestUnmatchedIn && unmatchedProperties.length > 0) {
    const validNestKey = createValidKey(options.nestUnmatchedIn);

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
