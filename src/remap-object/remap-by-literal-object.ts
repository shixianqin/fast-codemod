import * as t from '@babel/types';
import { getPropertyMeta } from '../traverse-references/get-property-meta';
import type { LiteralObjectExpression, ObjectProperties, RemapObjectOptions } from './types';
import { createValidKey } from './utils';

/**
 * 基于字面量对象表达式转换
 * @param obj
 * @param options
 */
export function remapByLiteralObject (obj: LiteralObjectExpression, options: RemapObjectOptions) {
  const properties: ObjectProperties = [];
  const unmatchedProperties: ObjectProperties = [];
  const keyMap = new Map(Object.entries(options.keyMap));

  for (const property of obj.properties) {
    const newKey = keyMap.get(
      getPropertyMeta(property).name!,
    );

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
