import { types } from '@babel/core';
import { createAccessedKey } from '../accessed-key';
import type { ObjectProperties, TransformObjectOptions } from './types';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function transformFromIdentifier (objectId: types.Identifier, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];

  if (options.rename) {
    for (const [oldKey, newKey] of Object.entries(options.rename)) {
      const newKeyObj = typeof newKey === 'string' ? { name: newKey } : newKey;
      const newAccessedKey = createAccessedKey(newKeyObj.name);
      const oldAccessedKey = createAccessedKey(oldKey);

      const memberExp = types.memberExpression(
        objectId,
        oldAccessedKey.key,
        oldAccessedKey.computed,
      );

      if (newKeyObj.get) {
        properties.push(
          types.objectMethod(
            'get',
            newAccessedKey.key,
            [],
            types.blockStatement(
              [types.returnStatement(memberExp)],
            ),
            newAccessedKey.computed,
          ),
        );
      }
      else {
        properties.push(
          types.objectProperty(
            newAccessedKey.key,
            memberExp,
            newAccessedKey.computed,
          ),
        );
      }

      if (newKeyObj.set) {
        const valueId = types.identifier('value');

        properties.push(
          types.objectMethod(
            'set',
            newAccessedKey.key,
            [valueId],
            types.blockStatement([
              types.expressionStatement(
                types.assignmentExpression(
                  '=',
                  memberExp,
                  valueId,
                ),
              ),
            ]),
            newAccessedKey.computed,
          ),
        );
      }
    }
  }

  if (options.extractor) {
    for (const [key, extract] of Object.entries(options.extractor)) {
      const accessedKey = createAccessedKey(key);

      const memberExp = types.memberExpression(
        objectId,
        accessedKey.key,
        accessedKey.computed,
      );

      extract(memberExp, memberExp);
    }
  }

  if (options.flatUnmatched === true) {
    properties.unshift(
      types.spreadElement(objectId),
    );
  }
  else if (options.wrapUnmatchedIn) {
    const accessedKey = createAccessedKey(options.wrapUnmatchedIn);

    properties.push(
      types.objectProperty(
        accessedKey.key,
        objectId,
        accessedKey.computed,
      ),
    );
  }

  return types.objectExpression(properties);
}
