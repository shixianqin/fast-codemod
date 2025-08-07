import * as t from '@babel/types';
import { createAccessedKey } from '../accessed-key';
import type { ObjectProperties, TransformObjectOptions } from './types';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function transformFromIdentifier (objectId: t.Identifier, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];

  if (options.rename) {
    for (const [oldKey, newKey] of Object.entries(options.rename)) {
      const newKeyObj = typeof newKey === 'string' ? { name: newKey } : newKey;
      const newAccessedKey = createAccessedKey(newKeyObj.name);
      const oldAccessedKey = createAccessedKey(oldKey);

      const memberExp = t.memberExpression(
        objectId,
        oldAccessedKey.key,
        oldAccessedKey.computed,
      );

      if (newKeyObj.get) {
        properties.push(
          t.objectMethod(
            'get',
            newAccessedKey.key,
            [],
            t.blockStatement(
              [t.returnStatement(memberExp)],
            ),
            newAccessedKey.computed,
          ),
        );
      }
      else {
        properties.push(
          t.objectProperty(
            newAccessedKey.key,
            memberExp,
            newAccessedKey.computed,
          ),
        );
      }

      if (newKeyObj.set) {
        const valueId = t.identifier('value');

        properties.push(
          t.objectMethod(
            'set',
            newAccessedKey.key,
            [valueId],
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression(
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

      const memberExp = t.memberExpression(
        objectId,
        accessedKey.key,
        accessedKey.computed,
      );

      extract(memberExp, memberExp);
    }
  }

  if (options.flatUnmatched === true) {
    properties.unshift(
      t.spreadElement(objectId),
    );
  }
  else if (options.wrapUnmatchedIn) {
    const accessedKey = createAccessedKey(options.wrapUnmatchedIn);

    properties.push(
      t.objectProperty(
        accessedKey.key,
        objectId,
        accessedKey.computed,
      ),
    );
  }

  return t.objectExpression(properties);
}
